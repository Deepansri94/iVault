/**
 * @file PayWithUpiModal.tsx
 * Google Pay & Universal UPI Instant Payment Engine
 *
 * Initiates real UPI deep-link intents (tez://upi/pay and upi://pay) for mobile devices,
 * generates dynamic scannable UPI QR codes for desktop/cross-device payments,
 * automatically deducts the selected account balance upon payment confirmation,
 * and records a classified expense entry in the ledger with audit notes.
 */

import React, { useState, useEffect, useId } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building,
  Wallet,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import type { Account, Transaction } from '../../types/db.types';

export interface PayWithUpiPayload {
  accountId: string;
  amount: number;
  payeeVpa: string;
  payeeName: string;
  category: string;
  notes?: string;
  date: string;
  familyMember: string;
}

interface PayWithUpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: string[];
  familyMembers: string[];
  activeMember: string;
  defaultAccountId?: string;
  onConfirmPayment: (payload: PayWithUpiPayload) => Promise<void> | void;
}

interface RecentPayee {
  vpa: string;
  name: string;
  category?: string;
}

const POPULAR_PAYEES: RecentPayee[] = [
  { name: 'Swiggy', vpa: 'swiggy@icici', category: 'Food & Dining' },
  { name: 'Zomato', vpa: 'zomato@hdfcbank', category: 'Food & Dining' },
  { name: 'Blinkit', vpa: 'blinkit@icici', category: 'Groceries & Provisions' },
  { name: 'Amazon Pay', vpa: 'amazonpay@apl', category: 'Shopping & E-Commerce' },
  { name: 'Electricity Bill', vpa: 'tneb@billdesk', category: 'Utilities & Bills' },
];

export const PayWithUpiModal: React.FC<PayWithUpiModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  familyMembers,
  activeMember,
  defaultAccountId,
  onConfirmPayment,
}) => {
  const payeeVpaId = useId();
  const payeeNameId = useId();
  const amountId = useId();
  const accountIdId = useId();
  const categoryId = useId();
  const notesId = useId();
  const memberId = useId();

  // Form states
  const [payeeVpa, setPayeeVpa] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [category, setCategory] = useState('Groceries & Provisions');
  const [notes, setNotes] = useState('');
  const [member, setMember] = useState(activeMember || 'Deepan');

  // Flow step: 'form' | 'intent' | 'success'
  const [step, setStep] = useState<'form' | 'intent' | 'success'>('form');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentPayees, setRecentPayees] = useState<RecentPayee[]>([]);

  // Load recent payees from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ivault_recent_upi_payees');
      if (stored) {
        setRecentPayees(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Initialize defaults on open
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErrorMessage(null);
      setIsSubmitting(false);
      setCopiedVpa(false);

      // Select default account: prefer provided default or first savings account with balance > 0
      if (defaultAccountId && accounts.some((a) => a.id === defaultAccountId)) {
        setSelectedAccountId(defaultAccountId);
      } else {
        const savings = accounts.find((a) => a.type === 'Savings' && a.balance > 0) || accounts[0];
        if (savings) setSelectedAccountId(savings.id);
      }

      if (activeMember) {
        setMember(activeMember);
      }

      if (categories.length > 0 && !categories.includes(category)) {
        setCategory(categories[0]);
      }
    }
  }, [isOpen, defaultAccountId, accounts, activeMember, categories]);

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const numAmount = parseFloat(amount) || 0;
  const isBalanceLow = selectedAccount ? selectedAccount.balance < numAmount : false;

  // Build standard UPI URL
  const buildUpiUri = (isTezProtocol = false): string => {
    const vpa = payeeVpa.trim();
    const name = (payeeName.trim() || 'Merchant').replace(/\s+/g, ' ');
    const noteText = (notes.trim() || 'iVault Payment').substring(0, 50);
    const amtStr = numAmount.toFixed(2);
    const txnRef = `IV${Date.now().toString().slice(-8)}`;

    const params = new URLSearchParams({
      pa: vpa,
      pn: name,
      am: amtStr,
      cu: 'INR',
      tn: noteText,
      tr: txnRef,
    });

    const protocol = isTezProtocol ? 'tez://upi/pay?' : 'upi://pay?';
    return `${protocol}${params.toString()}`;
  };

  const handleSelectRecent = (payee: RecentPayee) => {
    setPayeeVpa(payee.vpa);
    setPayeeName(payee.name);
    if (payee.category && categories.includes(payee.category)) {
      setCategory(payee.category);
    }
  };

  // Launch Google Pay and display scannable QR
  const handleProceedToPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanVpa = payeeVpa.trim();
    if (!cleanVpa || !cleanVpa.includes('@')) {
      setErrorMessage('Please enter a valid UPI ID (e.g. merchant@okaxis, shop@okhdfcbank)');
      return;
    }

    if (numAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than ₹0');
      return;
    }

    if (!selectedAccount) {
      setErrorMessage('Please select a bank account to debit from');
      return;
    }

    const upiUri = buildUpiUri(false);
    const tezUri = buildUpiUri(true);

    try {
      // Generate scannable QR Code
      const qrUrl = await QRCode.toDataURL(upiUri, {
        width: 280,
        margin: 2,
        color: {
          dark: '#002D62',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(qrUrl);
    } catch (err) {
      console.warn('QR Code generation fallback:', err);
    }

    // Save payee to recent payees in localStorage
    try {
      const updated = [
        { vpa: cleanVpa, name: payeeName.trim() || cleanVpa.split('@')[0], category },
        ...recentPayees.filter((p) => p.vpa.toLowerCase() !== cleanVpa.toLowerCase()),
      ].slice(0, 8);
      setRecentPayees(updated);
      localStorage.setItem('ivault_recent_upi_payees', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }

    setStep('intent');

    // On mobile devices, attempt to launch Google Pay directly
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // Try Google Pay Tez intent first, fallback to standard UPI
      try {
        window.location.href = tezUri;
      } catch {
        window.location.href = upiUri;
      }
    }
  };

  // Confirm payment success, deduct account and record ledger
  const handleConfirmSuccess = async () => {
    if (!selectedAccount || numAmount <= 0) return;
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await onConfirmPayment({
        accountId: selectedAccount.id,
        amount: numAmount,
        payeeVpa: payeeVpa.trim(),
        payeeName: payeeName.trim() || payeeVpa.trim().split('@')[0],
        category,
        notes: notes.trim() || undefined,
        date: today,
        familyMember: member,
      });

      setStep('success');
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record payment');
      setIsSubmitting(false);
    }
  };

  const handleCopyVpa = () => {
    if (payeeVpa) {
      navigator.clipboard.writeText(payeeVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    }
  };

  const handleLaunchGooglePay = () => {
    const tezUri = buildUpiUri(true);
    const upiUri = buildUpiUri(false);
    try {
      window.location.href = tezUri;
    } catch {
      window.location.href = upiUri;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header with Google Pay & UPI branding */}
        <div
          className="px-5 py-4 text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #002D62 0%, #0B4884 50%, #C93B2B 100%)',
          }}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md p-1.5 shrink-0">
                {/* Google Pay custom G mark */}
                <div className="flex items-center justify-center font-black text-sm">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">P</span>
                  <span className="text-[#FBBC05]">a</span>
                  <span className="text-[#34A853]">y</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white tracking-tight">Pay with UPI</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950 uppercase tracking-wider">
                    Instant Debit
                  </span>
                </div>
                <p className="text-xs text-blue-100 font-medium">Google Pay • Direct Bank Transfer</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP 1: FILL PAYMENT FORM */}
        {step === 'form' && (
          <form onSubmit={handleProceedToPay} className="p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Payee Suggestions */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Popular &amp; Recent Payees
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[...recentPayees, ...POPULAR_PAYEES.filter((p) => !recentPayees.some((r) => r.vpa === p.vpa))]
                  .slice(0, 6)
                  .map((payee) => (
                    <button
                      type="button"
                      key={payee.vpa}
                      onClick={() => handleSelectRecent(payee)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                        payeeVpa === payee.vpa
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {payee.name}
                    </button>
                  ))}
              </div>
            </div>

            {/* Payee VPA and Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={payeeVpaId} className="text-xs font-bold text-slate-700 block mb-1">
                  Payee UPI ID (VPA) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id={payeeVpaId}
                    type="text"
                    required
                    placeholder="e.g. merchant@okaxis"
                    value={payeeVpa}
                    onChange={(e) => setPayeeVpa(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={payeeNameId} className="text-xs font-bold text-slate-700 block mb-1">
                  Payee / Merchant Name
                </label>
                <input
                  id={payeeNameId}
                  type="text"
                  placeholder="e.g. Swiggy, Ramesh Store"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Amount and Quick Amount Chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={amountId} className="text-xs font-bold text-slate-700">
                  Amount to Pay (₹) <span className="text-rose-500">*</span>
                </label>
                {selectedAccount && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    Available:{' '}
                    <strong className={isBalanceLow ? 'text-rose-600 font-black' : 'text-emerald-700'}>
                      ₹{selectedAccount.balance.toLocaleString('en-IN')}
                    </strong>
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">
                  ₹
                </span>
                <input
                  id={amountId}
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-base font-extrabold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-1.5 mt-2">
                {[100, 250, 500, 1000, 2000].map((quickAmt) => (
                  <button
                    type="button"
                    key={quickAmt}
                    onClick={() => setAmount(String(quickAmt))}
                    className="flex-1 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    +₹{quickAmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Account to Debit From */}
            <div>
              <label htmlFor={accountIdId} className="text-xs font-bold text-slate-700 block mb-1">
                Debit From Account <span className="text-rose-500">*</span>
              </label>
              <select
                id={accountIdId}
                required
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                {accounts.length === 0 ? (
                  <option value="">No bank accounts available</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName}) • ₹{acc.balance.toLocaleString('en-IN')}
                    </option>
                  ))
                )}
              </select>
              {isBalanceLow && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Amount exceeds selected account balance!
                </p>
              )}
            </div>

            {/* Category and Family Member */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={categoryId} className="text-xs font-bold text-slate-700 block mb-1">
                  Ledger Category
                </label>
                <select
                  id={categoryId}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={memberId} className="text-xs font-bold text-slate-700 block mb-1">
                  Family Member
                </label>
                <select
                  id={memberId}
                  value={member}
                  onChange={(e) => setMember(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {familyMembers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transaction Note */}
            <div>
              <label htmlFor={notesId} className="text-xs font-bold text-slate-700 block mb-1">
                Transaction Note / Purpose
              </label>
              <input
                id={notesId}
                type="text"
                placeholder="e.g. Dinner, Medicines, Vegetables"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #002D62 0%, #0B4884 60%, #C93B2B 100%)',
                }}
              >
                <span>Pay via Google Pay</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: AWAITING PAYMENT / QR CODE & CONFIRMATION */}
        {step === 'intent' && (
          <div className="p-5 space-y-4 text-center">
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-left">
              <div>
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                  Paying To
                </span>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {payeeName || payeeVpa}
                </h4>
                <p className="text-xs text-slate-500 font-mono">{payeeVpa}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Amount
                </span>
                <span className="font-black text-lg text-emerald-700">
                  ₹{numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Dynamic UPI QR Code */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 inline-block shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Google Pay UPI QR Code"
                  className="w-56 h-56 mx-auto rounded-xl object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              )}
              <div className="mt-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-700">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Scan with Google Pay App</span>
              </div>
            </div>

            {/* Mobile 1-Tap Trigger Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleLaunchGooglePay}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open Google Pay App</span>
              </button>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedVpa ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedVpa ? 'VPA Copied' : 'Copy UPI ID'}</span>
              </button>
            </div>

            {/* Debit Confirmation Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 text-left flex items-start gap-2.5">
              <Wallet className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Account will be debited upon confirmation:</p>
                <p className="text-[11px] text-amber-800">
                  <strong>₹{numAmount.toLocaleString('en-IN')}</strong> will reduce from{' '}
                  <strong>{selectedAccount?.name}</strong> and be recorded in the Cash Ledger.
                </p>
              </div>
            </div>

            {/* Confirmation Action Row */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Back / Edit
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSuccess}
                className="flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Confirm Payment Completed</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS ANIMATION */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md scale-110 transition-transform">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-base">Payment Successful!</h4>
              <p className="text-xs text-slate-500 mt-1">
                ₹{numAmount.toLocaleString('en-IN')} paid to {payeeName || payeeVpa}.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
              Debited from <strong>{selectedAccount?.name}</strong> • Ledger updated &amp; queued for cloud sync.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
