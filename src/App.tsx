/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { RouterProvider, useRouter } from './router/Router';
import { ThemeService } from './services/theme.service';

// 4 Independent Ecosystem Applications
import { FinTrackerApp } from './apps/fintracker/FinTrackerApp';
import { FamilyDocsApp } from './apps/familydocs/FamilyDocsApp';
import { HealthMedsApp } from './apps/healthmeds/HealthMedsApp';
import { PassVaultApp } from './apps/passvault/PassVaultApp';

// Ecosystem Hub & Settings
import { EcosystemHubApp } from './apps/hub/EcosystemHubApp';
import { SettingsApp } from './apps/settings/SettingsApp';

/**
 * AppContent evaluates the current browser URL route and renders the
 * corresponding independent application directly without loading the others.
 *
 * Dedicated URLs:
 * - /fintracker  → FinTracker Application (Personal Finance, Ledger & Investments)
 * - /familyDocs  → Family Documents Application (Redacted Family Records & Expiry Radar)
 * - /healthMeds  → Health & Medication Application (Dose Schedules & Prescriptions)
 * - /passVault   → Password Vault Application (AES-GCM Credentials & Master Key)
 * - /settings    → Ecosystem Configuration & Cloud Sync
 * - / or /hub    → Ecosystem Launchpad & Unified Status Portal
 */
function AppContent() {
  const { appId } = useRouter();

  useEffect(() => {
    // Load theme configuration
    ThemeService.loadSavedTheme();
  }, []);

  switch (appId) {
    case 'fintracker':
      return <FinTrackerApp />;
    case 'familydocs':
      return <FamilyDocsApp />;
    case 'healthmeds':
      return <HealthMedsApp />;
    case 'passvault':
      return <PassVaultApp />;
    case 'settings':
      return <SettingsApp />;
    case 'hub':
    default:
      return <EcosystemHubApp />;
  }
}

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
