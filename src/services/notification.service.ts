/**
 * @file notification.service.ts
 * Application Notification Engine & Automated Health Radar
 *
 * Provides in-app notification state management, deduplicated automated audits,
 * and optional HTML5 Desktop Notifications API integration.
 */

import { db } from './db.service';
import type { AppNotification, Budget, FamilyDocument, Loan, Medicine } from '../types/db.types';

/**
 * Options for dispatching a new notification
 */
export interface DispatchNotificationOptions {
  type: 'budget' | 'loan' | 'medicine' | 'doc_expiry' | 'birthday' | 'system' | 'insurance';
  title: string;
  message: string;
  severity?: 'warning' | 'info' | 'danger' | 'success';
  linkTab?: string;
  /** If true, skip deduplication check */
  force?: boolean;
}

/**
 * Service managing in-app notifications and background automated audits.
 */
export class NotificationService {
  /**
   * Dispatches a new notification to the IndexedDB store.
   * Includes smart deduplication to avoid repetitive alerts within a 24-hour window.
   *
   * @param options Details of the notification to dispatch
   * @returns The saved or existing AppNotification record
   */
  public static async dispatchNotification(
    options: DispatchNotificationOptions
  ): Promise<AppNotification> {
    const { type, title, message, severity = 'info', linkTab, force = false } = options;

    if (!force) {
      // Check for an identical unread notification created in the last 24 hours
      const recentNotifs = await db.notifications
        .where('type')
        .equals(type)
        .toArray();

      const existingRecent = recentNotifs.find(
        (n) => !n.read && n.title === title && (Date.now() - new Date(n.timestamp).getTime()) < 86400000
      );

      if (existingRecent) {
        return existingRecent;
      }
    }

    const notification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      message,
      severity,
      read: false,
      linkTab,
    };

    await db.notifications.put(notification);

    // If desktop notifications are enabled and permitted, fire browser notification
    this.sendDesktopNotification(title, message);

    return notification;
  }

  /**
   * Executes scheduled health checks across Budgets, Medicines, Loans, and Family Documents.
   * Automatically generates actionable alerts when thresholds or deadlines are breached.
   *
   * @returns Array of newly generated or refreshed notifications
   */
  public static async runAutomatedNotificationAudits(): Promise<AppNotification[]> {
    const generated: AppNotification[] = [];
    const settings = await db.appSettings.get('default');

    if (settings && settings.notificationsEnabled === false) {
      return generated;
    }

    // 1. Audit Monthly Category Budgets
    const budgets = await db.budgets.toArray();
    const thresholdPct = settings?.budgetAlertThresholdPct ?? 80;

    for (const budget of budgets) {
      if (budget.allocatedAmount <= 0) continue;
      const spentPercent = (budget.spentAmount / budget.allocatedAmount) * 100;

      if (spentPercent >= 100) {
        const notif = await this.dispatchNotification({
          type: 'budget',
          title: `🚨 Budget Exceeded: ${budget.category}`,
          message: `Spending reached ₹${budget.spentAmount.toLocaleString('en-IN')} (${spentPercent.toFixed(0)}%), exceeding monthly ₹${budget.allocatedAmount.toLocaleString('en-IN')} allocation.`,
          severity: 'danger',
          linkTab: 'fintracker',
        });
        generated.push(notif);
      } else if (spentPercent >= thresholdPct) {
        const notif = await this.dispatchNotification({
          type: 'budget',
          title: `⚠️ Budget Warning: ${budget.category}`,
          message: `Spending reached ₹${budget.spentAmount.toLocaleString('en-IN')} (${spentPercent.toFixed(0)}%), nearing your limit of ₹${budget.allocatedAmount.toLocaleString('en-IN')}.`,
          severity: 'warning',
          linkTab: 'fintracker',
        });
        generated.push(notif);
      }
    }

    // 2. Audit Medicine Stocks
    if (settings?.medicineLowStockAlerts !== false) {
      const medicines = await db.medicines.toArray();
      for (const medicine of medicines) {
        if (medicine.currentStock <= medicine.minRefillThreshold) {
          const notif = await this.dispatchNotification({
            type: 'medicine',
            title: `💊 Low Stock Alert: ${medicine.medicineName}`,
            message: `${medicine.memberName}'s stock of ${medicine.medicineName} is down to ${medicine.currentStock} units (Threshold: ${medicine.minRefillThreshold}). Refill recommended.`,
            severity: medicine.currentStock === 0 ? 'danger' : 'warning',
            linkTab: 'medicines',
          });
          generated.push(notif);
        }
      }
    }

    // 3. Audit Loans with EMI due within 5 days
    if (settings?.loanEmiAlerts !== false) {
      const todayDay = new Date().getDate();
      const loans = await db.loans.toArray();

      for (const loan of loans) {
        const daysDiff = loan.emiDueDate - todayDay;
        if (daysDiff >= 0 && daysDiff <= 5) {
          const dueText = daysDiff === 0 ? 'Today' : `in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
          const notif = await this.dispatchNotification({
            type: 'loan',
            title: `🔔 Loan EMI Due ${dueText}: ${loan.loanName}`,
            message: `Auto-debit of ₹${loan.monthlyEmi.toLocaleString('en-IN')} scheduled for the ${loan.emiDueDate}th from ${loan.autoDebitAccount}. Ensure adequate balance.`,
            severity: daysDiff <= 1 ? 'danger' : 'info',
            linkTab: 'fintracker',
          });
          generated.push(notif);
        }
      }
    }

    // 3b. Audit Insurances with Premium Due within 7 days
    try {
      const insurances = await db.insurances.toArray();
      const currentTimestamp = Date.now();
      for (const ins of insurances) {
        if (!ins.nextDueDate) continue;
        const dueTimestamp = new Date(ins.nextDueDate).getTime();
        const daysRemaining = Math.ceil((dueTimestamp - currentTimestamp) / (1000 * 60 * 60 * 24));
        if (daysRemaining >= 0 && daysRemaining <= 7) {
          const dueText = daysRemaining === 0 ? 'Today' : `in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
          const debitSource = ins.autoDebitAccount ? `from ${ins.autoDebitAccount}` : 'via Auto-Debit';
          const notif = await this.dispatchNotification({
            type: 'insurance',
            title: `🛡️ Insurance Premium Due ${dueText}: ${ins.policyName}`,
            message: `Premium of ₹${ins.premiumAmount.toLocaleString('en-IN')} scheduled ${debitSource}. Ensure adequate balance.`,
            severity: daysRemaining <= 1 ? 'danger' : 'info',
            linkTab: 'fintracker',
          });
          generated.push(notif);
        }
      }
    } catch (e) {
      console.warn('Failed to audit insurance due dates:', e);
    }

    // 4. Audit Expiring Family Documents (within 30 days or already expired)
    if (settings?.documentExpiryAlerts !== false) {
      const docs = await db.familyDocuments.toArray();
      const currentTimestamp = Date.now();

      for (const doc of docs) {
        if (!doc.expiryDate) continue;

        const expiryTimestamp = new Date(doc.expiryDate).getTime();
        const daysRemaining = Math.ceil((expiryTimestamp - currentTimestamp) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          const notif = await this.dispatchNotification({
            type: 'doc_expiry',
            title: `🚨 Document Expired: ${doc.docType}`,
            message: `${doc.memberName}'s ${doc.docType} expired on ${doc.expiryDate}. Please renew promptly.`,
            severity: 'danger',
            linkTab: 'documents',
          });
          generated.push(notif);
        } else if (daysRemaining <= 30) {
          const notif = await this.dispatchNotification({
            type: 'doc_expiry',
            title: `⚠️ Document Expiring Soon: ${doc.docType}`,
            message: `${doc.memberName}'s ${doc.docType} expires in ${daysRemaining} days (${doc.expiryDate}). Action required.`,
            severity: 'warning',
            linkTab: 'documents',
          });
          generated.push(notif);
        }
      }
    }

    // 5. Audit Family Member Birthdays (Today or within upcoming 30 days)
    const members = await db.familyMembers.toArray();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentDay = today.getDate();

    for (const member of members) {
      if (!member.dateOfBirth) continue;
      const parts = member.dateOfBirth.split('-').map(Number);
      if (parts.length !== 3) continue;
      const [bYear, bMonth, bDay] = parts; // bMonth is 1-indexed

      // Create a date representing the birthday in the current year
      let bdayDate = new Date(currentYear, bMonth - 1, bDay);
      const todayDateOnly = new Date(currentYear, currentMonth, currentDay);

      // If the birthday already passed this year, rollover to the next year
      if (bdayDate.getTime() < todayDateOnly.getTime()) {
        bdayDate = new Date(currentYear + 1, bMonth - 1, bDay);
      }

      const diffMs = bdayDate.getTime() - todayDateOnly.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const turningAge = bdayDate.getFullYear() - bYear;

      // Check if birthday is today
      if (diffDays === 0) {
        const notif = await this.dispatchNotification({
          type: 'birthday',
          title: `🎂 Happy Birthday ${member.name}!`,
          message: `Today is ${member.name}'s ${turningAge > 0 ? `${turningAge}th ` : ''}birthday! Wishing great health, prosperity, and joy! 🎉`,
          severity: 'success',
          linkTab: 'documents',
        });
        generated.push(notif);
      } else if (diffDays > 0 && diffDays <= 30) {
        // Upcoming birthday within the next 30 days
        const notif = await this.dispatchNotification({
          type: 'birthday',
          title: `🎈 Upcoming Birthday: ${member.name}`,
          message: `${member.name} turns ${turningAge} in ${diffDays} day${diffDays > 1 ? 's' : ''} on ${bDay}/${bMonth}. Remember to celebrate! 🎁`,
          severity: 'info',
          linkTab: 'documents',
        });
        generated.push(notif);
      }
    }

    return generated;
  }

  /**
   * Marks a specific notification as read.
   *
   * @param notificationId ID of the notification
   */
  public static async markAsRead(notificationId: string): Promise<void> {
    await db.notifications.update(notificationId, { read: true });
  }

  /**
   * Marks all existing unread notifications as read.
   */
  public static async markAllAsRead(): Promise<void> {
    const unreadNotifications = await db.notifications.filter((n) => !n.read).toArray();
    await Promise.all(unreadNotifications.map((n) => db.notifications.update(n.id, { read: true })));
  }

  /**
   * Deletes a single notification by ID.
   *
   * @param notificationId ID of the notification to remove
   */
  public static async deleteNotification(notificationId: string): Promise<void> {
    await db.notifications.delete(notificationId);
  }

  /**
   * Deletes all notifications from the store.
   */
  public static async clearAllNotifications(): Promise<void> {
    await db.notifications.clear();
  }

  /**
   * Returns total count of unread notifications.
   */
  public static async getUnreadCount(): Promise<number> {
    return await db.notifications.filter((n) => !n.read).count();
  }

  /**
   * Requests permission for HTML5 Web Notifications API from the user.
   *
   * @returns NotificationPermission status ('granted' | 'denied' | 'default')
   */
  public static async requestDesktopPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return await Notification.requestPermission();
  }

  /**
   * Sends an HTML5 Desktop Notification if supported and permitted.
   *
   * @param title Title of the desktop notification
   * @param body Descriptive text
   */
  public static sendDesktopNotification(title: string, body: string): void {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
        });
      } catch {
        // Ignore desktop notification creation errors in iframe/sandboxed environments
      }
    }
  }
}
