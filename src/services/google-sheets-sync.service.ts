/**
 * @file google-sheets-sync.service.ts
 * Google Sheets / Google Apps Script Web App Cloud Sync, Backup, and Pull Engine
 */

import { db } from './db.service';

export interface SyncStatusResult {
  success: boolean;
  message: string;
  syncedTabs: string[];
  totalRecordsSynced: number;
  timestamp: string;
}

export class GoogleSheetsSyncService {
  /**
   * Structured Google Sheets tab names matching architecture
   */
  public static readonly SHEETS_TABS = [
    'Dashboard',
    'Savings Accounts',
    'Income',
    'Expenses',
    'Budgets',
    'Investments (PPF, SSA, RDs)',
    'Demat & Mutual Funds (SIPs, Stocks)',
    'Gold Holdings & Live Tracking',
    'Loans & EMIs',
    'People & Households',
    'Family Documents',
    'Medicines',
    'Passwords (Encrypted Store)',
  ] as const;

  /**
   * Export all local database tables into structured Sheets-compatible payload
   */
  public static async prepareCloudPayload() {
    const [
      accounts,
      transactions,
      budgets,
      fixedInvestments,
      dematInvestments,
      goldHoldings,
      loans,
      familyMembers,
      familyDocuments,
      medicines,
      passwords,
      settings,
    ] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.toArray(),
      db.budgets.toArray(),
      db.fixedInvestments.toArray(),
      db.dematInvestments.toArray(),
      db.goldHoldings.toArray(),
      db.loans.toArray(),
      db.familyMembers.toArray(),
      db.familyDocuments.toArray(),
      db.medicines.toArray(),
      db.passwords.toArray(),
      db.appSettings.get('default'),
    ]);

    const incomeRows = transactions
      .filter((t) => t.type === 'income')
      .map((t) => ({
        ID: t.id,
        Date: t.date,
        Category: t.category,
        Subcategory: t.subcategory || '',
        Amount: t.amount,
        PaymentMode: t.paymentMode,
        FamilyMember: t.familyMember,
        Notes: t.notes || '',
      }));

    const expenseRows = transactions
      .filter((t) => t.type === 'expense')
      .map((t) => ({
        ID: t.id,
        Date: t.date,
        Category: t.category,
        Subcategory: t.subcategory || '',
        Amount: t.amount,
        PaymentMode: t.paymentMode,
        FamilyMember: t.familyMember,
        Notes: t.notes || '',
      }));

    const savingsAccountRows = accounts.map((account) => ({
      ID: account.id,
      Name: account.name,
      Bank: account.bankName,
      Type: account.type,
      AccountNumberLast4: account.accountNumber.slice(-4),
      Balance: account.balance,
      LastUpdated: account.lastUpdated,
    }));

    const budgetRows = budgets.map((b) => ({
      ID: b.id,
      Category: b.category,
      MonthlyLimit: b.allocatedAmount,
      Spent: b.spentAmount,
    }));

    const fixedRows = fixedInvestments.map((f) => ({
      ID: f.id,
      Name: f.name,
      Type: f.type,
      Member: f.familyMember,
      CurrentBalance: f.currentBalance,
      MonthlyContribution: f.monthlyContribution,
      MaturityDate: f.maturityDate,
    }));

    const dematRows = dematInvestments.map((d) => ({
      ID: d.id,
      Name: d.name,
      Type: d.type,
      Member: d.familyMember,
      InvestedAmount: d.investedAmount,
      CurrentValue: d.currentValue,
    }));

    const goldRows = goldHoldings.map((g) => ({
      ID: g.id,
      ItemName: g.itemName,
      Grams: g.grams,
      Karat: g.karat,
      LandedCost: g.totalLandedCost,
      PurchaseDate: g.purchaseDate,
      Member: g.familyMember,
    }));

    const loanRows = loans.map((l) => ({
      ID: l.id,
      LoanName: l.loanName,
      Bank: l.bank,
      Outstanding: l.outstandingBalance,
      MonthlyEMI: l.monthlyEmi,
      DueDate: l.emiDueDate,
    }));

    const memberRows = familyMembers.map((m) => ({
      ID: m.id,
      Name: m.name,
      Age: m.age,
      DOB: m.dateOfBirth || '',
      Relationship: m.relationship,
      BloodGroup: m.bloodGroup || '',
    }));

    const documentRows = familyDocuments.map((d) => ({
      ID: d.id,
      MemberName: d.memberName,
      DocumentType: d.docType,
      DocumentNumber: '[Document ID Omitted]',
      IssueDate: d.issueDate,
      ExpiryDate: d.expiryDate || 'N/A',
      Issuer: d.issuer,
    }));

    const medicineRows = medicines.map((med) => ({
      ID: med.id,
      Member: med.memberName,
      Medicine: med.medicineName,
      Type: med.type,
      Dosage: med.dosage,
      CurrentStock: med.currentStock,
      Threshold: med.minRefillThreshold,
    }));

    const passwordRows = passwords.map((p) => ({
      ID: p.id,
      Title: p.title,
      Username: p.username,
      Category: p.category,
    }));

    const dashboardSummary = [
      {
        Metric: 'Total Accounts Balance',
        Value: accounts.reduce((acc, a) => acc + a.balance, 0),
        Timestamp: new Date().toISOString(),
      },
      {
        Metric: 'Total Investments',
        Value:
          fixedInvestments.reduce((acc, f) => acc + f.currentBalance, 0) +
          dematInvestments.reduce((acc, d) => acc + d.currentValue, 0),
        Timestamp: new Date().toISOString(),
      },
      {
        Metric: 'Total Debt / Loans',
        Value: loans.reduce((acc, l) => acc + l.outstandingBalance, 0),
        Timestamp: new Date().toISOString(),
      },
    ];

    return {
      timestamp: new Date().toISOString(),
      tabs: {
        Dashboard: dashboardSummary,
        'Savings Accounts': savingsAccountRows,
        Income: incomeRows,
        Expenses: expenseRows,
        Budgets: budgetRows,
        'Investments (PPF, SSA, RDs)': fixedRows,
        'Demat & Mutual Funds (SIPs, Stocks)': dematRows,
        'Gold Holdings & Live Tracking': goldRows,
        'Loans & EMIs': loanRows,
        'People & Households': memberRows,
        'Family Documents': documentRows,
        Medicines: medicineRows,
        'Passwords (Encrypted Store)': passwordRows,
      },
    };
  }

  /**
   * Synchronize local IndexedDB data to Google Sheets Web App via POST
   */
  public static async syncWithGoogleAppsScript(webappUrl: string): Promise<SyncStatusResult> {
    if (!webappUrl || !webappUrl.startsWith('http')) {
      return {
        success: false,
        message: 'Invalid or missing Google Sheets Web App URL in settings.',
        syncedTabs: [],
        totalRecordsSynced: 0,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const payload = await this.prepareCloudPayload();
      const response = await fetch(webappUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      const totalRecords = Object.values(payload.tabs).reduce(
        (acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0),
        0
      );

      return {
        success: true,
        message: `Successfully synced ${totalRecords} records across ${Object.keys(payload.tabs).length} tabs to Google Sheets!`,
        syncedTabs: Object.keys(payload.tabs),
        totalRecordsSynced: totalRecords,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        message: `Cloud sync failed: ${err instanceof Error ? err.message : String(err)}`,
        syncedTabs: [],
        totalRecordsSynced: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Pull and reload IndexedDB data from Google Sheets (trusted cloud data reload)
   */
  public static async pullFromGoogleSheets(webappUrl: string): Promise<SyncStatusResult> {
    if (!webappUrl || !webappUrl.startsWith('http')) {
      return {
        success: false,
        message: 'Invalid or missing Google Sheets Web App URL in settings.',
        syncedTabs: [],
        totalRecordsSynced: 0,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${webappUrl}?action=pull`, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.tabs) {
        // If sheet data has transactions / accounts, reload into IndexedDB
        if (Array.isArray(data.tabs.Expenses) || Array.isArray(data.tabs.Income)) {
          const allTx = [...(data.tabs.Income || []), ...(data.tabs.Expenses || [])];
          for (const tx of allTx) {
            await db.transactions.put({
              id: tx.ID || `tx-${Math.random()}`,
              type: tx.Category === 'Salary' ? 'income' : 'expense',
              amount: parseFloat(tx.Amount) || 0,
              category: tx.Category || 'General',
              subcategory: tx.Subcategory || undefined,
              date: tx.Date || new Date().toISOString().split('T')[0],
              paymentMode: tx.PaymentMode || 'UPI',
              familyMember: tx.FamilyMember || 'Deepan',
              notes: tx.Notes || undefined,
              syncedToSheets: true,
            });
          }
        }
      }

      return {
        success: true,
        message: 'Successfully reloaded IndexedDB data from trusted Google Sheet source!',
        syncedTabs: Object.keys(data?.tabs || {}),
        totalRecordsSynced: 1,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to pull data from Google Sheet (ensure CORS or Web App GET handler is configured): ${err instanceof Error ? err.message : String(err)}`,
        syncedTabs: [],
        totalRecordsSynced: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate Google Apps Script code for Code.gs
   */
  public static generateAppsScriptCode(): string {
    return `/**
 * iVault Pro - Google Apps Script Web App Backend & Live Market Engine
 */
function doPost(e) {
  try {
    var raw = e.parameter.data || (e.postData && e.postData.contents) || '{}';
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.tabs) {
      for (var tabName in data.tabs) {
        var rows = data.tabs[tabName];
        if (!Array.isArray(rows)) continue;

        var sheet = ss.getSheetByName(tabName);
        if (!sheet) {
          sheet = ss.insertSheet(tabName);
        }

        if (rows.length === 0) {
          sheet.clearContents();
          continue;
        }

        sheet.clear();
        var headers = Object.keys(rows[0]);
        var values = [headers];

        for (var i = 0; i < rows.length; i++) {
          var row = [];
          for (var j = 0; j < headers.length; j++) {
            var val = rows[i][headers[j]];
            row.push(val !== undefined && val !== null ? String(val) : '');
          }
          values.push(row);
        }

        sheet.getRange(1, 1, values.length, headers.length).setValues(values);
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setBackground('#064E3B');
        headerRange.setFontColor('#FFFFFF');
        headerRange.setFontWeight('bold');
        sheet.autoResizeColumns(1, headers.length);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'status';
  if (action === 'pull') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var tabs = {};
    for (var i = 0; i < sheets.length; i++) {
      var sh = sheets[i];
      var name = sh.getName();
      var data = sh.getDataRange().getValues();
      if (data.length > 1) {
        var headers = data[0];
        var rows = [];
        for (var r = 1; r < data.length; r++) {
          var obj = {};
          for (var c = 0; c < headers.length; c++) {
            obj[headers[c]] = data[r][c];
          }
          rows.push(obj);
        }
        tabs[name] = rows;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', tabs: tabs })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'online', appName: 'iVault Pro Sync' })).setMimeType(ContentService.MimeType.JSON);
}`;
  }

  /**
   * Export backup as JSON file
   */
  public static async exportBackupFile(): Promise<void> {
    const payload = await this.prepareCloudPayload();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `iVault_Pro_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
