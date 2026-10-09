/**
 * @file QuickActionGrid.tsx
 * Quick Action Launchpad & Family Vault Radar Strip
 *
 * Provides instant 1-tap access to Record Expense, Add Income,
 * Smart NLP Fast-Track Entry, and Google Sheets Cloud Synchronization.
 */

import React from 'react';
import {
  Send,
  PlusCircle,
  TrendingUp,
  FileText,
  Pill,
  KeyRound,
  Shield,
  RefreshCw,
  Sparkles,
  Cloud,
  Smartphone,
  QrCode,
} from 'lucide-react';

interface QuickActionGridProps {
  onNavigateTab: (tab: string) => void;
  onOpenPayWithUpi?: (initialMode?: 'form' | 'scanner') => void;
  onOpenSmartEntry: () => void;
  onOpenQuickExpense: () => void;
  onOpenQuickIncome: () => void;
  onTriggerSync: () => void;
  onPullFromSheets?: () => void;
  pendingSyncCount: number;
  lowStockMedsCount: number;
  expiringDocsCount: number;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onNavigateTab,
  onOpenPayWithUpi,
  onOpenSmartEntry,
  onOpenQuickExpense,
  onOpenQuickIncome,
  onTriggerSync,
  onPullFromSheets,
  pendingSyncCount,
  lowStockMedsCount,
  expiringDocsCount,
}) => {
  const primaryActions = [
    {
      id: 'upi',
      label: 'Pay & Scan UPI',
      subtext: 'Google Pay • QR Scanner',
      icon: Smartphone,
      gradient: 'from-[#002D62] via-[#0B4884] to-[#C93B2B]',
      textColor: 'text-[#002D62]',
      bgColor: 'bg-blue-50/80 hover:bg-blue-100/80 border-blue-200/90',
      badge: 'GPay / QR',
      onClick: () => onOpenPayWithUpi ? onOpenPayWithUpi() : onOpenQuickExpense(),
    },
    {
      id: 'pay',
      label: 'Record Expense',
      subtext: 'Cash / Card / NetBanking',
      icon: Send,
      gradient: 'from-rose-500 to-rose-600',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200/80',
      badge: 'Debit',
      onClick: onOpenQuickExpense,
    },
    {
      id: 'income',
      label: 'Add Income',
      subtext: 'Salary / Credit / Returns',
      icon: PlusCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200/80',
      badge: 'Credit',
      onClick: onOpenQuickIncome,
    },
    {
      id: 'smart-entry',
      label: 'Smart Fast Entry',
      subtext: 'Voice & Natural Language',
      icon: Sparkles,
      gradient: 'from-purple-600 to-indigo-600',
      textColor: 'text-purple-800',
      bgColor: 'bg-purple-50/70 hover:bg-purple-100/70 border-purple-200/80',
      badge: 'Auto Parse',
      onClick: onOpenSmartEntry,
    },
    {
      id: 'sync',
      label: 'Cloud Sync',
      subtext: 'Google Sheets 2-Way Sync',
      icon: Cloud,
      gradient: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-800',
      bgColor: 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200/80',
      badge: 'Sheets',
      onClick: onPullFromSheets || onTriggerSync,
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 mt-4">
      {/* 5 Focused Action Cards with Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {primaryActions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition active:scale-98 shadow-xs flex items-center gap-3 cursor-pointer ${act.bgColor}`}
            >
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${act.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs sm:text-sm font-extrabold truncate ${act.textColor}`}>
                    {act.label}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                  {act.subtext}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Clean Quick Category Radar Pill Bar */}
      <div className="mt-2.5 flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs text-xs overflow-x-auto scrollbar-none gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 hidden sm:inline">
          Family Vaults:
        </span>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('fintracker')}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-bold hover:bg-slate-50 px-2 py-1 rounded-lg transition cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Investments</span>
          </button>

          <span className="text-slate-200">·</span>

          <button
            onClick={() => onNavigateTab('documents')}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-bold hover:bg-slate-50 px-2 py-1 rounded-lg transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Family Docs</span>
            {expiringDocsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black">
                {expiringDocsCount}
              </span>
            )}
          </button>

          <span className="text-slate-200">·</span>

          <button
            onClick={() => onNavigateTab('medicines')}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-bold hover:bg-slate-50 px-2 py-1 rounded-lg transition cursor-pointer"
          >
            <Pill className="w-3.5 h-3.5 text-emerald-600" />
            <span>Prescriptions</span>
            {lowStockMedsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[9px] font-black">
                {lowStockMedsCount}
              </span>
            )}
          </button>

          <span className="text-slate-200">·</span>

          <button
            onClick={() => onNavigateTab('vault')}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-bold hover:bg-slate-50 px-2 py-1 rounded-lg transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
            <span>PassVault</span>
          </button>

          <span className="text-slate-200">·</span>

          <button
            onClick={() => onNavigateTab('insurances')}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-bold hover:bg-slate-50 px-2 py-1 rounded-lg transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Insurances</span>
          </button>
        </div>

        <button
          onClick={() => onNavigateTab('fintracker')}
          className="text-[#C93B2B] font-bold text-xs hover:underline cursor-pointer ml-auto shrink-0"
        >
          View All ›
        </button>
      </div>
    </section>
  );
};
