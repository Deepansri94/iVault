# Components

All UI components are written in React + TypeScript with Tailwind CSS v4. They are organized by feature module.

---

## `layout/`

### `TopHeader.tsx`
Sticky top navigation bar. Displays the iVault Pro logo, active family member selector, notification bell (with unread count), WhatsApp bot shortcut, and profile link.

### `BottomNavigation.tsx`
Fixed bottom tab bar with 6 tabs: Dashboard, FinTracker, Documents, Medicines, Vault, Settings. Shows badge counts for low-stock medicines and expiring documents.

---

## `common/`

### `OfflineIndicator.tsx`
Toast banner that appears when the device loses internet connectivity. Listens to the browser `online`/`offline` events.

### `PWAInstallButton.tsx`
Renders an "Install App" button using the `usePWAInstall` hook. Triggers the browser's native PWA install prompt.

---

## `dashboard/`

### `NetWorthCarousel.tsx`
Horizontally scrollable card carousel showing:
- Individual bank account balances
- Total net worth (assets minus liabilities)
- Investment portfolio summary
- Gold valuation at live rates

### `QuickActionGrid.tsx`
8-tile icon grid for one-tap actions: Record Expense, Add Income, WhatsApp Bot, FinTracker, Documents, Medicines, Vault, Sync.

### `ExecutiveSummary.tsx`
Scrollable analytics panel on the dashboard showing recent transactions, budget progress bars, medicine dose reminders, and expiring document alerts.

---

## `fintracker/`

### `FinTrackerModule.tsx`
Main finance module with sub-tabs for Transactions, Accounts, Budgets, Fixed Investments, Demat/MF, Gold Holdings, and Loans. Accounts can be added, edited, and deleted; configured savings accounts are used on the dashboard and offered as loan auto-debit sources.

### `FinTrackerModals.tsx`
All add/edit modal forms for the FinTracker module (accounts, transactions, budgets, investments, gold, loans).

---

## `familydocs/`

### `FamilyDocTrackerModule.tsx`
Document vault UI. Lists documents per family member with redacted IDs and expiry badges. Live sessions support attached local files, document editing/deletion, and family-member date-of-birth entry with calculated age.

---

## `medicines/`

### `MedicineTrackerModule.tsx`
Medicine dashboard per family member. Shows current stock, dosage schedule, and "Log Dose" / "Refill" action buttons. Low-stock items are highlighted; Live sessions support medicine editing and deletion.

### `PrescriptionModal.tsx`
Medicine-list modal showing actual saved medicines for all (or a selected) family member. Supports filtering and a tabular PDF download without sample clinical/doctor data.

---

## `vault/`

### `PasswordVaultModule.tsx`
AES-GCM encrypted password vault. Live sessions require a user-set PIN and support editing/deleting saved credentials. Includes a secure password generator, strength meter, and one-tap copy.

---

## `settings/`

### `SettingsModule.tsx`
App configuration panel covering:
- Theme selection (5 themes)
- Master PIN setup
- Google Sheets sync URL
- Live gold rate inputs
- Storage statistics
- Test runner launcher

---

## `notifications/`

### `NotificationCenterModal.tsx`
In-app notification center and health radar drawer. Surfaces automated alerts for budget limits, low medicine stock, upcoming loan EMIs, and expiring documents with category filtering, mark-as-read, clear, manual audit trigger, and optional desktop notification integration.

---

## `dashboard/SmartQuickEntryModal.tsx`
Natural language financial entry assistant modal. Accepts conversational text inputs, parses them via `SmartParserService`, displays live confidence and entity preview, and writes directly to IndexedDB.

---

## `testing/`

### `TestRunnerModal.tsx`
In-app interactive QA panel running live verification against Web Crypto AES-GCM, Smart NLP Parsing, Notification Radar Audits, and Dexie IndexedDB schemas.
