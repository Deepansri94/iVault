/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  db,
  initializeDatabase,
  switchToLiveMode,
  resetToDemoMode,
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
import { FamilyDocTrackerModule } from './components/familydocs/FamilyDocTrackerModule';
import { MedicineTrackerModule } from './components/medicines/MedicineTrackerModule';
import { PasswordVaultModule } from './components/vault/PasswordVaultModule';
import { SettingsModule } from './components/settings/SettingsModule';

// Modals
import { NotificationCenterModal } from './components/notifications/NotificationCenterModal';
import { SmartQuickEntryModal } from './components/dashboard/SmartQuickEntryModal';
import { SessionModeModal } from './components/common/SessionModeModal';
import { TestRunnerModal } from './components/testing/TestRunnerModal';
import { PrescriptionModal } from './components/medicines/PrescriptionModal';
import { X, TrendingUp, Sparkles, CheckCircle2, Shield } from 'lucide-react';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [initialFinanceSubTab, setInitialFinanceSubTab] = useState<'ledger' | 'accounts'>('ledger');
  const [activeMember, setActiveMember] = useState<string>('Deepan');

  // Database States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [fixedInvestments, setFixedInvestments] = useState<FixedInvestment[]>([]);
  const [dematInvestments, setDematInvestments] = useState<DematInvestment[]>([]);
  const [goldHoldings, setGoldHoldings] = useState<GoldHolding[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
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
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const [showQuickIncomeModal, setShowQuickIncomeModal] = useState(false);

  // Quick Action form states
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('Groceries & Household');
  const [quickNotes, setQuickNotes] = useState('');

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
        members,
        docs,
        meds,
        creds,
        notifs,
        sett,
        syncPending,
      ] = await Promise.all([
        db.accounts.toArray(),
        db.transactions.reverse().sortBy('date'),
        db.budgets.toArray(),
        db.fixedInvestments.toArray(),
        db.dematInvestments.toArray(),
        db.goldHoldings.toArray(),
        db.loans.toArray(),
        db.familyMembers.toArray(),
        db.familyDocuments.toArray(),
        db.medicines.toArray(),
        db.passwords.toArray(),
        db.notifications.reverse().sortBy('timestamp'),
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
      }
    } catch (err) {
      console.warn('Auto-sync notice:', err);
    }
  }, []);

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

  // Quick Action Expense Handler
  const handleQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount) return;

    await handleAddTransaction({
      type: 'expense',
      amount: parseFloat(quickAmount),
      category: quickCategory,
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'UPI',
      familyMember: activeMember,
      notes: quickNotes || 'Quick Action Entry',
      syncedToSheets: false,
    });

    setQuickAmount('');
    setQuickNotes('');
    setShowQuickExpenseModal(false);
  };

  // Quick Action Income Handler
  const handleQuickIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount) return;

    await handleAddTransaction({
      type: 'income',
      amount: parseFloat(quickAmount),
      category: 'Salary',
      subcategory: 'Direct Credit',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Net Banking',
      familyMember: activeMember,
      notes: quickNotes || 'Income Credit',
      syncedToSheets: false,
    });

    setQuickAmount('');
    setQuickNotes('');
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

  // Handler: Add Fixed Investment
  const handleAddFixedInvestment = async (fi: Omit<FixedInvestment, 'id'>) => {
    await db.fixedInvestments.put({
      id: `fi-${Date.now()}`,
      ...fi,
    });
    await loadDatabase();
    triggerAutoSync();
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

  // Handler: Session Mode Switcher
  const handleSwitchToLiveMode = async (name: string) => {
    await switchToLiveMode(name);
    setActiveMember(name);
    await loadDatabase();
    triggerAutoSync();
  };

  const handleResetToDemoMode = async () => {
    await resetToDemoMode();
    setActiveMember('Deepan');
    await loadDatabase();
    triggerAutoSync();
  };

  // Quick Trigger Sync
  const handleTriggerSync = async () => {
    const result = await GoogleSheetsSyncService.syncWithGoogleAppsScript(
      settings?.sheetsWebappUrl || ''
    );
    alert(result.message);
    loadDatabase();
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
        sessionMode={settings?.sessionMode || 'demo'}
        onOpenLiveSwitch={() => setShowSessionModal(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 w-full animate-fadeIn">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-3">
            {/* Demo Session Notice Banner with 1-Click Live Switch */}
            {settings?.sessionMode === 'demo' && (
              <div className="w-full max-w-7xl mx-auto px-4 mt-2.5">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs text-amber-950">
                      <strong>Demo Session Active:</strong> You are exploring with sample bank accounts &amp; dummy records.
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSessionModal(true)}
                    className="self-start sm:self-auto px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span>Switch to Live Mode</span>
                    <span>⚡</span>
                  </button>
                </div>
              </div>
            )}

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
                if (tab === 'accounts') {
                  setInitialFinanceSubTab('accounts');
                  setActiveTab('fintracker');
                } else {
                  setInitialFinanceSubTab('ledger');
                  setActiveTab(tab);
                }
              }}
            />

            {/* Quick Action 8-Tile Icon Grid */}
            <QuickActionGrid
              onNavigateTab={setActiveTab}
              onOpenSmartEntry={() => setShowSmartEntryModal(true)}
              onOpenQuickExpense={() => setShowQuickExpenseModal(true)}
              onOpenQuickIncome={() => setShowQuickIncomeModal(true)}
              onTriggerSync={handleTriggerSync}
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
              onNavigateTab={setActiveTab}
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
            liveGold24kRate={settings?.liveGold24kRate || 7250}
            liveGold22kRate={settings?.liveGold22kRate || 6650}
            onAddTransaction={handleAddTransaction}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
            onAddFixedInvestment={handleAddFixedInvestment}
            onUpdateFixedInvestment={handleUpdateFixedInvestment}
            onDeleteFixedInvestment={handleDeleteFixedInvestment}
            onAddDematInvestment={handleAddDematInvestment}
            onUpdateDematInvestment={handleUpdateDematInvestment}
            onDeleteDematInvestment={handleDeleteDematInvestment}
            onAddGoldHolding={handleAddGoldHolding}
            onUpdateGoldHolding={handleUpdateGoldHolding}
            onDeleteGoldHolding={handleDeleteGoldHolding}
            onAddLoan={handleAddLoan}
            onUpdateLoan={handleUpdateLoan}
            onDeleteLoan={handleDeleteLoan}
            onUpdateGoldRates={handleUpdateGoldRates}
            activeMember={activeMember}
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
            activeMember={activeMember}
            sessionMode={settings?.sessionMode || 'demo'}
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
            sessionMode={settings?.sessionMode || 'demo'}
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
            sessionMode={settings?.sessionMode || 'demo'}
            onSetMasterPin={handleSetMasterPin}
          />
        )}

        {/* TAB 6: SETTINGS, THEMES & GOOGLE SHEETS */}
        {activeTab === 'settings' && (
          <SettingsModule
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenTestRunner={() => setShowTestRunner(true)}
            onSwitchToLiveMode={handleSwitchToLiveMode}
            onResetToDemoMode={handleResetToDemoMode}
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

      {/* Session Mode Modal (Demo vs Live) */}
      <SessionModeModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        sessionMode={settings?.sessionMode || 'demo'}
        onSwitchToLiveMode={handleSwitchToLiveMode}
        onResetToDemoMode={handleResetToDemoMode}
        activeMember={activeMember}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Record Quick Expense</h3>
              <button
                onClick={() => setShowQuickExpenseModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 750"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-black text-base focus:ring-2 focus:ring-[#C93B2B]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="Groceries & Household">Groceries & Household</option>
                  <option value="Dining & Food Delivery">Dining & Food Delivery</option>
                  <option value="Fuel & Transportation">Fuel & Transportation</option>
                  <option value="Healthcare & Medicines">Healthcare & Medicines</option>
                  <option value="Utilities & Subscriptions">Utilities & Subscriptions</option>
                  <option value="General Expenses">General Expenses</option>
                </select>
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
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow mt-2"
              >
                Record Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Quick Record Income */}
      {showQuickIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Add Income Credit</h3>
              <button
                onClick={() => setShowQuickIncomeModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickIncome} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-black text-base text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Source / Note</label>
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
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow mt-2"
              >
                Record Income Credit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
