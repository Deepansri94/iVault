import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Coins,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  PieChart,
} from 'lucide-react';
import type { Account, DematInvestment, FixedInvestment, GoldHolding, Loan } from '../../types/db.types';

interface NetWorthCarouselProps {
  accounts: Account[];
  fixedInvestments: FixedInvestment[];
  dematInvestments: DematInvestment[];
  goldHoldings: GoldHolding[];
  loans: Loan[];
  liveGold24kRate: number;
  onOpenAnalytics: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NetWorthCarousel: React.FC<NetWorthCarouselProps> = ({
  accounts,
  fixedInvestments,
  dematInvestments,
  goldHoldings,
  loans,
  liveGold24kRate,
  onOpenAnalytics,
  onNavigateTab,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Calculations
  const savingsAccounts = accounts.filter((account) => account.type === 'Savings');
  const savingsTotal = accounts.reduce((acc, account) => acc + (Number(account.balance) || 0), 0);
  const fixedTotal = fixedInvestments.reduce((acc, f) => acc + (Number(f?.currentBalance) || Number(f?.principalAmount) || 0), 0);
  const dematTotal = dematInvestments.reduce((acc, d) => acc + (Number(d?.currentValue) || Number(d?.investedAmount) || 0), 0);
  const goldRate = Number(liveGold24kRate) || 7250;
  const goldTotal = goldHoldings.reduce((acc, g) => acc + ((Number(g?.grams) || 0) * goldRate), 0);
  const totalAssets = savingsTotal + fixedTotal + dematTotal + goldTotal;
  const totalDebt = loans.reduce((acc, l) => acc + (Number(l?.outstandingBalance) || 0), 0);
  const netWorth = totalAssets - totalDebt;

  const primaryAccount = savingsAccounts[0];

  const formatCurrency = (amount: number) => {
    if (isBalanceHidden) return '₹ ••••••••';
    const num = Number(amount) || 0;
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  interface CardStat {
    label: string;
    value: number | string;
    color?: string;
    isText?: boolean;
  }

  interface CarouselCard {
    id: string;
    tag: string;
    title: string;
    mainAmount: number;
    cssGradient: string;
    fallbackBg: string;
    stats: CardStat[];
    badge: string;
    actionLabel: string;
    onAction: () => void;
  }

  const cards: CarouselCard[] = [
    {
      id: 'networth',
      tag: 'EXECUTIVE WEALTH OVERVIEW',
      title: 'Family Total Net Worth',
      mainAmount: netWorth,
      cssGradient: 'linear-gradient(135deg, #002D62 0%, #052F5F 45%, #C93B2B 100%)',
      fallbackBg: '#002D62',
      stats: [
        { label: 'Total Assets', value: totalAssets, color: 'text-emerald-300' },
        { label: 'Outstanding Liabilities', value: totalDebt, color: 'text-rose-300' },
      ],
      badge: 'Solvent • Tier-1 Wealth',
      actionLabel: 'Wealth Analytics',
      onAction: onOpenAnalytics,
    },
    {
      id: 'savings',
      tag: primaryAccount?.bankName || 'SAVINGS ACCOUNT',
      title: primaryAccount
        ? `${primaryAccount.name} • A/c ...${primaryAccount.accountNumber.slice(-4)}`
        : 'No savings account configured',
      mainAmount: primaryAccount?.balance || 0,
      cssGradient: 'var(--theme-primary-gradient, linear-gradient(135deg, #C93B2B 0%, #A52316 55%, #7B170E 100%))',
      fallbackBg: '#C93B2B',
      stats: [
        { label: 'UPI ID', value: primaryAccount?.upiId || 'Not configured', isText: true },
        { label: 'Status', value: primaryAccount ? 'Configured' : 'Add account details', isText: true, color: 'text-amber-300' },
      ],
      badge: 'Savings Account',
      actionLabel: 'Manage Accounts',
      onAction: () => onNavigateTab('accounts'),
    },
    {
      id: 'investments',
      tag: 'GROWTH PORTFOLIO',
      title: 'Equities, Fixed Income & Gold',
      mainAmount: fixedTotal + dematTotal + goldTotal,
      cssGradient: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #022c22 100%)',
      fallbackBg: '#047857',
      stats: [
        { label: 'Fixed (PPF/SSA/RD)', value: fixedTotal },
        { label: 'Gold (Hallmarked)', value: goldTotal, color: 'text-amber-300' },
      ],
      badge: '+14.2% Annual Return',
      actionLabel: 'Portfolio Breakdown',
      onAction: () => onNavigateTab('demat'),
    },
    {
      id: 'debt',
      tag: 'LIABILITY & REPAYMENT',
      title: 'Active Loans & Outstanding EMIs',
      mainAmount: totalDebt,
      cssGradient: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #0F172A 100%)',
      fallbackBg: '#1E293B',
      stats: [
        { label: 'Monthly EMI Outflow', value: loans.reduce((acc, l) => acc + l.monthlyEmi, 0), color: 'text-rose-300' },
        { label: 'Active Facilities', value: `${loans.length} Loans Active`, isText: true },
      ],
      badge: 'Good Repayment Health',
      actionLabel: 'EMI Schedules',
      onAction: () => onNavigateTab('loans'),
    },
  ];

  const currentCard = cards[activeCardIndex] || cards[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mt-3 relative z-10">
      {/* Card Header Container */}
      <div
        className="relative rounded-2xl p-5 text-white shadow-xl overflow-hidden transition-all duration-300 border border-white/20"
        style={{
          background: currentCard.cssGradient,
          backgroundColor: currentCard.fallbackBg,
        }}
      >
        {/* Background decorative watermark and blur rings */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none font-black text-6xl tracking-widest text-white select-none">
          iV
        </div>

        {/* Top Tag & Eye Visibility Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-wider font-extrabold uppercase text-amber-200">
              {currentCard.tag}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-[11px] font-semibold text-white/80">
              {currentCard.badge}
            </span>
          </div>

          <button
            onClick={() => setIsBalanceHidden(!isBalanceHidden)}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition border border-white/30 active:scale-95 shadow-xs cursor-pointer"
            title={isBalanceHidden ? 'Reveal balance' : 'Hide balance'}
          >
            {isBalanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Card Title & Amount */}
        <div className="mt-3.5">
          <p className="text-xs text-white/90 font-semibold tracking-wide drop-shadow-xs">
            {currentCard.title}
          </p>
          <div className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white flex items-center gap-2 drop-shadow-sm">
            <span>{formatCurrency(currentCard.mainAmount)}</span>
          </div>
        </div>

        {/* Sub-stats row with high contrast background container */}
        <div className="mt-4 p-3 rounded-xl bg-black/25 border border-white/15 backdrop-blur-xs grid grid-cols-2 gap-3 text-xs">
          {currentCard.stats.map((stat, idx) => (
            <div key={idx}>
              <span className="text-[10px] text-white/75 block uppercase font-bold tracking-wider">
                {stat.label}
              </span>
              <span className={`font-black text-sm block mt-0.5 ${stat.color || 'text-white'}`}>
                {stat.isText
                  ? stat.value
                  : formatCurrency(stat.value as number)}
              </span>
            </div>
          ))}
        </div>

        {/* Action bar inside card */}
        <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/20">
          <div className="flex items-center gap-1.5">
            {cards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCardIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  activeCardIndex === idx ? 'w-6 bg-amber-300 shadow' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={currentCard.onAction}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition group bg-white/15 hover:bg-white/25 px-3 py-1 rounded-lg border border-amber-300/30 shadow-xs"
          >
            <span>{currentCard.actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Carousel navigation buttons */}
      <div className="flex justify-between items-center px-1 mt-2">
        <button
          onClick={() => setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1))}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs transition"
        >
          ‹ Previous Card
        </button>
        <span className="text-xs text-slate-500 font-bold">
          {activeCardIndex + 1} of {cards.length}
        </span>
        <button
          onClick={() => setActiveCardIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0))}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs transition"
        >
          Next Card ›
        </button>
      </div>
    </div>
  );
};
