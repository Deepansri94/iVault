/**
 * @file notification.service.spec.ts
 * Unit & Integration Test Suite for Application Notification Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup';
import { db } from '../services/db.service';
import { NotificationService } from '../services/notification.service';

describe('NotificationService (In-App Health Radar)', () => {
  beforeEach(async () => {
    await db.notifications.clear();
    await db.budgets.clear();
    await db.medicines.clear();
    await db.loans.clear();
    await db.familyDocuments.clear();
    await db.appSettings.clear();

    await db.appSettings.put({
      id: 'default',
      theme: 'classic-orange',
      autoSyncEnabled: false,
      liveGold24kRate: 7250,
      liveGold22kRate: 6650,
      notificationsEnabled: true,
      budgetAlertThresholdPct: 80,
      medicineLowStockAlerts: true,
      loanEmiAlerts: true,
      documentExpiryAlerts: true,
    });
  });

  it('should dispatch and persist a notification to IndexedDB', async () => {
    const notif = await NotificationService.dispatchNotification({
      type: 'budget',
      title: '🚨 Budget Exceeded: Dining',
      message: 'Monthly limit reached',
      severity: 'danger',
      linkTab: 'fintracker',
    });

    expect(notif.id).toBeDefined();
    expect(notif.read).toBe(false);

    const stored = await db.notifications.get(notif.id);
    expect(stored).toBeDefined();
    expect(stored?.title).toEqual('🚨 Budget Exceeded: Dining');
  });

  it('should deduplicate identical unread notifications within 24 hours', async () => {
    const first = await NotificationService.dispatchNotification({
      type: 'medicine',
      title: '💊 Low Stock: Paracetamol',
      message: 'Only 2 units remaining',
      severity: 'warning',
    });

    const second = await NotificationService.dispatchNotification({
      type: 'medicine',
      title: '💊 Low Stock: Paracetamol',
      message: 'Only 2 units remaining',
      severity: 'warning',
      force: false,
    });

    expect(second.id).toEqual(first.id);

    const count = await db.notifications.count();
    expect(count).toEqual(1);
  });

  it('should bypass deduplication when force is set to true', async () => {
    const first = await NotificationService.dispatchNotification({
      type: 'system',
      title: 'System Alert',
      message: 'Notice 1',
    });

    const second = await NotificationService.dispatchNotification({
      type: 'system',
      title: 'System Alert',
      message: 'Notice 2',
      force: true,
    });

    expect(second.id).not.toEqual(first.id);
    const count = await db.notifications.count();
    expect(count).toEqual(2);
  });

  it('should mark an individual notification as read', async () => {
    const notif = await NotificationService.dispatchNotification({
      type: 'loan',
      title: 'Loan EMI Due',
      message: 'Debited in 2 days',
    });

    expect(notif.read).toBe(false);
    await NotificationService.markAsRead(notif.id);

    const updated = await db.notifications.get(notif.id);
    expect(updated?.read).toBe(true);
  });

  it('should mark all unread notifications as read', async () => {
    await NotificationService.dispatchNotification({
      type: 'budget',
      title: 'Budget Alert 1',
      message: 'Test 1',
      force: true,
    });
    await NotificationService.dispatchNotification({
      type: 'budget',
      title: 'Budget Alert 2',
      message: 'Test 2',
      force: true,
    });

    expect(await NotificationService.getUnreadCount()).toEqual(2);

    await NotificationService.markAllAsRead();
    expect(await NotificationService.getUnreadCount()).toEqual(0);
  });

  it('should delete a notification and clear all notifications', async () => {
    const notif = await NotificationService.dispatchNotification({
      type: 'doc_expiry',
      title: 'Passport Expiring',
      message: 'Expires next week',
    });

    await NotificationService.deleteNotification(notif.id);
    expect(await db.notifications.get(notif.id)).toBeUndefined();

    await NotificationService.dispatchNotification({
      type: 'system',
      title: 'Clear Test',
      message: 'Clear Test',
    });
    await NotificationService.clearAllNotifications();
    expect(await db.notifications.count()).toEqual(0);
  });

  describe('Automated Health Audits', () => {
    it('should generate budget warning and danger notifications during audit', async () => {
      await db.budgets.bulkPut([
        {
          id: 'b-1',
          category: 'Dining & Food',
          allocatedAmount: 10000,
          spentAmount: 8500, // 85% -> Warning
          period: 'Monthly',
          warningThresholdPct: 80,
        },
        {
          id: 'b-2',
          category: 'Fuel & Transport',
          allocatedAmount: 5000,
          spentAmount: 5200, // 104% -> Exceeded / Danger
          period: 'Monthly',
          warningThresholdPct: 80,
        },
      ]);

      const audits = await NotificationService.runAutomatedNotificationAudits();
      expect(audits.length).toBeGreaterThanOrEqual(2);

      const warning = audits.find((a) => a.title.includes('Budget Warning: Dining & Food'));
      expect(warning).toBeDefined();
      expect(warning?.severity).toEqual('warning');

      const exceeded = audits.find((a) => a.title.includes('Budget Exceeded: Fuel & Transport'));
      expect(exceeded).toBeDefined();
      expect(exceeded?.severity).toEqual('danger');
    });

    it('should generate medicine low stock alerts during audit', async () => {
      await db.medicines.put({
        id: 'med-test',
        memberId: 'mem-1',
        memberName: 'Deepan',
        medicineName: 'Vitamin C 500mg',
        type: 'Tablet',
        dosage: '1 tablet',
        timings: ['Morning'],
        instructions: 'After Food',
        dailyQuantity: 1,
        currentStock: 3,
        minRefillThreshold: 5,
      });

      const audits = await NotificationService.runAutomatedNotificationAudits();
      const medAlert = audits.find((a) => a.title.includes('Low Stock Alert: Vitamin C 500mg'));
      expect(medAlert).toBeDefined();
      expect(medAlert?.type).toEqual('medicine');
    });

    it('should generate document expiry and expired alerts during audit', async () => {
      const today = new Date();
      const inTenDays = new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0];
      const expiredDate = '2025-01-01';

      await db.familyDocuments.bulkPut([
        {
          id: 'doc-expiring',
          memberId: 'mem-1',
          memberName: 'Deepan',
          docType: "Driver's License",
          docNumberRedacted: 'DL-****-5544',
          docNumberEncrypted: 'enc-dl-payload',
          issueDate: '2020-01-01',
          issuer: 'RTO Tamil Nadu',
          expiryDate: inTenDays,
        },
        {
          id: 'doc-expired',
          memberId: 'mem-2',
          memberName: 'Rani',
          docType: 'Passport',
          docNumberRedacted: 'Z****129',
          docNumberEncrypted: 'enc-pass-payload',
          issueDate: '2015-01-01',
          issuer: 'MEA India',
          expiryDate: expiredDate,
        },
      ]);

      const audits = await NotificationService.runAutomatedNotificationAudits();
      const expiringAlert = audits.find((a) => a.title.includes("Expiring Soon: Driver's License"));
      expect(expiringAlert).toBeDefined();

      const expiredAlert = audits.find((a) => a.title.includes('Document Expired: Passport'));
      expect(expiredAlert).toBeDefined();
      expect(expiredAlert?.severity).toEqual('danger');
    });
  });
});
