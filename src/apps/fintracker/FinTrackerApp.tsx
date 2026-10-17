/**
 * @file FinTrackerApp.tsx
 * Independent FinTracker Application.
 * Accessible directly at /fintracker.
 * Complete personal finance suite: Dashboard, Net Worth, Ledger, Accounts,
 * Budgets, Fixed Investments, Demat, Gold, Loans, Insurances, and Sheets Sync.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { db, initializeDatabase } from '../../services/db.service';
import { GoogleSheetsSyncService } from '../../services/google-sheets-sync.service';
import { NotificationService } from '../../services/notification.service';
import type {
  Account,
  Budget,
  DematInvestment,
  FixedInvestment,
  GoldHolding,
  Loan,
  Transaction,
  Insurance,
  FamilyMember,
  AppSettings,
  BalanceTransferPayload,
  CashWithdrawalPayload,
  AppNotification,
} from '../../types/db.types';

import { EcosystemHeader } from '../../components/ecosystem/EcosystemHeader';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { NetWorthCarousel } from '../../components/dashboard/NetWorthCarousel';
import { FinTrackerModule } from '../../components/fintracker/FinTrackerModule';
import { BalanceTransferModal, CashWithdrawalModal } from '../../components/fintracker/AccountActionModals';
import { AddEditAccountModal } from '../../components/fintracker/FinTrackerModals';
import { NotificationCenterModal } from '../../components/notifications/NotificationCenterModal';

import {
  TrendingUp,
  CreditCard,
  PieChart,
  Landmark,
  Coins,
  ArrowUpRight,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Banknote,
  ArrowLeftRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cloud,
  X,
  LayoutDashboard,
  Shield,
} from 'lucide-react';

export const FinTrackerApp: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [activeMember, setActiveMember] = useState<string>('Deepan');
  const [currentView, setCurrentView] = useState<
    'overview' | 'ledger' | 'accounts' | 'budgets' | 'fixed' | 'demat' | 'gold' | 'loans' | 'insurances'
  >('overview');

  // FinTracker State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [fixedInvestments, setFixedInvestments] = useState<FixedInvestment[]>([]);
  const [dematInvestments, setDematInvestments] = useState<DematInvestment[]>([]);
  const [goldHoldings, setGoldHoldings] = useState<GoldHolding[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Modals
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Transaction quick form states
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txCategory, setTxCategory] = useState('');
  const [txPaymentMode, setTxPaymentMode] = useState<Transaction['paymentMode']>('UPI');
  const [txAccountId, setTxAccountId] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickIncomeCategory, setQuickIncomeCategory] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickExpenseDate, setQuickExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickIncomeDate, setQuickIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickExpensePaymentMode, setQuickExpensePaymentMode] = useState<Transaction['paymentMode']>('UPI');
  const [quickIncomePaymentMode, setQuickIncomePaymentMode] = useState<Transaction['paymentMode']>('UPI');
  const [quickExpenseAccountId, setQuickExpenseAccountId] = useState('');
  const [quickIncomeAccountId, setQuickIncomeAccountId] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const [showQuickIncomeModal, setShowQuickIncomeModal] = useState(false);

  const [toastNotice, setToastNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastNotice({ type, message });
    setTimeout(() => {
      setToastNotice((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Load finance records only
  const loadFinanceData = useCallback(async () => {
    try {
      await initializeDatabase();
      const [accs, txs, bgs, fis, dms, golds, lns, inss, members, notifs, sets] = await Promise.all([
        db.accounts.toArray(),
        db.transactions.orderBy('date').reverse().toArray(),
        db.budgets.toArray(),
        db.fixedInvestments.toArray(),
        db.dematInvestments.toArray(),
        db.goldHoldings.toArray(),
        db.loans.toArray(),
        db.insurances.toArray(),
        db.familyMembers.toArray(),
        db.notifications.toArray().then((list) =>
          list
            .sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())
            .slice(0, 30)
        ),
        db.appSettings.get('default'),
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
      setNotifications(notifs);
      setSettings(sets || null);

      const pending = await db.syncQueue.where('status').equals('pending').count();
      setPendingSyncCount(pending);

      setIsReady(true);
    } catch (err) {
      console.error('Error loading FinTracker data:', err);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Sync with Google Sheets
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
        await loadFinanceData();
      }
    } catch (err) {
      console.warn('FinTracker auto-sync notice:', err);
    }
  }, [loadFinanceData]);

  // Categories mentioned in Budgets
  const budgetCategoryNames = useMemo(() => {
    return Array.from(new Set(budgets.map((b) => b.category?.trim()).filter(Boolean)));
  }, [budgets]);

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

  // Financial Handlers
  const handleAddAccount = async (accountData: Omit<Account, 'id'>) => {
    await db.accounts.put({ id: `account-${Date.now()}`, ...accountData });
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Account "${accountData.name}" created successfully.`, 'success');
  };

  const handleUpdateAccount = async (account: Account) => {
    await db.accounts.put(account);
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Account "${account.name}" updated.`, 'success');
  };

  const handleDeleteAccount = async (id: string) => {
    await db.accounts.delete(id);
    await loadFinanceData();
    triggerAutoSync();
    showToast('Account deleted.', 'info');
  };

  const handleTransferBalance = async (payload: BalanceTransferPayload) => {
    const fromAccount = await db.accounts.get(payload.fromAccountId);
    const toAccount = await db.accounts.get(payload.toAccountId);

    if (!fromAccount || !toAccount) {
      showToast('Error: Selected account not found.', 'error');
      return;
    }

    if (fromAccount.balance < payload.amount) {
      showToast(
        `Insufficient balance in ${fromAccount.name}. Available: ₹${fromAccount.balance.toLocaleString('en-IN')}`,
        'error'
      );
      return;
    }

    const now = new Date().toISOString();
    fromAccount.balance -= payload.amount;
    toAccount.balance += payload.amount;
    await db.accounts.put(fromAccount);
    await db.accounts.put(toAccount);

    await db.transactions.put({
      id: `tx-transfer-debit-${Date.now()}`,
      accountId: fromAccount.id,
      amount: payload.amount,
      type: 'expense',
      category: 'Internal Transfer',
      date: payload.date || now.split('T')[0],
      paymentMode: 'Net Banking',
      notes: `Transfer to ${toAccount.name}: ${payload.notes || 'Fund reallocation'}`,
      familyMember: payload.familyMember || activeMember,
    });

    await db.transactions.put({
      id: `tx-transfer-credit-${Date.now() + 1}`,
      accountId: toAccount.id,
      amount: payload.amount,
      type: 'income',
      category: 'Internal Transfer',
      date: payload.date || now.split('T')[0],
      paymentMode: 'Net Banking',
      notes: `Transfer from ${fromAccount.name}: ${payload.notes || 'Fund reallocation'}`,
      familyMember: payload.familyMember || activeMember,
    });

    setShowTransferModal(false);
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Transferred ₹${payload.amount.toLocaleString('en-IN')} successfully.`, 'success');
  };

  const handleCashWithdrawal = async (payload: CashWithdrawalPayload) => {
    const fromAccount = await db.accounts.get(payload.fromAccountId);
    if (!fromAccount) {
      showToast('Error: Bank account not found.', 'error');
      return;
    }

    if (fromAccount.balance < payload.amount) {
      showToast(`Insufficient balance in ${fromAccount.name}.`, 'error');
      return;
    }

    const now = new Date().toISOString();
    let cashAccount = accounts.find((a) => a.type === 'Wallet' || a.name.includes('Cash'));
    if (!cashAccount) {
      const newCash: Account = {
        id: `account-cash-${Date.now()}`,
        name: 'Physical Cash Wallet',
        accountNumber: 'CASH-001',
        bankName: 'Cash in Hand',
        type: 'Wallet',
        balance: 0,
        lastUpdated: now,
      };
      await db.accounts.put(newCash);
      cashAccount = newCash;
    }

    fromAccount.balance -= payload.amount;
    cashAccount.balance += payload.amount;
    await db.accounts.put(fromAccount);
    await db.accounts.put(cashAccount);

    await db.transactions.put({
      id: `tx-withdraw-${Date.now()}`,
      accountId: fromAccount.id,
      amount: payload.amount,
      type: 'expense',
      category: 'Cash Withdrawal',
      date: payload.date || now.split('T')[0],
      paymentMode: 'Debit Card',
      notes: `ATM Withdrawal: ${payload.notes || 'Cash for daily spending'}`,
      familyMember: payload.familyMember || activeMember,
    });

    setShowWithdrawalModal(false);
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Withdrawn ₹${payload.amount.toLocaleString('en-IN')} to Cash Wallet.`, 'success');
  };

  const handleAddTransaction = async (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      ...txData,
    };
    await db.transactions.put(newTx);

    if (txData.accountId) {
      const acc = await db.accounts.get(txData.accountId);
      if (acc) {
        if (txData.type === 'expense') {
          acc.balance -= txData.amount;
        } else {
          acc.balance += txData.amount;
        }
        await db.accounts.put(acc);
      }
    }

    await loadFinanceData();
    triggerAutoSync();
    showToast(`Recorded ${txData.type}: ₹${txData.amount.toLocaleString('en-IN')}`, 'success');
  };

  const handleQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickAmount);
    if (!val || val <= 0) return;

    await handleAddTransaction({
      amount: val,
      category: quickCategory || 'General Expenses',
      type: 'expense',
      paymentMode: quickExpensePaymentMode,
      accountId: quickExpenseAccountId || undefined,
      date: quickExpenseDate,
      notes: quickNotes.trim() || undefined,
      familyMember: activeMember,
    });

    setShowQuickExpenseModal(false);
    setQuickAmount('');
    setQuickNotes('');
  };

  const handleQuickIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickAmount);
    if (!val || val <= 0) return;

    await handleAddTransaction({
      amount: val,
      category: quickIncomeCategory || 'Salary',
      type: 'income',
      paymentMode: quickIncomePaymentMode,
      accountId: quickIncomeAccountId || undefined,
      date: quickIncomeDate,
      notes: quickNotes.trim() || undefined,
      familyMember: activeMember,
    });

    setShowQuickIncomeModal(false);
    setQuickAmount('');
    setQuickNotes('');
  };

  // Budgets
  const handleAddBudget = async (b: Omit<Budget, 'id'>) => {
    await db.budgets.put({ id: `budget-${Date.now()}`, ...b });
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Budget for ${b.category} set.`, 'success');
  };

  const handleUpdateBudget = async (b: Budget) => {
    await db.budgets.put(b);
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Budget updated.`, 'success');
  };

  const handleDeleteBudget = async (id: string) => {
    await db.budgets.delete(id);
    await loadFinanceData();
    triggerAutoSync();
    showToast('Budget deleted.', 'info');
  };

  // Fixed Investments
  const handleAddFixedInvestment = async (fi: Omit<FixedInvestment, 'id'>) => {
    await db.fixedInvestments.put({ id: `fixed-${Date.now()}`, ...fi });
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Investment added: ${fi.institution}`, 'success');
  };

  const handleUpdateFixedInvestment = async (fi: FixedInvestment) => {
    await db.fixedInvestments.put(fi);
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Investment updated.`, 'success');
  };

  const handleDeleteFixedInvestment = async (id: string) => {
    await db.fixedInvestments.delete(id);
    await loadFinanceData();
    triggerAutoSync();
    showToast('Fixed deposit removed.', 'info');
  };

  const handleContributeFixedInvestment = async (payload: {
    fixedInvestmentId: string;
    amount: number;
    accountId: string;
    date: string;
    paymentMode: Transaction['paymentMode'];
    notes?: string;
  }) => {
    const fi = await db.fixedInvestments.get(payload.fixedInvestmentId);
    const acc = await db.accounts.get(payload.accountId);
    if (!fi || !acc) return;

    if (acc.balance < payload.amount) {
      showToast(`Insufficient balance in ${acc.name}.`, 'error');
      return;
    }

    acc.balance -= payload.amount;
    fi.currentBalance += payload.amount;
    await db.accounts.put(acc);
    await db.fixedInvestments.put(fi);

    await db.transactions.put({
      id: `tx-fi-contribute-${Date.now()}`,
      accountId: acc.id,
      amount: payload.amount,
      type: 'expense',
      category: 'Investments',
      date: payload.date,
      paymentMode: payload.paymentMode,
      notes: `Deposit to ${fi.type} (${fi.institution}): ${payload.notes || ''}`,
      familyMember: fi.familyMember || activeMember,
    });

    await loadFinanceData();
    triggerAutoSync();
    showToast(`Contributed ₹${payload.amount.toLocaleString('en-IN')}`, 'success');
  };

  // Demat
  const handleAddDematInvestment = async (dm: Omit<DematInvestment, 'id'>) => {
    await db.dematInvestments.put({ id: `demat-${Date.now()}`, ...dm });
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Stock/Mutual Fund added: ${dm.name}`, 'success');
  };

  const handleUpdateDematInvestment = async (dm: DematInvestment) => {
    await db.dematInvestments.put(dm);
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Holding updated.`, 'success');
  };

  const handleDeleteDematInvestment = async (id: string) => {
    await db.dematInvestments.delete(id);
    await loadFinanceData();
    triggerAutoSync();
    showToast('Holding deleted.', 'info');
  };

  // Gold
  const handleAddGoldHolding = async (gold: Omit<GoldHolding, 'id'>) => {
    await db.goldHoldings.put({ id: `gold-${Date.now()}`, ...gold });
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Gold holding added.`, 'success');
  };

  const handleUpdateGoldHolding = async (gold: GoldHolding) => {
    await db.goldHoldings.put(gold);
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Gold holding updated.`, 'success');
  };

  const handleDeleteGoldHolding = async (id: string) => {
    await db.goldHoldings.delete(id);
    await loadFinanceData();
    triggerAutoSync();
    showToast('Gold holding deleted.', 'info');
  };

  const handleUpdateGoldRates = async (rate24k: number, rate22k: number) => {
    await db.appSettings.update('default', {
      liveGold24kRate: rate24k,
      liveGold22kRate: rate22k,
    });
    setSettings((prev) => (prev ? { ...prev, liveGold24kRate: rate24k, liveGold22kRate: rate22k } : prev));
    showToast(`Updated gold rates: 24k @ ₹${rate24k}/g, 22k @ ₹${rate22k}/g`, 'success');
  };

  // Loans
  const handleAddLoan = async (loan: Omit<Loan, 'id'>) => {
    await db.loans.put({ id: `loan-${Date.now()}`, ...loan });
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Loan added: ${loan.loanName}`, 'success');
  };

  const handleUpdateLoan = async (loan: Loan) => {
    await db.loans.put(loan);
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Loan updated.`, 'success');
  };

  const handleDeleteLoan = async (id: string) => {
    await db.loans.delete(id);
    await loadFinanceData();
    triggerAutoSync();
    showToast('Loan removed.', 'info');
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
    const acc = await db.accounts.get(payload.accountId);
    if (!loan || !acc) return;

    if (acc.balance < payload.amount) {
      showToast(`Insufficient balance in ${acc.name}.`, 'error');
      return;
    }

    acc.balance -= payload.amount;
    loan.outstandingBalance = Math.max(0, loan.outstandingBalance - payload.amount);
    await db.accounts.put(acc);
    await db.loans.put(loan);

    await db.transactions.put({
      id: `tx-emi-${Date.now()}`,
      accountId: acc.id,
      amount: payload.amount,
      type: 'expense',
      category: 'Loan EMI',
      date: payload.date,
      paymentMode: payload.paymentMode,
      notes: `EMI for ${loan.loanName} (${loan.bank}): ${payload.notes || ''}`,
      familyMember: activeMember,
    });

    await loadFinanceData();
    triggerAutoSync();
    showToast(`Paid EMI ₹${payload.amount.toLocaleString('en-IN')}`, 'success');
  };

  // Insurances
  const handleAddInsurance = async (ins: Omit<Insurance, 'id'>) => {
    await db.insurances.put({ id: `ins-${Date.now()}`, ...ins });
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Insurance policy added.`, 'success');
  };

  const handleUpdateInsurance = async (ins: Insurance) => {
    await db.insurances.put(ins);
    await loadFinanceData();
    triggerAutoSync();
    showToast(`Insurance policy updated.`, 'success');
  };

  const handleDeleteInsurance = async (id: string) => {
    await db.insurances.delete(id);
    await loadFinanceData();
    triggerAutoSync();
    showToast('Insurance policy deleted.', 'info');
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
    const ins = await db.insurances.get(payload.insuranceId);
    const acc = await db.accounts.get(payload.accountId);
    if (!ins || !acc) return;

    if (acc.balance < payload.amount) {
      showToast(`Insufficient balance in ${acc.name}.`, 'error');
      return;
    }

    acc.balance -= payload.amount;
    await db.accounts.put(acc);

    if (payload.advanceDueDate && ins.nextDueDate) {
      const currentDue = new Date(ins.nextDueDate);
      if (ins.frequency === 'Yearly') currentDue.setFullYear(currentDue.getFullYear() + 1);
      else if (ins.frequency === 'Half-Yearly') currentDue.setMonth(currentDue.getMonth() + 6);
      else if (ins.frequency === 'Quarterly') currentDue.setMonth(currentDue.getMonth() + 3);
      else if (ins.frequency === 'Monthly') currentDue.setMonth(currentDue.getMonth() + 1);
      ins.nextDueDate = currentDue.toISOString().split('T')[0];
      await db.insurances.put(ins);
    }

    await db.transactions.put({
      id: `tx-ins-premium-${Date.now()}`,
      accountId: acc.id,
      amount: payload.amount,
      type: 'expense',
      category: 'Insurance Premium',
      date: payload.date,
      paymentMode: payload.paymentMode,
      notes: `Premium for ${ins.policyName} (${ins.insurer}): ${payload.notes || ''}`,
      familyMember: ins.familyMember || activeMember,
    });

    await loadFinanceData();
    triggerAutoSync();
    showToast(`Paid Insurance Premium ₹${payload.amount.toLocaleString('en-IN')}`, 'success');
  };

  // Trigger manual sheets sync
  const handleTriggerSync = async () => {
    if (!settings?.sheetsWebappUrl) {
      showToast('Configure Google Sheets Webhook URL in Settings first.', 'error');
      return;
    }
    showToast('Syncing finance records to Google Sheets...', 'info');
    try {
      const res = await GoogleSheetsSyncService.syncWithGoogleAppsScript(settings.sheetsWebappUrl);
      if (res.success) {
        showToast('Successfully synchronized finance data!', 'success');
        await loadFinanceData();
      } else {
        showToast(`Sync warning: ${res.message}`, 'error');
      }
    } catch (e: any) {
      showToast(`Sync failed: ${e.message}`, 'error');
    }
  };

  const handlePullFromSheets = async () => {
    if (!settings?.sheetsWebappUrl) {
      showToast('Configure Google Sheets Webhook URL in Settings first.', 'error');
      return;
    }
    showToast('Pulling ledger & balances from Google Sheets...', 'info');
    try {
      const res = await GoogleSheetsSyncService.pullFromGoogleSheets(settings.sheetsWebappUrl);
      if (res.success) {
        showToast(`Pulled ${res.totalRecordsSynced ?? 0} records from Sheets!`, 'success');
        await loadFinanceData();
      } else {
        showToast(`Pull warning: ${res.message}`, 'error');
      }
    } catch (e: any) {
      showToast(`Pull failed: ${e.message}`, 'error');
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    await db.appSettings.update('default', newSettings);
    setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));
  };

  // FinTracker dedicated sub-navigation tabs
  const navTabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ledger', label: 'Ledger & Passbook', icon: TrendingUp },
    { id: 'accounts', label: 'Accounts & Cards', icon: CreditCard },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'fixed', label: 'Fixed Deposits', icon: Landmark },
    { id: 'demat', label: 'Stocks & Demat', icon: ArrowUpRight },
    { id: 'gold', label: 'Gold Valuation', icon: Coins },
    { id: 'loans', label: 'Loans & EMIs', icon: Banknote },
  ];

  // Net worth calculation
  const liquidCash = accounts.reduce((acc, a) => acc + (a.balance > 0 ? a.balance : 0), 0);
  const fixedTotal = fixedInvestments.reduce((acc, f) => acc + f.currentBalance, 0);
  const dematTotal = dematInvestments.reduce((acc, d) => acc + d.currentValue, 0);
  const goldRate = settings?.liveGold24kRate || 7250;
  const goldTotal = Math.round(goldHoldings.reduce((acc, g) => acc + g.grams * goldRate, 0));
  const debtTotal = loans.reduce((acc, l) => acc + l.outstandingBalance, 0);
  const netWorth = liquidCash + fixedTotal + dematTotal + goldTotal - debtTotal;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Loading FinTracker Pro...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-[#F4F6F9] text-slate-800 pb-20 overflow-y-auto">
      {/* Offline Alert Strip */}
      <OfflineIndicator />

      {/* App Header */}
      <EcosystemHeader
        appName="FinTracker Pro"
        appSubtitle="Unified Personal Wealth, Ledger & Investment Portfolios"
        appId="fintracker"
        activeMember={activeMember}
        onSelectMember={setActiveMember}
        familyMembers={familyMembers}
        notifications={notifications}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        rightActions={
          <button
            onClick={handleTriggerSync}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition border border-white/20 cursor-pointer"
            title="Sync with Google Sheets"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sheets Sync</span>
            {pendingSyncCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black">
                {pendingSyncCount}
              </span>
            )}
          </button>
        }
      />

      {/* FinTracker Secondary Sub-Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">
        {currentView === 'overview' ? (
          <div className="space-y-4">
            {/* FinTracker Landing Dashboard */}
            {/* Quick Action Ribbon */}
            <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Quick Actions:
                </span>
                <button
                  onClick={() => setShowQuickExpenseModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Expense
                </button>
                <button
                  onClick={() => setShowQuickIncomeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Income
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" /> Transfer
                </button>
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <Banknote className="w-3.5 h-3.5 text-slate-600" /> Cash ATM
                </button>
                <button
                  onClick={handlePullFromSheets}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  title="Pull latest ledger from Google Sheets"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Pull Sheets
                </button>
              </div>
            </div>

            {/* Net Worth Carousel */}
            <NetWorthCarousel
              accounts={accounts}
              fixedInvestments={fixedInvestments}
              dematInvestments={dematInvestments}
              goldHoldings={goldHoldings}
              loans={loans}
              liveGold24kRate={settings?.liveGold24kRate || 7250}
              onOpenAnalytics={() => setShowAnalyticsModal(true)}
              onNavigateTab={(tab) => {
                setCurrentView(tab as any);
              }}
            />

            {/* High Level Wealth Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setCurrentView('accounts')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Liquid Cash &amp; Bank</span>
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-black text-slate-900">
                  ₹{liquidCash.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Across {accounts.length} linked accounts
                </div>
              </div>

              <div
                onClick={() => setCurrentView('demat')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Stocks &amp; SIP Equities</span>
                  <ArrowUpRight className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-black text-slate-900">
                  ₹{dematTotal.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {dematInvestments.length} holdings recorded
                </div>
              </div>

              <div
                onClick={() => setCurrentView('fixed')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Fixed &amp; Sovereign</span>
                  <Landmark className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-lg font-black text-slate-900">
                  ₹{fixedTotal.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {fixedInvestments.length} deposits / bonds
                </div>
              </div>

              <div
                onClick={() => setCurrentView('loans')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-rose-300 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Total Debt &amp; EMIs</span>
                  <Banknote className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-lg font-black text-rose-600">
                  ₹{debtTotal.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {loans.length} active liabilities
                </div>
              </div>
            </div>

            {/* Quick Ledger Preview / Recent Transactions */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">Recent Passbook Activity</h3>
                </div>
                <button
                  onClick={() => setCurrentView('ledger')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  View Full Ledger →
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No transactions recorded yet. Click "Add Expense" or "Add Income" to record entry.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{tx.category}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {tx.date} • {tx.paymentMode}
                            {accounts.find((a) => a.id === tx.accountId)?.name
                              ? ` • ${accounts.find((a) => a.id === tx.accountId)?.name}`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-xs font-black shrink-0 ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Render Dedicated FinTracker Module Sub-Section */
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
            sheetsWebappUrl={settings?.sheetsWebappUrl}
            onUpdateSettings={handleUpdateSettings}
            activeMember={activeMember}
            familyMembers={familyMembers}
            initialSubTab={currentView as any}
          />
        )}
      </main>

      {/* QUICK EXPENSE MODAL */}
      {showQuickExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Add Quick Expense</h3>
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
                    placeholder="e.g. 850"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-black text-base text-rose-600 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={quickExpenseDate}
                    onChange={(e) => setQuickExpenseDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  {quickExpenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
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
                  placeholder="e.g. Weekly grocery shopping"
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
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

      {/* QUICK INCOME MODAL */}
      {showQuickIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4">
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
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={quickIncomeDate}
                    onChange={(e) => setQuickIncomeDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Income Category</label>
                <select
                  value={quickIncomeCategory}
                  onChange={(e) => setQuickIncomeCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  {quickIncomeCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
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
                  placeholder="e.g. Monthly Salary or Freelance"
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow mt-2 cursor-pointer"
              >
                Record Income Credit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Balance Transfer */}
      <BalanceTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        accounts={accounts}
        familyMembers={familyMembers}
        activeMember={activeMember}
        onTransfer={handleTransferBalance}
      />

      {/* MODAL: Cash ATM Withdrawal */}
      <CashWithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        accounts={accounts}
        familyMembers={familyMembers}
        activeMember={activeMember}
        onWithdrawal={handleCashWithdrawal}
      />

      {/* Notifications Radar Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onRefreshNotifications={loadFinanceData}
        onNavigateTab={(tab) => {
          setCurrentView(tab as any);
        }}
      />

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">FinTracker Wealth Solvency</h3>
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
                  <span className="text-slate-400 block font-semibold">Liquid &amp; Savings</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{liquidCash.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Fixed &amp; Sovereign</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{fixedTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Equities &amp; SIPs</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{dematTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Gold Valuation</span>
                  <span className="text-base font-black text-amber-600">
                    ₹{goldTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-rose-900 font-bold block">Total Outstanding Debt</span>
                <span className="text-lg font-black text-rose-700">
                  ₹{debtTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowAnalyticsModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

      {/* Global Status Toast */}
      {toastNotice && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl shadow-2xl p-3.5 flex items-start gap-3 border animate-fadeIn transition backdrop-blur-md bg-white/95 text-slate-800 border-slate-200">
          <div className="shrink-0 mt-0.5">
            {toastNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toastNotice.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {toastNotice.type === 'info' && <Cloud className="w-5 h-5 text-indigo-600 animate-pulse" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-snug">{toastNotice.message}</p>
          </div>
          <button
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
