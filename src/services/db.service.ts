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
    if (existingSettings?.sessionMode === 'live') {
      await db.medicines.bulkDelete(['med-dolo', 'med-augmentin', 'med-montek']);
    }

    // Migration check: update any existing records containing ICICI
    try {
      if (existingSettings && (existingSettings.theme as any) === 'icici-classic') {
        existingSettings.theme = 'classic-orange';
        await db.appSettings.put(existingSettings);
      }

      await db.accounts.where('bankName').equals('ICICI Bank').modify({
        bankName: 'Prime Bank',
      });
      await db.accounts.where('name').equals('ICICI Privilege Savings').modify({
        name: 'Prime Privilege Savings',
        upiId: 'deepan@ivault',
      });
      await db.accounts.where('name').equals('ICICI Sapphiro Credit Card').modify({
        name: 'Sapphiro Metal Credit Card',
      });
      await db.accounts.where('upiId').equals('rani@icici').modify({
        upiId: 'rani@ivault',
      });

      await db.loans.where('bank').equals('ICICI Bank').modify({
        bank: 'Prime Bank',
        autoDebitAccount: '402910008432 (Prime Bank)',
      });
      await db.loans.where('loanName').equals('ICICI Home Loan (Emerald Towers)').modify({
        loanName: 'Prime Home Loan (Emerald Towers)',
      });

      await db.fixedInvestments.where('institution').equals('ICICI Bank').modify({
        institution: 'Prime Bank',
        name: 'Bank Recurring Deposit (RD)',
      });

      await db.dematInvestments.where('symbol').equals('ICICIBANK.NS').modify({
        name: 'Bluechip Equity Growth Ltd',
        symbol: 'BLUECHIP.NS',
      });

      await db.familyDocuments.where('issuer').equals('ICICI Lombard Complete Health Shield').modify({
        issuer: 'Care Complete Health Shield',
      });

    } catch {
      // Best-effort migration
    }
    return; // Already initialized
  }

  // 1. Initial Settings
  await db.appSettings.put({
    id: 'default',
    theme: 'classic-orange',
    masterPinHash: '',
    sheetsWebappUrl: '',
    autoSyncEnabled: true,
    liveGold24kRate: 7250, // ₹ per gram 24K
    liveGold22kRate: 6650, // ₹ per gram 22K
    notificationsEnabled: true,
    sessionMode: 'demo',
    desktopNotificationsEnabled: false,
    budgetAlertThresholdPct: 80,
    medicineLowStockAlerts: true,
    loanEmiAlerts: true,
    documentExpiryAlerts: true,
    autoLogDosagesEnabled: true,
    lastAutoDosageDate: new Date().toISOString().split('T')[0],
    lastSyncTime: new Date().toISOString(),
  });

  // 2. Primary Bank Accounts
  await db.accounts.bulkPut([
    {
      id: 'acc-1',
      name: 'Prime Privilege Savings',
      accountNumber: '402910008432',
      type: 'Savings',
      balance: 148250.75,
      bankName: 'Prime Bank',
      upiId: 'deepan@ivault',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'acc-2',
      name: 'Sapphiro Metal Credit Card',
      accountNumber: '4315XXXXXXXX8019',
      type: 'Credit Card',
      balance: -24180.0,
      bankName: 'Prime Bank',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'acc-3',
      name: 'Family Emergency Liquid Fund',
      accountNumber: '918020045199',
      type: 'Savings',
      balance: 350000.0,
      bankName: 'Prime Bank',
      upiId: 'rani@ivault',
      lastUpdated: new Date().toISOString(),
    },
  ]);

  // 3. Family Members
  await db.familyMembers.bulkPut([
    {
      id: 'mem-1',
      name: 'Deepan',
      age: 32,
      relationship: 'Self',
      status: 'Active',
      phone: '+91 98765 43210',
      bloodGroup: 'O+',
      avatarColor: '#C93B2B',
    },
    {
      id: 'mem-2',
      name: 'Rani',
      age: 30,
      relationship: 'Spouse',
      status: 'Active',
      phone: '+91 98765 43211',
      bloodGroup: 'B+',
      avatarColor: '#002D62',
    },
    {
      id: 'mem-3',
      name: 'Aarav',
      age: 4,
      relationship: 'Child',
      status: 'Active',
      bloodGroup: 'O+',
      avatarColor: '#D97706',
    },
    {
      id: 'mem-4',
      name: 'Kalyani Amma',
      age: 62,
      relationship: 'Mother',
      status: 'Active',
      bloodGroup: 'A+',
      avatarColor: '#059669',
    },
  ]);

  // 4. Budgets
  await db.budgets.bulkPut([
    {
      id: 'b-1',
      category: 'Groceries & Household',
      allocatedAmount: 25000,
      spentAmount: 18450,
      period: 'Monthly',
      warningThresholdPct: 80,
    },
    {
      id: 'b-2',
      category: 'Dining & Food Delivery',
      allocatedAmount: 12000,
      spentAmount: 11200, // 93% spent -> triggers warning
      period: 'Monthly',
      warningThresholdPct: 80,
    },
    {
      id: 'b-3',
      category: 'Fuel & Transportation',
      allocatedAmount: 10000,
      spentAmount: 6200,
      period: 'Monthly',
      warningThresholdPct: 80,
    },
    {
      id: 'b-4',
      category: 'Healthcare & Medicines',
      allocatedAmount: 8000,
      spentAmount: 4300,
      period: 'Monthly',
      warningThresholdPct: 80,
    },
    {
      id: 'b-5',
      category: 'Utilities & Subscriptions',
      allocatedAmount: 9000,
      spentAmount: 5100,
      period: 'Monthly',
      warningThresholdPct: 80,
    },
  ]);

  // 5. Recent Transactions
  await db.transactions.bulkPut([
    {
      id: 'tx-1',
      type: 'income',
      amount: 145000,
      category: 'Salary',
      subcategory: 'Tech Corp Direct Credit',
      date: '2026-10-01',
      paymentMode: 'Net Banking',
      familyMember: 'Deepan',
      notes: 'Monthly regular payroll credit',
      syncedToSheets: true,
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 4250,
      category: 'Groceries & Household',
      subcategory: 'DMart Supermarket',
      date: '2026-10-02',
      paymentMode: 'UPI',
      familyMember: 'Rani',
      notes: 'Monthly staples and dairy',
      syncedToSheets: true,
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 2800,
      category: 'Dining & Food Delivery',
      subcategory: 'Weekend Dinner',
      date: '2026-10-03',
      paymentMode: 'Credit Card',
      familyMember: 'Deepan',
      notes: 'Family dining at Barbeque Nation',
      syncedToSheets: true,
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 1450,
      category: 'Healthcare & Medicines',
      subcategory: 'Apollo Pharmacy',
      date: '2026-10-04',
      paymentMode: 'UPI',
      familyMember: 'Deepan',
      notes: 'Monthly refill prescription',
      syncedToSheets: true,
    },
  ]);

  // 6. Fixed Investments (PPF, SSA, RD)
  await db.fixedInvestments.bulkPut([
    {
      id: 'fi-1',
      name: 'Public Provident Fund (PPF)',
      type: 'PPF',
      accountNumberRedacted: 'XXXX-XXXX-9912',
      institution: 'State Bank of India',
      principalAmount: 650000,
      currentBalance: 842300,
      interestRate: 7.1,
      monthlyContribution: 12500,
      startDate: '2020-04-10',
      maturityDate: '2035-04-10',
      familyMember: 'Deepan',
      notes: '15-year tax free sovereign lock-in',
    },
    {
      id: 'fi-2',
      name: 'Sukanya Samriddhi Account (SSA)',
      type: 'SSA',
      accountNumberRedacted: 'XXXX-XXXX-4501',
      institution: 'India Post / Prime Bank',
      principalAmount: 320000,
      currentBalance: 418500,
      interestRate: 8.2,
      monthlyContribution: 10000,
      startDate: '2022-08-15',
      maturityDate: '2043-08-15',
      familyMember: 'Aarav', // For child
      notes: 'Highest sovereign rate with Section 80C + EEE tax benefit',
    },
    {
      id: 'fi-3',
      name: 'Bank Recurring Deposit (RD)',
      type: 'RD',
      accountNumberRedacted: 'XXXX-XXXX-1120',
      institution: 'Prime Bank',
      principalAmount: 120000,
      currentBalance: 138400,
      interestRate: 7.25,
      monthlyContribution: 10000,
      startDate: '2025-01-10',
      maturityDate: '2027-01-10',
      familyMember: 'Rani',
      notes: 'Targeted vacation and festival reserve fund',
    },
  ]);

  // 7. Demat & Mutual Funds
  await db.dematInvestments.bulkPut([
    {
      id: 'dm-1',
      name: 'Parag Parikh Flexi Cap Fund',
      symbol: 'PPFAS-DIR-G',
      type: 'Mutual Fund',
      units: 1420.55,
      avgBuyPrice: 58.2,
      currentNAV: 82.4,
      investedAmount: 82676,
      currentValue: 117053,
      sipFrequency: 'Monthly',
      folioNumber: 'PPF/80129',
      familyMember: 'Deepan',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'dm-2',
      name: 'Mirae Asset Large & Midcap Fund',
      symbol: 'MIRAE-LM-DIR',
      type: 'Mutual Fund',
      units: 980.12,
      avgBuyPrice: 94.5,
      currentNAV: 142.1,
      investedAmount: 92621,
      currentValue: 139275,
      sipFrequency: 'Monthly',
      folioNumber: 'MIR/99014',
      familyMember: 'Rani',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'dm-3',
      name: 'Bluechip Equity Growth Ltd',
      symbol: 'BLUECHIP.NS',
      type: 'Stock',
      units: 150,
      avgBuyPrice: 920.0,
      currentNAV: 1285.5,
      investedAmount: 138000,
      currentValue: 192825,
      folioNumber: 'ZERODHA-DP01',
      familyMember: 'Deepan',
      lastUpdated: new Date().toISOString(),
    },
  ]);

  // 8. Physical Gold Holdings
  await db.goldHoldings.bulkPut([
    {
      id: 'gold-1',
      itemName: '24K Sovereign Bullion Coin (Tanishq)',
      grams: 20.0,
      karat: '24K',
      purchaseRatePerGram: 6400,
      gstPct: 3.0,
      makingChargesPct: 2.0,
      totalLandedCost: 134400,
      purchaseDate: '2024-11-01',
      familyMember: 'Deepan',
      invoiceNumber: 'TAN-2024-889',
      notes: 'Stored in Bank Safe Deposit Vault',
    },
    {
      id: 'gold-2',
      itemName: '22K Traditional Bridal Necklace Set',
      grams: 48.5,
      karat: '22K',
      purchaseRatePerGram: 5850,
      gstPct: 3.0,
      makingChargesPct: 12.0,
      totalLandedCost: 326698,
      purchaseDate: '2023-05-18',
      familyMember: 'Rani',
      notes: 'Hallmarked 916 certified jewellery with BIS stamp',
    },
  ]);

  // 9. Loans & EMIs
  await db.loans.bulkPut([
    {
      id: 'loan-1',
      loanName: 'Prime Home Loan (Emerald Towers)',
      bank: 'Prime Bank',
      loanType: 'Home Loan',
      principalAmount: 4500000,
      outstandingBalance: 3680000,
      interestRate: 8.55,
      monthlyEmi: 39250,
      tenureMonths: 240,
      remainingMonths: 172,
      emiDueDate: 10, // 10th of every month
      autoDebitAccount: '402910008432 (Prime Bank)',
      startDate: '2021-03-10',
    },
    {
      id: 'loan-2',
      loanName: 'EV Car Loan (Tata Harrier)',
      bank: 'Prime Bank',
      loanType: 'Car Loan',
      principalAmount: 1400000,
      outstandingBalance: 420000,
      interestRate: 8.75,
      monthlyEmi: 28600,
      tenureMonths: 60,
      remainingMonths: 16,
      emiDueDate: 7, // 7th of every month
      autoDebitAccount: '402910008432 (Prime Bank)',
      startDate: '2022-09-07',
    },
  ]);

  // 10. Family Documents (Strictly Redacted by Default)
  await db.familyDocuments.bulkPut([
    {
      id: 'doc-1',
      memberId: 'mem-1',
      memberName: 'Deepan',
      docType: 'PAN Card',
      docNumberRedacted: '[Document ID Omitted]',
      docNumberEncrypted: '',
      issueDate: '2015-06-12',
      issuer: 'Income Tax Department of India',
      notes: 'Permanent Account Number card with biometric linked status',
    },
    {
      id: 'doc-2',
      memberId: 'mem-1',
      memberName: 'Deepan',
      docType: "Driver's License",
      docNumberRedacted: '[Document ID Omitted]',
      docNumberEncrypted: '',
      issueDate: '2016-10-20',
      expiryDate: '2026-10-25', // Expiring in ~20 days! Triggers visual alert
      issuer: 'Regional Transport Office (RTO)',
      notes: 'LMV + Two Wheeler endorsement. Expiry renewal required!',
    },
    {
      id: 'doc-3',
      memberId: 'mem-2',
      memberName: 'Rani',
      docType: 'Passport',
      docNumberRedacted: '[Document ID Omitted]',
      docNumberEncrypted: '',
      issueDate: '2020-02-14',
      expiryDate: '2030-02-13',
      issuer: 'Ministry of External Affairs, India',
      notes: 'Republic of India 36-page regular passport',
    },
    {
      id: 'doc-4',
      memberId: 'mem-1',
      memberName: 'Deepan',
      docType: 'Health Insurance',
      docNumberRedacted: '[Document ID Omitted]',
      docNumberEncrypted: '',
      issueDate: '2025-11-01',
      expiryDate: '2026-11-01',
      issuer: 'Care Complete Health Shield',
      notes: '₹25,00,000 Sum Insured floater policy covering all 4 family members',
    },
  ]);

  // 11. Family Medicines (With Stock Count & Dose Schedule)
  await db.medicines.bulkPut([
    {
      id: 'med-1',
      memberId: 'mem-4',
      memberName: 'Kalyani Amma',
      medicineName: 'Metformin 500mg',
      type: 'Tablet',
      dosage: '1 tablet (500mg)',
      timings: ['Morning', 'Night'],
      instructions: 'After Food',
      dailyQuantity: 2,
      currentStock: 6, // Below threshold 10 -> Low stock alert!
      minRefillThreshold: 10,
      lastDoseTakenAt: '2026-10-04T08:30:00Z',
      doctorNotes: 'Prescribed by Dr. Balaji for glycemic regulation',
    },
    {
      id: 'med-2',
      memberId: 'mem-4',
      memberName: 'Kalyani Amma',
      medicineName: 'Telmisartan 40mg',
      type: 'Tablet',
      dosage: '1 tablet (40mg)',
      timings: ['Morning'],
      instructions: 'Before Food',
      dailyQuantity: 1,
      currentStock: 28,
      minRefillThreshold: 7,
      lastDoseTakenAt: '2026-10-04T07:15:00Z',
      doctorNotes: 'Morning BP control',
    },
    {
      id: 'med-3',
      memberId: 'mem-1',
      memberName: 'Deepan',
      medicineName: 'Multivitamin Complex + Zinc',
      type: 'Capsule',
      dosage: '1 capsule',
      timings: ['Morning'],
      instructions: 'After Food',
      dailyQuantity: 1,
      currentStock: 18,
      minRefillThreshold: 5,
      doctorNotes: 'Daily vitality dietary supplement',
    },
    {
      id: 'med-4',
      memberId: 'mem-3',
      memberName: 'Aarav',
      medicineName: 'Vitamin D3 Pediatric Drops',
      type: 'Drops',
      dosage: '0.5 ml',
      timings: ['Morning'],
      instructions: 'With Food',
      dailyQuantity: 1,
      currentStock: 1, // Only 1 bottle left
      minRefillThreshold: 2,
      doctorNotes: 'Pediatric recommendation for bone growth',
    },
  ]);

  // 12. Notifications (Pre-loaded smart alerts)
  await db.notifications.bulkPut([
    {
      id: 'notif-1',
      timestamp: new Date().toISOString(),
      type: 'medicine',
      title: 'Low Medicine Stock: Metformin 500mg',
      message: "Kalyani Amma's Metformin has only 6 tablets left (Threshold: 10). Reorder soon!",
      severity: 'danger',
      read: false,
      linkTab: 'medicines',
    },
    {
      id: 'notif-2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'doc_expiry',
      title: "Document Renewal Alert: Driver's License",
      message: "Deepan's Driver's License expires on 25 Oct 2026 (in 20 days). Schedule RTO slot.",
      severity: 'warning',
      read: false,
      linkTab: 'documents',
    },
    {
      id: 'notif-3',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: 'loan',
      title: 'Upcoming Loan EMI: EV Car Loan',
      message: '₹28,600 will be auto-debited on the 7th of this month from Prime A/c ...4029.',
      severity: 'info',
      read: false,
      linkTab: 'fintracker',
    },
    {
      id: 'notif-4',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      type: 'budget',
      title: 'Budget Limit Notice: Dining & Food',
      message: 'Dining expenses reached 93.3% of allocated ₹12,000 monthly limit.',
      severity: 'warning',
      read: false,
      linkTab: 'fintracker',
    },
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
  ]);

  await initializeDatabase();
}
