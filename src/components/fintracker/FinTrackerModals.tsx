import React, { useState, useEffect } from 'react';
import { X, Building, CreditCard, Coins, TrendingUp, PieChart, Shield, ArrowDownRight, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Account, Budget, FixedInvestment, DematInvestment, GoldHolding, Loan, Insurance, Transaction } from '../../types/db.types';
import { useFormFocus } from '../../hooks/useFormFocus';

const formatAccountForDebit = (account: Account) =>
  `${account.name} (${account.bankName} • A/c ...${account.accountNumber.slice(-4)})`;

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Omit<Account, 'id'>, existingId?: string) => void;
  accountToEdit?: Account | null;
}

export const AddEditAccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
}) => {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [type, setType] = useState<Account['type']>('Savings');
  const [balance, setBalance] = useState('');
  const [upiId, setUpiId] = useState('');

  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  useEffect(() => {
    setName(accountToEdit?.name || '');
    setBankName(accountToEdit?.bankName || '');
    setAccountNumber(accountToEdit?.accountNumber || '');
    setType(accountToEdit?.type || 'Savings');
    setBalance(accountToEdit ? String(accountToEdit.balance) : '');
    setUpiId(accountToEdit?.upiId || '');
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      name: name.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      type,
      balance: Number(balance) || 0,
      upiId: upiId.trim() || undefined,
      lastUpdated: new Date().toISOString(),
    }, accountToEdit?.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md max-h-[92vh] overflow-y-auto space-y-4 rounded-2xl bg-white p-6 shadow-2xl focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-extrabold text-slate-900">
            {accountToEdit ? 'Edit Account Details' : 'Add Account'}
          </h3>
          <button onClick={onClose} className="font-bold text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Close account form">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <label className="font-bold text-slate-700">
              Account Name
              <input
                required
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Salary Account"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold focus:ring-2 focus:ring-[#C93B2B]"
              />
            </label>
            <label className="font-bold text-slate-700">
              Bank
              <input required value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="e.g. HDFC Bank" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="font-bold text-slate-700">
              Account Number
              <input required value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold" />
            </label>
            <label className="font-bold text-slate-700">
              Type
              <select value={type} onChange={(event) => setType(event.target.value as Account['type'])} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold">
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Wallet">Wallet</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="font-bold text-slate-700">
              Balance (₹)
              <input type="number" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold" />
            </label>
            <label className="font-bold text-slate-700">
              UPI ID (optional)
              <input value={upiId} onChange={(event) => setUpiId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold" />
            </label>
          </div>
          <button type="submit" className="w-full rounded-xl bg-slate-900 py-2.5 font-bold text-white hover:bg-slate-800">
            {accountToEdit ? 'Save Account' : 'Add Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 1. ADD / EDIT LOAN MODAL
// =========================================================================
interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (loan: Omit<Loan, 'id'>, existingId?: string) => void;
  loanToEdit?: Loan | null;
  savingsAccounts: Account[];
}

export const AddEditLoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  loanToEdit,
  savingsAccounts,
}) => {
  const [loanName, setLoanName] = useState('');
  const [bank, setBank] = useState('');
  const [loanType, setLoanType] = useState<Loan['loanType']>('Home Loan');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [interestRate, setInterestRate] = useState('8.5');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [tenureMonths, setTenureMonths] = useState('240');
  const [remainingMonths, setRemainingMonths] = useState('180');
  const [emiDueDate, setEmiDueDate] = useState('10');
  const [autoDebitAccount, setAutoDebitAccount] = useState('');
  const debitAccountOptions = savingsAccounts.map((account) => ({
    value: formatAccountForDebit(account),
    label: formatAccountForDebit(account),
  }));
  const selectedAccountIsConfigured = debitAccountOptions.some((option) => option.value === autoDebitAccount);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (loanToEdit) {
      setLoanName(loanToEdit.loanName);
      setBank(loanToEdit.bank);
      setLoanType(loanToEdit.loanType);
      setPrincipalAmount(String(loanToEdit.principalAmount));
      setOutstandingBalance(String(loanToEdit.outstandingBalance));
      setInterestRate(String(loanToEdit.interestRate));
      setMonthlyEmi(String(loanToEdit.monthlyEmi));
      setTenureMonths(String(loanToEdit.tenureMonths));
      setRemainingMonths(String(loanToEdit.remainingMonths));
      setEmiDueDate(String(loanToEdit.emiDueDate));
      setAutoDebitAccount(loanToEdit.autoDebitAccount || '');
      setStartDate(loanToEdit.startDate);
    } else {
      setLoanName('');
      setBank(savingsAccounts[0]?.bankName || '');
      setLoanType('Home Loan');
      setPrincipalAmount('2500000');
      setOutstandingBalance('2100000');
      setInterestRate('8.5');
      setMonthlyEmi('21700');
      setTenureMonths('240');
      setRemainingMonths('180');
      setEmiDueDate('10');
      setAutoDebitAccount(savingsAccounts[0] ? formatAccountForDebit(savingsAccounts[0]) : '');
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [loanToEdit, isOpen, savingsAccounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanName.trim()) return;

    onSave(
      {
        loanName: loanName.trim(),
        bank: bank.trim(),
        loanType,
        principalAmount: parseFloat(principalAmount) || 0,
        outstandingBalance: parseFloat(outstandingBalance) || 0,
        interestRate: parseFloat(interestRate) || 0,
        monthlyEmi: parseFloat(monthlyEmi) || 0,
        tenureMonths: parseInt(tenureMonths) || 12,
        remainingMonths: parseInt(remainingMonths) || 12,
        emiDueDate: parseInt(emiDueDate) || 10,
        autoDebitAccount: autoDebitAccount.trim(),
        startDate,
      },
      loanToEdit?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {loanToEdit ? 'Edit Loan & EMI Details' : 'Set Up New Loan / Liability'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Loan / Liability Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Home Loan (Emerald Towers), EV Car Loan"
              value={loanName}
              onChange={(e) => setLoanName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-[#C93B2B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bank / Lender</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="Home Loan">Home Loan</option>
                <option value="Car Loan">Car Loan</option>
                <option value="Personal Loan">Personal Loan</option>
                <option value="Education Loan">Education Loan</option>
                <option value="Gold Loan">Gold Loan</option>
                <option value="Business Loan">Business Loan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Principal Amount (₹)</label>
              <input
                type="number"
                required
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Outstanding Balance (₹)</label>
              <input
                type="number"
                required
                value={outstandingBalance}
                onChange={(e) => setOutstandingBalance(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-rose-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Monthly EMI (₹)</label>
              <input
                type="number"
                required
                value={monthlyEmi}
                onChange={(e) => setMonthlyEmi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Interest (% p.a.)</label>
              <input
                type="number"
                step="0.05"
                required
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-amber-700"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">EMI Due Day</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={emiDueDate}
                onChange={(e) => setEmiDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Tenure (Months)</label>
              <input
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Remaining Months</label>
              <input
                type="number"
                value={remainingMonths}
                onChange={(e) => setRemainingMonths(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Auto Debit From</label>
            {savingsAccounts.length > 0 && (
              <select
                value={selectedAccountIsConfigured ? autoDebitAccount : '__custom__'}
                onChange={(event) => {
                  const value = event.target.value;
                  setAutoDebitAccount(value === '__custom__' ? '' : value);
                }}
                className="mb-2 w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                {debitAccountOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
                <option value="__custom__">Enter another account manually</option>
              </select>
            )}
            {(!selectedAccountIsConfigured || savingsAccounts.length === 0) && (
              <input
                type="text"
                required
                placeholder={savingsAccounts.length > 0 ? 'Enter debit account details' : 'Add a savings account or enter details'}
                value={autoDebitAccount}
                onChange={(event) => setAutoDebitAccount(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md mt-2"
          >
            {loanToEdit ? 'Save Changes' : 'Confirm & Set Up Loan'}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 2. ADD / EDIT DEMAT & STOCK INVESTMENT MODAL
// =========================================================================
interface DematModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dm: Omit<DematInvestment, 'id'>, existingId?: string) => void;
  dematToEdit?: DematInvestment | null;
  activeMember: string;
}

export const AddEditDematModal: React.FC<DematModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dematToEdit,
  activeMember,
}) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<DematInvestment['type']>('Mutual Fund');
  const [units, setUnits] = useState('100');
  const [avgBuyPrice, setAvgBuyPrice] = useState('50');
  const [currentNAV, setCurrentNAV] = useState('65');
  const [sipFrequency, setSipFrequency] = useState<'Monthly' | 'Quarterly' | 'Lumpsum'>('Monthly');
  const [folioNumber, setFolioNumber] = useState('');
  const [familyMember, setFamilyMember] = useState(activeMember);
  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (dematToEdit) {
      setName(dematToEdit.name);
      setSymbol(dematToEdit.symbol);
      setType(dematToEdit.type);
      setUnits(String(dematToEdit.units));
      setAvgBuyPrice(String(dematToEdit.avgBuyPrice));
      setCurrentNAV(String(dematToEdit.currentNAV));
      setSipFrequency(dematToEdit.sipFrequency || 'Monthly');
      setFolioNumber(dematToEdit.folioNumber || '');
      setFamilyMember(dematToEdit.familyMember);
    } else {
      setName('');
      setSymbol('');
      setType('Mutual Fund');
      setUnits('100');
      setAvgBuyPrice('100');
      setCurrentNAV('120');
      setSipFrequency('Monthly');
      setFolioNumber('');
      setFamilyMember(activeMember);
    }
  }, [dematToEdit, isOpen, activeMember]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const u = parseFloat(units) || 0;
    const avg = parseFloat(avgBuyPrice) || 0;
    const nav = parseFloat(currentNAV) || avg;
    const invested = u * avg;
    const currentVal = u * nav;

    onSave(
      {
        name: name.trim(),
        symbol: symbol.trim() || name.slice(0, 8).toUpperCase(),
        type,
        units: u,
        avgBuyPrice: avg,
        currentNAV: nav,
        investedAmount: Math.round(invested),
        currentValue: Math.round(currentVal),
        sipFrequency,
        folioNumber: folioNumber.trim(),
        familyMember,
        lastUpdated: new Date().toISOString(),
      },
      dematToEdit?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {dematToEdit ? 'Edit Stock / Mutual Fund' : 'Add Investment to Demat Portfolio'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Asset Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Parag Parikh Flexi Cap, Bluechip Equity Ltd, Nifty 50 ETF"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Ticker / Symbol</label>
              <input
                type="text"
                placeholder="e.g. TCS, INFY, RELIANCE, AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold uppercase"
              />
              <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                Ticker used for live stock prices via Google Sheets
              </span>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Asset Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="Mutual Fund">Mutual Fund (SIP / Lumpsum)</option>
                <option value="Stock">Direct Equity Stock</option>
                <option value="ETF">Index ETF</option>
                <option value="SGB">Sovereign Gold Bond (SGB)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Units Held</label>
              <input
                type="number"
                step="0.01"
                required
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Avg Buy NAV (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={avgBuyPrice}
                onChange={(e) => setAvgBuyPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Current NAV (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={currentNAV}
                onChange={(e) => setCurrentNAV(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">SIP Frequency</label>
              <select
                value={sipFrequency}
                onChange={(e) => setSipFrequency(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              >
                <option value="Monthly">Monthly SIP</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Lumpsum">One-Time Lumpsum</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Folio / Demat ID</label>
              <input
                type="text"
                placeholder="e.g. ZERODHA-DP01, 10293847"
                value={folioNumber}
                onChange={(e) => setFolioNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md mt-2"
          >
            {dematToEdit ? 'Save Changes' : 'Confirm & Save Investment'}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 3. ADD / EDIT FIXED INVESTMENT MODAL
// =========================================================================
interface FixedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fi: Omit<FixedInvestment, 'id'>, existingId?: string) => void;
  fixedToEdit?: FixedInvestment | null;
  activeMember: string;
}

export const AddEditFixedModal: React.FC<FixedModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fixedToEdit,
  activeMember,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<FixedInvestment['type']>('PPF');
  const [institution, setInstitution] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('150000');
  const [currentBalance, setCurrentBalance] = useState('210000');
  const [interestRate, setInterestRate] = useState('7.1');
  const [monthlyContribution, setMonthlyContribution] = useState('12500');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [maturityDate, setMaturityDate] = useState('2035-04-10');
  const [familyMember, setFamilyMember] = useState(activeMember);
  const [notes, setNotes] = useState('');
  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (fixedToEdit) {
      setName(fixedToEdit.name);
      setType(fixedToEdit.type);
      setInstitution(fixedToEdit.institution);
      setPrincipalAmount(String(fixedToEdit.principalAmount));
      setCurrentBalance(String(fixedToEdit.currentBalance));
      setInterestRate(String(fixedToEdit.interestRate));
      setMonthlyContribution(String(fixedToEdit.monthlyContribution));
      setStartDate(fixedToEdit.startDate);
      setMaturityDate(fixedToEdit.maturityDate);
      setFamilyMember(fixedToEdit.familyMember);
      setNotes(fixedToEdit.notes || '');
    } else {
      setName('');
      setType('PPF');
      setInstitution('');
      setPrincipalAmount('150000');
      setCurrentBalance('200000');
      setInterestRate('7.1');
      setMonthlyContribution('12500');
      setStartDate(new Date().toISOString().split('T')[0]);
      setMaturityDate('2035-04-10');
      setFamilyMember(activeMember);
      setNotes('');
    }
  }, [fixedToEdit, isOpen, activeMember]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name: name.trim(),
        type,
        accountNumberRedacted: 'XXXX-XXXX-8401',
        institution: institution.trim(),
        principalAmount: parseFloat(principalAmount) || 0,
        currentBalance: parseFloat(currentBalance) || 0,
        interestRate: parseFloat(interestRate) || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        startDate,
        maturityDate,
        familyMember,
        notes: notes.trim(),
      },
      fixedToEdit?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {fixedToEdit ? 'Edit Fixed Investment Scheme' : 'Add Sovereign / Fixed Income Scheme'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Scheme Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Public Provident Fund (PPF), Sukanya Samriddhi (SSA), Bank RD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Scheme Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="PPF">PPF (Public Provident Fund)</option>
                <option value="SSA">SSA (Sukanya Samriddhi Account)</option>
                <option value="FD">FD (Fixed Deposit)</option>
                <option value="RD">RD (Recurring Deposit)</option>
                <option value="EPF">EPF / VPF</option>
                <option value="NPS">NPS (National Pension Scheme)</option>
                <option value="Bonds">Sovereign Bonds</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bank / Institution</label>
              <input
                type="text"
                placeholder="e.g. State Bank of India, India Post, HDFC Bank"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Current Balance (₹)</label>
              <input
                type="number"
                required
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-amber-700"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Interest Rate (%)</label>
              <input
                type="number"
                step="0.05"
                required
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Monthly Deposit</label>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Maturity Date</label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Sovereign Lock-in</label>
            <input
              type="text"
              placeholder="e.g. 15-year tax free sovereign lock-in with 80C benefits"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-md mt-2"
          >
            {fixedToEdit ? 'Save Changes' : 'Confirm & Save Scheme'}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 4. ADD / EDIT BUDGET MODAL
// =========================================================================
interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: Omit<Budget, 'id'>, existingId?: string) => void;
  budgetToEdit?: Budget | null;
  allBudgets?: Budget[];
}

export const AddEditBudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  budgetToEdit,
  allBudgets = [],
}) => {
  const [category, setCategory] = useState('Groceries & Household');
  const [allocatedAmount, setAllocatedAmount] = useState('15000');
  const [period, setPeriod] = useState<'Monthly' | 'Annual'>('Monthly');
  const [warningThresholdPct, setWarningThresholdPct] = useState('80');

  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  // Totals across all budgeted items
  const totalBudgetAllocated = allBudgets.reduce((sum, b) => sum + (Number(b.allocatedAmount) || 0), 0);
  const totalBudgetSpent = allBudgets.reduce((sum, b) => sum + (Number(b.spentAmount) || 0), 0);
  const totalBudgetRemaining = totalBudgetAllocated - totalBudgetSpent;

  useEffect(() => {
    if (budgetToEdit) {
      setCategory(budgetToEdit.category);
      setAllocatedAmount(String(budgetToEdit.allocatedAmount));
      setPeriod(budgetToEdit.period);
      setWarningThresholdPct(String(budgetToEdit.warningThresholdPct || 80));
    } else {
      setCategory('Groceries & Household');
      setAllocatedAmount('15000');
      setPeriod('Monthly');
      setWarningThresholdPct('80');
    }
  }, [budgetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim()) return;

    onSave(
      {
        category: category.trim(),
        allocatedAmount: parseFloat(allocatedAmount) || 0,
        spentAmount: budgetToEdit ? budgetToEdit.spentAmount : 0,
        period,
        warningThresholdPct: parseInt(warningThresholdPct) || 80,
      },
      budgetToEdit?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl space-y-4 focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#C93B2B]" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {budgetToEdit ? 'Edit Budget Limit' : 'Create Category Budget'}
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">
                {allBudgets.length > 0 ? `${allBudgets.length} existing budgeted categories` : 'New allocation'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Surveillance Context for all budgeted items */}
        {allBudgets.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Aggregate Value (All Budgeted Items)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Total Budget Value</span>
                <span className="font-black text-slate-900 text-sm">₹{totalBudgetAllocated.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-100">
                <span className="text-[10px] text-amber-700 font-semibold block">Total Actual Value</span>
                <span className="font-black text-amber-700 text-sm">₹{totalBudgetSpent.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 font-semibold text-slate-600">
              <span>Available Spending Balance:</span>
              <span className={totalBudgetRemaining >= 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
                {totalBudgetRemaining >= 0 ? '' : '-'}₹{Math.abs(totalBudgetRemaining).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Expense Category</label>
            <input
              type="text"
              required
              autoFocus
              list="budget-categories"
              placeholder="e.g. Groceries & Household, Dining, Fuel, Utilities"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-[#C93B2B]"
            />
            <datalist id="budget-categories">
              <option value="Groceries & Household" />
              <option value="Dining & Food Delivery" />
              <option value="Fuel & Transportation" />
              <option value="Healthcare & Medicines" />
              <option value="Utilities & Subscriptions" />
              <option value="Shopping & Lifestyle" />
              <option value="Entertainment & Leisure" />
              <option value="General Expenses" />
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Allocated Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 15000"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-[#C93B2B]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Budget Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">Warning Alert Threshold</label>
              <span className="font-black text-[#C93B2B]">{warningThresholdPct}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={warningThresholdPct}
              onChange={(e) => setWarningThresholdPct(e.target.value)}
              className="w-full accent-[#C93B2B]"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Application notifications and dashboard alerts will trigger when spending reaches this percentage.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold rounded-xl shadow-md mt-2 transition active:scale-95"
          >
            {budgetToEdit ? 'Save Budget Changes' : 'Create Budget Allocation'}
          </button>
        </form>
      </div>
    </div>
  );
};

interface InsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ins: Omit<Insurance, 'id'>) => void;
  insuranceToEdit?: Insurance | null;
  familyMembers: string[];
  accounts?: Account[];
}

export const AddEditInsuranceModal: React.FC<InsuranceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  insuranceToEdit,
  familyMembers,
  accounts = [],
}) => {
  const [policyName, setPolicyName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [type, setType] = useState<Insurance['type']>('Health');
  const [insurer, setInsurer] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [frequency, setFrequency] = useState<Insurance['frequency']>('Yearly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [familyMember, setFamilyMember] = useState('');
  const [autoDebitAccount, setAutoDebitAccount] = useState('');
  const [notes, setNotes] = useState('');

  const debitAccountOptions = accounts.map((account) => ({
    value: formatAccountForDebit(account),
    label: `${account.name} (${account.bankName} • ₹${account.balance.toLocaleString('en-IN')})`,
  }));
  const selectedAccountIsConfigured = debitAccountOptions.some((opt) => opt.value === autoDebitAccount);

  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (insuranceToEdit) {
      setPolicyName(insuranceToEdit.policyName);
      setPolicyNumber(insuranceToEdit.policyNumber);
      setType(insuranceToEdit.type);
      setInsurer(insuranceToEdit.insurer);
      setPremiumAmount(String(insuranceToEdit.premiumAmount));
      setFrequency(insuranceToEdit.frequency);
      setStartDate(insuranceToEdit.startDate);
      setNextDueDate(insuranceToEdit.nextDueDate);
      setFamilyMember(insuranceToEdit.familyMember);
      setAutoDebitAccount(insuranceToEdit.autoDebitAccount || (accounts[0] ? formatAccountForDebit(accounts[0]) : ''));
      setNotes(insuranceToEdit.notes || '');
    } else {
      setPolicyName('');
      setPolicyNumber('');
      setType('Health');
      setInsurer('');
      setPremiumAmount('');
      setFrequency('Yearly');
      setStartDate(new Date().toISOString().split('T')[0]);
      setNextDueDate(new Date().toISOString().split('T')[0]);
      setFamilyMember(familyMembers[0] || 'Deepan');
      setAutoDebitAccount(accounts[0] ? formatAccountForDebit(accounts[0]) : '');
      setNotes('');
    }
  }, [insuranceToEdit, isOpen, familyMembers, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName.trim() || !insurer.trim()) return;

    onSave({
      policyName: policyName.trim(),
      policyNumber: policyNumber.trim() || 'N/A',
      type,
      insurer: insurer.trim(),
      premiumAmount: parseFloat(premiumAmount) || 0,
      frequency,
      startDate,
      nextDueDate,
      familyMember,
      autoDebitAccount: autoDebitAccount.trim() || undefined,
      notes: notes.trim() || undefined,
      syncedToSheets: false,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-extrabold text-slate-900 text-base">
            {insuranceToEdit ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Policy Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Optima Secure, Tech Term"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-[#C93B2B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Policy Number</label>
              <input
                type="text"
                placeholder="e.g. POL109248"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-[#C93B2B]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Insurer</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC Ergo, LIC"
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-[#C93B2B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Policy Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="Health">Health</option>
                <option value="Life">Life</option>
                <option value="Term">Term</option>
                <option value="Motor">Motor</option>
                <option value="Home">Home</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Premium Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Premium Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 1850"
                value={premiumAmount}
                onChange={(e) => setPremiumAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-[#C93B2B]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Insured Member</label>
              <select
                value={familyMember}
                onChange={(e) => setFamilyMember(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                {familyMembers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Auto-Debit / Payment Account</label>
            {accounts.length > 0 && (
              <select
                value={selectedAccountIsConfigured ? autoDebitAccount : '__custom__'}
                onChange={(event) => {
                  const value = event.target.value;
                  setAutoDebitAccount(value === '__custom__' ? '' : value);
                }}
                className="mb-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
              >
                {debitAccountOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
                <option value="__custom__">Enter another account manually</option>
              </select>
            )}
            {(!selectedAccountIsConfigured || accounts.length === 0) && (
              <input
                type="text"
                placeholder="e.g. HDFC Bank Salary A/c ...8401"
                value={autoDebitAccount}
                onChange={(event) => setAutoDebitAccount(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
              />
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Used for auto-debit payments, ledger expense recording, and upcoming due alerts.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Next Due Date</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Coverage details</label>
            <input
              type="text"
              placeholder="e.g. ₹25 Lakhs floater cover"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold rounded-xl shadow-md mt-2 transition active:scale-95 cursor-pointer"
          >
            {insuranceToEdit ? 'Save Policy Changes' : 'Record Policy'}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 7. CONTRIBUTE TO FIXED INVESTMENT MODAL (SSA, PPF, RD, FD)
// =========================================================================
interface ContributeFixedModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixedInvestment: FixedInvestment | null;
  accounts: Account[];
  onConfirm: (payload: {
    fixedInvestmentId: string;
    amount: number;
    accountId: string;
    date: string;
    paymentMode: Transaction['paymentMode'];
    notes?: string;
  }) => void;
}

export const ContributeFixedModal: React.FC<ContributeFixedModalProps> = ({
  isOpen,
  onClose,
  fixedInvestment,
  accounts,
  onConfirm,
}) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<Transaction['paymentMode']>('Net Banking');
  const [notes, setNotes] = useState('');
  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  const isNPS = fixedInvestment?.type === 'NPS';

  useEffect(() => {
    if (fixedInvestment && isOpen) {
      const defaultAmount = fixedInvestment.monthlyContribution > 0 ? String(fixedInvestment.monthlyContribution) : '';
      setAmount(defaultAmount);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('Net Banking');
      setNotes(`Monthly contribution to ${fixedInvestment.name} (${fixedInvestment.type})`);
      
      // Default to first savings account or account with highest balance
      const eligibleAccounts = accounts.filter((a) => a.type === 'Savings' || a.type === 'Current' || a.type === 'Wallet');
      const preferred = eligibleAccounts.length > 0 ? eligibleAccounts[0].id : (accounts[0]?.id || '');
      setAccountId(preferred);
    }
  }, [fixedInvestment, isOpen, accounts]);

  if (!isOpen || !fixedInvestment) return null;

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const numAmount = parseFloat(amount) || 0;
  const isInsufficient = selectedAccount && !isNPS && numAmount > selectedAccount.balance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;
    if (!isNPS && !accountId) return;

    onConfirm({
      fixedInvestmentId: fixedInvestment.id,
      amount: numAmount,
      accountId: isNPS ? (accountId || accounts[0]?.id || '') : accountId,
      date,
      paymentMode,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ArrowDownRight className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                {fixedInvestment.type} Deposit / Contribution
              </span>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                {fixedInvestment.name}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scheme Status Pill */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Balance</span>
            <span className="font-black text-slate-900 text-sm">
              ₹{fixedInvestment.currentBalance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Planned Monthly</span>
            <span className="font-bold text-emerald-700">
              ₹{fixedInvestment.monthlyContribution.toLocaleString('en-IN')}/mo
            </span>
          </div>
        </div>

        {isNPS ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Direct Corporate / Employer Contribution</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-snug">
              NPS contributions are deducted directly from company payroll. No personal bank account debit is required.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Contribution Amount (₹)</label>
            <input
              type="number"
              step="any"
              min="1"
              required
              autoFocus
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-black text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          {!isNPS && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Debit From Bank / Account</label>
              {accounts.length > 0 ? (
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="" disabled>Select account to debit</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName} • ₹{acc.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  No bank accounts configured. Please add a bank account first.
                </div>
              )}

              {selectedAccount && (
                <div className="mt-1 flex items-center justify-between text-[11px] px-1 font-semibold text-slate-500">
                  <span>Available Balance:</span>
                  <span className={isInsufficient ? 'text-rose-600 font-bold' : 'text-slate-800 font-bold'}>
                    ₹{selectedAccount.balance.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {isInsufficient && (
                <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>Contribution exceeds selected account balance. Account will reflect negative or overdraft balance.</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="Net Banking">Net Banking</option>
                <option value="UPI">UPI</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Narration</label>
            <input
              type="text"
              placeholder="e.g. PPF contribution for Oct 2026"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={numAmount <= 0 || (!isNPS && !accountId)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md mt-2 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            <span>
              {isNPS ? 'Record Corporate Contribution' : 'Debit Account & Record Contribution'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 8. PAY LOAN EMI / AUTO-DEBIT MODAL
// =========================================================================
interface PayLoanEmiModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  accounts: Account[];
  onConfirm: (payload: {
    loanId: string;
    amount: number;
    accountId: string;
    date: string;
    paymentMode: Transaction['paymentMode'];
    notes?: string;
  }) => void;
}

export const PayLoanEmiModal: React.FC<PayLoanEmiModalProps> = ({
  isOpen,
  onClose,
  loan,
  accounts,
  onConfirm,
}) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<Transaction['paymentMode']>('Net Banking');
  const [notes, setNotes] = useState('');
  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (loan && isOpen) {
      setAmount(String(loan.monthlyEmi || 0));
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('Net Banking');
      setNotes(`Loan EMI Repayment: ${loan.loanName} (${loan.bank})`);

      // Try matching loan.autoDebitAccount with one of the accounts
      const matched = accounts.find((a) => {
        const formatted = formatAccountForDebit(a);
        return (
          formatted === loan.autoDebitAccount ||
          loan.autoDebitAccount.toLowerCase().includes(a.name.toLowerCase()) ||
          loan.autoDebitAccount.toLowerCase().includes(a.bankName.toLowerCase())
        );
      });

      setAccountId(matched ? matched.id : (accounts[0]?.id || ''));
    }
  }, [loan, isOpen, accounts]);

  if (!isOpen || !loan) return null;

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || !accountId) return;

    onConfirm({
      loanId: loan.id,
      amount: numAmount,
      accountId,
      date,
      paymentMode,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <CreditCard className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">
                Loan EMI Payment
              </span>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                {loan.loanName}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding Balance</span>
            <span className="font-black text-rose-600 text-sm">
              ₹{loan.outstandingBalance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining Tenure</span>
            <span className="font-bold text-slate-800">
              {loan.remainingMonths} of {loan.tenureMonths} mos
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">EMI Repayment Amount (₹)</label>
            <input
              type="number"
              step="any"
              min="1"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-black text-slate-900 focus:ring-2 focus:ring-rose-600 focus:border-rose-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Debit From Bank / Account</label>
            {accounts.length > 0 ? (
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="" disabled>Select account to debit</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bankName} • ₹{acc.balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                No bank accounts configured.
              </div>
            )}

            {selectedAccount && (
              <div className="mt-1 flex items-center justify-between text-[11px] px-1 font-semibold text-slate-500">
                <span>Available Balance:</span>
                <span className="text-slate-800 font-bold">
                  ₹{selectedAccount.balance.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="Net Banking">Net Banking (Auto-Debit)</option>
                <option value="UPI">UPI</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Narration</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={numAmount <= 0 || !accountId}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md mt-2 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Debit Account & Record EMI Payment</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 9. PAY INSURANCE PREMIUM / AUTO-DEBIT MODAL
// =========================================================================
interface PayInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  insurance: Insurance | null;
  accounts: Account[];
  onConfirm: (payload: {
    insuranceId: string;
    amount: number;
    accountId: string;
    date: string;
    paymentMode: Transaction['paymentMode'];
    notes?: string;
    advanceDueDate?: boolean;
  }) => void;
}

export const PayInsuranceModal: React.FC<PayInsuranceModalProps> = ({
  isOpen,
  onClose,
  insurance,
  accounts,
  onConfirm,
}) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<Transaction['paymentMode']>('Net Banking');
  const [notes, setNotes] = useState('');
  const [advanceDueDate, setAdvanceDueDate] = useState(true);
  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (insurance && isOpen) {
      setAmount(String(insurance.premiumAmount || 0));
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('Net Banking');
      setAdvanceDueDate(true);
      setNotes(`Insurance Premium: ${insurance.policyName} (${insurance.insurer}) - #${insurance.policyNumber}`);

      // Try matching insurance.autoDebitAccount with accounts
      const matched = accounts.find((a) => {
        const formatted = formatAccountForDebit(a);
        return (
          formatted === insurance.autoDebitAccount ||
          (insurance.autoDebitAccount && insurance.autoDebitAccount.toLowerCase().includes(a.name.toLowerCase())) ||
          (insurance.autoDebitAccount && insurance.autoDebitAccount.toLowerCase().includes(a.bankName.toLowerCase()))
        );
      });

      setAccountId(matched ? matched.id : (accounts[0]?.id || ''));
    }
  }, [insurance, isOpen, accounts]);

  if (!isOpen || !insurance) return null;

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const numAmount = parseFloat(amount) || 0;

  // Calculate next prospective due date
  const computeNextDate = () => {
    const base = new Date(insurance.nextDueDate || date);
    if (insurance.frequency === 'Monthly') base.setMonth(base.getMonth() + 1);
    else if (insurance.frequency === 'Quarterly') base.setMonth(base.getMonth() + 3);
    else if (insurance.frequency === 'Half-Yearly') base.setMonth(base.getMonth() + 6);
    else base.setFullYear(base.getFullYear() + 1);
    return base.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || !accountId) return;

    onConfirm({
      insuranceId: insurance.id,
      amount: numAmount,
      accountId,
      date,
      paymentMode,
      notes: notes.trim() || undefined,
      advanceDueDate,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                Insurance Premium Payment
              </span>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                {insurance.policyName}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Insurer & Policy</span>
            <span className="font-bold text-slate-800">
              {insurance.insurer} ({insurance.type})
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Frequency</span>
            <span className="font-bold text-emerald-700">{insurance.frequency}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Premium Amount (₹)</label>
            <input
              type="number"
              step="any"
              min="1"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-black text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Debit From Bank / Account</label>
            {accounts.length > 0 ? (
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="" disabled>Select account to debit</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bankName} • ₹{acc.balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                No bank accounts configured.
              </div>
            )}

            {selectedAccount && (
              <div className="mt-1 flex items-center justify-between text-[11px] px-1 font-semibold text-slate-500">
                <span>Available Balance:</span>
                <span className="text-slate-800 font-bold">
                  ₹{selectedAccount.balance.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="Net Banking">Net Banking (Auto-Debit)</option>
                <option value="UPI">UPI</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-emerald-950 font-semibold">
              <input
                type="checkbox"
                checked={advanceDueDate}
                onChange={(e) => setAdvanceDueDate(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
              />
              <div>
                <span>Advance Next Due Date automatically</span>
                {advanceDueDate && (
                  <span className="block text-[11px] text-emerald-700 font-normal mt-0.5">
                    Next due date will become: <strong>{computeNextDate()}</strong> ({insurance.frequency})
                  </span>
                )}
              </div>
            </label>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Narration</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={numAmount <= 0 || !accountId}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md mt-2 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Debit Account & Record Premium Payment</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export { BalanceTransferModal, CashWithdrawalModal } from './AccountActionModals';

