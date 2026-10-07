/**
 * @file db.types.ts
 * Core domain types and interfaces for iVault Pro
 */

export type ThemeId = 'classic-orange' | 'emerald-wealth' | 'royal-purple' | 'dark-slate' | 'ruby-privilege';

export interface Account {
  id: string;
  name: string;
  accountNumber: string;
  type: 'Savings' | 'Current' | 'Credit Card' | 'Wallet';
  balance: number;
  bankName: string;
  upiId?: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  subcategory?: string;
  date: string;
  paymentMode: 'UPI' | 'Net Banking' | 'Debit Card' | 'Credit Card' | 'Cash';
  familyMember: string;
  notes?: string;
  syncedToSheets?: boolean;
}

export interface Budget {
  id: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  period: 'Monthly' | 'Annual';
  warningThresholdPct: number; // default 80%
}

export interface FixedInvestment {
  id: string;
  name: string;
  type: 'PPF' | 'SSA' | 'RD' | 'FD';
  accountNumberRedacted: string;
  institution: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number; // e.g. 7.1 for PPF, 8.2 for SSA
  monthlyContribution: number;
  startDate: string;
  maturityDate: string;
  familyMember: string;
  notes?: string;
}

export interface DematInvestment {
  id: string;
  name: string;
  symbol: string;
  type: 'Mutual Fund' | 'Stock' | 'SIP' | 'ETF';
  units: number;
  avgBuyPrice: number;
  currentNAV: number;
  investedAmount: number;
  currentValue: number;
  sipFrequency?: 'Monthly' | 'Quarterly' | 'Lumpsum';
  folioNumber?: string;
  familyMember: string;
  lastUpdated: string;
}

export interface GoldHolding {
  id: string;
  itemName: string;
  grams: number;
  karat: '24K' | '22K' | '18K';
  purchaseRatePerGram: number;
  gstPct: number; // typically 3% in India
  makingChargesPct: number; // typically 6% - 15%
  totalLandedCost: number;
  purchaseDate: string;
  familyMember: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface Loan {
  id: string;
  loanName: string;
  bank: string;
  loanType: 'Home Loan' | 'Car Loan' | 'Personal Loan' | 'Education Loan';
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number; // % p.a.
  monthlyEmi: number;
  tenureMonths: number;
  remainingMonths: number;
  emiDueDate: number; // day of month e.g. 5
  autoDebitAccount: string;
  startDate: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  dateOfBirth?: string;
  relationship: 'Self' | 'Spouse' | 'Child' | 'Father' | 'Mother' | 'Sibling' | 'Other';
  status: 'Active' | 'Inactive';
  phone?: string;
  bloodGroup?: string;
  avatarColor: string;
}

export interface FamilyDocument {
  id: string;
  memberId: string;
  memberName: string;
  docType:
    | 'PAN Card'
    | 'Aadhaar Card'
    | "Driver's License"
    | 'Passport'
    | 'Health Insurance'
    | 'Vehicle RC'
    | 'Vehicle Insurance'
    | 'Vehicle Pollution / PUC'
    | 'Vehicle Service & Warranty'
    | 'Vehicle Permit / Tax'
    | 'Voter ID'
    | 'Other';
  docNumberRedacted: string; // e.g. "[Document ID Omitted]" or "XXXX-XXXX-4091"
  docNumberEncrypted: string; // AES-GCM ciphertext
  issueDate: string;
  expiryDate?: string;
  issuer: string;
  vehicleNumber?: string; // Optional vehicle plate / registration number (e.g., TN-01-AB-1234)
  filePreviewUrl?: string;
  fileName?: string;
  fileData?: Blob;
  notes?: string;
}

export interface Medicine {
  id: string;
  memberId: string;
  memberName: string;
  medicineName: string;
  genericComposition?: string; // e.g. "PARACETAMOL 650MG", "AMOXICILLIN 500MG + CLAVULANIC ACID 125MG"
  type: 'Tablet' | 'Capsule' | 'Syrup' | 'Inhaler' | 'Drops' | 'Injection';
  dosage: string; // e.g. "500 mg", "10 ml"
  timings: ('Morning' | 'Afternoon' | 'Night')[];
  duration?: string; // e.g. "5 DAYS", "30 DAYS", "ONGOING"
  instructions: 'Before Food' | 'After Food' | 'With Food' | 'Anytime';
  dailyQuantity: number;
  currentStock: number;
  minRefillThreshold: number;
  lastDoseTakenAt?: string;
  doctorNotes?: string;
}

export interface VaultCredential {
  id: string;
  title: string;
  username: string;
  encryptedPassword: string; // AES-GCM base64
  iv: string; // AES-GCM IV base64
  salt: string; // PBKDF2 salt base64
  url?: string;
  category: 'Banking' | 'Email' | 'Govt Portal' | 'Shopping' | 'Social' | 'Work' | 'Other';
  notes?: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: string;
  timestamp: string;
  entityType: 'transaction' | 'budget' | 'fixed_invest' | 'demat' | 'gold' | 'loan' | 'member' | 'document' | 'medicine' | 'vault';
  action: 'insert' | 'update' | 'delete';
  payload: string; // JSON string
  status: 'pending' | 'failed' | 'synced';
}

/**
 * Application In-App & Desktop Notification definition
 */
export interface AppNotification {
  /** Unique notification ID */
  id: string;
  /** ISO-8601 creation timestamp */
  timestamp: string;
  /** Notification category type */
  type: 'budget' | 'loan' | 'medicine' | 'doc_expiry' | 'birthday' | 'system';
  /** Alert title banner */
  title: string;
  /** Detailed human-readable alert message */
  message: string;
  /** Visual urgency severity level */
  severity: 'warning' | 'info' | 'danger' | 'success';
  /** Whether the notification has been read by user */
  read: boolean;
  /** Optional target navigation tab when clicked */
  linkTab?: string;
}

/**
 * Global Application Configuration & User Preferences
 */
export interface AppSettings {
  /** Fixed singleton settings key ('default') */
  id: string;
  /** Selected UI color palette theme */
  theme: ThemeId;
  /** SHA-256 hashed master PIN for vault unlock */
  masterPinHash?: string;
  /** Google Sheets Web App endpoint URL for cloud sync */
  sheetsWebappUrl?: string;
  /** Whether automatic background sync to sheets is enabled */
  autoSyncEnabled: boolean;
  /** Per-gram 24K pure gold rate in INR */
  liveGold24kRate: number;
  /** Per-gram 22K standard gold rate in INR */
  liveGold22kRate: number;
  /** ISO timestamp of last successful cloud sync */
  lastSyncTime?: string;
  /** Master switch for in-app alert notifications */
  notificationsEnabled: boolean;
  /** Application data profile mode */
  sessionMode?: 'demo' | 'live';
  /** Whether browser desktop notifications (Web Notification API) are enabled */
  desktopNotificationsEnabled?: boolean;
  /** Budget alert warning trigger percentage threshold (e.g., 80%) */
  budgetAlertThresholdPct?: number;
  /** Whether medicine low-stock warning audits are enabled */
  medicineLowStockAlerts?: boolean;
  /** Whether loan EMI 5-day advance alerts are enabled */
  loanEmiAlerts?: boolean;
  /** Whether family document 30-day expiry alerts are enabled */
  documentExpiryAlerts?: boolean;
  /** Whether daily recurring medication doses are auto-deducted */
  autoLogDosagesEnabled?: boolean;
  /** YYYY-MM-DD string of the last date dosages were auto-deducted */
  lastAutoDosageDate?: string;
}
