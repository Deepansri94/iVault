/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  db,
  initializeDatabase,
} from './services/db.service';
import { ThemeService } from './services/theme.service';
import { NotificationService } from './services/notification.service';
import { GoogleSheetsSyncService } from './services/google-sheets-sync.service';

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
  Transaction,
  VaultCredential,
  Insurance,
  BalanceTransferPayload,
  CashWithdrawalPayload,
} from './types/db.types';

// Layout & Common Components
import { TopHeader } from './components/layout/TopHeader';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Dashboard Components
import { NetWorthCarousel } from './components/dashboard/NetWorthCarousel';
import { QuickActionGrid } from './components/dashboard/QuickActionGrid';
import { ExecutiveSummary } from './components/dashboard/ExecutiveSummary';

// Modules
import { FinTrackerModule } from './components/fintracker/FinTrackerModule';
import { useFormFocus } from './hooks/useFormFocus';
import { FamilyDocTrackerModule } from './components/familydocs/FamilyDocTrackerModule';
import { MedicineTrackerModule } from './components/medicines/MedicineTrackerModule';
import { PasswordVaultModule } from './components/vault/PasswordVaultModule';
import { SettingsModule } from './components/settings/SettingsModule';

// Modals
import { NotificationCenterModal } from './components/notifications/NotificationCenterModal';
import { SmartQuickEntryModal } from './components/dashboard/SmartQuickEntryModal';
import { TestRunnerModal } from './components/testing/TestRunnerModal';
import { PrescriptionModal } from './components/medicines/PrescriptionModal';
import { BalanceTransferModal, CashWithdrawalModal } from './components/fintracker/AccountActionModals';
import { X, TrendingUp, Sparkles, CheckCircle2, Shield, AlertCircle, Cloud, ArrowLeftRight, Banknote } from 'lucide-react';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [initialFinanceSubTab, setInitialFinanceSubTab] = useState<'ledger' | 'accounts' | 'budgets' | 'fixed' | 'demat' | 'gold' | 'loans' | 'insurances'>('ledger');
  const [activeMember, setActiveMember] = useState<string>('Deepan');

  // Database States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [fixedInvestments, setFixedInvestments] = useState<FixedInvestment[]>([]);
  const [dematInvestments, setDematInvestments] = useState<DematInvestment[]>([]);
  const [goldHoldings, setGoldHoldings] = useState<GoldHolding[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyDocuments, setFamilyDocuments] = useState<FamilyDocument[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [credentials, setCredentials] = useState<VaultCredential[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Modals
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showSmartEntryModal, setShowSmartEntryModal] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const [showQuickIncomeModal, setShowQuickIncomeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const quickExpenseModalRef = useFormFocus<HTMLDivElement>(showQuickExpenseModal);
  const quickIncomeModalRef = useFormFocus<HTMLDivElement>(showQuickIncomeModal);
  const [syncToastNotice, setSyncToastNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSyncToastNotice({ type, message });
    setTimeout(() => {
      setSyncToastNotice((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Quick Action form states
  const [quickAmount, setQuickAmount] = useState('');
  const [quickExpenseDate, setQuickExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickIncomeDate, setQuickIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickCategory, setQuickCategory] = useState('');
  const [quickIncomeCategory, setQuickIncomeCategory] = useState('');
  const [quickExpensePaymentMode, setQuickExpensePaymentMode] = useState<Transaction['paymentMode']>('UPI');
  const [quickIncomePaymentMode, setQuickIncomePaymentMode] = useState<Transaction['paymentMode']>('Net Banking');
  const [quickExpenseAccountId, setQuickExpenseAccountId] = useState('');
  const [quickIncomeAccountId, setQuickIncomeAccountId] = useState('');
  const [quickNotes, setQuickNotes] = useState('');

  // Categories mentioned in Budgets
  const budgetCategoryNames = useMemo(() => {
    return Array.from(new Set(budgets.map((b) => b.category?.trim()).filter(Boolean)));
  }, [budgets]);

  // Comprehensive Expense Categories for Quick Access (Budgets categories first)
  const quickExpenseCategories = useMemo(() => {
    const list: string[] = [];
    budgetCategoryNames.forEach((cat) => {
      if (!list.includes(cat)) list.push(cat);
    });
    const defaultExpenseCategories = [
      'Groceries & Household',
      'Dining & Food Delivery',
      'Fuel & Transportation',
      'Healthcare & Medicines',
      'Utilities & Subscriptions',
      'Shopping & Lifestyle',
      'Entertainment & Leisure',
      'Rent & Maintenance',
      'General Expenses',
    ];
    defaultExpenseCategories.forEach((cat) => {
      if (!list.includes(cat)) list.push(cat);
    });
    return list;
  }, [budgetCategoryNames]);

  // Comprehensive Income Categories for Quick Access (Budgets categories first)
  const quickIncomeCategories = useMemo(() => {
    const list: string[] = [];
    budgetCategoryNames.forEach((cat) => {
      if (!list.includes(cat)) list.push(cat);
    });
    const defaultIncomeCategories = [
      'Salary',
      'Business / Professional',
      'Freelance & Consulting',
      'Investment Credit & Dividends',
      'Rental Income',
      'Bonus & Incentive',
      'Interest Credit',
      'Other Income',
    ];
    defaultIncomeCategories.forEach((cat) => {
      if (!list.includes(cat)) list.push(cat);
    });
    return list;
  }, [budgetCategoryNames]);

  // Keep quick category selections synchronized with available categories
  useEffect(() => {
    if (!quickExpenseCategories.includes(quickCategory)) {
      setQuickCategory(quickExpenseCategories[0] || 'Groceries & Household');
    }
  }, [quickExpenseCategories, quickCategory]);

  useEffect(() => {
    if (!quickIncomeCategories.includes(quickIncomeCategory)) {
      setQuickIncomeCategory(quickIncomeCategories[0] || 'Salary');
    }
  }, [quickIncomeCategories, quickIncomeCategory]);

  // 1. Initial Load & Seed
  const loadDatabase = useCallback(async () => {
    try {
      await initializeDatabase();
      await ThemeService.loadSavedTheme();

      const [
        accs,
        txs,
        bgs,
        fis,
        dms,
        golds,
        lns,
        inss,
        members,
        docs,
        meds,
        creds,
        notifs,
        sett,
        syncPending,
      ] = await Promise.all([
        db.accounts.toArray(),
        db.transactions.orderBy('date').reverse().toArray(),
        db.budgets.toArray(),
        db.fixedInvestments.toArray(),
        db.dematInvestments.toArray(),
        db.goldHoldings.toArray(),
        db.loans.toArray(),
        db.insurances.toArray(),
        db.familyMembers.toArray(),
        db.familyDocuments.toArray(),
        db.medicines.toArray(),
        db.passwords.toArray(),
        db.notifications.orderBy('timestamp').reverse().toArray(),
        db.appSettings.get('default'),
        db.syncQueue.where('status').equals('pending').count(),
      ]);

      setAccounts(accs);
      setTransactions(txs);
      setBudgets(bgs);
      setFixedInvestments(fis);
      setDematInvestments(dms);
      setGoldHoldings(golds);
      setLoans(lns);
      setInsurances(inss);
      setFamilyMembers(members);
      setFamilyDocuments(docs);
      setMedicines(meds);
      setCredentials(creds);
      setNotifications(notifs);
      setSettings(sett || null);
      setPendingSyncCount(syncPending);

      // Automatic daily dosage deduction check if enabled
      if (sett?.autoLogDosagesEnabled) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (sett.lastAutoDosageDate !== todayStr) {
          let autoDeductedCount = 0;
          for (const m of meds) {
            if (m.currentStock > 0 && (!m.lastDoseTakenAt || !m.lastDoseTakenAt.startsWith(todayStr))) {
              const deductQty = m.dailyQuantity || 1;
              m.currentStock = Math.max(0, m.currentStock - deductQty);
              m.lastDoseTakenAt = new Date().toISOString();
              await db.medicines.put(m);
              autoDeductedCount++;

              if (m.currentStock <= m.minRefillThreshold) {
                await NotificationService.dispatchNotification({
                  type: 'medicine',
                  title: `💊 Refill Alert: ${m.medicineName}`,
                  message: `Automatic daily dose logged. Stock for ${m.memberName} is now ${m.currentStock} units.`,
                  severity: 'warning',
                  linkTab: 'medicines',
                });
              }
            }
          }

          await db.appSettings.update('default', { lastAutoDosageDate: todayStr });
          if (sett) sett.lastAutoDosageDate = todayStr;

          if (autoDeductedCount > 0) {
            await db.notifications.add({
              id: `notif-autodose-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'medicine',
              title: '⚡ Automatic Daily Dosage Logged',
              message: `Auto-deducted daily doses for ${autoDeductedCount} family medicine${autoDeductedCount === 1 ? '' : 's'}.`,
              severity: 'success',
              read: false,
              linkTab: 'medicines',
            });
            const refreshedMeds = await db.medicines.toArray();
            const refreshedNotifs = await db.notifications.orderBy('timestamp').reverse().toArray();
            setMedicines(refreshedMeds);
            setNotifications(refreshedNotifs);
          }
        }
      }

      // Run automated alert audits
      try {
        await NotificationService.runAutomatedNotificationAudits();
        const finalNotifs = await db.notifications.orderBy('timestamp').reverse().toArray();
        setNotifications(finalNotifs);
      } catch (auditErr) {
        console.warn('Failed to run automated notification audits:', auditErr);
      }
    } catch (err) {
      console.error('Failed to initialize iVault Pro DB:', err);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadDatabase();
  }, [loadDatabase]);

  // Background Auto-Sync Trigger to Google Sheets
  const triggerAutoSync = useCallback(async () => {
    try {
      const current = await db.appSettings.get('default');
      if (
        current?.sheetsWebappUrl &&
        current.sheetsWebappUrl.startsWith('http') &&
        current.autoSyncEnabled !== false
      ) {
        await GoogleSheetsSyncService.syncWithGoogleAppsScript(current.sheetsWebappUrl);
        const now = new Date().toISOString();
        await db.appSettings.update('default', { lastSyncTime: now });
        setSettings((prev) => (prev ? { ...prev, lastSyncTime: now } : prev));
        await loadDatabase();
      }
    } catch (err) {
      console.warn('Auto-sync notice:', err);
    }
  }, [loadDatabase]);

  // Handler: Take Medicine Dose
  const handleTakeDose = async (medicineId: string) => {
    const med = await db.medicines.get(medicineId);
    if (!med) return;

    med.currentStock = Math.max(0, med.currentStock - 1);
    med.lastDoseTakenAt = new Date().toISOString();
    await db.medicines.put(med);

    if (med.currentStock <= med.minRefillThreshold) {
      await NotificationService.dispatchNotification({
        type: 'medicine',
        title: `💊 Refill Alert: ${med.medicineName}`,
        message: `Stock for ${med.memberName} has dropped to ${med.currentStock} units (Threshold: ${med.minRefillThreshold}).`,
        severity: med.currentStock === 0 ? 'danger' : 'warning',
        linkTab: 'medicines',
      });
    }

    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Refill Medicine Stock
  const handleRefillStock = async (medicineId: string, quantity: number) => {
    const med = await db.medicines.get(medicineId);
    if (!med) return;

    med.currentStock += quantity;
    await db.medicines.put(med);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Batch Take Doses
  const handleBatchTakeDoses = async (
    timing?: 'Morning' | 'Afternoon' | 'Night' | 'all',
    memberName?: string
  ): Promise<number> => {
    const allMeds = await db.medicines.toArray();
    const targets = allMeds.filter((m) => {
      if (memberName && memberName !== 'all' && m.memberName !== memberName) return false;
      if (timing && timing !== 'all' && !m.timings.includes(timing)) return false;
      return true;
    });

    let updatedCount = 0;
    for (const med of targets) {
      if (med.currentStock > 0) {
        med.currentStock = Math.max(0, med.currentStock - (med.dailyQuantity || 1));
        med.lastDoseTakenAt = new Date().toISOString();
        await db.medicines.put(med);
        updatedCount++;

        if (med.currentStock <= med.minRefillThreshold) {
          await NotificationService.dispatchNotification({
            type: 'medicine',
            title: `💊 Refill Alert: ${med.medicineName}`,
            message: `Batch logged. Stock for ${med.memberName} is now ${med.currentStock} units.`,
            severity: med.currentStock === 0 ? 'danger' : 'warning',
            linkTab: 'medicines',
          });
        }
      }
    }

    await loadDatabase();
    triggerAutoSync();
    return updatedCount;
  };

  // Handler: Revert Dose
  const handleRevertDose = async (medicineId: string) => {
    const med = await db.medicines.get(medicineId);
    if (!med) return;

    med.currentStock += (med.dailyQuantity || 1);
    med.lastDoseTakenAt = undefined;
    await db.medicines.put(med);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Toggle Auto Logging
  const handleToggleAutoLogging = async (enabled: boolean) => {
    await db.appSettings.update('default', { autoLogDosagesEnabled: enabled });
    setSettings((prev) => (prev ? { ...prev, autoLogDosagesEnabled: enabled } : prev));
  };

  const handleAddAccount = async (accountData: Omit<Account, 'id'>) => {
    await db.accounts.put({ id: `account-${Date.now()}`, ...accountData });
    await loadDatabase();
    triggerAutoSync();
  };

  const handleUpdateAccount = async (account: Account) => {
    await db.accounts.put(account);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleDeleteAccount = async (id: string) => {
    await db.accounts.delete(id);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Balance Transfer between Accounts
  const handleTransferBalance = async (payload: BalanceTransferPayload) => {
    const fromAccount = await db.accounts.get(payload.fromAccountId);
    const toAccount = await db.accounts.get(payload.toAccountId);

    if (!fromAccount || !toAccount) {
      showToast('Error: Selected account not found.', 'error');
      return;
    }

    if (fromAccount.balance < payload.amount) {
      showToast(`Insufficient balance in ${fromAccount.name}. Available: ₹${fromAccount.balance.toLocaleString('en-IN')}`, 'error');
      return;
    }

    const now = new Date().toISOString();

    // 1. Update balances atomically
    fromAccount.balance -= payload.amount;
    fromAccount.lastUpdated = now;
    toAccount.balance += payload.amount;
    toAccount.lastUpdated = now;

    await db.accounts.put(fromAccount);
    await db.accounts.put(toAccount);

    // 2. Add audit transactions
    const txOut: Transaction = {
      id: `tx-out-${Date.now()}`,
      type: 'expense',
      amount: payload.amount,
      category: 'Account Transfer',
      subcategory: `To: ${toAccount.name}`,
      date: payload.date,
      paymentMode: (payload.transferMode === 'UPI' ? 'UPI' : 'Net Banking') as Transaction['paymentMode'],
      familyMember: payload.familyMember,
      notes: `Transfer to ${toAccount.name} (${toAccount.bankName})${payload.notes ? ` - ${payload.notes}` : ''}`,
      accountId: fromAccount.id,
      syncedToSheets: false,
    };

    const txIn: Transaction = {
      id: `tx-in-${Date.now() + 1}`,
      type: 'income',
      amount: payload.amount,
      category: 'Account Transfer',
      subcategory: `From: ${fromAccount.name}`,
      date: payload.date,
      paymentMode: (payload.transferMode === 'UPI' ? 'UPI' : 'Net Banking') as Transaction['paymentMode'],
      familyMember: payload.familyMember,
      notes: `Transfer from ${fromAccount.name} (${fromAccount.bankName})${payload.notes ? ` - ${payload.notes}` : ''}`,
      accountId: toAccount.id,
      syncedToSheets: false,
    };

    await db.transactions.bulkPut([txOut, txIn]);

    // 3. Queue for sync
    await db.syncQueue.bulkPut([
      {
        id: `sync-acc-${Date.now()}-1`,
        timestamp: now,
        entityType: 'account',
        action: 'update',
        payload: JSON.stringify(fromAccount),
        status: 'pending',
      },
      {
        id: `sync-acc-${Date.now()}-2`,
        timestamp: now,
        entityType: 'account',
        action: 'update',
        payload: JSON.stringify(toAccount),
        status: 'pending',
      },
      {
        id: `sync-tx-${Date.now()}-1`,
        timestamp: now,
        entityType: 'transaction',
        action: 'insert',
        payload: JSON.stringify(txOut),
        status: 'pending',
      },
      {
        id: `sync-tx-${Date.now()}-2`,
        timestamp: now,
        entityType: 'transaction',
        action: 'insert',
        payload: JSON.stringify(txIn),
        status: 'pending',
      },
    ]);

    await loadDatabase();
    triggerAutoSync();
    showToast(`Transferred ₹${payload.amount.toLocaleString('en-IN')} from ${fromAccount.name} to ${toAccount.name}`, 'success');
  };

  // Handler: Cash Withdrawal
  const handleCashWithdrawal = async (payload: CashWithdrawalPayload) => {
    const fromAccount = await db.accounts.get(payload.fromAccountId);

    if (!fromAccount) {
      showToast('Error: Source bank account not found.', 'error');
      return;
    }

    if (fromAccount.balance < payload.amount) {
      showToast(`Insufficient balance in ${fromAccount.name}. Available: ₹${fromAccount.balance.toLocaleString('en-IN')}`, 'error');
      return;
    }

    const now = new Date().toISOString();

    // 1. Debit source bank account
    fromAccount.balance -= payload.amount;
    fromAccount.lastUpdated = now;
    await db.accounts.put(fromAccount);

    if (payload.destinationMode === 'wallet') {
      // Find or create 'Cash in Hand' account
      let cashAccount: Account | undefined;
      if (payload.targetWalletId) {
        cashAccount = await db.accounts.get(payload.targetWalletId);
      }
      if (!cashAccount) {
        cashAccount = await db.accounts.where('type').equals('Wallet').first();
      }
      if (!cashAccount) {
        cashAccount = {
          id: `acc-cash-${Date.now()}`,
          name: 'Cash in Hand',
          bankName: 'Physical Cash Wallet',
          accountNumber: 'CASH-WALLET',
          type: 'Wallet',
          balance: 0,
          lastUpdated: now,
        };
      }

      cashAccount.balance += payload.amount;
      cashAccount.lastUpdated = now;
      await db.accounts.put(cashAccount);

      // Ledger: Transfer from Bank to Cash Wallet
      const txOut: Transaction = {
        id: `tx-cw-out-${Date.now()}`,
        type: 'expense',
        amount: payload.amount,
        category: 'Cash Withdrawal',
        subcategory: 'ATM Withdrawal',
        date: payload.date,
        paymentMode: 'Debit Card',
        familyMember: payload.familyMember,
        notes: `Cash withdrawn from ${fromAccount.name} into ${cashAccount.name}${payload.notes ? ` - ${payload.notes}` : ''}`,
        accountId: fromAccount.id,
        syncedToSheets: false,
      };

      const txIn: Transaction = {
        id: `tx-cw-in-${Date.now() + 1}`,
        type: 'income',
        amount: payload.amount,
        category: 'Cash Withdrawal',
        subcategory: 'Cash Received',
        date: payload.date,
        paymentMode: 'Cash',
        familyMember: payload.familyMember,
        notes: `Cash deposit from ${fromAccount.name} ATM withdrawal${payload.notes ? ` - ${payload.notes}` : ''}`,
        accountId: cashAccount.id,
        syncedToSheets: false,
      };

      await db.transactions.bulkPut([txOut, txIn]);
      await loadDatabase();
      triggerAutoSync();
      showToast(`Withdrew ₹${payload.amount.toLocaleString('en-IN')} cash from ${fromAccount.name} into ${cashAccount.name}`, 'success');
    } else {
      // Direct Cash Out / Expense
      const txOut: Transaction = {
        id: `tx-cw-exp-${Date.now()}`,
        type: 'expense',
        amount: payload.amount,
        category: 'Cash Withdrawal',
        subcategory: 'ATM Withdrawal',
        date: payload.date,
        paymentMode: 'Debit Card',
        familyMember: payload.familyMember,
        notes: `Cash withdrawal from ${fromAccount.name}${payload.notes ? ` - ${payload.notes}` : ''}`,
        accountId: fromAccount.id,
        syncedToSheets: false,
      };

      await db.transactions.put(txOut);
      await loadDatabase();
      triggerAutoSync();
      showToast(`Withdrew ₹${payload.amount.toLocaleString('en-IN')} cash from ${fromAccount.name}`, 'success');
    }
  };

  // Handler: Add Transaction
  const handleAddTransaction = async (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      ...txData,
    };
    await db.transactions.put(newTx);

    // Update budget if expense
    if (newTx.type === 'expense') {
      const budget = await db.budgets.where('category').equalsIgnoreCase(newTx.category).first();
      if (budget) {
        budget.spentAmount += newTx.amount;
        await db.budgets.put(budget);
      }
    }

    // Update account balance if accountId is linked
    if (newTx.accountId) {
      const account = await db.accounts.get(newTx.accountId);
      if (account) {
        account.balance = newTx.type === 'expense' ? account.balance - newTx.amount : account.balance + newTx.amount;
        account.lastUpdated = new Date().toISOString();
        await db.accounts.put(account);

        await db.syncQueue.put({
          id: `sync-acc-${Date.now()}`,
          timestamp: new Date().toISOString(),
          entityType: 'account',
          action: 'update',
          payload: JSON.stringify(account),
          status: 'pending',
        });
      }
    }

    // Queue for sync
    await db.syncQueue.put({
      id: `sync-${Date.now()}`,
      timestamp: new Date().toISOString(),
      entityType: 'transaction',
      action: 'insert',
      payload: JSON.stringify(newTx),
      status: 'pending',
    });

    await loadDatabase();
    triggerAutoSync();
  };

  // Quick Action Openers (pre-populate categories from budgets)
  const handleOpenQuickExpense = () => {
    setQuickAmount('');
    setQuickNotes('');
    setQuickExpenseDate(new Date().toISOString().split('T')[0]);
    const initial = budgetCategoryNames[0] || quickExpenseCategories[0] || 'Groceries & Household';
    setQuickCategory(initial);
    setQuickExpensePaymentMode('UPI');
    setQuickExpenseAccountId('');
    setShowQuickExpenseModal(true);
  };

  const handleOpenQuickIncome = () => {
    setQuickAmount('');
    setQuickNotes('');
    setQuickIncomeDate(new Date().toISOString().split('T')[0]);
    const matchingBudget = budgetCategoryNames.find((c) =>
      /salary|income|credit|consulting|freelance|business|rental/i.test(c)
    );
    const initial = matchingBudget || (budgetCategoryNames.length > 0 ? budgetCategoryNames[0] : 'Salary');
    setQuickIncomeCategory(initial);
    setQuickIncomePaymentMode('Net Banking');
    setQuickIncomeAccountId('');
    setShowQuickIncomeModal(true);
  };

  // Quick Action Expense Handler
  const handleQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount) return;

    const chosenCategory = quickCategory || quickExpenseCategories[0] || 'Groceries & Household';

    await handleAddTransaction({
      type: 'expense',
      amount: parseFloat(quickAmount),
      category: chosenCategory,
      date: quickExpenseDate || new Date().toISOString().split('T')[0],
      paymentMode: quickExpensePaymentMode,
      familyMember: activeMember,
      notes: quickNotes || 'Quick Action Expense',
      accountId: quickExpenseAccountId || undefined,
      syncedToSheets: false,
    });

    setQuickAmount('');
    setQuickNotes('');
    setQuickExpenseDate(new Date().toISOString().split('T')[0]);
    setShowQuickExpenseModal(false);
  };

  // Quick Action Income Handler
  const handleQuickIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount) return;

    const chosenCategory = quickIncomeCategory || quickIncomeCategories[0] || 'Salary';

    await handleAddTransaction({
      type: 'income',
      amount: parseFloat(quickAmount),
      category: chosenCategory,
      subcategory: 'Direct Credit',
      date: quickIncomeDate || new Date().toISOString().split('T')[0],
      paymentMode: quickIncomePaymentMode,
      familyMember: activeMember,
      notes: quickNotes || 'Income Credit',
      accountId: quickIncomeAccountId || undefined,
      syncedToSheets: false,
    });

    setQuickAmount('');
    setQuickNotes('');
    setQuickIncomeDate(new Date().toISOString().split('T')[0]);
    setShowQuickIncomeModal(false);
  };

  // Handler: Add, Update & Delete Budget
  const handleAddBudget = async (b: Omit<Budget, 'id'>) => {
    await db.budgets.put({
      id: `b-${Date.now()}`,
      ...b,
    });
    await loadDatabase();
    triggerAutoSync();
  };

  const handleUpdateBudget = async (b: Budget) => {
    await db.budgets.put(b);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleDeleteBudget = async (id: string) => {
    await db.budgets.delete(id);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleContributeFixedInvestment = async (payload: {
    fixedInvestmentId: string;
    amount: number;
    accountId: string;
    date: string;
    paymentMode: Transaction['paymentMode'];
    notes?: string;
  }) => {
    const scheme = await db.fixedInvestments.get(payload.fixedInvestmentId);
    if (!scheme) return;

    const isNPS = scheme.type === 'NPS';

    // 1. Update scheme balance
    scheme.currentBalance += payload.amount;
    scheme.lastContributionDate = payload.date;
    await db.fixedInvestments.put(scheme);

    // 2. If not NPS, debit account balance and record ledger transaction
    if (!isNPS && payload.accountId) {
      const account = await db.accounts.get(payload.accountId);
      if (account) {
        account.balance -= payload.amount;
        account.lastUpdated = new Date().toISOString();
        await db.accounts.put(account);

        await db.syncQueue.put({
          id: `sync-acc-${Date.now()}`,
          timestamp: new Date().toISOString(),
          entityType: 'account',
          action: 'update',
          payload: JSON.stringify(account),
          status: 'pending',
        });
      }

      // Record transaction
      const newTx: Transaction = {
        id: `tx-contrib-${Date.now()}`,
        type: 'expense',
        amount: payload.amount,
        category: 'Investments & Savings',
        subcategory: `${scheme.type} Contribution`,
        date: payload.date,
        paymentMode: payload.paymentMode,
        familyMember: scheme.familyMember || activeMember,
        notes: payload.notes || `Contribution of ₹${payload.amount.toLocaleString('en-IN')} to ${scheme.name} (${scheme.type})`,
        accountId: payload.accountId,
        syncedToSheets: false,
      };
      await db.transactions.put(newTx);

      await db.syncQueue.put({
        id: `sync-tx-${Date.now()}`,
        timestamp: new Date().toISOString(),
        entityType: 'transaction',
        action: 'insert',
        payload: JSON.stringify(newTx),
        status: 'pending',
      });
    }

    await loadDatabase();
    triggerAutoSync();
    showToast(`Successfully contributed ₹${payload.amount.toLocaleString('en-IN')} to ${scheme.name} (${scheme.type})`, 'success');
  };

  const handlePayLoanEmi = async (payload: {
    loanId: string;
    amount: number;
    accountId: string;
    date: string;
    paymentMode: Transaction['paymentMode'];
    notes?: string;
  }) => {
    const loan = await db.loans.get(payload.loanId);
    if (!loan) return;

    // 1. Reduce loan outstanding balance and remaining months
    loan.outstandingBalance = Math.max(0, loan.outstandingBalance - payload.amount);
    if (loan.remainingMonths > 0) {
      loan.remainingMonths -= 1;
    }
    await db.loans.put(loan);

    // 2. Debit account balance
    if (payload.accountId) {
      const account = await db.accounts.get(payload.accountId);
      if (account) {
        account.balance -= payload.amount;
        account.lastUpdated = new Date().toISOString();
        await db.accounts.put(account);

        await db.syncQueue.put({
          id: `sync-acc-${Date.now()}`,
          timestamp: new Date().toISOString(),
          entityType: 'account',
          action: 'update',
          payload: JSON.stringify(account),
          status: 'pending',
        });
      }

      // 3. Record transaction in ledger
      const newTx: Transaction = {
        id: `tx-loan-${Date.now()}`,
        type: 'expense',
        amount: payload.amount,
        category: 'Debt & Loans',
        subcategory: `${loan.loanType} EMI`,
        date: payload.date,
        paymentMode: payload.paymentMode,
        familyMember: activeMember,
        notes: payload.notes || `EMI repayment of ₹${payload.amount.toLocaleString('en-IN')} for ${loan.loanName} (${loan.bank})`,
        accountId: payload.accountId,
        syncedToSheets: false,
      };
      await db.transactions.put(newTx);

      await db.syncQueue.put({
        id: `sync-tx-${Date.now()}`,
        timestamp: new Date().toISOString(),
        entityType: 'transaction',
        action: 'insert',
        payload: JSON.stringify(newTx),
        status: 'pending',
      });
    }

    await loadDatabase();
    triggerAutoSync();
    showToast(`Paid EMI of ₹${payload.amount.toLocaleString('en-IN')} for ${loan.loanName}`, 'success');
  };

  const handlePayInsurancePremium = async (payload: {
    insuranceId: string;
    amount: number;
    accountId: string;
    date: string;
    paymentMode: Transaction['paymentMode'];
    notes?: string;
    advanceDueDate?: boolean;
  }) => {
    const insurance = await db.insurances.get(payload.insuranceId);
    if (!insurance) return;

    // 1. Update last paid date and optionally advance next due date
    insurance.lastPaidDate = payload.date;
    if (payload.advanceDueDate && insurance.nextDueDate) {
      const base = new Date(insurance.nextDueDate);
      if (insurance.frequency === 'Monthly') base.setMonth(base.getMonth() + 1);
      else if (insurance.frequency === 'Quarterly') base.setMonth(base.getMonth() + 3);
      else if (insurance.frequency === 'Half-Yearly') base.setMonth(base.getMonth() + 6);
      else base.setFullYear(base.getFullYear() + 1);
      insurance.nextDueDate = base.toISOString().split('T')[0];
    }
    await db.insurances.put(insurance);

    // 2. Debit account balance
    if (payload.accountId) {
      const account = await db.accounts.get(payload.accountId);
      if (account) {
        account.balance -= payload.amount;
        account.lastUpdated = new Date().toISOString();
        await db.accounts.put(account);

        await db.syncQueue.put({
          id: `sync-acc-${Date.now()}`,
          timestamp: new Date().toISOString(),
          entityType: 'account',
          action: 'update',
          payload: JSON.stringify(account),
          status: 'pending',
        });
      }

      // 3. Record transaction in ledger
      const newTx: Transaction = {
        id: `tx-ins-${Date.now()}`,
        type: 'expense',
        amount: payload.amount,
        category: 'Insurance & Health',
        subcategory: `${insurance.type} Premium`,
        date: payload.date,
        paymentMode: payload.paymentMode,
        familyMember: insurance.familyMember || activeMember,
        notes: payload.notes || `Premium payment of ₹${payload.amount.toLocaleString('en-IN')} for ${insurance.policyName} (${insurance.insurer})`,
        accountId: payload.accountId,
        syncedToSheets: false,
      };
      await db.transactions.put(newTx);

      await db.syncQueue.put({
        id: `sync-tx-${Date.now()}`,
        timestamp: new Date().toISOString(),
        entityType: 'transaction',
        action: 'insert',
        payload: JSON.stringify(newTx),
        status: 'pending',
      });
    }

    await loadDatabase();
    triggerAutoSync();
    showToast(`Paid premium of ₹${payload.amount.toLocaleString('en-IN')} for ${insurance.policyName}`, 'success');
  };

  const handleUpdateFixedInvestment = async (fi: FixedInvestment) => {
    await db.fixedInvestments.put(fi);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleDeleteFixedInvestment = async (id: string) => {
    await db.fixedInvestments.delete(id);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Add & Edit Demat Investment
  const handleAddDematInvestment = async (dm: Omit<DematInvestment, 'id'>) => {
    await db.dematInvestments.put({
      id: `dm-${Date.now()}`,
      ...dm,
    });
    await loadDatabase();
    triggerAutoSync();
  };

  const handleUpdateDematInvestment = async (dm: DematInvestment) => {
    await db.dematInvestments.put(dm);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleDeleteDematInvestment = async (id: string) => {
    await db.dematInvestments.delete(id);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Add & Edit Gold Holding
  const handleAddGoldHolding = async (gold: Omit<GoldHolding, 'id'>) => {
    await db.goldHoldings.put({
      id: `gold-${Date.now()}`,
      ...gold,
    });
    await loadDatabase();
    triggerAutoSync();
  };

  const handleUpdateGoldHolding = async (gold: GoldHolding) => {
    await db.goldHoldings.put(gold);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleDeleteGoldHolding = async (id: string) => {
    await db.goldHoldings.delete(id);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Add & Edit Loan
  const handleAddLoan = async (loan: Omit<Loan, 'id'>) => {
    await db.loans.put({
      id: `loan-${Date.now()}`,
      ...loan,
    });
    await loadDatabase();
    triggerAutoSync();
  };

  const handleUpdateLoan = async (loan: Loan) => {
    await db.loans.put(loan);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleDeleteLoan = async (id: string) => {
    await db.loans.delete(id);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Add & Edit Insurance
  const handleAddInsurance = async (ins: Omit<Insurance, 'id'>) => {
    const newIns: Insurance = {
      id: `ins-${Date.now()}`,
      ...ins,
    };
    await db.insurances.put(newIns);

    await db.syncQueue.put({
      id: `sync-${Date.now()}`,
      timestamp: new Date().toISOString(),
      entityType: 'insurance',
      action: 'insert',
      payload: JSON.stringify(newIns),
      status: 'pending',
    });

    await loadDatabase();
    triggerAutoSync();
    showToast(`Added insurance policy ${newIns.policyName}`, 'success');
  };

  const handleUpdateInsurance = async (ins: Insurance) => {
    await db.insurances.put(ins);

    await db.syncQueue.put({
      id: `sync-${Date.now()}`,
      timestamp: new Date().toISOString(),
      entityType: 'insurance',
      action: 'update',
      payload: JSON.stringify(ins),
      status: 'pending',
    });

    await loadDatabase();
    triggerAutoSync();
    showToast(`Updated policy ${ins.policyName}`, 'success');
  };

  const handleDeleteInsurance = async (id: string) => {
    const existing = await db.insurances.get(id);
    await db.insurances.delete(id);

    await db.syncQueue.put({
      id: `sync-${Date.now()}`,
      timestamp: new Date().toISOString(),
      entityType: 'insurance',
      action: 'delete',
      payload: JSON.stringify({ id }),
      status: 'pending',
    });

    await loadDatabase();
    triggerAutoSync();
    showToast(`Deleted policy ${existing?.policyName || ''}`, 'info');
  };

  // Handler: Add Document
  const handleAddDocument = async (doc: Omit<FamilyDocument, 'id'>) => {
    await db.familyDocuments.put({
      id: `doc-${Date.now()}`,
      ...doc,
    });
    await loadDatabase();
    triggerAutoSync();
  };

  const handleUpdateDocument = async (doc: FamilyDocument) => {
    await db.familyDocuments.put(doc);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleDeleteDocument = async (id: string) => {
    await db.familyDocuments.delete(id);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Add Member
  const handleAddMember = async (member: Omit<FamilyMember, 'id'>) => {
    await db.familyMembers.put({
      id: `mem-${Date.now()}`,
      ...member,
    });
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Update Member (Allows editing details & birthdays)
  const handleUpdateMember = async (member: FamilyMember) => {
    await db.familyMembers.put(member);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Add Medicine
  const handleAddMedicine = async (med: Omit<Medicine, 'id'>) => {
    await db.medicines.put({
      id: `med-${Date.now()}`,
      ...med,
    });
    await loadDatabase();
    triggerAutoSync();
  };

  const handleUpdateMedicine = async (med: Medicine) => {
    await db.medicines.put(med);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleDeleteMedicine = async (id: string) => {
    await db.medicines.delete(id);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Add Credential
  const handleAddCredential = async (cred: Omit<VaultCredential, 'id' | 'updatedAt'>) => {
    await db.passwords.put({
      id: `cred-${Date.now()}`,
      ...cred,
      updatedAt: new Date().toISOString(),
    });
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Delete Credential
  const handleDeleteCredential = async (id: string) => {
    await db.passwords.delete(id);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleUpdateCredential = async (credential: VaultCredential) => {
    await db.passwords.put(credential);
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Update Settings
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const current = await db.appSettings.get('default');
    if (current) {
      const merged = { ...current, ...newSettings };
      await db.appSettings.put(merged);
      setSettings(merged);
    }
  };

  const handleSetMasterPin = async (hash: string, updatedCredentials: VaultCredential[] = []) => {
    await db.transaction('rw', db.appSettings, db.passwords, async () => {
      const current = await db.appSettings.get('default');
      if (!current) throw new Error('App settings are unavailable; the vault PIN was not saved.');
      await db.appSettings.put({ ...current, masterPinHash: hash });
      await db.passwords.bulkPut(updatedCredentials);
    });
    await loadDatabase();
    triggerAutoSync();
  };

  // Handler: Update Gold Rates
  const handleUpdateGoldRates = async (rate24k: number, rate22k: number) => {
    await handleUpdateSettings({ liveGold24kRate: rate24k, liveGold22kRate: rate22k });
    triggerAutoSync();
  };

  // Quick Trigger Sync
  const handleTriggerSync = async () => {
    if (!settings?.sheetsWebappUrl) {
      showToast('Please configure your Google Sheets Web App URL in Settings first.', 'error');
      return;
    }
    showToast('☁️ Pushing all ledger and vault records to Google Sheets...', 'info');
    try {
      const result = await GoogleSheetsSyncService.syncWithGoogleAppsScript(
        settings.sheetsWebappUrl
      );
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        const now = new Date().toISOString();
        await db.appSettings.update('default', { lastSyncTime: now });
        setSettings((prev) => (prev ? { ...prev, lastSyncTime: now } : prev));
      }
      await loadDatabase();
    } catch (err) {
      showToast(`Cloud sync error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  // Pull Data from Google Sheets & Reload Local IndexedDB
  const handlePullFromSheets = async () => {
    if (!settings?.sheetsWebappUrl) {
      showToast('Please configure your Google Sheets Web App URL in Settings first.', 'error');
      return;
    }
    showToast('🔄 Pulling verified records from Google Sheets into local vault...', 'info');
    try {
      const result = await GoogleSheetsSyncService.pullFromGoogleSheets(settings.sheetsWebappUrl);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        await loadDatabase();
      }
    } catch (err) {
      showToast(`Pull from sheet error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  // 1-Click Live Stock Price Refresh directly in iVault
  const handleRefreshStockPrices = async () => {
    const webappUrl = settings?.sheetsWebappUrl;
    showToast('📈 Refreshing live stock prices on demand...', 'info');
    try {
      const result = await GoogleSheetsSyncService.refreshStockPrices(webappUrl);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        await loadDatabase();
      }
      return result;
    } catch (err) {
      showToast(`Stock refresh error: ${err instanceof Error ? err.message : String(err)}`, 'error');
      return { success: false, message: String(err), updatedCount: 0 };
    }
  };

  // Filter alert counts
  const lowStockMedsCount = medicines.filter((m) => m.currentStock <= m.minRefillThreshold).length;
  const expiringDocsCount = familyDocuments.filter((doc) => {
    if (!doc.expiryDate) return false;
    const daysLeft = Math.ceil(
      (new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 30;
  }).length;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#C93B2B] flex items-center justify-center font-black text-2xl text-amber-300 shadow-2xl animate-pulse">
          iV
        </div>
        <h2 className="mt-4 text-base font-extrabold tracking-tight">iVault Pro</h2>
        <p className="text-xs text-slate-400 mt-1">Initializing iVault Pro unified ecosystem...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col pb-32 font-sans antialiased selection:bg-[#C93B2B] selection:text-white">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Top Header Strip */}
      <TopHeader
        notifications={notifications}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenSmartEntry={() => setShowSmartEntryModal(true)}
        onOpenProfile={() => setActiveTab('settings')}
        activeMember={activeMember}
        onSelectMember={setActiveMember}
        familyMembers={familyMembers}
        isSheetsConnected={Boolean(settings?.sheetsWebappUrl && settings.sheetsWebappUrl.startsWith('http'))}
        onPullFromSheets={handlePullFromSheets}
      />

      {/* Main Tab Content */}
      <main className="flex-1 w-full animate-fadeIn">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-3">
            {/* Account & Net Worth Card Carousel */}
            <NetWorthCarousel
              accounts={accounts}
              fixedInvestments={fixedInvestments}
              dematInvestments={dematInvestments}
              goldHoldings={goldHoldings}
              loans={loans}
              liveGold24kRate={settings?.liveGold24kRate || 7250}
              onOpenAnalytics={() => setShowAnalyticsModal(true)}
              onNavigateTab={(tab) => {
                const fintrackerSubTabs = ['ledger', 'accounts', 'budgets', 'fixed', 'demat', 'gold', 'loans', 'insurances'];
                if (fintrackerSubTabs.includes(tab)) {
                  setInitialFinanceSubTab(tab as any);
                  setActiveTab('fintracker');
                } else {
                  setActiveTab(tab);
                }
              }}
            />

            {/* Quick Action 8-Tile Icon Grid */}
            <QuickActionGrid
              onNavigateTab={(tab) => {
                const fintrackerSubTabs = ['ledger', 'accounts', 'budgets', 'fixed', 'demat', 'gold', 'loans', 'insurances'];
                if (fintrackerSubTabs.includes(tab)) {
                  setInitialFinanceSubTab(tab as any);
                  setActiveTab('fintracker');
                } else {
                  setActiveTab(tab);
                }
              }}
              onOpenSmartEntry={() => setShowSmartEntryModal(true)}
              onOpenQuickExpense={handleOpenQuickExpense}
              onOpenQuickIncome={handleOpenQuickIncome}
              onOpenTransfer={() => setShowTransferModal(true)}
              onOpenWithdrawal={() => setShowWithdrawalModal(true)}
              onTriggerSync={handleTriggerSync}
              onPullFromSheets={handlePullFromSheets}
              pendingSyncCount={pendingSyncCount}
              lowStockMedsCount={lowStockMedsCount}
              expiringDocsCount={expiringDocsCount}
            />

            {/* Executive Analytics & Passbook Summary */}
            <ExecutiveSummary
              transactions={transactions}
              budgets={budgets}
              medicines={medicines}
              documents={familyDocuments}
              onTakeDose={handleTakeDose}
              onNavigateTab={(tab) => {
                const fintrackerSubTabs = ['ledger', 'accounts', 'budgets', 'fixed', 'demat', 'gold', 'loans', 'insurances'];
                if (fintrackerSubTabs.includes(tab)) {
                  setInitialFinanceSubTab(tab as any);
                  setActiveTab('fintracker');
                } else {
                  setActiveTab(tab);
                }
              }}
              onOpenPrescription={() => setShowPrescriptionModal(true)}
              activeMember={activeMember}
            />
          </div>
        )}

        {/* TAB 2: FINTRACKER (Finance, Investments, Gold, Loans) */}
        {activeTab === 'fintracker' && (
          <FinTrackerModule
            accounts={accounts}
            transactions={transactions}
            budgets={budgets}
            fixedInvestments={fixedInvestments}
            dematInvestments={dematInvestments}
            goldHoldings={goldHoldings}
            loans={loans}
            insurances={insurances}
            liveGold24kRate={settings?.liveGold24kRate || 7250}
            liveGold22kRate={settings?.liveGold22kRate || 6650}
            onAddTransaction={handleAddTransaction}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
            onTransferBalance={handleTransferBalance}
            onCashWithdrawal={handleCashWithdrawal}
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
            onAddFixedInvestment={handleAddFixedInvestment}
            onUpdateFixedInvestment={handleUpdateFixedInvestment}
            onDeleteFixedInvestment={handleDeleteFixedInvestment}
            onContributeFixedInvestment={handleContributeFixedInvestment}
            onPayLoanEmi={handlePayLoanEmi}
            onPayInsurancePremium={handlePayInsurancePremium}
            onAddDematInvestment={handleAddDematInvestment}
            onUpdateDematInvestment={handleUpdateDematInvestment}
            onDeleteDematInvestment={handleDeleteDematInvestment}
            onAddGoldHolding={handleAddGoldHolding}
            onUpdateGoldHolding={handleUpdateGoldHolding}
            onDeleteGoldHolding={handleDeleteGoldHolding}
            onAddLoan={handleAddLoan}
            onUpdateLoan={handleUpdateLoan}
            onDeleteLoan={handleDeleteLoan}
            onAddInsurance={handleAddInsurance}
            onUpdateInsurance={handleUpdateInsurance}
            onDeleteInsurance={handleDeleteInsurance}
            onUpdateGoldRates={handleUpdateGoldRates}
            onTriggerSync={handleTriggerSync}
            onPullFromSheets={handlePullFromSheets}
            onRefreshStockPrices={handleRefreshStockPrices}
            sheetsWebappUrl={settings?.sheetsWebappUrl}
            onUpdateSettings={handleUpdateSettings}
            activeMember={activeMember}
            familyMembers={familyMembers}
            initialSubTab={initialFinanceSubTab}
          />
        )}

        {/* TAB 3: FAMILY DOCTRACKER (Redacted Vault) */}
        {activeTab === 'documents' && (
          <FamilyDocTrackerModule
            familyMembers={familyMembers}
            documents={familyDocuments}
            onAddDocument={handleAddDocument}
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={handleDeleteDocument}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            activeMember={activeMember}
          />
        )}

        {/* TAB 4: MEDICINE TRACKER */}
        {activeTab === 'medicines' && (
          <MedicineTrackerModule
            medicines={medicines}
            familyMembers={familyMembers}
            onTakeDose={handleTakeDose}
            onRefillStock={handleRefillStock}
            onAddMedicine={handleAddMedicine}
            onUpdateMedicine={handleUpdateMedicine}
            onDeleteMedicine={handleDeleteMedicine}
            activeMember={activeMember}
            onOpenNotificationsAlerts={() => setShowNotificationsModal(true)}
            onBatchTakeDoses={handleBatchTakeDoses}
            onRevertDose={handleRevertDose}
            onToggleAutoLogging={handleToggleAutoLogging}
            autoLoggingEnabled={settings?.autoLogDosagesEnabled ?? true}
          />
        )}

        {/* TAB 5: PASSWORD VAULT (AES-GCM) */}
        {activeTab === 'vault' && (
          <PasswordVaultModule
            credentials={credentials}
            onAddCredential={handleAddCredential}
            onUpdateCredential={handleUpdateCredential}
            onDeleteCredential={handleDeleteCredential}
            masterPinHash={settings?.masterPinHash || ''}
            onSetMasterPin={handleSetMasterPin}
          />
        )}

        {/* TAB 6: SETTINGS, THEMES & GOOGLE SHEETS */}
        {activeTab === 'settings' && (
          <SettingsModule
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenTestRunner={() => setShowTestRunner(true)}
            onTriggerDataRefresh={loadDatabase}
            storageStats={{
              txCount: transactions.length,
              medCount: medicines.length,
              docCount: familyDocuments.length,
              credCount: credentials.length,
            }}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lowStockCount={lowStockMedsCount}
        expiringDocsCount={expiringDocsCount}
      />

      {/* Application Notifications Radar Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onRefreshNotifications={loadDatabase}
        onNavigateTab={setActiveTab}
      />

      {/* Smart Fast-Track Entry Modal */}
      <SmartQuickEntryModal
        isOpen={showSmartEntryModal}
        onClose={() => setShowSmartEntryModal(false)}
        activeMember={activeMember}
        onEntrySaved={loadDatabase}
      />

      {/* QA Test Runner Modal (Karma, Jasmine, Cypress) */}
      <TestRunnerModal
        isOpen={showTestRunner}
        onClose={() => setShowTestRunner(false)}
        onTriggerDataRefresh={loadDatabase}
      />

      {/* Master Family Prescription & Dosage Chart Modal */}
      <PrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        medicines={medicines}
        familyMembers={familyMembers}
        initialMemberFilter="all"
      />

      {/* MODAL: Wealth Analytics Drawer */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Executive Wealth & Solvency Analysis
                </h3>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold">Liquid & Savings</span>
                  <span className="text-base font-black text-slate-900">
                    ₹
                    {accounts
                      .reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0)
                      .toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Fixed & Sovereign</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{fixedInvestments.reduce((s, f) => s + f.currentBalance, 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Equities & SIPs</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{dematInvestments.reduce((s, d) => s + d.currentValue, 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Gold Valuation</span>
                  <span className="text-base font-black text-amber-600">
                    ₹
                    {Math.round(
                      goldHoldings.reduce(
                        (s, g) => s + g.grams * (settings?.liveGold24kRate || 7250),
                        0
                      )
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-rose-900 font-bold block">Total Outstanding Debt</span>
                <span className="text-lg font-black text-rose-700">
                  ₹{loans.reduce((s, l) => s + l.outstandingBalance, 0).toLocaleString('en-IN')}
                </span>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Monthly debt service requirement: ₹
                  {loans.reduce((s, l) => s + l.monthlyEmi, 0).toLocaleString('en-IN')}/month
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-emerald-900 font-bold block">Debt-to-Asset Solvency</span>
                  <span className="text-[11px] text-emerald-700">Healthy Tier-1 solvency position</span>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-full">
                  0.34 (Low Risk)
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowAnalyticsModal(false)}
              className="w-full py-2.5 bg-[#C93B2B] text-white font-bold rounded-xl shadow"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Quick Record Expense */}
      {showQuickExpenseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickExpenseModal(false);
          }}
        >
          <div
            ref={quickExpenseModalRef}
            className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl space-y-4 focus:outline-none"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Record Quick Expense</h3>
              <button
                onClick={() => setShowQuickExpenseModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    autoFocus
                    placeholder="e.g. 750"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-black text-base focus:ring-2 focus:ring-[#C93B2B]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">Date</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuickExpenseDate(new Date().toISOString().split('T')[0])}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          quickExpenseDate === new Date().toISOString().split('T')[0]
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const y = new Date();
                          y.setDate(y.getDate() - 1);
                          setQuickExpenseDate(y.toISOString().split('T')[0]);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          (() => {
                            const y = new Date();
                            y.setDate(y.getDate() - 1);
                            return quickExpenseDate === y.toISOString().split('T')[0];
                          })()
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={quickExpenseDate}
                    onChange={(e) => setQuickExpenseDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#C93B2B]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Expense Category</label>
                  {budgets.length > 0 && (
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                      🎯 {budgets.length} Budgets Active
                    </span>
                  )}
                </div>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-[#C93B2B]"
                >
                  {budgets.length > 0 && (
                    <optgroup label="🎯 Categories Configured in Budgets">
                      {budgets.map((b) => (
                        <option key={`exp-budget-${b.id || b.category}`} value={b.category}>
                          {b.category} (Limit: ₹{b.allocatedAmount.toLocaleString('en-IN')})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={budgets.length > 0 ? "Standard Expense Categories" : "Expense Categories"}>
                    {quickExpenseCategories
                      .filter((cat) => !budgets.some((b) => b.category === cat))
                      .map((cat) => (
                        <option key={`exp-std-${cat}`} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={quickExpensePaymentMode}
                    onChange={(e) => setQuickExpensePaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account (Optional)</label>
                  <select
                    value={quickExpenseAccountId}
                    onChange={(e) => setQuickExpenseAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold truncate"
                  >
                    <option value="">No Account Link</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (₹{acc.balance.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via UPI"
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow mt-2 cursor-pointer"
              >
                Record Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Quick Record Income */}
      {showQuickIncomeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickIncomeModal(false);
          }}
        >
          <div
            ref={quickIncomeModalRef}
            className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl space-y-4 focus:outline-none"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Add Income Credit</h3>
              <button
                onClick={() => setShowQuickIncomeModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickIncome} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    autoFocus
                    placeholder="e.g. 50000"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-black text-base text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">Date</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuickIncomeDate(new Date().toISOString().split('T')[0])}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          quickIncomeDate === new Date().toISOString().split('T')[0]
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const y = new Date();
                          y.setDate(y.getDate() - 1);
                          setQuickIncomeDate(y.toISOString().split('T')[0]);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          (() => {
                            const y = new Date();
                            y.setDate(y.getDate() - 1);
                            return quickIncomeDate === y.toISOString().split('T')[0];
                          })()
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={quickIncomeDate}
                    onChange={(e) => setQuickIncomeDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Income Category</label>
                  {budgets.length > 0 && (
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                      🎯 {budgets.length} Budgets Active
                    </span>
                  )}
                </div>
                <select
                  value={quickIncomeCategory}
                  onChange={(e) => setQuickIncomeCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {budgets.length > 0 && (
                    <optgroup label="🎯 Categories Configured in Budgets">
                      {budgets.map((b) => (
                        <option key={`inc-budget-${b.id || b.category}`} value={b.category}>
                          {b.category}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={budgets.length > 0 ? "Standard Income Sources" : "Income Categories"}>
                    {quickIncomeCategories
                      .filter((cat) => !budgets.some((b) => b.category === cat))
                      .map((cat) => (
                        <option key={`inc-std-${cat}`} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={quickIncomePaymentMode}
                    onChange={(e) => setQuickIncomePaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Net Banking">Net Banking</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deposit To (Optional)</label>
                  <select
                    value={quickIncomeAccountId}
                    onChange={(e) => setQuickIncomeAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold truncate"
                  >
                    <option value="">No Account Link</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (₹{acc.balance.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Source / Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Salary or Freelance Client"
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow mt-2"
              >
                Record Income Credit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Balance Transfer Between Accounts */}
      <BalanceTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        accounts={accounts}
        familyMembers={familyMembers}
        activeMember={activeMember}
        onTransfer={handleTransferBalance}
      />

      {/* MODAL: Cash Withdrawal from Bank Account */}
      <CashWithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        accounts={accounts}
        familyMembers={familyMembers}
        activeMember={activeMember}
        onWithdrawal={handleCashWithdrawal}
      />

      {/* Global Cloud Sync & Status Notification Toast */}
      {syncToastNotice && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl shadow-2xl p-3.5 flex items-start gap-3 border animate-fadeIn transition backdrop-blur-md bg-white/95 text-slate-800 border-slate-200">
          <div className="shrink-0 mt-0.5">
            {syncToastNotice.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            {syncToastNotice.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            {syncToastNotice.type === 'info' && (
              <Cloud className="w-5 h-5 text-indigo-600 animate-pulse" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-snug">{syncToastNotice.message}</p>
          </div>
          <button
            onClick={() => setSyncToastNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
