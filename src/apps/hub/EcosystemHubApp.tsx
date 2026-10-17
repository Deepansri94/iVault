/**
 * @file EcosystemHubApp.tsx
 * Ecosystem Hub & Unified Workspace Portal.
 * Welcomes users, summarizes high-level status across all 4 independent applications,
 * and provides 1-click launchers directly to each application.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { db, initializeDatabase } from '../../services/db.service';
import { useRouter } from '../../router/Router';
import { EcosystemHeader, ECOSYSTEM_APPS } from '../../components/ecosystem/EcosystemHeader';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { SmartQuickEntryModal } from '../../components/dashboard/SmartQuickEntryModal';
import { NotificationCenterModal } from '../../components/notifications/NotificationCenterModal';
import { TestRunnerModal } from '../../components/testing/TestRunnerModal';

import type {
  Account,
  AppNotification,
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
  AppSettings,
} from '../../types/db.types';

import {
  TrendingUp,
  FileText,
  Pill,
  KeyRound,
  ArrowRight,
  Shield,
  Sparkles,
  Sliders,
  AlertTriangle,
  Clock,
  Coins,
  CheckCircle2,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const EcosystemHubApp: React.FC = () => {
  const { navigate } = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [activeMember, setActiveMember] = useState<string>('Deepan');

  // Stats
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [fixedInvestments, setFixedInvestments] = useState<FixedInvestment[]>([]);
  const [dematInvestments, setDematInvestments] = useState<DematInvestment[]>([]);
  const [goldHoldings, setGoldHoldings] = useState<GoldHolding[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [documents, setDocuments] = useState<FamilyDocument[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [credentials, setCredentials] = useState<VaultCredential[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Modals
  const [showSmartEntryModal, setShowSmartEntryModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);

  const loadAllStats = useCallback(async () => {
    try {
      await initializeDatabase();
      const [
        accs,
        txs,
        bgs,
        fis,
        dms,
        golds,
        lns,
        mems,
        docs,
        meds,
        creds,
        notifs,
        sets,
      ] = await Promise.all([
        db.accounts.toArray(),
        db.transactions.toArray(),
        db.budgets.toArray(),
        db.fixedInvestments.toArray(),
        db.dematInvestments.toArray(),
        db.goldHoldings.toArray(),
        db.loans.toArray(),
        db.familyMembers.toArray(),
        db.familyDocuments.toArray(),
        db.medicines.toArray(),
        db.passwords.toArray(),
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
      setFamilyMembers(mems);
      setDocuments(docs);
      setMedicines(meds);
      setCredentials(creds);
      setNotifications(notifs);
      setSettings(sets || null);
      setIsReady(true);
    } catch (err) {
      console.error('Error loading Ecosystem Hub stats:', err);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadAllStats();
  }, [loadAllStats]);

  // Derived summaries
  const liquidCash = accounts.reduce((acc, a) => acc + (a.balance > 0 ? a.balance : 0), 0);
  const fixedTotal = fixedInvestments.reduce((acc, f) => acc + f.currentBalance, 0);
  const dematTotal = dematInvestments.reduce((acc, d) => acc + d.currentValue, 0);
  const goldRate = settings?.liveGold24kRate || 7250;
  const goldTotal = Math.round(goldHoldings.reduce((acc, g) => acc + g.grams * goldRate, 0));
  const debtTotal = loans.reduce((acc, l) => acc + l.outstandingBalance, 0);
  const netWorth = liquidCash + fixedTotal + dematTotal + goldTotal - debtTotal;

  const lowStockMeds = useMemo(
    () => medicines.filter((m) => m.currentStock <= m.minRefillThreshold),
    [medicines]
  );

  const expiringDocs = useMemo(() => {
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);
    return documents.filter((doc) => {
      if (!doc.expiryDate) return false;
      const exp = new Date(doc.expiryDate);
      return exp >= today && exp <= thirtyDays;
    });
  }, [documents]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#C93B2B] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Launching iVault Ecosystem...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 pb-20">
      <OfflineIndicator />

      {/* Header */}
      <EcosystemHeader
        appName="iVault Ecosystem"
        appSubtitle="Modular Workspace for Wealth, Records, Health & Security"
        appId="hub"
        activeMember={activeMember}
        onSelectMember={setActiveMember}
        familyMembers={familyMembers}
        notifications={notifications}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        rightActions={
          <button
            onClick={() => setShowSmartEntryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black transition shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Smart Entry</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 space-y-6">
        {/* Welcome Greeting Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Ecosystem Launchpad
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                All 4 Applications Online
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {greeting}, {activeMember}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Each application operates completely independently with dedicated URLs, isolated state,
              and focused dashboards while maintaining unified security and offline sync.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => navigate('/fintracker')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Record Expense
            </button>
            <button
              onClick={() => setShowSmartEntryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Smart Fast Entry
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>
        </div>

        {/* Global Family Net Worth Overview Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Unified Ecosystem Solvency
              </span>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight">
                Family Total Net Worth: ₹{netWorth.toLocaleString('en-IN')}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Aggregated across bank balances, fixed deposits, equity Demat portfolios, and physical gold holdings.
              </p>
            </div>
            <button
              onClick={() => navigate('/fintracker')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-md flex items-center gap-2 self-start sm:self-center cursor-pointer"
            >
              Open Full Finance Suite <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ecosystem Bottom/Quick Navigation Bar */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center justify-around gap-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-2 px-2 text-center rounded-xl bg-slate-100 text-[#C93B2B] font-black cursor-pointer truncate"
          >
            Home
          </button>
          <button
            onClick={() => navigate('/fintracker')}
            className="flex-1 py-2 px-2 text-center rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer truncate"
          >
            FinTracker
          </button>
          <button
            onClick={() => navigate('/familyDocs')}
            className="flex-1 py-2 px-2 text-center rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer truncate"
          >
            Family Docs
          </button>
          <button
            onClick={() => navigate('/healthMeds')}
            className="flex-1 py-2 px-2 text-center rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer truncate"
          >
            Health/Meds
          </button>
          <button
            onClick={() => navigate('/passVault')}
            className="flex-1 py-2 px-2 text-center rounded-xl text-slate-600 hover:text-violet-700 hover:bg-violet-50 cursor-pointer truncate"
          >
            Vault
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex-1 py-2 px-2 text-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer truncate"
          >
            Settings
          </button>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">
              Select an Application
            </h2>
            <span className="text-xs text-slate-400">Direct standalone routes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: FinTracker Pro */}
            <div
              onClick={() => navigate('/fintracker')}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    /fintracker
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition">
                  FinTracker Pro
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Personal wealth dashboard, accounts passbook, equity portfolios, sovereign gold &amp; loan EMIs.
                </p>

                {/* Live Metric Preview */}
                <div className="mt-4 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Total Net Worth</span>
                    <span className="text-sm font-black text-slate-900">
                      ₹{netWorth.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Liquid Accounts</span>
                    <span className="text-sm font-black text-emerald-700">
                      ₹{liquidCash.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>Launch FinTracker App</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: FamilyDocs */}
            <div
              onClick={() => navigate('/familyDocs')}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 hover:border-blue-500 shadow-xs hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    /familyDocs
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition">
                  FamilyDocs
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Encrypted family records, Aadhaar/SSN redaction masking, and automated expiry alert radar.
                </p>

                {/* Live Metric Preview */}
                <div className="mt-4 p-3 rounded-2xl bg-blue-50/60 border border-blue-100 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Stored Records</span>
                    <span className="text-sm font-black text-slate-900">
                      {documents.length} Documents
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Expiry Status</span>
                    <span
                      className={`text-sm font-black ${
                        expiringDocs.length > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {expiringDocs.length > 0 ? `${expiringDocs.length} Expiring Soon` : 'All Valid'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:translate-x-1 transition-transform">
                <span>Launch FamilyDocs App</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: HealthMeds */}
            <div
              onClick={() => navigate('/healthMeds')}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 hover:border-teal-500 shadow-xs hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                    <Pill className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    /healthMeds
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-700 transition">
                  HealthMeds
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Daily dosage adherence, stock refill warnings, doctor prescriptions &amp; printable schedules.
                </p>

                {/* Live Metric Preview */}
                <div className="mt-4 p-3 rounded-2xl bg-teal-50/60 border border-teal-100 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Medications</span>
                    <span className="text-sm font-black text-slate-900">
                      {medicines.length} Prescriptions
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Stock Alarms</span>
                    <span
                      className={`text-sm font-black ${
                        lowStockMeds.length > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {lowStockMeds.length > 0 ? `${lowStockMeds.length} Low Stock` : 'Stock Normal'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:translate-x-1 transition-transform">
                <span>Launch HealthMeds App</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 4: PassVault */}
            <div
              onClick={() => navigate('/passVault')}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 hover:border-violet-500 shadow-xs hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-violet-700 text-white flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-violet-50 text-violet-800 border border-violet-200">
                    /passVault
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 group-hover:text-violet-700 transition">
                  PassVault
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Zero-knowledge AES-GCM credential vault, master PIN unlock, security audit &amp; generator.
                </p>

                {/* Live Metric Preview */}
                <div className="mt-4 p-3 rounded-2xl bg-violet-50/60 border border-violet-100 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Vault Credentials</span>
                    <span className="text-sm font-black text-slate-900">
                      {credentials.length} Passwords
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Security Gate</span>
                    <span className="text-sm font-black text-emerald-700">AES-GCM 256</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-violet-700 group-hover:translate-x-1 transition-transform">
                <span>Launch PassVault App</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SmartQuickEntryModal
        isOpen={showSmartEntryModal}
        onClose={() => setShowSmartEntryModal(false)}
        activeMember={activeMember}
        onEntrySaved={loadAllStats}
      />

      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onRefreshNotifications={loadAllStats}
        onNavigateTab={(tab) => {
          if (tab === 'fintracker') navigate('/fintracker');
          else if (tab === 'documents') navigate('/familyDocs');
          else if (tab === 'medicines') navigate('/healthMeds');
          else if (tab === 'vault') navigate('/passVault');
        }}
      />

      <TestRunnerModal
        isOpen={showTestRunner}
        onClose={() => setShowTestRunner(false)}
        onTriggerDataRefresh={loadAllStats}
      />
    </div>
  );
};
