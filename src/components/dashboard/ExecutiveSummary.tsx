import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Pill,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  FileText,
} from 'lucide-react';
import type { Budget, FamilyDocument, Medicine, Transaction } from '../../types/db.types';

interface ExecutiveSummaryProps {
  transactions: Transaction[];
  budgets: Budget[];
  medicines: Medicine[];
  documents: FamilyDocument[];
  onTakeDose: (medicineId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenPrescription?: () => void;
  activeMember: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  transactions,
  budgets,
  medicines,
  documents,
  onTakeDose,
  onNavigateTab,
  onOpenPrescription,
  activeMember,
}) => {
  // Current month's financial calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Medicines needing attention
  const lowStockMeds = medicines.filter((m) => m.currentStock <= m.minRefillThreshold);

  // Expiring documents (< 30 days)
  const expiringDocs = documents.filter((doc) => {
    if (!doc.expiryDate) return false;
    const daysLeft = Math.ceil(
      (new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 30;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mt-5 space-y-4">
      {/* 1. Consolidated Critical Alerts Banner */}
      {(expiringDocs.length > 0 || lowStockMeds.length > 0) && (
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-950">Family Alerts: </span>
              <span className="text-amber-900">
                {expiringDocs.length > 0 && `${expiringDocs.length} document renewal upcoming`}
                {expiringDocs.length > 0 && lowStockMeds.length > 0 && ' · '}
                {lowStockMeds.length > 0 && `${lowStockMeds.length} prescription low on stock`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {expiringDocs.length > 0 && (
              <button
                onClick={() => onNavigateTab('documents')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Review Docs
              </button>
            )}
            {lowStockMeds.length > 0 && (
              <button
                onClick={() => onNavigateTab('medicines')}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Refill Meds
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Balanced 2-Column Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Monthly Cash Flow Health */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Monthly Cash Flow
                </span>
                <span className="text-sm font-black text-slate-900">Financial Pulse</span>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {savingsRate}% Savings Rate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] font-semibold text-emerald-800 block">Total Income</span>
                <span className="text-lg font-black text-emerald-700 block mt-0.5">
                  ₹{totalIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-[11px] font-semibold text-rose-800 block">Total Spent</span>
                <span className="text-lg font-black text-rose-700 block mt-0.5">
                  ₹{totalExpense.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Cash Flow Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Outflow vs Inflow</span>
                <span className="font-bold text-slate-700">
                  {totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0}% of Income Spent
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="h-full bg-rose-500 rounded-l-full transition-all duration-500"
                  style={{
                    width: `${totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0}%`,
                  }}
                />
                <div
                  className="h-full bg-emerald-500 rounded-r-full transition-all duration-500"
                  style={{
                    width: `${totalIncome > 0 ? Math.max(0, 100 - (totalExpense / totalIncome) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Net Monthly Surplus</span>
            <span className="font-black text-base text-slate-900">
              {netSavings >= 0 ? '+' : ''}₹{netSavings.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Right Column: Recent Activity (Passbook) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Passbook Activity
                </span>
                <span className="text-sm font-black text-slate-900">Recent Transactions</span>
              </div>
              <button
                onClick={() => onNavigateTab('fintracker')}
                className="text-xs font-bold text-[#C93B2B] hover:underline cursor-pointer"
              >
                Full Statement ›
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No recent transactions recorded yet.
                </div>
              ) : (
                transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '−'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{tx.category}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {tx.familyMember} · {tx.paymentMode} · {tx.date}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span
                        className={`font-black text-xs sm:text-sm ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '−'}₹{tx.amount.toLocaleString('en-IN')}
                      </span>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {tx.subcategory || tx.notes || 'Entry'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing latest {Math.min(5, transactions.length)} entries</span>
            <button
              onClick={() => onNavigateTab('fintracker')}
              className="font-bold text-[#C93B2B] hover:underline cursor-pointer"
            >
              View All in Ledger ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
