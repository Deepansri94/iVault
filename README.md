# iVault Pro — Unified Finance & Family Vault 🛡️💼

> **Mobile-first, offline-ready Progressive Web App (PWA)** delivering banking-grade personal finance tracking, investment portfolio valuation, encrypted family document management, medicine dosage tracking, and AES-GCM password vault.

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-v4.4-00A396)](https://dexie.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green?logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## 🌟 Overview

**iVault Pro** combines modern banking elegance with strict zero-knowledge privacy. Built with **React 19**, **Vite**, **Tailwind CSS v4**, and **Dexie.js (IndexedDB)**, it functions completely offline while providing automatic background synchronization to Google Sheets and real-time WhatsApp alerts to your mobile phone via CallMeBot.

---

## ✨ Key Feature Modules

### 1. 📊 Executive Dashboard & Net Worth Carousel
- **Net Worth Carousel**: Real-time aggregation of liquid savings, sovereign fixed investments (PPF/SSA/RD), equity/MF SIPs, and physical gold holdings minus loan debts.
- **De-Cluttered Quick Action Bar**: 4 streamlined one-tap quick actions (*Record Expense*, *Add Income*, *WhatsApp Alerts*, *Google Sheets Cloud Sync*) plus a clean family vault radar strip.
- **Financial Pulse & Passbook**: Monthly income vs. expense progress bar, savings rate meter, net monthly surplus calculation, and recent ledger entries.

### 2. ⚡ Clean Live Session & Privacy First
- **Pristine Real Ledger**: Pure zero-clutter live environment for your genuine family accounts, investments, and personal expenses.
- **Local-First & Encrypted**: All records stored locally in your browser with AES-GCM 256-bit encryption for passwords and document IDs.

### 3. 📱 WhatsApp Notifications & Bot (Free 30s Webhook via CallMeBot)
- **CallMeBot Integration**: 100% free webhook integration delivering notifications straight to your personal WhatsApp without complex cloud setups or paid API keys.
- **Automated Family Alerts**:
  - 💊 **Medicine Low-Stock Warnings**: Instant alert when pill stock drops below refill threshold.
  - 🚨 **Budget Limit Radar**: Automated notifications when a category crosses 80% or 100% of monthly budget.
  - 🏦 **Scheduled EMI Reminders**: 5-day advance warnings for home, car, or personal loan auto-debits.
  - 📄 **Document Expiry Radar**: 30-day advance notice for Passport, DL, or insurance renewals.
- **Natural Language Chat Bot**: Type natural messages (e.g., *"Spent 450 on Dinner"* or *"Invested 5000 in PPF"*) to parse and record entries instantly.

### 4. 💰 Comprehensive FinTracker
- **Cash Ledger**: Filterable income and expense records with category classification, payment mode tags, and Google Sheets sync status.
- **Budgets & Limits**: Monthly budget allocation with warning progress bars.
- **Fixed Investments**: Tracks PPF (7.1%), Sukanya Samriddhi (8.2%), Fixed Deposits, and Recurring Deposits with maturity dates.
- **Demat & Mutual Funds**: Tracks portfolio current value, invested capital, and overall profit/loss percentage.
- **Physical Gold Holdings**: Automatic live valuation updates based on 24K and 22K per-gram gold rates.
- **Loans & EMIs**: Active loan facilities with outstanding balance, interest rate, tenure, and monthly EMI deduction tracking.

### 5. 📁 Family DocTracker (Zero-Knowledge Redaction)
- **Supported Documents**: PAN, Aadhaar, Passport, Driving License, Health Insurance, Vehicle RC, and Voter ID.
- **AES-GCM Encryption**: Document numbers encrypted with 256-bit AES-GCM before storage.
- **Shoulder-Surfing Protection**: Document identifiers masked by default with `[Document ID Omitted]` placeholders.
- **30-Day Renewal Radar**: Real-time status tags (*Valid*, *Expiring Soon*, *Expired*).

### 6. 💊 Medicine & Prescription Tracker
- **Automatic Daily Dosage Deduction**: Completely eliminates tedious manual logging. When enabled, scheduled daily doses are automatically deducted on startup each day, tracking compliance without requiring user intervention.
- **1-Tap Batch Logging**: One-click actions to log all medicines or filter by slot (*Morning*, *Afternoon*, *Night*, or *All Today's*).
- **Undo / Revert Dose**: Accidental dose logs can be reversed with a single click (+1 stock recovery).
- **Multi-Member Scheduling**: Morning, Afternoon, Evening, and Night dosage tracking per family member.
- **Low-Stock WhatsApp Alerts**: Instant notification when current stock falls to or below the minimum threshold.
- **PDF Prescription Generator**: Instant generation and download of printable clinical prescription charts using **jsPDF**.

### 7. 🔐 AES-GCM Password Vault
- **Client-Side Cryptography**: Zero-knowledge AES-GCM 256-bit encryption with PBKDF2 key derivation (100,000 iterations).
- **Master PIN Hash**: Stored exclusively as a client-side SHA-256 hash.
- **Cryptographic Password Generator**: Generates high-entropy passwords (`crypto.getRandomValues`).

### 8. 🎨 Dynamic Multi-Theme Support
Switch between 5 polished themes dynamically rendered via CSS custom properties:
- 🍊 **Classic Orange** (`#C93B2B`) — Signature warm banking theme
- 🌲 **Emerald Wealth** (`#047857`) — Forest & investment wealth tones
- 👑 **Royal Purple** (`#6D28D9`) — Executive luxury palette
- 🌑 **Dark Slate** (`#0F172A`) — High-contrast OLED dark mode
- 🍷 **Ruby Privilege** (`#991B1B`) — Premium banking styling

### 9. 🔄 Dual Sync & Offline Persistence
- **Google Sheets Integration**: Automatically syncs all 12 database tables to Google Sheets via Google Apps Script Web App.
- **Offline Staging Queue**: All offline transactions are queued in IndexedDB and automatically synchronized once connected.

---

## 🚀 Recent Updates & High-Value Releases (October 2026)

We have recently completed a series of enterprise-grade reliability, user experience, and mobile PWA updates:

### 1. 🔄 Multi-Directional Cloud Sync & Overwrite
- **Instant Overwrite/Reload**: Added a dedicated **"Pull from Google Sheet"** feature that safely clears local IndexedDB data and reloads verified real-time cloud data from your Google Sheet. Perfect for syncing multi-device updates!
- **Persistent Sync Indicators**: Added a global background auto-sync sync-flag manager. Staged transactions turn from `⚡ Local Staged` to `☁️ Synced` automatically upon successful POST push request.
- **Global Header Access**: Integrated a **global `[Pull Sheet]` button** in the `TopHeader` bar on **both mobile and desktop layouts** across every tab.

### 2. 🎂 Advanced Family Birthday Alarms
- **Year Boundary Bug Fix**: Built a robust date rollover calculation resolving the year-crossing bug (e.g., December to January transitions).
- **30-Day Reminder Window**: Enlarged the notification alert window to audit upcoming birthdays **30 days** in advance.
- **Immediate State Synchronization**: Audited notifications refresh immediately upon family member additions or edits.

### 3. 📲 PWA compliant Mobile Subdirectories (GitHub Pages)
- **100% Installable**: Linked the PWA web app manifest (`manifest.webmanifest`) and standard `apple-touch-icon` relative references in the `index.html` header.
- **Relative Path Resolvers**: Changed absolute icon and favicon URLs into relative `./` paths, enabling bulletproof installability within nested subdirectories like GitHub Pages (`/iVault/`).
- **Cache Invalidation Automation**: Integrated service worker cache version bumping (to `v3`) to force PWA clients to clear stale bundles and register changes immediately.

### 4. 🔗 Financial & Medical Enhancements
- **Prescription Creation & Edit Resilience**: Overhauled "Add Medicine / Save Prescription" modal with auto-provisioning of member entities, interactive error banner reporting inside the modal, and async submit indicators to guarantee prescriptions are always saved cleanly.
- **Mobile & Desktop Pull Sheet Buttons**: Added high-visibility one-tap "Pull Sheet" and "Sync Sheet" action buttons directly in the TopHeader utility bar, the FinTracker transaction ledger bar, and the Settings dashboard without browser alert freezing.
- **Live Ledger Sync Badge Automation**: Background Google Sheets syncing automatically flips `⚡ Local Staged` records into `☁️ Synced` upon completion without requiring page reloads.
- **Interactive Family Member Profiles**: Added member entity editing with proactive 30-day birthday reminder alarms, custom dates of birth, and automated database migration.
- **Demat & EMI Deep Navigation**: Fixed Portfolio Breakdown and Loan EMI Schedule quick-launch buttons to navigate directly to their correct Demat Portfolio and Loan EMI tracker tabs.
- **Physical Gold Holding Modals**: Added intuitive Edit and Delete holding capabilities with full visual dialog forms.
- **Prescription Download Dosage Mathematics**: Enhanced clinical charts generator (jsPDF) to automatically calculate exact 30-day purchase pill quantities based on daily dosages.
- **Medicine Explicit Actions**: Added individual Edit and Delete buttons for every medical item in your cabinet.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build & Tooling** | [Vite](https://vitejs.dev/) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) + CSS Custom Properties |
| **Database & Storage** | [Dexie.js](https://dexie.org/) (IndexedDB wrapper, 14 local tables) |
| **Cryptography** | Web Crypto API (`crypto.subtle` AES-GCM 256-bit, PBKDF2 100k, SHA-256) |
| **WhatsApp Integration** | [CallMeBot Webhook API](https://www.callmebot.com/) + Rule-Based NLP Parser |
| **Offline & PWA** | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + Service Worker caching |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) |
| **Icons & UI** | [Lucide React](https://lucide.dev/) |

---

## 📁 Project Directory Structure

```
iVault-Pro/
├── .github/
│   └── workflows/
│       └── deploy.yml               # GitHub Pages automated build & deployment workflow
├── public/
│   ├── apple-touch-icon.png         # iOS home screen icon
│   ├── icon.svg                     # Vector favicon
│   ├── manifest.webmanifest         # PWA web app manifest
│   ├── pwa-192x192.png              # Standard PWA icon
│   ├── pwa-512x512.png              # High-res PWA icon
│   └── pwa-maskable-512x512.png     # Android adaptive maskable icon
├── src/
│   ├── components/
│   │   ├── common/                  # OfflineIndicator, PWAInstallButton, SessionModeModal
│   │   ├── dashboard/               # NetWorthCarousel, QuickActionGrid, ExecutiveSummary
│   │   ├── familydocs/              # FamilyDocTrackerModule (Redacted documents)
│   │   ├── fintracker/              # FinTrackerModule, FinTrackerModals
│   │   ├── layout/                  # TopHeader, BottomNavigation
│   │   ├── medicines/               # MedicineTrackerModule, PrescriptionModal
│   │   ├── settings/                # SettingsModule, Theme, Sync, Master PIN & Webhooks
│   │   ├── testing/                 # TestRunnerModal
│   │   ├── vault/                   # PasswordVaultModule (AES-GCM encryption)
│   │   └── whatsapp/                # WhatsAppAlertsModal (CallMeBot & NLP FinBot)
│   ├── hooks/
│   │   └── usePWAInstall.ts         # PWA installation prompt hook
│   ├── services/
│   │   ├── callmebot.service.ts     # CallMeBot WhatsApp webhook integration engine
│   │   ├── crypto.service.ts        # AES-GCM, PBKDF2, SHA-256, Password Generator
│   │   ├── db.service.ts            # Dexie database schema (14 tables), seed data & modes
│   │   ├── google-sheets-sync.service.ts # Apps Script Web App sync & JSON export
│   │   ├── pdf-prescription.service.ts   # jsPDF prescription chart generator
│   │   ├── theme.service.ts         # Dynamic CSS variable theme switcher
│   │   └── whatsapp-parser.service.ts    # Rule-based NLP parser & automated audits
│   ├── types/
│   │   └── db.types.ts              # Full TypeScript interfaces for all 14 tables
│   ├── App.tsx                      # Root application component & state orchestrator
│   ├── index.css                    # Tailwind CSS v4 declarations
│   └── main.tsx                     # React DOM entry point
├── metadata.json                    # Application metadata descriptor
├── package.json                     # NPM packages & scripts
├── tsconfig.json                    # TypeScript compiler configuration
└── vite.config.ts                   # Vite + Tailwind + BASE_PATH config
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0+) or [Bun](https://bun.sh/)
- Modern web browser with Web Crypto API and IndexedDB support

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Deepansri94/iVault-Pro.git
cd iVault-Pro

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📱 WhatsApp Setup (Free 30s Webhook via CallMeBot)

To enable live WhatsApp notifications sent directly to your phone:

1. On your phone, open WhatsApp and send the following message to **`+34 644 44 42 06`**:
   ```text
   I allow callmebot to send me messages
   ```
2. CallMeBot will reply within seconds with your personal **API Key**.
3. In iVault Pro:
   - Tap **WhatsApp** in the top navigation bar (or in **Settings**).
   - Enter your phone number with international country code (e.g. `+919876543210` or `+1234567890`).
   - Enter your **CallMeBot API Key**.
   - Click **Send Test WhatsApp Ping** to verify connectivity, then click **Save Configuration**.

---

### 🛡️ Is CallMeBot Safe to Use? (Security & Privacy Breakdown)

**Yes, for notification alerts.** Here is how iVault Pro ensures bank-grade data security:

| Security Factor | How iVault Pro Protects You |
|---|---|
| **Local Key Storage** | Your CallMeBot API key and phone number are stored **only in your device's IndexedDB**. No central server ever sees or stores them. |
| **No Passwords or Secrets Sent** | iVault Pro strictly filters what is sent. AES-GCM passwords from your Password Vault and redacted document numbers are **never** transmitted. Only operational reminders (e.g. *"Low medicine stock: TAB DOLO 650"* or *"Upcoming EMI due"*) are dispatched. |
| **Direct Client-to-Webhook HTTPS** | Webhook calls are made directly from your browser over TLS/HTTPS (`https://api.callmebot.com`). There is no middleman backend proxy reading your alerts. |
| **Explicit Opt-In Authorization** | Messages can only be sent to the phone number that initiated the handshake message (`I allow callmebot to send me messages`), preventing arbitrary spam. |
| **No Account or Credit Card Needed** | CallMeBot does not require passwords, credit cards, or accounts. |

*Note: For maximum confidentiality, keep your master passwords and bank credentials inside the local AES-GCM Vault—never paste them into external webhooks.*

---

## 📊 Google Sheets Sync Setup (Apps Script)

To automatically synchronize all records with your personal Google Sheet:

1. Create a blank Google Sheet at [sheets.new](https://sheets.new).
2. Go to **Extensions** → **Apps Script**.
3. Replace the content of `Code.gs` with the script from **iVault Pro Settings > Google Apps Script (Code.gs)**.
4. Click **Deploy** → **New Deployment**:
   - Select type: **Web App**
   - Execute as: **Me (`your-email@gmail.com`)**
   - Who has access: **Anyone** *(Crucial: Do not select "Only myself")*
5. Copy the generated Web App URL (`https://script.google.com/macros/s/.../exec`).
6. Paste the URL into **iVault Pro Settings → Google Apps Script Web App URL** and click **Save URL**.

---

## 📈 Live Market Rates in Google Sheets (Gold, Stocks, Mutual Funds)

You can track live prices directly inside your Google Sheet using built-in Google Finance formulas and the enhanced `Code.gs` engine:

### 1. 🟡 Live 24K & 22K Gold Rates (INR / gram)
Google Finance tracks spot gold in INR per Troy Ounce (`CURRENCY:XAUINR`). 1 Troy Ounce = 31.1034768 grams. Factoring in Indian import duties & GST (~12% retail factor):
- **24K Pure Gold (₹/g)**:
  ```text
  =ROUND((GOOGLEFINANCE("CURRENCY:XAUINR") / 31.1034768) * 1.12, 0)
  ```
- **22K Jewellery Gold (₹/g)** (if 24K rate is in cell B2):
  ```text
  =ROUND(B2 * (22 / 24), 0)
  ```
- **NSE Gold ETF (Nippon Gold BeES)**:
  ```text
  =GOOGLEFINANCE("NSE:GOLDBEES", "price")
  ```

### 2. 📊 Live Indian Stocks (NSE / BSE)
Prefix tickers with `NSE:` or `BSE:`:
- **Live Price**: `=GOOGLEFINANCE("NSE:TCS", "price")` or `=GOOGLEFINANCE("NSE:RELIANCE", "price")`
- **Day's Change %**: `=GOOGLEFINANCE("NSE:INFY", "changepct")`
- **52-Week High**: `=GOOGLEFINANCE("NSE:HDFCBANK", "high52")`
- **US Stocks**: `=GOOGLEFINANCE("NASDAQ:GOOGL", "price")`
- **USD/INR FX Rate**: `=GOOGLEFINANCE("CURRENCY:USDINR")`

### 3. 📈 Live Indian Mutual Funds (Official AMFI NAV)
Google Sheets doesn't natively support all non-ETF mutual funds. iVault Pro's enhanced `Code.gs` includes a custom function that fetches the official daily AMFI NAV directly:
- **Formula**:
  ```text
  =GET_MF_NAV(122639)
  ```
  *(Example: `122639` is Parag Parikh Flexi Cap Fund Direct Growth)*
- **Popular AMFI Scheme Codes**:
  - Parag Parikh Flexi Cap: `122639`
  - Mirae Asset Large Cap: `118834`
  - HDFC Balanced Advantage: `101762`
  - Quant Small Cap: `120828`
  - SBI Bluechip: `119598`
  - Nippon India Small Cap: `118778`

### 4. ⚡ Auto-Generate the "Live Market Rates" Sheet
In your Google Sheet, after pasting the enhanced `Code.gs`:
1. In the Apps Script toolbar, select the function **`setupLiveMarketTracker`** and click **Run**.
2. It will automatically create and format a dedicated **`Live Market Rates`** tab with all live formulas pre-configured!

---

## 🌐 GitHub Pages Deployment & Troubleshooting

The repository includes an automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).

### How to Enable Deployment:
1. Go to your repository on GitHub: `https://github.com/Deepansri94/iVault-Pro`
2. Navigate to **⚙️ Settings** → **Pages** (under *Code and automation*).
3. Under **Build and deployment > Source**, select **`GitHub Actions`** (do not leave as *"Deploy from a branch"*).
4. Push a commit to `main` or manually run the workflow from the **Actions** tab.
5. Your application will be live at:
   **`https://deepansri94.github.io/iVault-Pro/`**

> **Note on "Get Pages site failed (HttpError: Not Found)"**:  
> If your GitHub Actions workflow fails on the *Setup GitHub Pages* step, it means step 3 above was missed. Selecting **GitHub Actions** under repository Settings → Pages immediately resolves this.

---

## 🔒 Security & Privacy Model

- **Zero-Knowledge Architecture**: Sensitive credentials and document IDs are encrypted client-side using `AES-GCM` 256-bit before writing to IndexedDB.
- **PBKDF2 Key Derivation**: Uses 100,000 rounds of PBKDF2 with SHA-256 and unique salts.
- **Client-Side SHA-256 PIN**: Master PIN hash is evaluated locally; no plaintext keys are stored.
- **No Third-Party Tracking**: No telemetry, tracking scripts, or external ad SDKs.

---

## 📄 License

This project is licensed under the **Apache-2.0 License** — see the [LICENSE](LICENSE) file for details.
