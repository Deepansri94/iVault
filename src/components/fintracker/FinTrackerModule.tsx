import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Coins,
  Building,
  CreditCard,
  PieChart,
  Percent,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Clock,
  Sparkles,
  Filter,
  Trash2,
  Pencil,
  Edit2,
  FileSpreadsheet,
} from 'lucide-react';
import type {
  Account,
  Budget,
  DematInvestment,
  FixedInvestment,
  GoldHolding,
  Loan,
  Transaction,
} from '../../types/db.types';
import {
  AddEditAccountModal,
  AddEditLoanModal,
  AddEditDematModal,
  AddEditFixedModal,
  AddEditBudgetModal,
} from './FinTrackerModals';
import { GoogleSheetsMarketGuideModal } from '../settings/GoogleSheetsMarketGuideModal';

interface FinTrackerModuleProps {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  fixedInvestments: FixedInvestment[];
  dematInvestments: DematInvestment[];
  goldHoldings: GoldHolding[];
  loans: Loan[];
  liveGold24kRate: number;
  liveGold22kRate: number;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onUpdateAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onAddBudget: (b: Omit<Budget, 'id'>) => void;
  onUpdateBudget?: (b: Budget) => void;
  onDeleteBudget?: (id: string) => void;
  onAddFixedInvestment: (fi: Omit<FixedInvestment, 'id'>) => void;
  onUpdateFixedInvestment?: (fi: FixedInvestment) => void;
  onDeleteFixedInvestment?: (id: string) => void;
  onAddDematInvestment?: (dm: Omit<DematInvestment, 'id'>) => void;
  onUpdateDematInvestment?: (dm: DematInvestment) => void;
  onDeleteDematInvestment?: (id: string) => void;
  onAddGoldHolding: (gold: Omit<GoldHolding, 'id'>) => void;
  onUpdateGoldHolding?: (gold: GoldHolding) => void;
  onDeleteGoldHolding?: (id: string) => void;
  onAddLoan: (loan: Omit<Loan, 'id'>) => void;
  onUpdateLoan?: (loan: Loan) => void;
  onDeleteLoan?: (id: string) => void;
  onUpdateGoldRates?: (rate24k: number, rate22k: number) => void;
  activeMember: string;
  initialSubTab?: 'ledger' | 'accounts' | 'budgets' | 'fixed' | 'demat' | 'gold' | 'loans';
}

export const FinTrackerModule: React.FC<FinTrackerModuleProps> = ({
  accounts,
  transactions,
  budgets,
  fixedInvestments,
  dematInvestments,
  goldHoldings,
  loans,
  liveGold24kRate,
  liveGold22kRate,
  onAddTransaction,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  onAddFixedInvestment,
  onUpdateFixedInvestment,
  onDeleteFixedInvestment,
  onAddDematInvestment,
  onUpdateDematInvestment,
  onDeleteDematInvestment,
  onAddGoldHolding,
  onUpdateGoldHolding,
  onDeleteGoldHolding,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
  onUpdateGoldRates,
  activeMember,
  initialSubTab = 'ledger',
}) => {
  const [subTab, setSubTab] = useState<'ledger' | 'accounts' | 'budgets' | 'fixed' | 'demat' | 'gold' | 'loans'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddGoldModal, setShowAddGoldModal] = useState(false);
  const [showAddFixedModal, setShowAddFixedModal] = useState(false);
  const [showAddDematModal, setShowAddDematModal] = useState(false);
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);

  // Edit states
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editingDemat, setEditingDemat] = useState<DematInvestment | null>(null);
  const [editingFixed, setEditingFixed] = useState<FixedInvestment | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingGold, setEditingGold] = useState<GoldHolding | null>(null);

  // Filter state for ledger
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // New Transaction Form State
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Groceries & Household');
  const [txSubcategory, setTxSubcategory] = useState('');
  const [txPaymentMode, setTxPaymentMode] = useState<Transaction['paymentMode']>('UPI');
  const [txNotes, setTxNotes] = useState('');

  // New Gold Form State
  const [goldItemName, setGoldItemName] = useState('24K Sovereign Bullion Coin');
  const [goldGrams, setGoldGrams] = useState('10');
  const [goldKarat, setGoldKarat] = useState<'24K' | '22K' | '18K'>('24K');
  const [goldRate, setGoldRate] = useState(String(liveGold24kRate));
  const [goldGst, setGoldGst] = useState('3');
  const [goldMaking, setGoldMaking] = useState('3');

  // Spot Rates Modal State
  const [showGoldRateModal, setShowGoldRateModal] = useState(false);
  const [showSheetsGuideModal, setShowSheetsGuideModal] = useState(false);
  const [rate24kInput, setRate24kInput] = useState(String(liveGold24kRate));
  const [rate22kInput, setRate22kInput] = useState(String(liveGold22kRate));

  // Gold portfolio live valuation
  const totalGoldGrams = goldHoldings.reduce((sum, g) => sum + g.grams, 0);
  const totalGoldCost = goldHoldings.reduce((sum, g) => sum + g.totalLandedCost, 0);
  const currentGoldMarketValue = goldHoldings.reduce((sum, g) => {
    const rate = g.karat === '24K' ? liveGold24kRate : liveGold22kRate;
    return sum + g.grams * rate;
  }, 0);
  const goldPnL = currentGoldMarketValue - totalGoldCost;
  const goldPnLPct = totalGoldCost > 0 ? (goldPnL / totalGoldCost) * 100 : 0;

  // Fixed Income Totals
  const totalFixedBalance = fixedInvestments.reduce((sum, f) => sum + f.currentBalance, 0);
  const totalFixedMonthly = fixedInvestments.reduce((sum, f) => sum + f.monthlyContribution, 0);

  // Demat Totals
  const totalDematInvested = dematInvestments.reduce((sum, d) => sum + d.investedAmount, 0);
  const totalDematCurrent = dematInvestments.reduce((sum, d) => sum + d.currentValue, 0);
  const dematPnL = totalDematCurrent - totalDematInvested;
  const dematPnLPct = totalDematInvested > 0 ? (dematPnL / totalDematInvested) * 100 : 0;

  // Loans Totals
  const totalOutstandingLoan = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const totalMonthlyEMI = loans.reduce((sum, l) => sum + l.monthlyEmi, 0);

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) return;

    onAddTransaction({
      type: txType,
      amount: parseFloat(txAmount),
      category: txCategory,
      subcategory: txSubcategory || undefined,
      date: new Date().toISOString().split('T')[0],
      paymentMode: txPaymentMode,
      familyMember: activeMember,
      notes: txNotes || undefined,
      syncedToSheets: false,
    });

    setTxAmount('');
    setTxSubcategory('');
    setTxNotes('');
    setShowAddTxModal(false);
  };

  const handleCreateGold = (e: React.FormEvent) => {
    e.preventDefault();
    const grams = parseFloat(goldGrams) || 0;
    const rate = parseFloat(goldRate) || liveGold24kRate;
    const gstPct = parseFloat(goldGst) || 3;
    const makingPct = parseFloat(goldMaking) || 0;

    const baseCost = grams * rate;
    const makingAmount = baseCost * (makingPct / 100);
    const subtotal = baseCost + makingAmount;
    const gstAmount = subtotal * (gstPct / 100);
    const totalLandedCost = Math.round(subtotal + gstAmount);

    if (editingGold) {
      if (onUpdateGoldHolding) {
        onUpdateGoldHolding({
          ...editingGold,
          itemName: goldItemName,
          grams,
          karat: goldKarat,
          purchaseRatePerGram: rate,
          gstPct,
          makingChargesPct: makingPct,
          totalLandedCost,
        });
      }
    } else {
      onAddGoldHolding({
        itemName: goldItemName,
        grams,
        karat: goldKarat,
        purchaseRatePerGram: rate,
        gstPct,
        makingChargesPct: makingPct,
        totalLandedCost,
        purchaseDate: new Date().toISOString().split('T')[0],
        familyMember: activeMember,
        notes: `Hallmarked ${goldKarat} purchase`,
      });
    }

    setEditingGold(null);
    setShowAddGoldModal(false);
  };

  const handleOpenEditGold = (g: GoldHolding) => {
    setEditingGold(g);
    setGoldItemName(g.itemName);
    setGoldGrams(String(g.grams));
    setGoldKarat(g.karat);
    setGoldRate(String(g.purchaseRatePerGram));
    setGoldGst(String(g.gstPct));
    setGoldMaking(String(g.makingChargesPct));
    setShowAddGoldModal(true);
  };

  const handleOpenAddGold = () => {
    setEditingGold(null);
    setGoldItemName('24K Sovereign Bullion Coin');
    setGoldGrams('10');
    setGoldKarat('24K');
    setGoldRate(String(liveGold24kRate));
    setGoldGst('3');
    setGoldMaking('3');
    setShowAddGoldModal(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* FinTracker Top Pill Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        {[
          { id: 'ledger', label: 'Cash Ledger', count: transactions.length },
          { id: 'accounts', label: 'Accounts', count: accounts.length },
          { id: 'budgets', label: 'Budgets & Limits', count: budgets.length },
          { id: 'fixed', label: 'Fixed (PPF/SSA/RD)', count: fixedInvestments.length },
          { id: 'demat', label: 'Demat & MF (SIPs)', count: dematInvestments.length },
          { id: 'gold', label: 'Physical Gold', count: `${totalGoldGrams}g` },
          { id: 'loans', label: 'Loans & EMIs', count: loans.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
              subTab === tab.id
                ? 'bg-[#C93B2B] text-white shadow-sm font-black'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                subTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {subTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Bank & Savings Accounts</h3>
              <p className="text-xs text-slate-500">These account details appear on the dashboard and can be selected for loan auto-debits.</p>
            </div>
            <button
              onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}
              className="flex items-center gap-1.5 rounded-xl bg-[#C93B2B] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#A52316]"
            >
              <Plus className="h-4 w-4" /> Add Account
            </button>
          </div>
          {accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No accounts configured yet. Add a savings or bank account to show it on the dashboard.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {accounts.map((account) => (
                <div key={account.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{account.name}</h4>
                      <p className="text-xs text-slate-500">{account.bankName} · {account.type} · A/c ending {account.accountNumber.slice(-4)}</p>
                    </div>
                    <span className="text-sm font-black text-emerald-700">₹{account.balance.toLocaleString('en-IN')}</span>
                  </div>
                  {account.upiId && <p className="text-xs text-slate-500">UPI: {account.upiId}</p>}
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
                    <button onClick={() => { setEditingAccount(account); setShowAccountModal(true); }} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${account.name}?`)) onDeleteAccount(account.id);
                      }}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <AddEditAccountModal
            isOpen={showAccountModal}
            onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
            accountToEdit={editingAccount}
            onSave={(account, existingId) => {
              if (existingId) onUpdateAccount({ ...account, id: existingId });
              else onAddAccount(account);
            }}
          />
        </div>
      )}

      {/* SUB-TAB 1: LEDGER (INCOME & EXPENSES) */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Income & Expense Ledger</h3>
              <p className="text-xs text-slate-500">
                Classified transactions synced with Google Sheets
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setLedgerTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    ledgerTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setLedgerTypeFilter('income')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    ledgerTypeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => setLedgerTypeFilter('expense')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    ledgerTypeFilter === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Expenses
                </button>
              </div>

              <button
                onClick={() => setShowAddTxModal(true)}
                className="px-3.5 py-2 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Record Tx</span>
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {transactions
                .filter((t) => ledgerTypeFilter === 'all' || t.type === ledgerTypeFilter)
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm">
                          {tx.category}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-slate-700">{tx.familyMember}</span>
                          <span>•</span>
                          <span>{tx.paymentMode}</span>
                          <span>•</span>
                          <span>{tx.date}</span>
                        </div>
                        {tx.notes && (
                          <div className="text-[10px] text-slate-400 mt-0.5 italic">{tx.notes}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-black text-sm sm:text-base ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                        {tx.syncedToSheets ? '☁️ Synced' : '⚡ Local Staged'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BUDGETS & LIMITS */}
      {subTab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Monthly Budget Allocations</h3>
              <p className="text-xs text-slate-500">
                Automated in-app warnings triggered at 80% and 100% capacity
              </p>
            </div>
            <button
              onClick={() => {
                setEditingBudget(null);
                setShowAddBudgetModal(true);
              }}
              className="px-3.5 py-2 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Budget</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {budgets.map((b) => {
              const pct = Math.min(100, Math.round((b.spentAmount / b.allocatedAmount) * 100));
              const remaining = b.allocatedAmount - b.spentAmount;
              const isOver = remaining < 0;

              return (
                <div
                  key={b.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{b.category}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">{b.period} Allocation</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-black ${
                        isOver
                          ? 'bg-rose-100 text-rose-700'
                          : pct >= b.warningThresholdPct
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {pct}% Used
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : pct >= b.warningThresholdPct ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Spent</span>
                      <span className="font-bold text-slate-800">
                        ₹{b.spentAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Limit</span>
                      <span className="font-bold text-slate-800">
                        ₹{b.allocatedAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Available</span>
                      <span
                        className={`font-black ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}
                      >
                        ₹{remaining.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setEditingBudget(b);
                        setShowAddBudgetModal(true);
                      }}
                      className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
                    >
                      <Pencil className="w-3 h-3 text-slate-500" />
                      <span>Edit Limit</span>
                    </button>

                    {onDeleteBudget && (
                      <button
                        onClick={() => onDeleteBudget(b.id)}
                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FIXED INVESTMENTS (PPF, SSA, RD) */}
      {subTab === 'fixed' && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-[#002D62] to-[#052F5F] p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                GOVERNMENT & BANK ASSURED
              </span>
              <h3 className="text-xl font-black">Sovereign & Fixed Income Holdings</h3>
              <p className="text-xs text-white/80 mt-0.5">
                Tax-free compound growth (PPF 7.1%, SSA 8.2%, Bank RDs 7.25%)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-white/70 block uppercase font-medium">Total Balance</span>
                <span className="text-2xl font-black text-amber-300">
                  ₹{totalFixedBalance.toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                  +₹{totalFixedMonthly.toLocaleString('en-IN')}/mo auto-contribution
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingFixed(null);
                  setShowAddFixedModal(true);
                }}
                className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4 text-slate-900" />
                <span>Add Scheme</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {fixedInvestments.map((fi) => (
              <div
                key={fi.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-[#C93B2B] text-xs font-black">
                      {fi.type}
                    </span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {fi.interestRate}% p.a.
                    </span>
                  </div>

                  <div className="mt-2">
                    <h4 className="font-bold text-slate-800 text-sm">{fi.name}</h4>
                    <div className="text-[11px] text-slate-500">
                      {fi.institution} • {fi.familyMember}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Current Balance</span>
                      <span className="font-black text-slate-900 text-sm">
                        ₹{fi.currentBalance.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Monthly Contribution</span>
                      <span className="font-bold text-emerald-700">
                        ₹{fi.monthlyContribution.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Maturity Date</span>
                      <span className="font-semibold text-slate-700">{fi.maturityDate}</span>
                    </div>
                  </div>

                  {fi.notes && (
                    <p className="text-[11px] text-slate-400 italic leading-snug mt-2">{fi.notes}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                  <button
                    onClick={() => {
                      setEditingFixed(fi);
                      setShowAddFixedModal(true);
                    }}
                    className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Pencil className="w-3 h-3 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  {onDeleteFixedInvestment && (
                    <button
                      onClick={() => onDeleteFixedInvestment(fi.id)}
                      className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DEMAT & MUTUAL FUNDS (SIPS, STOCKS) */}
      {subTab === 'demat' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#047857] to-[#064E3B] p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                EQUITY & MUTUAL FUNDS
              </span>
              <h3 className="text-xl font-black">Demat Portfolio & SIPs</h3>
              <p className="text-xs text-white/80 mt-0.5">
                Market linked active mutual funds and dividend bluechips
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-white/70 block uppercase font-medium">Current Valuation</span>
                <span className="text-2xl font-black text-white">
                  ₹{totalDematCurrent.toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] text-emerald-300 font-bold mt-0.5">
                  +₹{dematPnL.toLocaleString('en-IN')} ({dematPnLPct.toFixed(1)}% P&L)
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <button
                  onClick={() => setShowSheetsGuideModal(true)}
                  className="px-2.5 py-2 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-300/30 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="View Google Sheets live formula setup for stocks and mutual funds"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Sheets Live Formulas</span>
                </button>

                <button
                  onClick={() => {
                    setEditingDemat(null);
                    setShowAddDematModal(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-900" />
                  <span>Add Investment</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {dematInvestments.map((dm) => {
              const pnl = dm.currentValue - dm.investedAmount;
              const pnlPct = (pnl / dm.investedAmount) * 100;
              const isProfit = pnl >= 0;

              return (
                <div
                  key={dm.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {dm.type}
                      </span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          isProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isProfit ? '+' : ''}
                        {pnlPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-2">
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{dm.name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {dm.symbol} • {dm.familyMember}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs mt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Invested Capital</span>
                        <span className="font-semibold text-slate-700">
                          ₹{dm.investedAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Value</span>
                        <span className="font-black text-slate-900 text-sm">
                          ₹{dm.currentValue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500">Units @ NAV</span>
                        <span className="font-medium text-slate-600">
                          {dm.units.toFixed(2)} @ ₹{dm.currentNAV}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                    <button
                      onClick={() => {
                        setEditingDemat(dm);
                        setShowAddDematModal(true);
                      }}
                      className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
                    >
                      <Pencil className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    {onDeleteDematInvestment && (
                      <button
                        onClick={() => onDeleteDematInvestment(dm.id)}
                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PHYSICAL GOLD HOLDINGS & LIVE PRICING */}
      {subTab === 'gold' && (
        <div className="space-y-4">
          {/* Gold Header with Live Rates & P&L */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-800 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-200" />
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded text-amber-200">
                  LIVE BULLION TRACKER
                </span>
              </div>
              <h3 className="text-xl font-black mt-1">Physical Gold Assets</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-amber-100">
                  Live Spot Rates: 24K @ ₹{liveGold24kRate}/g • 22K @ ₹{liveGold22kRate}/g
                </p>
                {onUpdateGoldRates && (
                  <button
                    onClick={() => {
                      setRate24kInput(String(liveGold24kRate));
                      setRate22kInput(String(liveGold22kRate));
                      setShowGoldRateModal(true);
                    }}
                    className="px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold rounded-lg transition border border-white/25 flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                    <span>Edit Rates</span>
                  </button>
                )}

                <button
                  onClick={() => setShowSheetsGuideModal(true)}
                  className="px-2 py-0.5 bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 text-[10px] font-bold rounded-lg transition border border-amber-300/30 flex items-center gap-1 cursor-pointer"
                  title="View Google Sheets live formula setup for gold"
                >
                  <FileSpreadsheet className="w-2.5 h-2.5 text-amber-200" />
                  <span>Sheets Formula</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-amber-200 uppercase font-semibold block">
                  Current Market Worth ({totalGoldGrams}g)
                </span>
                <span className="text-2xl font-black text-white">
                  ₹{Math.round(currentGoldMarketValue).toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] text-amber-200 font-bold">
                  {goldPnL >= 0 ? '+' : ''}₹{Math.round(goldPnL).toLocaleString('en-IN')} ({goldPnLPct.toFixed(1)}% Return)
                </div>
              </div>

              <button
                onClick={handleOpenAddGold}
                className="px-3.5 py-2.5 bg-white text-amber-900 font-black text-xs rounded-xl shadow hover:bg-amber-50 active:scale-95 transition cursor-pointer"
              >
                + Add Gold
              </button>
            </div>
          </div>

          {/* Holdings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {goldHoldings.map((g) => {
              const liveRate = g.karat === '24K' ? liveGold24kRate : liveGold22kRate;
              const currentItemVal = g.grams * liveRate;
              const itemPnL = currentItemVal - g.totalLandedCost;
              const itemPnLPct = (itemPnL / g.totalLandedCost) * 100;

              return (
                <div
                  key={g.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-black border border-amber-200 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>{g.karat} Gold ({g.grams} grams)</span>
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        itemPnL >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {itemPnL >= 0 ? '+' : ''}
                      {itemPnLPct.toFixed(1)}%
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{g.itemName}</h4>
                    <p className="text-[11px] text-slate-500">
                      Owner: {g.familyMember} • Purchased: {g.purchaseDate}
                    </p>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Purchase Rate</span>
                      <span className="font-semibold text-slate-700">₹{g.purchaseRatePerGram}/g</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">GST + Making</span>
                      <span className="font-semibold text-slate-700">
                        {g.gstPct}% GST + {g.makingChargesPct}% Making
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Landed Cost</span>
                      <span className="font-bold text-slate-800">
                        ₹{g.totalLandedCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Live Market Value</span>
                      <span className="font-black text-amber-700">
                        ₹{Math.round(currentItemVal).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {g.notes && <p className="text-[11px] text-slate-400 italic">{g.notes}</p>}

                  {/* Edit and Delete Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium">{g.purchaseDate}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditGold(g)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition cursor-pointer"
                        title="Edit gold item"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-700" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${g.itemName}? This cannot be undone.`)) {
                            onDeleteGoldHolding?.(g.id);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer"
                        title="Delete gold item"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: LOANS & EMIS */}
      {subTab === 'loans' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                DEBT REPAYMENT & LIABILITIES
              </span>
              <h3 className="text-xl font-black">Loans & Scheduled EMIs</h3>
              <p className="text-xs text-white/80 mt-0.5">
                Each loan can use one of your configured savings accounts as its auto-debit source.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-white/70 block uppercase font-medium">Total Outstanding</span>
                <span className="text-2xl font-black text-rose-300">
                  ₹{totalOutstandingLoan.toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] text-white/80 font-semibold mt-0.5">
                  Total Monthly EMI: ₹{totalMonthlyEMI.toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingLoan(null);
                  setShowAddLoanModal(true);
                }}
                className="px-3.5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Loan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {loans.map((loan) => {
              const repaidMonths = loan.tenureMonths - loan.remainingMonths;
              const repaidPct = Math.round((repaidMonths / loan.tenureMonths) * 100);

              return (
                <div
                  key={loan.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                        {loan.loanType}
                      </span>
                      <span className="text-xs font-black text-[#C93B2B]">
                        {loan.interestRate}% p.a.
                      </span>
                    </div>

                    <div className="mt-2">
                      <h4 className="font-bold text-slate-800 text-sm">{loan.loanName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {loan.bank} • Auto Debit from {loan.autoDebitAccount}
                      </p>
                    </div>

                    {/* Amortization Progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1 font-semibold text-slate-600">
                        <span>Repayment Progress</span>
                        <span>{repaidPct}% Repaid ({repaidMonths}/{loan.tenureMonths} mos)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#C93B2B] transition-all duration-500"
                          style={{ width: `${repaidPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs mt-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Monthly EMI</span>
                        <span className="font-black text-slate-900 text-sm">
                          ₹{loan.monthlyEmi.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Due Date</span>
                        <span className="font-bold text-amber-700">
                          {loan.emiDueDate}th of every month
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Original Loan</span>
                        <span className="font-semibold text-slate-700">
                          ₹{loan.principalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Balance</span>
                        <span className="font-black text-rose-600">
                          ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                    <button
                      onClick={() => {
                        setEditingLoan(loan);
                        setShowAddLoanModal(true);
                      }}
                      className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
                    >
                      <Pencil className="w-3 h-3 text-slate-500" />
                      <span>Edit Loan</span>
                    </button>

                    {onDeleteLoan && (
                      <button
                        onClick={() => onDeleteLoan(loan.id)}
                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Record Transaction */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Record New Transaction</h3>
              <button onClick={() => setShowAddTxModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 rounded-xl font-bold transition ${
                    txType === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 rounded-xl font-bold transition ${
                    txType === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Income (+)
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-[#C93B2B]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="Groceries & Household">Groceries & Household</option>
                  <option value="Dining & Food Delivery">Dining & Food Delivery</option>
                  <option value="Fuel & Transportation">Fuel & Transportation</option>
                  <option value="Healthcare & Medicines">Healthcare & Medicines</option>
                  <option value="Utilities & Subscriptions">Utilities & Subscriptions</option>
                  <option value="Salary">Salary / Payroll</option>
                  <option value="Investment Credit">Investment Credit</option>
                  <option value="General Expenses">General Expenses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={txPaymentMode}
                    onChange={(e) => setTxPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Family Member</label>
                  <input
                    type="text"
                    disabled
                    value={activeMember}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Merchant</label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy, DMart, Apollo"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold rounded-xl shadow-md mt-2"
              >
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Gold Holding */}
      {showAddGoldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingGold ? 'Edit Physical Gold Holding' : 'Add Physical Gold Holding'}
              </h3>
              <button
                onClick={() => {
                  setShowAddGoldModal(false);
                  setEditingGold(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGold} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={goldItemName}
                  onChange={(e) => setGoldItemName(e.target.value)}
                  placeholder="e.g. 24K Sovereign Bullion Coin"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Weight (Grams)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={goldGrams}
                    onChange={(e) => setGoldGrams(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Karat</label>
                  <select
                    value={goldKarat}
                    onChange={(e) => {
                      const k = e.target.value as '24K' | '22K' | '18K';
                      setGoldKarat(k);
                      const rate =
                        k === '24K'
                          ? liveGold24kRate
                          : k === '22K'
                          ? liveGold22kRate
                          : Math.round(liveGold24kRate * (18 / 24));
                      setGoldRate(String(rate));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="24K">24K (99.9% Pure)</option>
                    <option value="22K">22K (91.6% Hallmark)</option>
                    <option value="18K">18K (75.0% Gold)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rate (₹/g)</label>
                  <input
                    type="number"
                    value={goldRate}
                    onChange={(e) => setGoldRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST (%)</label>
                  <input
                    type="number"
                    value={goldGst}
                    onChange={(e) => setGoldGst(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Making (%)</label>
                  <input
                    type="number"
                    value={goldMaking}
                    onChange={(e) => setGoldMaking(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md mt-2 cursor-pointer transition active:scale-95"
              >
                {editingGold ? 'Update Gold Holding' : 'Add Gold to Vault'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Loan */}
      <AddEditLoanModal
        isOpen={showAddLoanModal}
        onClose={() => {
          setShowAddLoanModal(false);
          setEditingLoan(null);
        }}
        loanToEdit={editingLoan}
        onSave={(loanData, existingId) => {
          if (existingId && onUpdateLoan) {
            onUpdateLoan({ id: existingId, ...loanData });
          } else {
            onAddLoan(loanData);
          }
        }}
        savingsAccounts={accounts.filter((account) => account.type === 'Savings')}
      />

      {/* MODAL: Add / Edit Demat & Stock Investment */}
      <AddEditDematModal
        isOpen={showAddDematModal}
        onClose={() => {
          setShowAddDematModal(false);
          setEditingDemat(null);
        }}
        dematToEdit={editingDemat}
        activeMember={activeMember}
        onSave={(dmData, existingId) => {
          if (existingId && onUpdateDematInvestment) {
            onUpdateDematInvestment({ id: existingId, ...dmData });
          } else if (onAddDematInvestment) {
            onAddDematInvestment(dmData);
          }
        }}
      />

      {/* MODAL: Add / Edit Fixed Investment */}
      <AddEditFixedModal
        isOpen={showAddFixedModal}
        onClose={() => {
          setShowAddFixedModal(false);
          setEditingFixed(null);
        }}
        fixedToEdit={editingFixed}
        activeMember={activeMember}
        onSave={(fiData, existingId) => {
          if (existingId && onUpdateFixedInvestment) {
            onUpdateFixedInvestment({ id: existingId, ...fiData });
          } else {
            onAddFixedInvestment(fiData);
          }
        }}
      />

      {/* MODAL: Add / Edit Budget */}
      <AddEditBudgetModal
        isOpen={showAddBudgetModal}
        onClose={() => {
          setShowAddBudgetModal(false);
          setEditingBudget(null);
        }}
        budgetToEdit={editingBudget}
        onSave={(bData, existingId) => {
          if (existingId && onUpdateBudget) {
            onUpdateBudget({ id: existingId, ...bData });
          } else {
            onAddBudget(bData);
          }
        }}
      />

      {/* MODAL: Update Gold Spot Rates */}
      {showGoldRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">Update Spot Gold Rates</h3>
              </div>
              <button
                onClick={() => setShowGoldRateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Updating spot bullion rates will automatically recalculate all your 24K & 22K holdings and your total Net Worth.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const r24 = parseFloat(rate24kInput) || liveGold24kRate;
                const r22 = parseFloat(rate22kInput) || liveGold22kRate;
                if (onUpdateGoldRates) {
                  onUpdateGoldRates(r24, r22);
                }
                setShowGoldRateModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  24K Gold Rate (₹ / gram)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={rate24kInput}
                  onChange={(e) => setRate24kInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  22K Gold Rate (₹ / gram)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={rate22kInput}
                  onChange={(e) => setRate22kInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGoldRateModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow transition"
                >
                  Save & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Google Sheets Live Market Prices Guide */}
      <GoogleSheetsMarketGuideModal
        isOpen={showSheetsGuideModal}
        onClose={() => setShowSheetsGuideModal(false)}
      />
    </div>
  );
};
