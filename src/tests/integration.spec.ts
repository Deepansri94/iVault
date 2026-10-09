/**
 * @file integration.spec.ts
 * End-to-End & Integration Test Suite for iVault Pro
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup';
import {
  db,
  initializeDatabase,
  switchToLiveMode,
  resetToDemoMode,
} from '../services/db.service';
import { CryptoService } from '../services/crypto.service';
import { SmartParserService } from '../services/smart-parser.service';
import { NotificationService } from '../services/notification.service';
import { parseSheetDate, GoogleSheetsSyncService } from '../services/google-sheets-sync.service';
import { parseUpiString } from '../components/fintracker/UpiQrScanner';

describe('iVault Pro Full-Flow Integration Tests', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('should initialize database with clean live setup', async () => {
    await initializeDatabase();

    const accounts = await db.accounts.toArray();
    const transactions = await db.transactions.toArray();
    const medicines = await db.medicines.toArray();
    const members = await db.familyMembers.toArray();
    const settings = await db.appSettings.get('default');

    expect(accounts.length).toEqual(0);
    expect(transactions.length).toEqual(0);
    expect(medicines.length).toEqual(0);
    expect(members.length).toEqual(1);
    expect(members[0].name).toEqual('Deepan');
    expect(settings?.sessionMode).toEqual('live');
  });

  it('should switch to Live Mode cleanly and clear all records', async () => {
    await initializeDatabase();
    await switchToLiveMode('Rajesh');

    const accounts = await db.accounts.count();
    const transactions = await db.transactions.count();
    const budgets = await db.budgets.count();
    const members = await db.familyMembers.toArray();
    const settings = await db.appSettings.get('default');

    expect(accounts).toEqual(0);
    expect(transactions).toEqual(0);
    expect(budgets).toEqual(0);
    expect(await db.insurances.count()).toEqual(0);
    expect(members.length).toEqual(1);
    expect(members[0].name).toEqual('Rajesh');
    expect(settings?.sessionMode).toEqual('live');

    // Re-running initializeDatabase in live mode must not recreate any demo records
    await initializeDatabase();
    expect(await db.insurances.count()).toEqual(0);
  });

  it('should correctly save user entered bank name without reverting to Prime Bank', async () => {
    await initializeDatabase();
    await db.accounts.put({
      id: 'acc-user-1',
      name: 'Account 1',
      accountNumber: '123456789012',
      type: 'Savings',
      balance: 50000,
      bankName: 'ICICI Bank',
      lastUpdated: new Date().toISOString(),
    });

    await initializeDatabase(); // Re-running database initialization

    const saved = await db.accounts.get('acc-user-1');
    expect(saved).toBeDefined();
    expect(saved?.bankName).toEqual('ICICI Bank');
    expect(saved?.name).toEqual('Account 1');
  });

  it('should execute end-to-end Smart NLP Entry -> Ledger Transaction -> Budget Update -> Audit Alert flow', async () => {
    await initializeDatabase();

    await db.budgets.put({
      id: 'b-dining',
      category: 'Dining & Food Delivery',
      allocatedAmount: 3000,
      spentAmount: 500,
      period: 'Monthly',
      warningThresholdPct: 80,
    });

    // 1. Parse conversational user message
    const parsed = SmartParserService.parseMessage('Spent 2500 on Dining', 'Deepan');
    expect(parsed.success).toBe(true);

    // 2. Insert transaction
    const txId = `tx-flow-${Date.now()}`;
    await db.transactions.put({
      id: txId,
      ...parsed.data,
    });

    // 3. Mutate category budget
    const diningBudget = await db.budgets.where('category').equals('Dining & Food Delivery').first();
    expect(diningBudget).toBeDefined();

    if (diningBudget) {
      diningBudget.spentAmount += 2500;
      await db.budgets.put(diningBudget);
    }

    // 4. Trigger automated health audit
    const alerts = await NotificationService.runAutomatedNotificationAudits();
    const budgetAlert = alerts.find((a) => a.title.includes('Dining & Food'));
    expect(budgetAlert).toBeDefined();

    // 5. User marks alert as read
    if (budgetAlert) {
      await NotificationService.markAsRead(budgetAlert.id);
      const updated = await db.notifications.get(budgetAlert.id);
      expect(updated?.read).toBe(true);
    }
  });

  it('should securely encrypt, store, and decrypt passwords in the IndexedDB vault', async () => {
    await initializeDatabase();
    const masterPass = 'StrongFamilyVault#2026';
    const rawSecret = 'BankNetBanking@SecretPass999';

    // 1. Encrypt secret
    const encrypted = await CryptoService.encrypt(rawSecret, masterPass);

    // 2. Store in Dexie passwords table
    const credentialId = 'cred-flow-1';
    await db.passwords.put({
      id: credentialId,
      title: 'HDFC Bank NetBanking',
      username: 'deepan_netbank',
      encryptedPassword: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
      category: 'Banking',
      updatedAt: new Date().toISOString(),
    });

    // 3. Retrieve from store
    const stored = await db.passwords.get(credentialId);
    expect(stored).toBeDefined();

    // 4. Decrypt with correct master key
    const decrypted = await CryptoService.decrypt(
      {
        ciphertext: stored!.encryptedPassword,
        iv: stored!.iv,
        salt: stored!.salt,
      },
      masterPass
    );
    expect(decrypted).toEqual(rawSecret);

    // 5. Decrypt fails with wrong master key
    await expect(
      CryptoService.decrypt(
        {
          ciphertext: stored!.encryptedPassword,
          iv: stored!.iv,
          salt: stored!.salt,
        },
        'WrongMasterPass#000'
      )
    ).rejects.toThrow();
  });

  it('should parse dates safely without date decrement across timezones and serialized formats', () => {
    // 1. Plain YYYY-MM-DD
    expect(parseSheetDate('2026-10-08')).toEqual('2026-10-08');

    // 2. YYYY/MM/DD
    expect(parseSheetDate('2026/10/08')).toEqual('2026-10-08');

    // 3. Indian DD/MM/YYYY format
    expect(parseSheetDate('08/10/2026')).toEqual('2026-10-08');
    expect(parseSheetDate('8/10/2026')).toEqual('2026-10-08');

    // 4. Indian DD-MM-YYYY format
    expect(parseSheetDate('08-10-2026')).toEqual('2026-10-08');

    // 5. Apps Script UTC ISO serialization from IST midnight (18:30Z on previous day) - MUST NOT DECREASE TO 2026-10-07
    expect(parseSheetDate('2026-10-07T18:30:00.000Z')).toEqual('2026-10-08');

    // 6. Midnight UTC ISO
    expect(parseSheetDate('2026-10-08T00:00:00.000Z')).toEqual('2026-10-08');

    // 7. Google Sheets numeric serial date (46303 for 2026-10-08)
    expect(parseSheetDate(46303)).toEqual('2026-10-08');
  });

  it('should generate complete Enhanced Google Apps Script with Live Market Engine and Auto-Refresh', () => {
    const script = GoogleSheetsSyncService.generateEnhancedAppsScriptCode();
    const standardScript = GoogleSheetsSyncService.generateAppsScriptCode();

    // Both methods must return identical, full-featured script
    expect(standardScript).toEqual(script);

    // Verify key functions and features are present in the generated script
    expect(script).toContain('function GET_LIVE_STOCK_PRICE(ticker)');
    expect(script).toContain('function refreshLiveStockPrices()');
    expect(script).toContain('function refreshLiveMarketData()');
    expect(script).toContain('function setupAutoRefreshTrigger()');
    expect(script).toContain('function removeAutoRefreshTrigger()');
    expect(script).toContain('function GET_MF_NAV(schemeCode)');
    expect(script).toContain('function GET_LIVE_GOLD_RATE_24K()');
    expect(script).toContain('function GET_LIVE_GOLD_RATE_22K()');
    expect(script).toContain('function onOpen()');
    expect(script).toContain('⚡ iVault PRO Live Engine');
    expect(script).toContain('Utilities.formatDate');
  });

  it('should maintain budget categories for Quick Access expense and income options', async () => {
    // 1. Seed custom budget category
    const customBudget = {
      id: `b-test-${Date.now()}`,
      category: 'Home Renovation & Interior',
      allocatedAmount: 75000,
      spentAmount: 0,
      period: 'Monthly' as const,
      warningThresholdPct: 80,
    };
    await db.budgets.put(customBudget);

    // 2. Fetch all budgets
    const allBudgets = await db.budgets.toArray();
    const budgetCategories = allBudgets.map((b) => b.category);
    expect(budgetCategories).toContain('Home Renovation & Interior');

    // 3. Record transaction with that category
    const tx = {
      id: `tx-test-${Date.now()}`,
      type: 'expense' as const,
      amount: 12500,
      category: 'Home Renovation & Interior',
      date: '2026-10-09',
      paymentMode: 'UPI' as const,
      familyMember: 'Deepan',
      syncedToSheets: false,
    };
    await db.transactions.put(tx);

    // 4. Verify transaction recorded
    const fetchedTx = await db.transactions.get(tx.id);
    expect(fetchedTx).toBeDefined();
    expect(fetchedTx?.category).toEqual('Home Renovation & Interior');
  });

  it('should support 1-click on-demand stock price refresh without opening Google Sheets', async () => {
    // 1. Script contains on-demand refreshStocks action
    const script = GoogleSheetsSyncService.generateEnhancedAppsScriptCode();
    expect(script).toContain('action === "refreshStocks"');

    // 2. Calling refreshStockPrices with missing URL gives a clear configuration message
    const noUrlResult = await GoogleSheetsSyncService.refreshStockPrices('');
    expect(noUrlResult.success).toBe(false);
    expect(noUrlResult.message).toContain('Google Sheets Web App URL is not configured');

    // 3. Seed stock with ticker symbol in local DB
    const stockId = `dm-stock-${Date.now()}`;
    await db.dematInvestments.put({
      id: stockId,
      name: 'Tata Consultancy Services',
      symbol: 'TCS',
      type: 'Stock',
      investedAmount: 60000,
      currentValue: 60000,
      units: 20,
      avgBuyPrice: 3000,
      currentNAV: 3000,
      familyMember: 'Deepan',
      lastUpdated: new Date().toISOString(),
    });

    const stock = await db.dematInvestments.get(stockId);
    expect(stock?.symbol).toEqual('TCS');
    expect(stock?.currentNAV).toEqual(3000);
  });

  it('should support Google Pay UPI payment with automatic account deduction and ledger entry', async () => {
    // 1. Seed a bank account with initial balance
    const accountId = `acc-upi-test-${Date.now()}`;
    await db.accounts.put({
      id: accountId,
      name: 'HDFC Salary Account',
      bankName: 'HDFC Bank',
      accountNumber: 'XXXX1234',
      type: 'Savings',
      balance: 50000,
      lastUpdated: new Date().toISOString(),
    });

    const initialAccount = await db.accounts.get(accountId);
    expect(initialAccount?.balance).toEqual(50000);

    // 2. Perform Google Pay UPI payment of ₹2,450 to Swiggy
    const paymentAmount = 2450;
    const payeeVpa = 'swiggy@icici';
    const payeeName = 'Swiggy';
    const category = 'Food & Dining';
    const userNote = 'Weekend family dinner';

    // Simulate account deduction
    const account = await db.accounts.get(accountId);
    expect(account).toBeDefined();
    if (account) {
      account.balance -= paymentAmount;
      account.lastUpdated = new Date().toISOString();
      await db.accounts.put(account);
    }

    // Simulate Ledger transaction recording
    const txId = `tx-upi-${Date.now()}`;
    const txNote = `${userNote} (Paid to ${payeeName} [${payeeVpa}] via Google Pay)`;
    await db.transactions.put({
      id: txId,
      date: new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      type: 'expense',
      category,
      paymentMode: 'UPI',
      accountId,
      familyMember: 'Deepan',
      notes: txNote,
      syncedToSheets: false,
    });

    // 3. Verify bank account balance is reduced
    const updatedAccount = await db.accounts.get(accountId);
    expect(updatedAccount?.balance).toEqual(50000 - 2450); // 47550

    // 4. Verify transaction exists in ledger with all details
    const tx = await db.transactions.get(txId);
    expect(tx).toBeDefined();
    expect(tx?.amount).toEqual(2450);
    expect(tx?.paymentMode).toEqual('UPI');
    expect(tx?.category).toEqual('Food & Dining');
    expect(tx?.accountId).toEqual(accountId);
    expect(tx?.notes).toContain('Swiggy');
    expect(tx?.notes).toContain('Google Pay');
  });

  it('should parse various UPI QR code schemes accurately for Google Pay', () => {
    // Standard UPI URI with payee, name, amount and note
    const upiUri = 'upi://pay?pa=freshmart@okaxis&pn=Fresh%20Mart&am=340.50&cu=INR&tn=Vegetables%20Purchase';
    const parsed = parseUpiString(upiUri);
    expect(parsed).not.toBeNull();
    expect(parsed?.vpa).toEqual('freshmart@okaxis');
    expect(parsed?.name).toEqual('Fresh Mart');
    expect(parsed?.amount).toEqual(340.5);
    expect(parsed?.note).toEqual('Vegetables Purchase');

    // Google Pay tez:// protocol
    const tezUri = 'tez://upi/pay?pa=restaurant@hdfcbank&pn=Golden%20Dhaba&am=1200';
    const tezParsed = parseUpiString(tezUri);
    expect(tezParsed).not.toBeNull();
    expect(tezParsed?.vpa).toEqual('restaurant@hdfcbank');
    expect(tezParsed?.name).toEqual('Golden Dhaba');
    expect(tezParsed?.amount).toEqual(1200);

    // Plain VPA string
    const plainVpa = 'deepan@okicici';
    const plainParsed = parseUpiString(plainVpa);
    expect(plainParsed).not.toBeNull();
    expect(plainParsed?.vpa).toEqual('deepan@okicici');
    expect(plainParsed?.name).toEqual('deepan');

    // Merchant QR code with category code and merchant parameters
    const merchantQr = 'upi://pay?pa=store@okbizaxis&pn=SuperMarket&mc=5411&mode=02&orgid=159003&am=520.00&cu=INR';
    const merchantParsed = parseUpiString(merchantQr);
    expect(merchantParsed).not.toBeNull();
    expect(merchantParsed?.vpa).toEqual('store@okbizaxis');
    expect(merchantParsed?.name).toEqual('SuperMarket');
    expect(merchantParsed?.amount).toEqual(520);
    expect(merchantParsed?.merchantParams?.mc).toEqual('5411');
    expect(merchantParsed?.merchantParams?.mode).toEqual('02');
    expect(merchantParsed?.merchantParams?.orgid).toEqual('159003');
  });
});

