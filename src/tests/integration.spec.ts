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

describe('iVault Pro Full-Flow Integration Tests', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('should initialize database with complete production-grade demo dataset', async () => {
    await initializeDatabase();

    const accounts = await db.accounts.toArray();
    const transactions = await db.transactions.toArray();
    const budgets = await db.budgets.toArray();
    const medicines = await db.medicines.toArray();
    const members = await db.familyMembers.toArray();
    const settings = await db.appSettings.get('default');

    expect(accounts.length).toBeGreaterThanOrEqual(3);
    expect(transactions.length).toBeGreaterThanOrEqual(4);
    expect(budgets.length).toBeGreaterThanOrEqual(4);
    expect(medicines.length).toBeGreaterThanOrEqual(3);
    expect(members.length).toBeGreaterThanOrEqual(2);
    expect(settings?.sessionMode).toEqual('demo');
  });

  it('should switch to Live Mode cleanly and clear all demo records', async () => {
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
    expect(members.length).toEqual(1);
    expect(members[0].name).toEqual('Rajesh');
    expect(settings?.sessionMode).toEqual('live');
  });

  it('should reset back to Demo Mode with restored sample data', async () => {
    await initializeDatabase();
    await switchToLiveMode('TestUser');
    expect(await db.transactions.count()).toEqual(0);

    await resetToDemoMode();
    expect(await db.transactions.count()).toBeGreaterThanOrEqual(4);
    const settings = await db.appSettings.get('default');
    expect(settings?.sessionMode).toEqual('demo');
  });

  it('should execute end-to-end Smart NLP Entry -> Ledger Transaction -> Budget Update -> Audit Alert flow', async () => {
    await initializeDatabase();

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
      title: 'Prime Bank NetBanking',
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
});
