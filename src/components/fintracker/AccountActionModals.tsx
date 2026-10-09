/**
 * @file AccountActionModals.tsx
 * Cash Withdrawal & Balance Transfer Action Modals
 *
 * Provides dedicated interfaces for:
 * 1. Balance Transfer between bank, savings, and credit accounts
 * 2. Cash Withdrawal from bank accounts into physical cash wallets or direct cash expenditure
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeftRight,
  Banknote,
  Building,
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import type { Account, FamilyMember, BalanceTransferPayload, CashWithdrawalPayload } from '../../types/db.types';
import { useFormFocus } from '../../hooks/useFormFocus';

// =========================================================================
// 1. BALANCE TRANSFER MODAL
// =========================================================================

interface BalanceTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  familyMembers: FamilyMember[];
  activeMember: string;
  initialFromAccountId?: string;
  onTransfer: (payload: BalanceTransferPayload) => void;
}

export const BalanceTransferModal: React.FC<BalanceTransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  familyMembers,
  activeMember,
  initialFromAccountId,
  onTransfer,
}) => {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferMode, setTransferMode] = useState<BalanceTransferPayload['transferMode']>('Net Banking');
  const [familyMember, setFamilyMember] = useState(activeMember);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  // Initialize source and destination accounts
  useEffect(() => {
    if (isOpen) {
      setError('');
      setAmount('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setFamilyMember(activeMember);

      // Default fromAccount
      const validFrom = initialFromAccountId
        ? accounts.find((a) => a.id === initialFromAccountId)
        : accounts.find((a) => a.balance > 0) || accounts[0];

      const fromId = validFrom ? validFrom.id : (accounts[0]?.id || '');
      setFromAccountId(fromId);

      // Default toAccount (different from fromAccount)
      const validTo = accounts.find((a) => a.id !== fromId);
      setToAccountId(validTo ? validTo.id : '');
    }
  }, [isOpen, accounts, initialFromAccountId, activeMember]);

  if (!isOpen) return null;

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const parsedAmount = parseFloat(amount) || 0;
  const isInsufficient = fromAccount ? parsedAmount > fromAccount.balance : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromAccountId || !toAccountId) {
      setError('Please select both source and destination accounts.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Source and destination accounts must be different.');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Please enter a valid transfer amount greater than 0.');
      return;
    }

    if (fromAccount && parsedAmount > fromAccount.balance) {
      setError(`Insufficient balance in ${fromAccount.name}. Available balance is ₹${fromAccount.balance.toLocaleString('en-IN')}.`);
      return;
    }

    onTransfer({
      fromAccountId,
      toAccountId,
      amount: parsedAmount,
      date,
      transferMode,
      notes: notes.trim(),
      familyMember,
    });

    onClose();
  };

  const setQuickAmount = (val: number) => {
    setAmount(String(val));
    setError('');
  };

  const handleSetMax = () => {
    if (fromAccount && fromAccount.balance > 0) {
      setAmount(String(Math.floor(fromAccount.balance)));
      setError('');
    }
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
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl space-y-4 focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-600">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Transfer Balance Between Accounts</h3>
              <p className="text-xs text-slate-500">Atomic inter-account fund transfer with audit ledger logging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-xl cursor-pointer"
            aria-label="Close transfer modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Account Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* From Account */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>From Account (Source)</span>
                {fromAccount && (
                  <span className={`text-[10px] font-bold ${fromAccount.balance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    ₹{fromAccount.balance.toLocaleString('en-IN')}
                  </span>
                )}
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => {
                  setFromAccountId(e.target.value);
                  if (e.target.value === toAccountId) {
                    const alt = accounts.find((a) => a.id !== e.target.value);
                    if (alt) setToAccountId(alt.id);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bankName} • ₹{acc.balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* To Account */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>To Account (Destination)</span>
                {toAccount && (
                  <span className={`text-[10px] font-bold ${toAccount.balance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    ₹{toAccount.balance.toLocaleString('en-IN')}
                  </span>
                )}
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              >
                {accounts
                  .filter((acc) => acc.id !== fromAccountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName} • ₹{acc.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Amount Input & Quick Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">Transfer Amount (₹)</label>
              {fromAccount && (
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Use Max Available (₹{Math.max(0, fromAccount.balance).toLocaleString('en-IN')})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-base font-black focus:ring-2 focus:ring-indigo-500 transition ${
                  isInsufficient ? 'border-rose-400 bg-rose-50/30 text-rose-700' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {[500, 1000, 2000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuickAmount(val)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  +₹{val.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {isInsufficient && fromAccount && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Amount exceeds available balance of ₹{fromAccount.balance.toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Transfer Details: Mode & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Transfer Mode</label>
              <select
                value={transferMode}
                onChange={(e) => setTransferMode(e.target.value as BalanceTransferPayload['transferMode'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="Net Banking">Net Banking</option>
                <option value="UPI">UPI Transfer</option>
                <option value="IMPS / NEFT">IMPS / NEFT</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Internal Transfer">Internal Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Transfer Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
          </div>

          {/* Family Member & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Initiated By (Member)</label>
              <select
                value={familyMember}
                onChange={(e) => setFamilyMember(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.relationship})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Transfer Note / Reason</label>
              <input
                type="text"
                placeholder="e.g. Savings fund, Credit Card payment, Rent"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          {/* Visual Transfer Pathway Card */}
          {fromAccount && toAccount && parsedAmount > 0 && !isInsufficient && (
            <div className="p-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-indigo-100 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                Transfer Summary Preview
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-semibold">Debited from {fromAccount.name}</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-bold text-slate-700 line-through">
                      ₹{fromAccount.balance.toLocaleString('en-IN')}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 inline" />
                    <span className="text-sm font-black text-rose-600">
                      ₹{(fromAccount.balance - parsedAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-600 font-bold block mt-0.5">-₹{parsedAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-semibold">Credited to {toAccount.name}</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-bold text-slate-700 line-through">
                      ₹{toAccount.balance.toLocaleString('en-IN')}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 inline" />
                    <span className="text-sm font-black text-emerald-700">
                      ₹{(toAccount.balance + parsedAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">+₹{parsedAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInsufficient || parsedAmount <= 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Confirm & Transfer {parsedAmount > 0 ? `₹${parsedAmount.toLocaleString('en-IN')}` : ''}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 2. CASH WITHDRAWAL MODAL
// =========================================================================

interface CashWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  familyMembers: FamilyMember[];
  activeMember: string;
  initialFromAccountId?: string;
  onWithdrawal: (payload: CashWithdrawalPayload) => void;
}

export const CashWithdrawalModal: React.FC<CashWithdrawalModalProps> = ({
  isOpen,
  onClose,
  accounts,
  familyMembers,
  activeMember,
  initialFromAccountId,
  onWithdrawal,
}) => {
  const [fromAccountId, setFromAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [withdrawalMethod, setWithdrawalMethod] = useState<CashWithdrawalPayload['withdrawalMethod']>('ATM Withdrawal (Debit Card)');
  const [destinationMode, setDestinationMode] = useState<CashWithdrawalPayload['destinationMode']>('wallet');
  const [targetWalletId, setTargetWalletId] = useState('');
  const [familyMember, setFamilyMember] = useState(activeMember);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  // Filter bank/savings/current accounts that can provide cash
  const bankAccounts = accounts.filter((a) => a.type === 'Savings' || a.type === 'Current');
  const walletAccounts = accounts.filter((a) => a.type === 'Wallet');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setAmount('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setFamilyMember(activeMember);
      setDestinationMode('wallet');

      // Select valid source bank account
      const validFrom = initialFromAccountId
        ? accounts.find((a) => a.id === initialFromAccountId)
        : bankAccounts.find((a) => a.balance > 0) || bankAccounts[0] || accounts[0];

      setFromAccountId(validFrom ? validFrom.id : (accounts[0]?.id || ''));

      // Select target wallet account if exists
      const defaultWallet = walletAccounts[0];
      setTargetWalletId(defaultWallet ? defaultWallet.id : '');
    }
  }, [isOpen, accounts, initialFromAccountId, activeMember]);

  if (!isOpen) return null;

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const targetWallet = accounts.find((a) => a.id === targetWalletId);
  const parsedAmount = parseFloat(amount) || 0;
  const isInsufficient = fromAccount ? parsedAmount > fromAccount.balance : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromAccountId) {
      setError('Please select a source bank account.');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Please enter a valid withdrawal amount greater than 0.');
      return;
    }

    if (fromAccount && parsedAmount > fromAccount.balance) {
      setError(`Insufficient balance in ${fromAccount.name}. Available balance is ₹${fromAccount.balance.toLocaleString('en-IN')}.`);
      return;
    }

    onWithdrawal({
      fromAccountId,
      amount: parsedAmount,
      date,
      withdrawalMethod,
      destinationMode,
      targetWalletId: destinationMode === 'wallet' ? (targetWalletId || undefined) : undefined,
      notes: notes.trim(),
      familyMember,
    });

    onClose();
  };

  const setQuickAmount = (val: number) => {
    setAmount(String(val));
    setError('');
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
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl space-y-4 focus:outline-none"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Record Cash Withdrawal</h3>
              <p className="text-xs text-slate-500">ATM or Branch withdrawal debited from bank into cash wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-xl cursor-pointer"
            aria-label="Close withdrawal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Source Account */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Withdraw From (Source Bank Account)</span>
              {fromAccount && (
                <span className={`text-[10px] font-bold ${fromAccount.balance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  Available: ₹{fromAccount.balance.toLocaleString('en-IN')}
                </span>
              )}
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
              required
            >
              {(bankAccounts.length > 0 ? bankAccounts : accounts).map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName} • ₹{acc.balance.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input & Quick Denominations */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Withdrawal Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">₹</span>
              <input
                type="number"
                step="100"
                min="100"
                required
                autoFocus
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-base font-black focus:ring-2 focus:ring-amber-500 transition ${
                  isInsufficient ? 'border-rose-400 bg-rose-50/30 text-rose-700' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
            </div>

            {/* Quick Denomination Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {[500, 1000, 2000, 5000, 10000, 20000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuickAmount(val)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  ₹{val.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {isInsufficient && fromAccount && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Withdrawal amount exceeds available bank balance of ₹{fromAccount.balance.toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Destination Cash Mode: Wallet vs Direct Expense */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <label className="font-bold text-slate-800 block">Cash Handling Destination</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  destinationMode === 'wallet'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="destinationMode"
                  value="wallet"
                  checked={destinationMode === 'wallet'}
                  onChange={() => setDestinationMode('wallet')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900">Credit to Cash Wallet</span>
                  <span className="block text-[10px] text-slate-500 leading-tight">
                    Maintains physical &quot;Cash in Hand&quot; balance in ledger for offline expenses
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  destinationMode === 'direct_expense'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="destinationMode"
                  value="direct_expense"
                  checked={destinationMode === 'direct_expense'}
                  onChange={() => setDestinationMode('direct_expense')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900">Direct Cash Out</span>
                  <span className="block text-[10px] text-slate-500 leading-tight">
                    Records immediate cash withdrawal expense without keeping a cash wallet
                  </span>
                </div>
              </label>
            </div>

            {/* Target wallet selection if wallet mode */}
            {destinationMode === 'wallet' && walletAccounts.length > 1 && (
              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Cash Wallet</label>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-semibold bg-white"
                >
                  {walletAccounts.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Current: ₹{w.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Withdrawal Method</label>
              <select
                value={withdrawalMethod}
                onChange={(e) => setWithdrawalMethod(e.target.value as CashWithdrawalPayload['withdrawalMethod'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="ATM Withdrawal (Debit Card)">ATM Withdrawal (Debit Card)</option>
                <option value="Bank Branch / Cheque">Bank Branch (Self Cheque)</option>
                <option value="UPI Cash / Micro ATM">UPI Cash / Micro ATM</option>
              </select>
            </div>

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
          </div>

          {/* Member & ATM Location/Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Withdrawn By (Member)</label>
              <select
                value={familyMember}
                onChange={(e) => setFamilyMember(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.relationship})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">ATM Location / Notes</label>
              <input
                type="text"
                placeholder="e.g. HDFC ATM Anna Nagar West"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          {/* Visual Route Preview */}
          {fromAccount && parsedAmount > 0 && !isInsufficient && (
            <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Cash Flow Summary
              </span>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 font-semibold">Bank Account Debit:</span>
                <span className="text-rose-600 font-bold">-₹{parsedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">
                  {destinationMode === 'wallet' ? 'Credited to Cash in Hand Wallet:' : 'Offline Cash in Hand Available:'}
                </span>
                <span className="text-emerald-700 font-bold">+₹{parsedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-200/60 font-semibold text-slate-500">
                <span>Remaining Bank Balance:</span>
                <span className="font-bold text-slate-800">₹{(fromAccount.balance - parsedAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInsufficient || parsedAmount <= 0}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Banknote className="w-4 h-4" />
              <span>Confirm Withdrawal {parsedAmount > 0 ? `₹${parsedAmount.toLocaleString('en-IN')}` : ''}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
