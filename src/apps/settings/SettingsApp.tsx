/**
 * @file SettingsApp.tsx
 * Independent Settings & Ecosystem Configuration Application.
 * Accessible directly at /settings.
 * Theme customization, Google Sheets webhook sync, test runners, and storage metrics.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { db, initializeDatabase } from '../../services/db.service';
import { EcosystemHeader } from '../../components/ecosystem/EcosystemHeader';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { SettingsModule } from '../../components/settings/SettingsModule';
import { TestRunnerModal } from '../../components/testing/TestRunnerModal';
import type { AppSettings, AppNotification } from '../../types/db.types';

export const SettingsApp: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [storageStats, setStorageStats] = useState({
    txCount: 0,
    medCount: 0,
    docCount: 0,
    credCount: 0,
  });

  const loadData = useCallback(async () => {
    try {
      await initializeDatabase();
      const [sets, notifs, txCount, medCount, docCount, credCount] = await Promise.all([
        db.appSettings.get('default'),
        db.notifications.toArray().then((list) =>
          list
            .sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())
            .slice(0, 30)
        ),
        db.transactions.count(),
        db.medicines.count(),
        db.familyDocuments.count(),
        db.passwords.count(),
      ]);

      setSettings(sets || null);
      setNotifications(notifs);
      setStorageStats({ txCount, medCount, docCount, credCount });
      setIsReady(true);
    } catch (err) {
      console.error('Error loading settings data:', err);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    await db.appSettings.update('default', newSettings);
    setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-[#F4F6F9] text-slate-800 pb-20 overflow-y-auto">
      <OfflineIndicator />
      <EcosystemHeader
        appName="Ecosystem Settings"
        appSubtitle="Theme Customization, Google Sheets Cloud Webhook & Storage"
        appId="settings"
        notifications={notifications}
      />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">
        <SettingsModule
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenTestRunner={() => setShowTestRunner(true)}
          onTriggerDataRefresh={loadData}
          storageStats={storageStats}
        />
      </main>

      <TestRunnerModal
        isOpen={showTestRunner}
        onClose={() => setShowTestRunner(false)}
        onTriggerDataRefresh={loadData}
      />
    </div>
  );
};
