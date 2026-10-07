import React, { useState, useEffect } from 'react';
import { X, Building, CreditCard, Coins, TrendingUp, PieChart } from 'lucide-react';
import type { Account, Budget, FixedInvestment, DematInvestment, GoldHolding, Loan } from '../../types/db.types';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-extrabold text-slate-900">
            {accountToEdit ? 'Edit Account Details' : 'Add Account'}
          </h3>
          <button onClick={onClose} className="font-bold text-slate-400 hover:text-slate-700" aria-label="Close account form">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <label className="font-bold text-slate-700">
              Account Name
              <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Salary Account" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold" />
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
  const [bank, setBank] = useState('Prime Bank');
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
      setBank('Prime Bank');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {loanToEdit ? 'Edit Loan & EMI Details' : 'Set Up New Loan / Liability'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Loan / Liability Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Home Loan (Emerald Towers), EV Car Loan"
              value={loanName}
              onChange={(e) => setLoanName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bank / Lender</label>
              <input
                type="text"
                required
                placeholder="e.g. Prime Bank, HDFC, SBI"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {dematToEdit ? 'Edit Stock / Mutual Fund' : 'Add Investment to Demat Portfolio'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Asset Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Parag Parikh Flexi Cap, Bluechip Equity Ltd, Nifty 50 ETF"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Ticker / Symbol</label>
              <input
                type="text"
                placeholder="e.g. PPFAS-DIR, BLUECHIP.NS"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
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
  const [institution, setInstitution] = useState('Prime Bank');
  const [principalAmount, setPrincipalAmount] = useState('150000');
  const [currentBalance, setCurrentBalance] = useState('210000');
  const [interestRate, setInterestRate] = useState('7.1');
  const [monthlyContribution, setMonthlyContribution] = useState('12500');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [maturityDate, setMaturityDate] = useState('2035-04-10');
  const [familyMember, setFamilyMember] = useState(activeMember);
  const [notes, setNotes] = useState('');

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
      setInstitution('Prime Bank');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {fixedToEdit ? 'Edit Fixed Investment Scheme' : 'Add Sovereign / Fixed Income Scheme'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Scheme Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Public Provident Fund (PPF), Sukanya Samriddhi (SSA), Bank RD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
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
                placeholder="e.g. Prime Bank, India Post, SBI"
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
}

export const AddEditBudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  budgetToEdit,
}) => {
  const [category, setCategory] = useState('Groceries & Household');
  const [allocatedAmount, setAllocatedAmount] = useState('15000');
  const [period, setPeriod] = useState<'Monthly' | 'Annual'>('Monthly');
  const [warningThresholdPct, setWarningThresholdPct] = useState('80');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#C93B2B]" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {budgetToEdit ? 'Edit Budget Limit' : 'Create Category Budget'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Expense Category</label>
            <input
              type="text"
              required
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
