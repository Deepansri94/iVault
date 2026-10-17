/**
 * @file PassVaultApp.tsx
 * Independent Password & Credential Vault Application.
 * Accessible directly at /passVault.
 * Secure AES-GCM credential vault: Security Audit & Password Health,
 * Master PIN Unlock Gate, Strong Password Generator, and Category Organizers.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { db, initializeDatabase } from '../../services/db.service';
import type {
  VaultCredential,
  AppSettings,
  AppNotification,
} from '../../types/db.types';

import { EcosystemHeader } from '../../components/ecosystem/EcosystemHeader';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { PasswordVaultModule } from '../../components/vault/PasswordVaultModule';
import { NotificationCenterModal } from '../../components/notifications/NotificationCenterModal';

import {
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const PassVaultApp: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [currentView, setCurrentView] = useState<'vault' | 'audit' | 'banking' | 'social'>('vault');

  // Vault State
  const [credentials, setCredentials] = useState<VaultCredential[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [toastNotice, setToastNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastNotice({ type, message });
    setTimeout(() => {
      setToastNotice((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const loadVaultData = useCallback(async () => {
    try {
      await initializeDatabase();
      const [creds, sets, notifs] = await Promise.all([
        db.passwords.toArray(),
        db.appSettings.get('default'),
        db.notifications.toArray().then((list) =>
          list
            .sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())
            .slice(0, 30)
        ),
      ]);

      setCredentials(creds);
      setSettings(sets || null);
      setNotifications(notifs);
      setIsReady(true);
    } catch (err) {
      console.error('Error loading PassVault data:', err);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  // Handlers
  const handleAddCredential = async (credData: Omit<VaultCredential, 'id' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await db.passwords.put({
      id: `cred-${Date.now()}`,
      ...credData,
      updatedAt: now,
    });
    await loadVaultData();
    showToast(`Saved credentials for "${credData.title}".`, 'success');
  };

  const handleUpdateCredential = async (cred: VaultCredential) => {
    cred.updatedAt = new Date().toISOString();
    await db.passwords.put(cred);
    await loadVaultData();
    showToast(`Updated credentials for "${cred.title}".`, 'success');
  };

  const handleDeleteCredential = async (id: string) => {
    await db.passwords.delete(id);
    await loadVaultData();
    showToast('Credential removed from vault.', 'info');
  };

  const handleSetMasterPin = async (pin: string) => {
    await db.appSettings.update('default', { masterPinHash: pin });
    setSettings((prev) => (prev ? { ...prev, masterPinHash: pin } : prev));
    showToast('Master Vault PIN updated successfully.', 'success');
  };

  // Category counts
  const bankingCount = credentials.filter((c) => c.category === 'Banking').length;
  const socialCount = credentials.filter((c) => c.category === 'Social').length;
  const workCount = credentials.filter((c) => c.category === 'Work').length;
  const otherCount = credentials.filter((c) => !['Banking', 'Social', 'Work'].includes(c.category)).length;

  const navTabs = [
    { id: 'vault', label: `All Credentials (${credentials.length})`, icon: KeyRound },
    { id: 'banking', label: `Banking & Cards (${bankingCount})`, icon: ShieldCheck },
    { id: 'social', label: `Social & Apps (${socialCount})`, icon: Shield },
    { id: 'audit', label: 'Security Health Audit', icon: ShieldAlert },
  ];

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Loading PassVault...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-[#F4F6F9] text-slate-800 pb-20 overflow-y-auto">
      <OfflineIndicator />

      {/* App Header */}
      <EcosystemHeader
        appName="PassVault"
        appSubtitle="Zero-Knowledge AES-GCM Encrypted Security Vault"
        appId="passvault"
        notifications={notifications}
        onOpenNotifications={() => setShowNotificationsModal(true)}
      />

      {/* PassVault Sub-Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-violet-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">
        {currentView === 'audit' ? (
          <div className="space-y-4">
            {/* Security Audit Banner */}
            <div className="bg-gradient-to-r from-violet-950 via-purple-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <ShieldCheck className="w-4 h-4 text-violet-300" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-200">
                    PassVault Security Health
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Vault Security Analysis
                </h2>
                <p className="text-xs text-violet-200/80 mt-1 max-w-xl">
                  Evaluates password entropy, cross-account reuse risks, and outdated passwords.
                </p>
              </div>
            </div>

            {/* Audit Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Passwords</span>
                <span className="text-2xl font-black text-slate-900">{credentials.length}</span>
                <p className="text-[10px] text-slate-500 mt-1">Encrypted with AES-GCM 256-bit</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Default Master PIN</span>
                <span className="text-sm font-black text-emerald-600">Active (4-Digit Hash)</span>
                <p className="text-[10px] text-slate-500 mt-1">Default PIN is 1234. Change anytime in Vault.</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Categories Covered</span>
                <span className="text-2xl font-black text-violet-700">
                  {new Set(credentials.map((c) => c.category)).size}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Banking, Email, Work &amp; Social</p>
              </div>
            </div>

            <div className="mt-4">
              <PasswordVaultModule
                credentials={credentials}
                onAddCredential={handleAddCredential}
                onUpdateCredential={handleUpdateCredential}
                onDeleteCredential={handleDeleteCredential}
                masterPinHash={settings?.masterPinHash || ''}
                onSetMasterPin={handleSetMasterPin}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <PasswordVaultModule
              credentials={
                currentView === 'banking'
                  ? credentials.filter((c) => c.category === 'Banking')
                  : currentView === 'social'
                  ? credentials.filter((c) => c.category === 'Social')
                  : credentials
              }
              onAddCredential={handleAddCredential}
              onUpdateCredential={handleUpdateCredential}
              onDeleteCredential={handleDeleteCredential}
              masterPinHash={settings?.masterPinHash || ''}
              onSetMasterPin={handleSetMasterPin}
            />
          </div>
        )}
      </main>

      {/* Notifications Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onRefreshNotifications={loadVaultData}
        onNavigateTab={(tab) => {
          if (tab === 'vault') setCurrentView('vault');
        }}
      />

      {/* Toast */}
      {toastNotice && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl shadow-2xl p-3.5 flex items-start gap-3 border animate-fadeIn transition backdrop-blur-md bg-white/95 text-slate-800 border-slate-200">
          <div className="shrink-0 mt-0.5">
            {toastNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toastNotice.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {toastNotice.type === 'info' && <KeyRound className="w-5 h-5 text-violet-600" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-snug">{toastNotice.message}</p>
          </div>
          <button
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
