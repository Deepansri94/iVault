import React, { useState } from 'react';
import {
  Palette,
  Cloud,
  RefreshCw,
  Download,
  Copy,
  Check,
  Code2,
  Database,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Sliders,
  Sparkles,
  Play,
  FileCheck,
  MessageSquare,
  AlertCircle,
  RotateCcw,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  Coins,
  Bell,
  Laptop,
  CheckCircle2,
  Pill,
  Landmark,
  FileText,
} from 'lucide-react';
import { THEME_PRESETS, ThemeService, type ThemeConfig } from '../../services/theme.service';
import { GoogleSheetsSyncService, type SyncStatusResult } from '../../services/google-sheets-sync.service';
import { NotificationService } from '../../services/notification.service';
import { GoogleSheetsMarketGuideModal } from './GoogleSheetsMarketGuideModal';
import type { AppSettings, ThemeId } from '../../types/db.types';

interface SettingsModuleProps {
  settings: AppSettings | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onOpenTestRunner: () => void;
  onSwitchToLiveMode?: (name: string) => Promise<void>;
  onResetToDemoMode?: () => Promise<void>;
  storageStats: {
    txCount: number;
    medCount: number;
    docCount: number;
    credCount: number;
  };
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  onUpdateSettings,
  onOpenTestRunner,
  onSwitchToLiveMode,
  onResetToDemoMode,
  storageStats,
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(settings?.theme || 'classic-orange');
  const [webappUrl, setWebappUrl] = useState(settings?.sheetsWebappUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncStatusResult | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showMarketGuideModal, setShowMarketGuideModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Live / Demo Switcher states
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveUserName, setLiveUserName] = useState('Deepan');
  const [showResetModal, setShowResetModal] = useState(false);
  const isLive = settings?.sessionMode === 'live';

  // Notification preferences states
  const [desktopNotifsEnabled, setDesktopNotifsEnabled] = useState(
    settings?.desktopNotificationsEnabled ?? false
  );
  const [budgetThresholdPct, setBudgetThresholdPct] = useState(
    settings?.budgetAlertThresholdPct ?? 80
  );
  const [medStockAlerts, setMedStockAlerts] = useState(
    settings?.medicineLowStockAlerts ?? true
  );
  const [loanEmiAlerts, setLoanEmiAlerts] = useState(
    settings?.loanEmiAlerts ?? true
  );
  const [docExpiryAlerts, setDocExpiryAlerts] = useState(
    settings?.documentExpiryAlerts ?? true
  );
  const [notifsSaved, setNotifsSaved] = useState(false);
  const [sheetsSaved, setSheetsSaved] = useState(false);
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [testAlertResult, setTestAlertResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSelectTheme = async (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    await ThemeService.saveTheme(themeId);
    await onUpdateSettings({ theme: themeId });
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const result = await GoogleSheetsSyncService.syncWithGoogleAppsScript(webappUrl);
      setSyncResult(result);
      if (result.success) {
        await onUpdateSettings({ lastSyncTime: result.timestamp });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveWebappUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({ sheetsWebappUrl: webappUrl.trim() });
    setSheetsSaved(true);
    setTimeout(() => setSheetsSaved(false), 3000);
  };

  const handleSaveNotificationPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      desktopNotificationsEnabled: desktopNotifsEnabled,
      budgetAlertThresholdPct: budgetThresholdPct,
      medicineLowStockAlerts: medStockAlerts,
      loanEmiAlerts,
      documentExpiryAlerts: docExpiryAlerts,
    });
    setNotifsSaved(true);
    setTimeout(() => setNotifsSaved(false), 3000);
  };

  const handleToggleDesktopPermission = async (checked: boolean) => {
    setDesktopNotifsEnabled(checked);
    if (checked) {
      const permission = await NotificationService.requestDesktopPermission();
      if (permission === 'granted') {
        NotificationService.sendDesktopNotification(
          'iVault Pro Desktop Notifications Active',
          'You will now receive desktop alerts for low medicine stocks and budget overruns.'
        );
      }
    }
  };

  const handleSendTestAlert = async () => {
    setIsTestingAlert(true);
    setTestAlertResult(null);

    try {
      const notif = await NotificationService.dispatchNotification({
        type: 'system',
        title: '🔔 Test Application Alert: Health Radar Active',
        message: 'Your iVault Pro in-app notification system is operating smoothly with offline storage.',
        severity: 'info',
        force: true,
      });

      if (desktopNotifsEnabled) {
        NotificationService.sendDesktopNotification(notif.title, notif.message);
      }

      setTestAlertResult({
        success: true,
        message: 'Test notification triggered successfully and logged to offline store!',
      });
    } catch (err: any) {
      setTestAlertResult({
        success: false,
        message: err.message || 'Failed to dispatch test notification.',
      });
    } finally {
      setIsTestingAlert(false);
    }
  };

  const appsScriptCode = GoogleSheetsSyncService.generateAppsScriptCode();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-300" />
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-amber-200">
              SYSTEM & THEME CONTROL
            </span>
          </div>
          <h3 className="text-xl font-black mt-1">Settings, Themes & Google Sheets Cloud</h3>
          <p className="text-xs text-white/80 mt-0.5">
            Configure dynamic DOM colors, Google Apps Script endpoint sync, and QA test suites
          </p>
        </div>

        <button
          onClick={onOpenTestRunner}
          className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Play className="w-4 h-4 text-slate-950 fill-slate-950" />
          <span>Launch QA Test Suite</span>
        </button>
      </div>

      {/* SECTION 1: THEME CUSTOMIZATION ENGINE */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Palette className="w-5 h-5 text-[#C93B2B]" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Theme Customization Engine</h3>
            <p className="text-xs text-slate-500">
              Dynamically injects CSS custom properties into DOM root
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(THEME_PRESETS).map((t) => {
            const isSelected = currentTheme === t.id;

            return (
              <button
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                className={`p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#C93B2B] ring-2 ring-[#C93B2B]/20 bg-orange-50/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-xs">{t.name}</span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C93B2B] text-white text-[10px] font-black">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{t.subtitle}</p>
                </div>

                {/* Color preview chips */}
                <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                  {t.previewColors.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: GOOGLE SHEETS & APPS SCRIPT SYNC LAYER */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Google Sheets / Google Apps Script Cloud Sync
              </h3>
              <p className="text-xs text-slate-500">
                13-tab structured schema, including a dedicated savings account sheet
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowMarketGuideModal(true)}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-extrabold text-xs rounded-xl border border-emerald-300 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs active:scale-95"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>📊 Live Prices Setup (Gold, Stocks, MF)</span>
            </button>

            <button
              onClick={() => setShowCodeModal(true)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Generate Code.gs</span>
            </button>
          </div>
        </div>

        {/* Web App URL Form */}
        <form onSubmit={handleSaveWebappUrl} className="space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 block">
                Google Apps Script Web App URL (Endpoint)
              </label>
              {webappUrl ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Connected
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  ⚠️ Not configured (Offline mode)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webappUrl}
                onChange={(e) => setWebappUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Save URL
              </button>
            </div>
            {sheetsSaved && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mt-2">
                ✓ Google Sheets Web App endpoint saved successfully.
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              {webappUrl
                ? 'Your Google Sheet endpoint is active. Data changes will be replicated to Google Sheets.'
                : 'Click "Generate Code.gs" above to deploy the script in your Google Sheet, then paste the Web App URL here.'}
            </p>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Automatic Background Sync
              </span>
              <span className="text-[11px] text-slate-500">
                Automatically push to Google Sheets whenever you add expenses, income, or edit data
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.autoSyncEnabled !== false}
                onChange={async (e) => {
                  await onUpdateSettings({ autoSyncEnabled: e.target.checked });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </form>

        {/* Sync Controls & Result */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Cloud Synchronization</span>
            <span className="text-[11px] text-slate-500">
              Last synced: {settings?.lastSyncTime ? new Date(settings.lastSyncTime).toLocaleString() : 'Never'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-[#C93B2B] hover:bg-[#A52316] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing 12 Tabs...' : 'Sync Now'}</span>
            </button>

            <button
              onClick={() => GoogleSheetsSyncService.exportBackupFile()}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {syncResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              syncResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="font-bold">{syncResult.message}</div>
            {syncResult.syncedTabs.length > 0 && (
              <div className="mt-1 text-[11px] text-emerald-800">
                Tabs updated: {syncResult.syncedTabs.join(' • ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: ENVIRONMENT & SESSION MODE (DEMO VS LIVE) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">Session Mode</h3>
                {isLive ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    Live Session Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                    Demo Mode (Sample Data)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isLive
                  ? 'Currently managing your personal financial records with zero demo clutter.'
                  : 'Currently showing pre-populated sample accounts, investments, and dummy expenses.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-800 block">
              {isLive ? 'Live Session Controls' : 'Ready to record your real personal finances?'}
            </span>
            <p className="text-[11px] text-slate-500 max-w-xl">
              {isLive
                ? 'You are running in clean Live mode. You can restore sample demo data at any time if you want to explore sample features.'
                : 'Switching to Live Mode clears sample transactions, dummy loans, and demo data so you can enter your own real accounts, family members, and expenses.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLive ? (
              <button
                onClick={() => setShowResetModal(true)}
                className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Demo Data</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLiveModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Switch to Live Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: APPLICATION NOTIFICATIONS & HEALTH RADAR */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Application Notifications &amp; Health Radar
              </h3>
              <p className="text-xs text-slate-500">
                Automated offline alerts for budgets, medicines, upcoming loan EMIs, and document renewals
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isTestingAlert}
            onClick={handleSendTestAlert}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingAlert ? 'animate-spin' : ''}`} />
            <span>{isTestingAlert ? 'Sending...' : 'Send Test Alert'}</span>
          </button>
        </div>

        {/* Quick Explanation Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm flex items-center gap-1.5 text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              <span>Offline-First Background Health Audits</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 font-bold text-[10px]">
              Client-Side · No Cloud Webhooks
            </span>
          </div>
          <p className="text-[11px] text-indigo-900/90 leading-relaxed">
            All audits run entirely locally in your browser against IndexedDB. Alerts appear in the top Notification Bell drawer with optional desktop system notifications.
          </p>
        </div>

        <form onSubmit={handleSaveNotificationPreferences} className="space-y-3.5 text-xs">
          {/* Desktop Push Alert Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Laptop className="w-4 h-4 text-slate-600" />
              <div>
                <span className="font-bold text-slate-800 block">Desktop System Notifications</span>
                <span className="text-[11px] text-slate-500">
                  Trigger HTML5 OS notifications for high-priority medicine refills and budget alerts
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={desktopNotifsEnabled}
              onChange={(e) => handleToggleDesktopPermission(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Alert Category Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">Medicine Low-Stock Radar</span>
                  <span className="text-[10px] text-slate-500">Alert when pill count &le; refill threshold</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={medStockAlerts}
                onChange={(e) => setMedStockAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">Loan EMI 5-Day Warning</span>
                  <span className="text-[10px] text-slate-500">Advance notices for auto-debit dates</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={loanEmiAlerts}
                onChange={(e) => setLoanEmiAlerts(e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">Document 30-Day Expiry Radar</span>
                  <span className="text-[10px] text-slate-500">Notifies prior to passport / DL / insurance expiry</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={docExpiryAlerts}
                onChange={(e) => setDocExpiryAlerts(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Budget Warning Threshold</span>
                <span className="text-[10px] text-slate-500">Trigger alert when category spending reaches %</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={budgetThresholdPct}
                  onChange={(e) => setBudgetThresholdPct(Number(e.target.value))}
                  className="w-14 px-2 py-1 rounded-lg border border-slate-300 font-bold text-xs text-center"
                />
                <span className="text-slate-500 font-bold">%</span>
              </div>
            </div>
          </div>

          {testAlertResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold ${
                testAlertResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testAlertResult.message}
            </div>
          )}

          {notifsSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
              ✓ Application notification preferences saved successfully.
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow transition cursor-pointer"
            >
              Save Notification Preferences
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: STORAGE TELEMETRY & OFFLINE ARCHITECTURE */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Database className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Offline Storage Telemetry</h3>
            <p className="text-xs text-slate-500">IndexedDB persistence metrics via Dexie.js</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Transactions</span>
            <span className="text-lg font-black text-slate-900">{storageStats.txCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Prescriptions</span>
            <span className="text-lg font-black text-slate-900">{storageStats.medCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Family Docs</span>
            <span className="text-lg font-black text-slate-900">{storageStats.docCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">AES Passwords</span>
            <span className="text-lg font-black text-slate-900">{storageStats.credCount}</span>
          </div>
        </div>
      </div>

      {/* MODAL: Google Apps Script Code.gs Generator */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Google Apps Script (Code.gs)</h3>
                <p className="text-xs text-slate-500">
                  Ready-to-deploy script that auto-creates and syncs all 12 tabs in Google Sheets
                </p>
              </div>
              <button onClick={() => setShowCodeModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <strong>Quick 2-Minute Setup:</strong>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-blue-800">
                <li>Create a blank Google Sheet at sheets.new</li>
                <li>Click <strong>Extensions &gt; Apps Script</strong></li>
                <li>Paste this code into <strong>Code.gs</strong></li>
                <li>Click <strong>Deploy &gt; New Deployment &gt; Web App</strong> (Access: Anyone)</li>
                <li>Paste the Web App URL into iVault Pro Settings!</li>
              </ol>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-900 p-4 rounded-xl text-emerald-400 font-mono text-[11px] select-all">
              <pre>{appsScriptCode}</pre>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400">Total lines: ~80 lines pure JavaScript</span>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code.gs'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Switch to Live Session */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Switch to Live Session</h3>
              </div>
              <button onClick={() => setShowLiveModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                What happens when you switch?
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                All pre-seeded demo records (sample bank accounts, dummy loans, demo medicines, and transactions) will be cleared so you can record your own genuine finances.
              </p>
              <p className="text-[11px] text-amber-900/90 font-medium">
                Your theme, PIN, and Google Sheets Web App URL are kept untouched. You can restore demo data anytime.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">Primary Account Holder Name</label>
              <input
                type="text"
                value={liveUserName}
                onChange={(e) => setLiveUserName(e.target.value)}
                placeholder="e.g. Deepan"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLiveModal(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onSwitchToLiveMode) {
                    await onSwitchToLiveMode(liveUserName.trim() || 'Self');
                  }
                  setShowLiveModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Confirm & Start Live Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Restore Demo Data */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Restore Demo Dataset</h3>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will re-populate the application with the complete sample dataset (multi-member family, loan EMIs, stocks, gold, and prescriptions).
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onResetToDemoMode) {
                    await onResetToDemoMode();
                  }
                  setShowResetModal(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                Restore Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Google Sheets Live Market Prices Guide (Gold, Stocks, Mutual Funds) */}
      <GoogleSheetsMarketGuideModal
        isOpen={showMarketGuideModal}
        onClose={() => setShowMarketGuideModal(false)}
        webappUrl={webappUrl}
      />
    </div>
  );
};
