/**
 * @file EcosystemHeader.tsx
 * Ecosystem App Bar with brand switcher, app launcher grid, active member selector,
 * and quick notification trigger.
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  FileText,
  Pill,
  KeyRound,
  LayoutGrid,
  Home,
  Sliders,
  Bell,
  ChevronDown,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useRouter, type EcosystemAppId } from '../../router/Router';
import { PWAInstallButton } from '../common/PWAInstallButton';
import type { AppNotification } from '../../types/db.types';

interface EcosystemHeaderProps {
  appName: string;
  appSubtitle: string;
  appId: EcosystemAppId;
  activeMember?: string;
  onSelectMember?: (name: string) => void;
  familyMembers?: { name: string; avatarColor?: string }[];
  notifications?: AppNotification[];
  onOpenNotifications?: () => void;
  rightActions?: React.ReactNode;
}

export const ECOSYSTEM_APPS = [
  {
    id: 'fintracker' as EcosystemAppId,
    name: 'FinTracker',
    tagline: 'Personal Finance & Portfolios',
    description: 'Accounts, Ledger, SIPs, Demat, Gold, Loans & Budgets',
    path: '/fintracker',
    icon: TrendingUp,
    badgeColor: 'bg-emerald-500',
    headerTheme: {
      from: '#065F46',
      via: '#047857',
      to: '#0f172a',
      accent: 'text-emerald-300',
    },
  },
  {
    id: 'familydocs' as EcosystemAppId,
    name: 'FamilyDocs',
    tagline: 'Secure Document Vault',
    description: 'Identity cards, vehicle papers, medical records & redaction',
    path: '/familyDocs',
    icon: FileText,
    badgeColor: 'bg-blue-500',
    headerTheme: {
      from: '#1E3A8A',
      via: '#1D4ED8',
      to: '#0f172a',
      accent: 'text-blue-300',
    },
  },
  {
    id: 'healthmeds' as EcosystemAppId,
    name: 'HealthMeds',
    tagline: 'Medication & Health Care',
    description: 'Daily doses, prescriptions, refill alerts & adherence',
    path: '/healthMeds',
    icon: Pill,
    badgeColor: 'bg-teal-500',
    headerTheme: {
      from: '#0f766e',
      via: '#0d9488',
      to: '#0f172a',
      accent: 'text-teal-300',
    },
  },
  {
    id: 'passvault' as EcosystemAppId,
    name: 'PassVault',
    tagline: 'AES-GCM Secure Credentials',
    description: 'Encrypted logins, master PIN, security audit & generator',
    path: '/passVault',
    icon: KeyRound,
    badgeColor: 'bg-violet-600',
    headerTheme: {
      from: '#4C1D95',
      via: '#5B21B6',
      to: '#0f172a',
      accent: 'text-amber-300',
    },
  },
];

export const EcosystemHeader: React.FC<EcosystemHeaderProps> = ({
  appName,
  appSubtitle,
  appId,
  activeMember,
  onSelectMember,
  familyMembers = [],
  notifications = [],
  onOpenNotifications,
  rightActions,
}) => {
  const { navigate } = useRouter();
  const [showLauncher, setShowLauncher] = useState(false);
  const [showMemberSelect, setShowMemberSelect] = useState(false);

  const currentAppMeta = ECOSYSTEM_APPS.find((a) => a.id === appId);
  const theme = currentAppMeta?.headerTheme || {
    from: '#C93B2B',
    via: '#A52316',
    to: '#002D62',
    accent: 'text-amber-300',
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header
        className="relative text-white pt-3 pb-3 px-3 sm:px-4 shadow-lg transition-all z-30"
        style={{
          background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.via} 60%, ${theme.to} 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: App Identity & Ecosystem Launcher Switcher */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Ecosystem App Switcher Button (9 dots) */}
            <button
              onClick={() => setShowLauncher(!showLauncher)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition flex items-center justify-center border border-white/20 cursor-pointer shadow-xs shrink-0"
              title="Open Ecosystem App Switcher"
              aria-label="Switch Application"
            >
              <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            {/* Brand Logo & Current App Badge */}
            <div
              onClick={() => {
                if (currentAppMeta) {
                  navigate(currentAppMeta.path);
                } else {
                  navigate('/');
                }
              }}
              className="min-w-0 cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold tracking-tight text-white text-sm sm:text-base leading-tight shrink-0">
                  iVault <span className="text-amber-300 font-black">PRO</span>
                </span>
                <span className="text-white/40 hidden xs:inline">•</span>
                <span className="font-black text-white text-sm sm:text-base leading-tight truncate">
                  {appName}
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-medium tracking-wide truncate">
                {appSubtitle}
              </p>
            </div>
          </div>

          {/* Right: Actions, Member Switcher, Notifications, PWA */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {rightActions}

            {/* PWA Install */}
            <PWAInstallButton />

            {/* Notification Bell */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition active:scale-95 border border-white/20 cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[9px] flex items-center justify-center px-1 shadow animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Family Member Switcher (if applicable) */}
            {activeMember && onSelectMember && familyMembers.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMemberSelect(!showMemberSelect)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white pl-2 pr-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-sm transition border border-white/25 cursor-pointer"
                  title="Switch Active Family Member"
                >
                  <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                    {activeMember[0]?.toUpperCase() || 'M'}
                  </div>
                  <span className="max-w-[70px] sm:max-w-[110px] truncate">{activeMember}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/70 shrink-0" />
                </button>

                {showMemberSelect && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMemberSelect(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl py-1 z-50 text-slate-800 border border-slate-200 animate-fadeIn">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Active Family Profile
                      </div>
                      {familyMembers.map((m) => (
                        <button
                          key={m.name}
                          onClick={() => {
                            onSelectMember(m.name);
                            setShowMemberSelect(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                            activeMember === m.name ? 'font-black text-indigo-700 bg-indigo-50/70' : 'font-medium'
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          {activeMember === m.name && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Ecosystem App Switcher Modal / Drawer */}
      {showLauncher && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setShowLauncher(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 z-10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">iVault Ecosystem Apps</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Direct access to all 4 independent applications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLauncher(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* 4 App Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
              {ECOSYSTEM_APPS.map((app) => {
                const Icon = app.icon;
                const isCurrent = app.id === appId;
                return (
                  <button
                    key={app.id}
                    onClick={() => {
                      setShowLauncher(false);
                      navigate(app.path);
                    }}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer group ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 hover:shadow-md'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${app.badgeColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition truncate">
                          {app.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 mt-0.5 truncate">
                        {app.tagline}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {app.description}
                      </p>
                      <div className="mt-2 text-[10px] font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Launch application <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Portal & Settings Links */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  setShowLauncher(false);
                  navigate('/');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-600" />
                Ecosystem Hub Portal
              </button>

              <button
                onClick={() => {
                  setShowLauncher(false);
                  navigate('/settings');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-slate-600" />
                Ecosystem Settings &amp; Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
