import React, { useState, useEffect, useMemo } from 'react';
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
  Cloud,
  RefreshCw,
  CheckCircle2,
  ArrowLeftRight,
  Banknote,
  Wallet,
  AlertCircle,
  X,
  Smartphone,
} from 'lucide-react';
import { Pagination } from '../common/Pagination';
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
  BalanceTransferPayload,
  CashWithdrawalPayload,
  AppSettings,
} from '../../types/db.types';
import { GoogleSheetsSyncService } from '../../services/google-sheets-sync.service';
import {
  AddEditAccountModal,
  AddEditLoanModal,
  AddEditDematModal,
  AddEditFixedModal,
  AddEditBudgetModal,
  AddEditInsuranceModal,
  ContributeFixedModal,
  PayLoanEmiModal,
  PayInsuranceModal,
} from './FinTrackerModals';
import { BalanceTransferModal, CashWithdrawalModal } from './AccountActionModals';
import { GoogleSheetsMarketGuideModal } from '../settings/GoogleSheetsMarketGuideModal';
import { useFormFocus } from '../../hooks/useFormFocus';

interface FinTrackerModuleProps {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  fixedInvestments: FixedInvestment[];
  dematInvestments: DematInvestment[];
  goldHoldings: GoldHolding[];
  loans: Loan[];
  insurances: Insurance[];
  liveGold24kRate: number;
  liveGold22kRate: number;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onUpdateAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onTransferBalance?: (payload: BalanceTransferPayload) => void;
  onCashWithdrawal?: (payload: CashWithdrawalPayload) => void;
  onAddBudget: (b: Omit<Budget, 'id'>) => void;
  onUpdateBudget?: (b: Budget) => void;
  onDeleteBudget?: (id: string) => void;
  onAddFixedInvestment: (fi: Omit<FixedInvestment, 'id'>) => void;
  onUpdateFixedInvestment?: (fi: FixedInvestment) => void;
  onDeleteFixedInvestment?: (id: string) => void;
  onContributeFixedInvestment?: (payload: { fixedInvestmentId: string; amount: number; accountId: string; date: string; paymentMode: Transaction['paymentMode']; notes?: string }) => void;
  onPayLoanEmi?: (payload: { loanId: string; amount: number; accountId: string; date: string; paymentMode: Transaction['paymentMode']; notes?: string }) => void;
  onPayInsurancePremium?: (payload: { insuranceId: string; amount: number; accountId: string; date: string; paymentMode: Transaction['paymentMode']; notes?: string; advanceDueDate?: boolean }) => void;
  onAddDematInvestment?: (dm: Omit<DematInvestment, 'id'>) => void;
  onUpdateDematInvestment?: (dm: DematInvestment) => void;
  onDeleteDematInvestment?: (id: string) => void;
  onAddGoldHolding: (gold: Omit<GoldHolding, 'id'>) => void;
  onUpdateGoldHolding?: (gold: GoldHolding) => void;
  onDeleteGoldHolding?: (id: string) => void;
  onAddLoan: (loan: Omit<Loan, 'id'>) => void;
  onUpdateLoan?: (loan: Loan) => void;
  onDeleteLoan?: (id: string) => void;
  onAddInsurance: (ins: Omit<Insurance, 'id'>) => void;
  onUpdateInsurance?: (ins: Insurance) => void;
  onDeleteInsurance?: (id: string) => void;
  onUpdateGoldRates?: (rate24k: number, rate22k: number) => void;
  onOpenPayWithUpi?: (accountId?: string) => void;
  onTriggerSync?: () => void;
  onPullFromSheets?: () => void;
  onRefreshStockPrices?: () => Promise<{ success: boolean; message: string; updatedCount: number } | any>;
  sheetsWebappUrl?: string;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => Promise<void>;
  activeMember: string;
  familyMembers: FamilyMember[];
  initialSubTab?: 'ledger' | 'accounts' | 'budgets' | 'fixed' | 'demat' | 'gold' | 'loans' | 'insurances';
}

export const FinTrackerModule: React.FC<FinTrackerModuleProps> = ({
  accounts,
  transactions,
  budgets,
  fixedInvestments,
  dematInvestments,
  goldHoldings,
  loans,
  insurances,
  liveGold24kRate,
  liveGold22kRate,
  onAddTransaction,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onTransferBalance,
  onCashWithdrawal,
  onOpenPayWithUpi,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  onAddFixedInvestment,
  onUpdateFixedInvestment,
  onDeleteFixedInvestment,
  onContributeFixedInvestment,
  onPayLoanEmi,
  onPayInsurancePremium,
  onAddDematInvestment,
  onUpdateDematInvestment,
  onDeleteDematInvestment,
  onAddGoldHolding,
  onUpdateGoldHolding,
  onDeleteGoldHolding,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
  onAddInsurance,
  onUpdateInsurance,
  onDeleteInsurance,
  onUpdateGoldRates,
  onTriggerSync,
  onPullFromSheets,
  onRefreshStockPrices,
  sheetsWebappUrl,
  onUpdateSettings,
  activeMember,
  familyMembers,
  initialSubTab = 'ledger',
}) => {
  const [subTab, setSubTab] = useState<'ledger' | 'accounts' | 'budgets' | 'fixed' | 'demat' | 'gold' | 'loans' | 'insurances'>(initialSubTab);

  // Live Stock Price Refresh States (1-Click On Demand)
  const [isRefreshingStocks, setIsRefreshingStocks] = useState(false);
  const [refreshingSymbol, setRefreshingSymbol] = useState<string | null>(null);
  const [showWebappSetupModal, setShowWebappSetupModal] = useState(false);
  const [setupWebappUrlInput, setSetupWebappUrlInput] = useState('');
  const [stockRefreshFeedback, setStockRefreshFeedback] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [actionAccountId, setActionAccountId] = useState<string | undefined>(undefined);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddGoldModal, setShowAddGoldModal] = useState(false);
  const [showAddFixedModal, setShowAddFixedModal] = useState(false);
  const [showAddDematModal, setShowAddDematModal] = useState(false);
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  const addTxModalRef = useFormFocus<HTMLDivElement>(showAddTxModal);
  const addGoldModalRef = useFormFocus<HTMLDivElement>(showAddGoldModal);

  // Edit states
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editingDemat, setEditingDemat] = useState<DematInvestment | null>(null);
  const [editingFixed, setEditingFixed] = useState<FixedInvestment | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingGold, setEditingGold] = useState<GoldHolding | null>(null);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [deletingInsuranceId, setDeletingInsuranceId] = useState<string | null>(null);

  // Modal target states for Contribute / Pay EMI / Pay Premium
  const [contributingFixed, setContributingFixed] = useState<FixedInvestment | null>(null);
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [payingInsurance, setPayingInsurance] = useState<Insurance | null>(null);

  // Filter state for ledger
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Pagination states (Maximum 20 items per page by default)
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(20);

  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsPageSize, setAccountsPageSize] = useState(20);

  const [fixedPage, setFixedPage] = useState(1);
  const [fixedPageSize, setFixedPageSize] = useState(20);

  const [dematPage, setDematPage] = useState(1);
  const [dematPageSize, setDematPageSize] = useState(20);

  const [goldPage, setGoldPage] = useState(1);
  const [goldPageSize, setGoldPageSize] = useState(20);

  const [loansPage, setLoansPage] = useState(1);
  const [loansPageSize, setLoansPageSize] = useState(20);

  const [insurancesPage, setInsurancesPage] = useState(1);
  const [insurancesPageSize, setInsurancesPageSize] = useState(20);

  // Paginated data lists
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => ledgerTypeFilter === 'all' || t.type === ledgerTypeFilter);
  }, [transactions, ledgerTypeFilter]);

  const paginatedTransactions = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ledgerPageSize));
    const safePage = Math.min(Math.max(1, ledgerPage), totalPages);
    const start = (safePage - 1) * ledgerPageSize;
    return filteredTransactions.slice(start, start + ledgerPageSize);
  }, [filteredTransactions, ledgerPage, ledgerPageSize]);

  const paginatedAccounts = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(accounts.length / accountsPageSize));
    const safePage = Math.min(Math.max(1, accountsPage), totalPages);
    const start = (safePage - 1) * accountsPageSize;
    return accounts.slice(start, start + accountsPageSize);
  }, [accounts, accountsPage, accountsPageSize]);

  const paginatedFixed = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(fixedInvestments.length / fixedPageSize));
    const safePage = Math.min(Math.max(1, fixedPage), totalPages);
    const start = (safePage - 1) * fixedPageSize;
    return fixedInvestments.slice(start, start + fixedPageSize);
  }, [fixedInvestments, fixedPage, fixedPageSize]);

  const paginatedDemat = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(dematInvestments.length / dematPageSize));
    const safePage = Math.min(Math.max(1, dematPage), totalPages);
    const start = (safePage - 1) * dematPageSize;
    return dematInvestments.slice(start, start + dematPageSize);
  }, [dematInvestments, dematPage, dematPageSize]);

  const paginatedGold = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(goldHoldings.length / goldPageSize));
    const safePage = Math.min(Math.max(1, goldPage), totalPages);
    const start = (safePage - 1) * goldPageSize;
    return goldHoldings.slice(start, start + goldPageSize);
  }, [goldHoldings, goldPage, goldPageSize]);

  const paginatedLoans = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(loans.length / loansPageSize));
    const safePage = Math.min(Math.max(1, loansPage), totalPages);
    const start = (safePage - 1) * loansPageSize;
    return loans.slice(start, start + loansPageSize);
  }, [loans, loansPage, loansPageSize]);

  const paginatedInsurances = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(insurances.length / insurancesPageSize));
    const safePage = Math.min(Math.max(1, insurancesPage), totalPages);
    const start = (safePage - 1) * insurancesPageSize;
    return insurances.slice(start, start + insurancesPageSize);
  }, [insurances, insurancesPage, insurancesPageSize]);

  // New Transaction Form State
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txCategory, setTxCategory] = useState('Groceries & Household');
  const [txSubcategory, setTxSubcategory] = useState('');
  const [txPaymentMode, setTxPaymentMode] = useState<Transaction['paymentMode']>('UPI');
  const [txNotes, setTxNotes] = useState('');
  const [txAccountId, setTxAccountId] = useState('');

  const budgetCategoryNames = useMemo(() => {
    return Array.from(new Set(budgets.map((b) => b.category?.trim()).filter(Boolean)));
  }, [budgets]);

  const expenseCategories = useMemo(() => {
    const list: string[] = [];
    budgetCategoryNames.forEach((cat) => {
      if (!list.includes(cat)) list.push(cat);
    });
    const defaults = [
      "Groceries & Household",
      "Dining & Food Delivery",
      "Fuel & Transportation",
      "Healthcare & Medicines",
      "Utilities & Subscriptions",
      "Shopping & Lifestyle",
      "Entertainment & Leisure",
      "General Expenses",
    ];
    defaults.forEach((cat) => {
      if (!list.includes(cat)) list.push(cat);
    });
    return list;
  }, [budgetCategoryNames]);

  const incomeCategories = useMemo(() => {
    const list: string[] = [];
    budgetCategoryNames.forEach((cat) => {
      if (!list.includes(cat)) list.push(cat);
    });
    const defaults = [
      "Salary",
      "Business / Professional",
      "Freelance & Consulting",
      "Investment Credit & Dividends",
      "Rental Income",
      "Bonus & Incentive",
      "Other Income",
    ];
    defaults.forEach((cat) => {
      if (!list.includes(cat)) list.push(cat);
    });
    return list;
  }, [budgetCategoryNames]);

  useEffect(() => {
    const available = txType === 'expense' ? expenseCategories : incomeCategories;
    if (!available.includes(txCategory)) {
      setTxCategory(available[0] || '');
    }
  }, [txType, expenseCategories, incomeCategories, txCategory]);

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

  // Insurances Totals
  const totalAnnualInsurancePremium = insurances.reduce((sum, ins) => {
    const factor = ins.frequency === 'Monthly' ? 12 : ins.frequency === 'Quarterly' ? 4 : ins.frequency === 'Half-Yearly' ? 2 : 1;
    return sum + ins.premiumAmount * factor;
  }, 0);
  const totalMonthlyInsurancePremium = insurances.reduce((sum, ins) => {
    const factor = ins.frequency === 'Monthly' ? 1 : ins.frequency === 'Quarterly' ? 1/3 : ins.frequency === 'Half-Yearly' ? 1/6 : 1/12;
    return sum + ins.premiumAmount * factor;
  }, 0);

  // Budgets & Limits Totals
  const totalBudgetAllocated = budgets.reduce((sum, b) => sum + (Number(b.allocatedAmount) || 0), 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + (Number(b.spentAmount) || 0), 0);
  const totalBudgetRemaining = totalBudgetAllocated - totalBudgetSpent;
  const totalBudgetUtilizationPct = totalBudgetAllocated > 0 ? Math.round((totalBudgetSpent / totalBudgetAllocated) * 100) : 0;

  // 1-Click Live Stock Price Refresh Handler (On Demand)
  const handleRefreshStockPrices = async () => {
    const url = (sheetsWebappUrl || localStorage.getItem('ivault_google_sheets_url') || '').trim();
    if (!url) {
      setSetupWebappUrlInput('');
      setShowWebappSetupModal(true);
      return;
    }

    setIsRefreshingStocks(true);
    setStockRefreshFeedback(null);
    try {
      let result;
      if (onRefreshStockPrices) {
        result = await onRefreshStockPrices();
      } else {
        result = await GoogleSheetsSyncService.refreshStockPrices(url);
      }
      if (result && result.message) {
        setStockRefreshFeedback({
          message: result.message,
          type: result.success ? 'success' : 'error',
        });
        setTimeout(() => setStockRefreshFeedback(null), 6000);
      }
    } catch (err) {
      setStockRefreshFeedback({
        message: `Failed to refresh stock prices: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    } finally {
      setIsRefreshingStocks(false);
    }
  };

  const handleRefreshSingleStock = async (dm: DematInvestment) => {
    const url = (sheetsWebappUrl || localStorage.getItem('ivault_google_sheets_url') || '').trim();
    if (!url) {
      setShowWebappSetupModal(true);
      return;
    }
    setRefreshingSymbol(dm.symbol);
    try {
      const res = await GoogleSheetsSyncService.refreshStockPrices(url);
      if (res && res.message) {
        setStockRefreshFeedback({
          message: res.message,
          type: res.success ? 'success' : 'error',
        });
        setTimeout(() => setStockRefreshFeedback(null), 6000);
      }
      if (onPullFromSheets) {
        onPullFromSheets();
      }
    } catch (err) {
      setStockRefreshFeedback({
        message: `Error refreshing ${dm.symbol}: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    } finally {
      setRefreshingSymbol(null);
    }
  };

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) return;

    onAddTransaction({
      type: txType,
      amount: parseFloat(txAmount),
      category: txCategory,
      subcategory: txSubcategory || undefined,
      date: txDate || new Date().toISOString().split('T')[0],
      paymentMode: txPaymentMode,
      familyMember: activeMember,
      notes: txNotes || undefined,
      syncedToSheets: false,
      accountId: txAccountId || undefined,
    });

    setTxAmount('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxSubcategory('');
    setTxNotes('');
    setTxAccountId('');
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

  const handleOpenEditInsurance = (ins: Insurance) => {
    setEditingInsurance(ins);
    setShowInsuranceModal(true);
  };

  const handleOpenAddInsurance = () => {
    setEditingInsurance(null);
    setShowInsuranceModal(true);
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
          { id: 'insurances', label: 'Insurances', count: insurances.length },
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
              <p className="text-xs text-slate-500">Manage savings, current, and wallet balances with inter-account transfers and cash withdrawals.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setActionAccountId(undefined);
                  setShowWithdrawalModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-2xs active:scale-95 transition cursor-pointer"
                title="Withdraw cash from an account via ATM or Branch"
              >
                <Banknote className="h-4 w-4 text-amber-700" />
                <span>Cash Withdrawal</span>
              </button>
              <button
                onClick={() => {
                  setActionAccountId(undefined);
                  setShowTransferModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold text-indigo-900 shadow-2xs active:scale-95 transition cursor-pointer"
                title="Transfer funds between bank and savings accounts"
              >
                <ArrowLeftRight className="h-4 w-4 text-indigo-700" />
                <span>Transfer Funds</span>
              </button>
              <button
                onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}
                className="flex items-center gap-1.5 rounded-xl bg-[#C93B2B] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#A52316] active:scale-95 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Account
              </button>
            </div>
          </div>
          {accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No accounts configured yet. Add a savings or bank account to show it on the dashboard.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {paginatedAccounts.map((account) => (
                  <div key={account.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{account.name}</h4>
                        <p className="text-xs text-slate-500">{account.bankName} · {account.type} · A/c ending {account.accountNumber.slice(-4)}</p>
                      </div>
                      <span className="text-sm font-black text-emerald-700">₹{account.balance.toLocaleString('en-IN')}</span>
                    </div>
                    {account.upiId && <p className="text-xs text-slate-500">UPI: {account.upiId}</p>}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {onOpenPayWithUpi && (
                          <button
                            onClick={() => onOpenPayWithUpi(account.id)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                            title={`Pay with UPI from ${account.name}`}
                          >
                            <Smartphone className="h-3.5 w-3.5 text-blue-600" /> Pay UPI
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActionAccountId(account.id);
                            setShowTransferModal(true);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                          title={`Transfer money from ${account.name}`}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer
                        </button>
                        {(account.type === 'Savings' || account.type === 'Current') && (
                          <button
                            onClick={() => {
                              setActionAccountId(account.id);
                              setShowWithdrawalModal(true);
                            }}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-amber-800 hover:bg-amber-50 transition cursor-pointer"
                            title={`Withdraw cash from ${account.name}`}
                          >
                            <Banknote className="h-3.5 w-3.5" /> Cash Out
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingAccount(account); setShowAccountModal(true); }} className="flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${account.name}?`)) onDeleteAccount(account.id);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={accountsPage}
                totalItems={accounts.length}
                itemsPerPage={accountsPageSize}
                onPageChange={setAccountsPage}
                onItemsPerPageChange={setAccountsPageSize}
                pageSizeOptions={[10, 20, 50]}
                itemName="accounts"
              />
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

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => {
                    setLedgerTypeFilter('all');
                    setLedgerPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    ledgerTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setLedgerTypeFilter('income');
                    setLedgerPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    ledgerTypeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => {
                    setLedgerTypeFilter('expense');
                    setLedgerPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    ledgerTypeFilter === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Expenses
                </button>
              </div>

              {/* Pay with UPI (Google Pay) Action */}
              {onOpenPayWithUpi && (
                <button
                  onClick={() => onOpenPayWithUpi()}
                  className="px-3.5 py-2 bg-gradient-to-r from-[#002D62] to-[#0B4884] hover:from-[#0B4884] hover:to-[#002D62] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title="Pay via Google Pay / UPI and auto-debit account"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Pay with UPI</span>
                </button>
              )}

              {/* Unified Cloud Sync */}
              {(onPullFromSheets || onTriggerSync) && (
                <button
                  onClick={onPullFromSheets || onTriggerSync}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                  title="Sync verified transactions with Google Sheets"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden xs:inline">Sync Cloud</span>
                </button>
              )}

              <button
                onClick={() => setShowAddTxModal(true)}
                className="px-3.5 py-2 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Tx</span>
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-sm text-slate-700">No transactions recorded</p>
                <p className="text-xs text-slate-500">
                  {ledgerTypeFilter === 'all'
                    ? 'Record an income or expense transaction or pull records from Google Sheets.'
                    : `No ${ledgerTypeFilter} records found. Switch filter or add a new transaction.`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedTransactions.map((tx) => (
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
            )}
          </div>

          {/* Cash Ledger Pagination (Max 20 items per page default) */}
          <Pagination
            currentPage={ledgerPage}
            totalItems={filteredTransactions.length}
            itemsPerPage={ledgerPageSize}
            onPageChange={setLedgerPage}
            onItemsPerPageChange={setLedgerPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
            itemName="transactions"
          />
        </div>
      )}

      {/* SUB-TAB 2: BUDGETS & LIMITS */}
      {subTab === 'budgets' && (
        <div className="space-y-4">
          {/* Executive Total Budget & Actuals KPI Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-2xl text-white shadow-md flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                  BUDGET vs ACTUAL SURVEILLANCE
                </span>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-xs text-white/80 font-bold">{budgets.length} Category Budgets</span>
              </div>
              <h3 className="text-xl font-black mt-1">Monthly Budget Performance</h3>
              <p className="text-xs text-white/70 mt-0.5">
                Aggregate allocated spending limits vs real expenditure across all budgeted categories.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
                <span className="text-[10px] text-white/70 font-semibold uppercase block">Total Budget Value of all Budgeted items</span>
                <span className="text-lg sm:text-xl font-black text-white block mt-0.5">
                  ₹{totalBudgetAllocated.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-white/60 block mt-0.5">Allocated limit ({budgets.length} items)</span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
                <span className="text-[10px] text-white/70 font-semibold uppercase block">Total Actual Value of all Budgeted items</span>
                <span className="text-lg sm:text-xl font-black text-amber-300 block mt-0.5">
                  ₹{totalBudgetSpent.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-white/60 block mt-0.5">
                  {totalBudgetUtilizationPct}% utilized
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-white/70 font-semibold uppercase block">Total Available Balance</span>
                <span className={`text-lg sm:text-xl font-black block mt-0.5 ${totalBudgetRemaining >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {totalBudgetRemaining >= 0 ? '' : '-'}₹{Math.abs(totalBudgetRemaining).toLocaleString('en-IN')}
                </span>
                <span className={`text-[10px] font-bold block mt-0.5 ${totalBudgetRemaining >= 0 ? 'text-emerald-300/80' : 'text-rose-300'}`}>
                  {totalBudgetRemaining >= 0 ? 'Within budget' : 'Over budget'}
                </span>
              </div>
            </div>
          </div>

          {/* Overall Budget Utilization Progress Strip */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Overall Budget Utilization</span>
                <span className="text-slate-500 font-medium">
                  (Spent ₹{totalBudgetSpent.toLocaleString('en-IN')} of ₹{totalBudgetAllocated.toLocaleString('en-IN')})
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                totalBudgetRemaining < 0
                  ? 'bg-rose-100 text-rose-700'
                  : totalBudgetUtilizationPct >= 80
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {totalBudgetUtilizationPct}% Total Spent
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalBudgetRemaining < 0
                    ? 'bg-rose-500'
                    : totalBudgetUtilizationPct >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, totalBudgetUtilizationPct)}%` }}
              />
            </div>
          </div>

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
              className="px-3.5 py-2 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Budget</span>
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <PieChart className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-extrabold text-slate-800 text-sm">No Category Budgets Configured</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Set monthly allocation limits for groceries, dining, fuel, and health to automate spending alarms.
              </p>
              <button
                onClick={() => {
                  setEditingBudget(null);
                  setShowAddBudgetModal(true);
                }}
                className="px-3.5 py-2 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                Create Your First Budget
              </button>
            </div>
          ) : (
            <>
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

          {/* Aggregate Surveillance Summary for All Budgeted Items */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h4 className="font-extrabold text-sm text-white">
                  Consolidated Summary of All Budgeted Items ({budgets.length} Categories)
                </h4>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold self-start sm:self-auto border ${
                  totalBudgetRemaining >= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {totalBudgetRemaining >= 0 ? '✓ Net Surplus Within Budget' : '⚠️ Net Over Budget Limit'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15">
                <span className="text-[10px] text-white/70 uppercase font-bold block">
                  Total Budget Value of all Budgeted items
                </span>
                <span className="text-base sm:text-lg font-black text-white block mt-0.5">
                  ₹{totalBudgetAllocated.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">Sum of all category limits</span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15">
                <span className="text-[10px] text-amber-300/90 uppercase font-bold block">
                  Total Actual Value of all Budgeted items
                </span>
                <span className="text-base sm:text-lg font-black text-amber-300 block mt-0.5">
                  ₹{totalBudgetSpent.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-amber-300/70 block mt-0.5">{totalBudgetUtilizationPct}% overall utilized</span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15">
                <span className="text-[10px] text-white/70 uppercase font-bold block">
                  Total Available Balance
                </span>
                <span
                  className={`text-base sm:text-lg font-black block mt-0.5 ${
                    totalBudgetRemaining >= 0 ? 'text-emerald-300' : 'text-rose-400'
                  }`}
                >
                  {totalBudgetRemaining >= 0 ? '' : '-'}₹{Math.abs(totalBudgetRemaining).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">
                  {totalBudgetRemaining >= 0 ? 'Remaining budget room' : 'Excess expenditure'}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15">
                <span className="text-[10px] text-white/70 uppercase font-bold block">
                  Overall Budget Health
                </span>
                <span className="text-base sm:text-lg font-black text-white block mt-0.5">
                  {totalBudgetUtilizationPct}% Spent
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">
                  Across all {budgets.length} configured items
                </span>
              </div>
            </div>
          </div>
          </>
          )}
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

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {paginatedFixed.map((fi) => (
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
                      onClick={() => setContributingFixed(fi)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Contribute</span>
                    </button>

                    <div className="flex items-center gap-1">
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
                </div>
              ))}
            </div>
            <Pagination
              currentPage={fixedPage}
              totalItems={fixedInvestments.length}
              itemsPerPage={fixedPageSize}
              onPageChange={setFixedPage}
              onItemsPerPageChange={setFixedPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemName="schemes"
            />
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
                  onClick={handleRefreshStockPrices}
                  disabled={isRefreshingStocks}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 disabled:opacity-60"
                  title="Refresh live prices for all stocks on click without opening Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStocks ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingStocks ? 'Refreshing Prices...' : 'Refresh Stock Prices'}</span>
                </button>

                <button
                  onClick={() => setShowSheetsGuideModal(true)}
                  className="px-3 py-2 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-300/30 transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
                  title="View Google Sheets live stock price setup with tickers and formulas"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Ticker Guide</span>
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

          {/* Live Ticker info banner */}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-600 text-white font-bold shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-extrabold text-blue-900">1-Click Live Stock Refresh:</span>{' '}
                <span>Click <strong>Refresh Stock Prices</strong> above anytime to update live prices directly in iVault. No need to visit Google Sheets or wait for auto-refresh!</span>
              </div>
            </div>
            <button
              onClick={() => setShowSheetsGuideModal(true)}
              className="text-blue-700 hover:text-blue-900 font-bold text-[11px] underline shrink-0 cursor-pointer text-left sm:text-right"
            >
              How to use tickers &gt;
            </button>
          </div>

          {/* Feedback Toast Banner */}
          {stockRefreshFeedback && (
            <div
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 transition shadow-xs ${
                stockRefreshFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : stockRefreshFeedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {stockRefreshFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{stockRefreshFeedback.message}</span>
              </div>
              <button
                onClick={() => setStockRefreshFeedback(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-black/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {paginatedDemat.map((dm) => {
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingDemat(dm);
                            setShowAddDematModal(true);
                          }}
                          className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        {(dm.type === 'Stock' || dm.type === 'ETF' || (dm.symbol && dm.type !== 'Mutual Fund')) && (
                          <button
                            onClick={() => handleRefreshSingleStock(dm)}
                            disabled={isRefreshingStocks || refreshingSymbol === dm.symbol}
                            className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition cursor-pointer disabled:opacity-50"
                            title={`Refresh live price for ${dm.symbol}`}
                          >
                            <RefreshCw className={`w-3 h-3 ${refreshingSymbol === dm.symbol ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                          </button>
                        )}
                      </div>

                      {onDeleteDematInvestment && (
                        <button
                          onClick={() => onDeleteDematInvestment(dm.id)}
                          className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
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
            <Pagination
              currentPage={dematPage}
              totalItems={dematInvestments.length}
              itemsPerPage={dematPageSize}
              onPageChange={setDematPage}
              onItemsPerPageChange={setDematPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemName="holdings"
            />
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
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {paginatedGold.map((g) => {
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
            <Pagination
              currentPage={goldPage}
              totalItems={goldHoldings.length}
              itemsPerPage={goldPageSize}
              onPageChange={setGoldPage}
              onItemsPerPageChange={setGoldPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemName="gold items"
            />
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

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {paginatedLoans.map((loan) => {
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
                        onClick={() => setPayingLoan(loan)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>💳 Pay EMI</span>
                      </button>

                      <div className="flex items-center gap-1">
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
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={loansPage}
              totalItems={loans.length}
              itemsPerPage={loansPageSize}
              onPageChange={setLoansPage}
              onItemsPerPageChange={setLoansPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemName="loans"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 7: INSURANCES */}
      {subTab === 'insurances' && (
        <div className="space-y-4 font-bold text-xs">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                RISK MITIGATION & PROTECTION
              </span>
              <h3 className="text-xl font-black">Family Insurance Policies</h3>
              <p className="text-xs text-white/80 mt-0.5">
                Maintain monthly or yearly premium schedules and track comprehensive family coverage.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-white/70 block uppercase font-medium">Annualized Premium</span>
                <span className="text-xl font-black text-emerald-300">
                  ₹{totalAnnualInsurancePremium.toLocaleString('en-IN')}
                </span>
                <div className="text-[10px] text-white/80 font-semibold mt-0.5">
                  Monthly Equivalent: ₹{Math.round(totalMonthlyInsurancePremium).toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={handleOpenAddInsurance}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Add Policy</span>
              </button>
            </div>
          </div>

          {insurances.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <Shield className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-extrabold text-slate-800 text-sm">No Insurance Policies Recorded</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Keep all health, term life, vehicle, and critical illness policies organized in one secure offline dashboard.
              </p>
              <button
                onClick={handleOpenAddInsurance}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition cursor-pointer text-white"
              >
                Add Your First Policy
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {paginatedInsurances.map((ins) => {
                const daysToDue = Math.ceil((new Date(ins.nextDueDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                const isOverdue = daysToDue < 0;
                const isDueSoon = daysToDue >= 0 && daysToDue <= 30;

                return (
                  <div
                    key={ins.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          ins.type === 'Health' ? 'bg-emerald-50 text-emerald-800' :
                          ins.type === 'Life' ? 'bg-blue-50 text-blue-800' :
                          ins.type === 'Term' ? 'bg-purple-50 text-purple-800' :
                          ins.type === 'Motor' ? 'bg-amber-50 text-amber-800' :
                          ins.type === 'Home' ? 'bg-indigo-50 text-indigo-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {ins.type} Insurance
                        </span>
                        {isOverdue ? (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-black uppercase">
                            Overdue
                          </span>
                        ) : isDueSoon ? (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black uppercase">
                            Due in {daysToDue} days
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5">
                        <h4 className="font-bold text-slate-800 text-sm">{ins.policyName}</h4>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {ins.insurer} • No: <span className="font-mono text-slate-700">{ins.policyNumber}</span>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs mt-3.5">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Premium Amount</span>
                          <span className="font-black text-slate-900 text-sm">
                            ₹{ins.premiumAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1 font-semibold">({ins.frequency})</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Next Due Date</span>
                          <span className={`font-black text-sm ${isOverdue ? 'text-rose-600' : isDueSoon ? 'text-amber-600' : 'text-slate-800'}`}>
                            {new Date(ins.nextDueDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Insured Member</span>
                          <span className="font-extrabold text-slate-700">
                            👤 {ins.familyMember}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Start Date</span>
                          <span className="font-semibold text-slate-600">
                            {new Date(ins.startDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {ins.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-2.5 bg-slate-50/50 p-2 rounded-lg border border-dashed border-slate-200">
                          ℹ️ {ins.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                      <button
                        onClick={() => setPayingInsurance(ins)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>🛡️ Pay Premium</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditInsurance(ins)}
                          className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                          <span>Edit Policy</span>
                        </button>

                        {onDeleteInsurance && (
                          deletingInsuranceId === ins.id ? (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <span className="text-[11px] font-bold text-rose-700">Confirm?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteInsurance(ins.id);
                                  setDeletingInsuranceId(null);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
                              >
                                Yes, Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingInsuranceId(null)}
                                className="text-slate-500 hover:text-slate-800 font-semibold text-[11px] px-1.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingInsuranceId(ins.id)}
                              className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
              <Pagination
                currentPage={insurancesPage}
                totalItems={insurances.length}
                itemsPerPage={insurancesPageSize}
                onPageChange={setInsurancesPage}
                onItemsPerPageChange={setInsurancesPageSize}
                pageSizeOptions={[10, 20, 50]}
                itemName="policies"
              />
            </div>
          )}
        </div>
      )}

      {/* MODAL: Record Transaction */}
      {showAddTxModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddTxModal(false);
          }}
        >
          <div
            ref={addTxModalRef}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl space-y-4 focus:outline-none"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Record New Transaction</h3>
              <button onClick={() => setShowAddTxModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                    txType === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                    txType === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Income (+)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    autoFocus
                    placeholder="e.g. 1500"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-[#C93B2B]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">Date</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTxDate(new Date().toISOString().split('T')[0])}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          txDate === new Date().toISOString().split('T')[0]
                            ? 'bg-[#C93B2B] text-white'
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
                          setTxDate(y.toISOString().split('T')[0]);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          (() => {
                            const y = new Date();
                            y.setDate(y.getDate() - 1);
                            return txDate === y.toISOString().split('T')[0];
                          })()
                            ? 'bg-[#C93B2B] text-white'
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
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#C93B2B]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Category</label>
                  {budgets.length > 0 && (
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      🎯 {budgets.length} Budgets Active
                    </span>
                  )}
                </div>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  {budgets.length > 0 && (
                    <optgroup label="🎯 Categories from Budgets">
                      {budgets.map((b) => (
                        <option key={`tx-b-${b.id || b.category}`} value={b.category}>
                          {b.category} {txType === 'expense' ? `(Budget: ₹${b.allocatedAmount.toLocaleString('en-IN')})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={budgets.length > 0 ? (txType === 'expense' ? 'Other Expense Categories' : 'Other Income Sources') : (txType === 'expense' ? 'Expense Categories' : 'Income Categories')}>
                    {(txType === 'expense' ? expenseCategories : incomeCategories)
                      .filter((cat) => !budgets.some((b) => b.category === cat))
                      .map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                  </optgroup>
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
                <label className="font-bold text-slate-700 block mb-1">Linked Account (Deduct/Add Balance)</label>
                <select
                  value={txAccountId}
                  onChange={(e) => setTxAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-sm"
                >
                  <option value="">-- No Account (Cash/Other) --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName}) - Balance: ₹{acc.balance.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddGoldModal(false);
              setEditingGold(null);
            }
          }}
        >
          <div
            ref={addGoldModalRef}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl space-y-4 focus:outline-none"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingGold ? 'Edit Physical Gold Holding' : 'Add Physical Gold Holding'}
              </h3>
              <button
                onClick={() => {
                  setShowAddGoldModal(false);
                  setEditingGold(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
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
                  autoFocus
                  value={goldItemName}
                  onChange={(e) => setGoldItemName(e.target.value)}
                  placeholder="e.g. 24K Sovereign Bullion Coin"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-amber-500"
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
        allBudgets={budgets}
        onSave={(bData, existingId) => {
          if (existingId && onUpdateBudget) {
            onUpdateBudget({ id: existingId, ...bData });
          } else {
            onAddBudget(bData);
          }
        }}
      />

      {/* MODAL: Add / Edit Insurance */}
      <AddEditInsuranceModal
        isOpen={showInsuranceModal}
        onClose={() => {
          setShowInsuranceModal(false);
          setEditingInsurance(null);
        }}
        insuranceToEdit={editingInsurance}
        familyMembers={familyMembers.map((m) => m.name)}
        onSave={(insData) => {
          if (editingInsurance) {
            onUpdateInsurance?.({ id: editingInsurance.id, ...insData });
          } else {
            onAddInsurance(insData);
          }
        }}
      />

      {/* MODAL: Update Gold Spot Rates */}
      {showGoldRateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGoldRateModal(false);
          }}
        >
          <div
            className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white rounded-2xl p-5 shadow-2xl space-y-4 focus:outline-none"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">Update Spot Gold Rates</h3>
              </div>
              <button
                onClick={() => setShowGoldRateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
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
                  autoFocus
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

      {/* MODAL: Balance Transfer Between Accounts */}
      <BalanceTransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setActionAccountId(undefined);
        }}
        accounts={accounts}
        familyMembers={familyMembers}
        activeMember={activeMember}
        initialFromAccountId={actionAccountId}
        onTransfer={(payload) => {
          if (onTransferBalance) {
            onTransferBalance(payload);
          }
        }}
      />

      {/* MODAL: Cash Withdrawal */}
      <CashWithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => {
          setShowWithdrawalModal(false);
          setActionAccountId(undefined);
        }}
        accounts={accounts}
        familyMembers={familyMembers}
        activeMember={activeMember}
        initialFromAccountId={actionAccountId}
        onWithdrawal={(payload) => {
          if (onCashWithdrawal) {
            onCashWithdrawal(payload);
          }
        }}
      />

      {/* MODAL: Contribute to Fixed Investment (SSA, PPF, RD, FD, NPS) */}
      <ContributeFixedModal
        isOpen={Boolean(contributingFixed)}
        onClose={() => setContributingFixed(null)}
        fixedInvestment={contributingFixed}
        accounts={accounts}
        onConfirm={(payload) => {
          if (onContributeFixedInvestment) {
            onContributeFixedInvestment(payload);
          }
        }}
      />

      {/* MODAL: Pay Loan EMI */}
      <PayLoanEmiModal
        isOpen={Boolean(payingLoan)}
        onClose={() => setPayingLoan(null)}
        loan={payingLoan}
        accounts={accounts}
        onConfirm={(payload) => {
          if (onPayLoanEmi) {
            onPayLoanEmi(payload);
          }
        }}
      />

      {/* MODAL: Pay Insurance Premium */}
      <PayInsuranceModal
        isOpen={Boolean(payingInsurance)}
        onClose={() => setPayingInsurance(null)}
        insurance={payingInsurance}
        accounts={accounts}
        onConfirm={(payload) => {
          if (onPayInsurancePremium) {
            onPayInsurancePremium(payload);
          }
        }}
      />
      {showWebappSetupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWebappSetupModal(false);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 focus:outline-none"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">1-Click Live Stock Refresh</h3>
                  <p className="text-xs text-slate-500">Connect Google Sheets Web App</p>
                </div>
              </div>
              <button
                onClick={() => setShowWebappSetupModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To refresh live stock prices on click directly inside iVault without visiting Google Sheets, paste your Google Sheets Web App URL below once:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Google Sheets Web App URL</label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={setupWebappUrlInput}
                onChange={(e) => setSetupWebappUrlInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                You can get this URL from <strong>Google Sheets → Extensions → Apps Script → Deploy → Web app</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowWebappSetupModal(false);
                  setShowSheetsGuideModal(true);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
              >
                View Setup Guide & Code.gs
              </button>

              <button
                type="button"
                disabled={!setupWebappUrlInput.trim().startsWith('http')}
                onClick={async () => {
                  const trimmed = setupWebappUrlInput.trim();
                  localStorage.setItem('ivault_google_sheets_url', trimmed);
                  if (onUpdateSettings) {
                    await onUpdateSettings({ sheetsWebappUrl: trimmed });
                  }
                  setShowWebappSetupModal(false);
                  setTimeout(() => {
                    handleRefreshStockPrices();
                  }, 100);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition active:scale-95"
              >
                Save & Refresh Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
