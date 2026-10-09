# Services

Core business logic and data access layer for iVault Pro. All services are stateless utility classes or singletons.

---

## `db.service.ts`

Dexie.js (IndexedDB) database definition and seed data.

- Exports the `db` singleton instance of `IVaultDatabase`
- Defines 14 tables: `accounts`, `transactions`, `budgets`, `fixedInvestments`, `dematInvestments`, `goldHoldings`, `loans`, `familyMembers`, `familyDocuments`, `medicines`, `passwords`, `syncQueue`, `notifications`, `appSettings`
- `initializeDatabase()` seeds the database on first launch with sample family data and runs migration patches on subsequent launches

---

## `crypto.service.ts`

Client-side cryptography using the **Web Crypto API**. No data ever leaves the device unencrypted.

| Method | Description |
|---|---|
| `encrypt(plaintext, masterKey)` | AES-GCM 256-bit encryption with PBKDF2 key derivation |
| `decrypt(payload, masterKey)` | Decrypts an `EncryptedPayload` (ciphertext + iv + salt) |
| `hashMasterPin(pin)` | SHA-256 hash of the master PIN for local auth |
| `getRedactedPlaceholder(rawId, maskType)` | Returns `[Document ID Omitted]` or `XXXX-XXXX-{last4}` |
| `generateSecurePassword(options)` | Cryptographically secure password using `crypto.getRandomValues` |
| `calculatePasswordStrength(password)` | Entropy-based strength score (0–100) with label and color |

Key derivation parameters: PBKDF2, SHA-256, 100,000 iterations, 256-bit AES-GCM key, 16-byte random salt, 12-byte random IV.

---

## `theme.service.ts`

Manages the 5 built-in UI themes by writing CSS custom properties to `document.documentElement`.

- Themes: `classic-orange`, `emerald-wealth`, `royal-purple`, `dark-slate`, `ruby-privilege`
- `loadSavedTheme()` — reads the saved theme from `appSettings` and applies it on startup

---

## `smart-parser.service.ts`

Natural language transaction parser for fast-track ledger and investment entry.

- Parses conversational free-text messages (e.g. `"Spent 500 on Groceries"`, `"Invested 2000 in PPF"`, `"Received 50000 Salary"`, `"Bought 10g Gold for 72500"`) into structured `Transaction` or investment objects with confidence scoring.
- Categorizes descriptions into canonical budget categories (Groceries, Dining, Fuel, Healthcare, Utilities, Education, etc.).

---

## `notification.service.ts`

Application Notification Engine and Automated Health Radar.

- `runAutomatedNotificationAudits()` — checks for monthly budget limits & overruns, depleted medicine stocks, upcoming loan auto-debits (within 5 days), and expiring identity documents (within 30 days).
- `dispatchNotification(options)` — creates deduplicated notifications in IndexedDB with severity ratings.
- Supports HTML5 Web Notifications API (`requestDesktopPermission()`, `sendDesktopNotification()`) for optional desktop alerts.
- CRUD operations for notifications: `markAsRead`, `markAllAsRead`, `deleteNotification`, `clearAllNotifications`, and `getUnreadCount`.

---

## `google-sheets-sync.service.ts`

Exports the local database as a snapshot to a Google Apps Script Web App endpoint.

- `syncWithGoogleAppsScript(webappUrl)` — sends the database snapshot as URL-encoded form data (`data`) and updates the sync timestamp
- Exports configured savings accounts to a `Savings Accounts` tab with account numbers limited to the last four digits
- The generated Apps Script reads `e.parameter.data` and refreshes all tabs, including clearing tabs whose local tables are empty
- The browser uses `no-cors` mode for the Apps Script request, so its opaque response cannot confirm whether the script completed successfully

---

## `pdf-prescription.service.ts`

Generates a printable tabular medicine list using **jsPDF**.

- Accepts the displayed list of `Medicine` records
- Outputs medicine, member, type, dosage, timing, instructions, duration, and notes in a table with repeated headers on additional pages
