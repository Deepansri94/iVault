/**
 * @file db.service.ts
 * IndexedDB Database Service via Dexie.js
 * Offline-first persistent store matching Google Sheets tabs architecture.
 */

import Dexie, { type Table } from 'dexie';
import { CryptoService } from './crypto.service';
import type {
  Account,
  AppNotification,
  AppSettings,
  Budget,
  DematInvestment,
  FamilyDocument,
  FamilyMember,
  FixedInvestment,
  GoldHolding,
  Loan,
  Medicine,
  SyncQueueItem,
  Transaction,
  VaultCredential,
  Insurance,
} from '../types/db.types';

export class IVaultDatabase extends Dexie {
  public accounts!: Table<Account, string>;
  public transactions!: Table<Transaction, string>;
  public budgets!: Table<Budget, string>;
  public fixedInvestments!: Table<FixedInvestment, string>;
  public dematInvestments!: Table<DematInvestment, string>;
  public goldHoldings!: Table<GoldHolding, string>;
  public loans!: Table<Loan, string>;
  public familyMembers!: Table<FamilyMember, string>;
  public familyDocuments!: Table<FamilyDocument, string>;
  public medicines!: Table<Medicine, string>;
  public passwords!: Table<VaultCredential, string>;
  public syncQueue!: Table<SyncQueueItem, string>;
  public notifications!: Table<AppNotification, string>;
  public appSettings!: Table<AppSettings, string>;
  public insurances!: Table<Insurance, string>;

  constructor() {
    super('iVaultProDB');

    this.version(1).stores({
      accounts: 'id, type, bankName',
      transactions: 'id, type, date, category, familyMember, syncedToSheets',
      budgets: 'id, category, period',
      fixedInvestments: 'id, type, institution, familyMember, maturityDate',
      dematInvestments: 'id, symbol, type, familyMember',
      goldHoldings: 'id, karat, familyMember, purchaseDate',
      loans: 'id, loanType, bank, emiDueDate',
      familyMembers: 'id, name, relationship, status',
      familyDocuments: 'id, memberId, docType, expiryDate',
      medicines: 'id, memberId, medicineName, currentStock',
      passwords: 'id, title, category, updatedAt',
      syncQueue: 'id, entityType, timestamp, status',
      notifications: 'id, type, timestamp, read',
      appSettings: 'id',
    });

    this.version(2).stores({
      accounts: 'id, type, bankName',
      transactions: 'id, type, date, category, familyMember, syncedToSheets',
      budgets: 'id, category, period',
      fixedInvestments: 'id, type, institution, familyMember, maturityDate',
      dematInvestments: 'id, symbol, type, familyMember',
      goldHoldings: 'id, karat, familyMember, purchaseDate',
      loans: 'id, loanType, bank, emiDueDate',
      familyMembers: 'id, name, relationship, status',
      familyDocuments: 'id, memberId, docType, expiryDate',
      medicines: 'id, memberId, medicineName, currentStock',
      passwords: 'id, title, category, updatedAt',
      syncQueue: 'id, entityType, timestamp, status',
      notifications: 'id, type, timestamp, read',
      appSettings: 'id',
      insurances: 'id, policyName, type, familyMember, nextDueDate',
    });
  }
}

export const db = new IVaultDatabase();

/**
 * Initial Seeding Service with production-grade sample data
 */
export async function initializeDatabase() {
  const settingsCount = await db.appSettings.count();
  if (settingsCount > 0) {
    const existingSettings = await db.appSettings.get('default');
    if (existingSettings && existingSettings.sessionMode !== 'live') {
      existingSettings.sessionMode = 'live';
      await db.appSettings.put(existingSettings);
    }

    // Always clean out legacy demo dummy items so they do not pollute live session
    try {
      await db.medicines.bulkDelete(['med-dolo', 'med-augmentin', 'med-montek']);
      await db.insurances.bulkDelete(['ins-1', 'ins-2']);
      await db.passwords.bulkDelete(['cred-1', 'cred-2', 'cred-3', 'cred-4']);

      const acc1 = await db.accounts.get('acc-1');
      if (acc1 && (acc1.bankName === 'Prime Bank' || acc1.name === 'Prime Privilege Savings')) {
        await db.accounts.delete('acc-1');
      }
      const acc2 = await db.accounts.get('acc-2');
      if (acc2 && (acc2.bankName === 'Prime Bank' || acc2.name === 'Sapphiro Metal Credit Card')) {
        await db.accounts.delete('acc-2');
      }
      const acc3 = await db.accounts.get('acc-3');
      if (acc3 && (acc3.bankName === 'Prime Bank' || acc3.name === 'Family Emergency Liquid Fund')) {
        await db.accounts.delete('acc-3');
      }

      await db.loans.bulkDelete(['loan-1', 'loan-2']);
      await db.fixedInvestments.bulkDelete(['fi-1', 'fi-2', 'fi-3']);
      await db.dematInvestments.bulkDelete(['mf-1', 'mf-2', 'mf-3']);
      await db.goldHoldings.bulkDelete(['gold-1', 'gold-2']);
      await db.transactions.bulkDelete(['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6', 'tx-7']);
      await db.budgets.bulkDelete(['b-1', 'b-2', 'b-3', 'b-4', 'b-5']);
      await db.familyDocuments.bulkDelete(['doc-1', 'doc-2']);

      const mem2 = await db.familyMembers.get('mem-2');
      if (mem2 && mem2.name === 'Rani' && mem2.relationship === 'Spouse' && mem2.phone === '+91 98765 43211') {
        await db.familyMembers.delete('mem-2');
      }
      const mem3 = await db.familyMembers.get('mem-3');
      if (mem3 && mem3.name === 'Aarav' && mem3.relationship === 'Child') {
        await db.familyMembers.delete('mem-3');
      }
      const mem4 = await db.familyMembers.get('mem-4');
      if (mem4 && mem4.name === 'Kalyani Amma' && mem4.relationship === 'Mother') {
        await db.familyMembers.delete('mem-4');
      }

      const memCount = await db.familyMembers.count();
      if (memCount === 0) {
        await db.familyMembers.put({
          id: 'mem-1',
          name: 'Deepan',
          age: 32,
          dateOfBirth: '1994-10-18',
          relationship: 'Self',
          status: 'Active',
          avatarColor: '#C93B2B',
        });
      }
    } catch {
      // Best-effort migration
    }

    // Check theme fallback
    try {
      if (existingSettings && (existingSettings.theme as any) === 'icici-classic') {
        existingSettings.theme = 'classic-orange';
        await db.appSettings.put(existingSettings);
      }

      // Migration: Ensure family members have dateOfBirth populated for automated birthday reminders
      const existingMembers = await db.familyMembers.toArray();
      for (const m of existingMembers) {
        if (!m.dateOfBirth) {
          if (m.name.includes('Deepan')) m.dateOfBirth = '1994-10-18';
          else {
            const bYear = new Date().getFullYear() - (m.age || 30);
            m.dateOfBirth = `${bYear}-10-15`;
          }
          await db.familyMembers.put(m);
        }
      }
    } catch {
      // Best-effort migration
    }
    return; // Already initialized
  }

  // 1. Initial Settings (Always Live Mode)
  await db.appSettings.put({
    id: "default",
    theme: "classic-orange",
    masterPinHash: "",
    sheetsWebappUrl: "",
    autoSyncEnabled: true,
    liveGold24kRate: 7250, // ₹ per gram 24K
    liveGold22kRate: 6650, // ₹ per gram 22K
    notificationsEnabled: true,
    sessionMode: "live",
    desktopNotificationsEnabled: false,
    budgetAlertThresholdPct: 80,
    medicineLowStockAlerts: true,
    loanEmiAlerts: true,
    documentExpiryAlerts: true,
    autoLogDosagesEnabled: true,
    lastAutoDosageDate: new Date().toISOString().split("T")[0],
    lastSyncTime: new Date().toISOString(),
  });

  // 2. Primary Account Holder (Clean Live State)
  await db.familyMembers.put({
    id: "mem-1",
    name: "Deepan",
    age: 32,
    dateOfBirth: "1994-10-18",
    relationship: "Self",
    status: "Active",
    avatarColor: "#C93B2B",
  });
}

/**
 * Clear all data tables prior to reloading from cloud source (Google Sheets)
 */
export async function clearAllTablesForReload() {
  await Promise.all([
    db.transactions.clear(),
    db.budgets.clear(),
    db.fixedInvestments.clear(),
    db.dematInvestments.clear(),
    db.goldHoldings.clear(),
    db.loans.clear(),
    db.familyDocuments.clear(),
    db.medicines.clear(),
    db.passwords.clear(),
    db.syncQueue.clear(),
    db.notifications.clear(),
    db.accounts.clear(),
    db.familyMembers.clear(),
    db.insurances.clear(),
  ]);
}

/**
 * Switch from Demo dataset to a clean Live production session
 */
export async function switchToLiveMode(primaryMemberName = 'Deepan') {
  await Promise.all([
    db.transactions.clear(),
    db.budgets.clear(),
    db.fixedInvestments.clear(),
    db.dematInvestments.clear(),
    db.goldHoldings.clear(),
    db.loans.clear(),
    db.familyDocuments.clear(),
    db.medicines.clear(),
    db.passwords.clear(),
    db.syncQueue.clear(),
    db.notifications.clear(),
    db.accounts.clear(),
    db.familyMembers.clear(),
    db.insurances.clear(),
  ]);

  // Create clean self family member
  await db.familyMembers.put({
    id: 'mem-live-1',
    name: primaryMemberName || 'Self',
    age: 30,
    relationship: 'Self',
    status: 'Active',
    avatarColor: '#C93B2B',
  });

  const settings = await db.appSettings.get('default');
  if (settings) {
    settings.sessionMode = 'live';
    await db.appSettings.put(settings);
  }
}

/**
 * Reset back to Demo Mode with sample dataset
 */
export async function resetToDemoMode() {
  await Promise.all([
    db.transactions.clear(),
    db.budgets.clear(),
    db.fixedInvestments.clear(),
    db.dematInvestments.clear(),
    db.goldHoldings.clear(),
    db.loans.clear(),
    db.familyDocuments.clear(),
    db.medicines.clear(),
    db.passwords.clear(),
    db.syncQueue.clear(),
    db.notifications.clear(),
    db.accounts.clear(),
    db.familyMembers.clear(),
    db.appSettings.clear(),
    db.insurances.clear(),
  ]);

  await initializeDatabase();
}
