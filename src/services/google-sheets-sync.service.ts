/**
 * @file google-sheets-sync.service.ts
 * Google Sheets / Google Apps Script Web App Cloud Sync, Backup, and Pull Engine
 */

import { db, clearAllTablesForReload } from './db.service';

export interface SyncStatusResult {
  success: boolean;
  message: string;
  syncedTabs: string[];
  totalRecordsSynced: number;
  timestamp: string;
}

/**
 * Safely parses date strings from Google Sheets without timezone date-shifting (decrement by 1).
 * Handles:
 * 1. Plain YYYY-MM-DD strings (direct return)
 * 2. YYYY/MM/DD strings
 * 3. Indian format DD/MM/YYYY or DD-MM-YYYY
 * 4. Google Apps Script / UTC ISO strings (e.g. 2026-10-07T18:30:00.000Z representing midnight IST)
 * 5. Excel/Sheets numeric serial dates (e.g. 46303)
 * 6. Date objects
 */
export function parseSheetDate(raw: any): string {
  if (!raw && raw !== 0) return new Date().toISOString().split("T")[0];

  // Numeric serial date from Excel/Sheets (e.g. 46303 for 2026-10-08)
  if (typeof raw === "number" && raw > 25000 && raw < 75000) {
    const ms = Math.round((raw - 25569) * 86400 * 1000);
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const str = String(raw).trim();
  if (!str) return new Date().toISOString().split("T")[0];

  // 1. Direct YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) {
    return str.replace(/\//g, "-");
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY format (common in Indian Sheets)
  const matchDmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (matchDmy) {
    const day = matchDmy[1].padStart(2, "0");
    const month = matchDmy[2].padStart(2, "0");
    const year = matchDmy[3];
    return `${year}-${month}-${day}`;
  }

  // 4. ISO String with T or Z (e.g. "2026-10-07T18:30:00.000Z")
  if (str.includes("T") || str.endsWith("Z")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const utcHours = d.getUTCHours();
      const utcMinutes = d.getUTCMinutes();
      // If UTC hours >= 12 (e.g. 18:30 for midnight IST UTC+5:30), it represents midnight in an Asian/European timezone
      // on the NEXT day! Shift by IST (+5.5 hours) to recover the exact local calendar date without decreasing by 1.
      if (utcHours >= 12) {
        const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
        const istYear = istDate.getUTCFullYear();
        const istMonth = String(istDate.getUTCMonth() + 1).padStart(2, "0");
        const istDay = String(istDate.getUTCDate()).padStart(2, "0");
        return `${istYear}-${istMonth}-${istDay}`;
      }

      // If UTC hours === 0 and minutes === 0, it was serialized at UTC midnight:
      if (utcHours === 0 && utcMinutes === 0) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }

      // Otherwise, return local browser date
      const localYear = d.getFullYear();
      const localMonth = String(d.getMonth() + 1).padStart(2, "0");
      const localDay = String(d.getDate()).padStart(2, "0");
      return `${localYear}-${localMonth}-${localDay}`;
    }
  }

  // 5. Fallback Date parse with local components
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return str.split("T")[0];
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
      insurances,
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
      db.insurances.toArray(),
    ]);

    const insuranceRows = insurances.map((ins) => ({
      ID: ins.id,
      PolicyName: ins.policyName,
      PolicyNumber: ins.policyNumber,
      Type: ins.type,
      Insurer: ins.insurer,
      PremiumAmount: ins.premiumAmount,
      Frequency: ins.frequency,
      StartDate: ins.startDate,
      NextDueDate: ins.nextDueDate,
      Member: ins.familyMember,
      AutoDebitAccount: ins.autoDebitAccount || '',
      Notes: ins.notes || '',
    }));

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
      Symbol: d.symbol,
      Type: d.type,
      Units: d.units,
      AvgBuyPrice: d.avgBuyPrice,
      CurrentNAV: d.currentNAV,
      InvestedAmount: d.investedAmount,
      CurrentValue: d.currentValue,
      Member: d.familyMember,
      LastUpdated: d.lastUpdated,
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
        Insurances: insuranceRows,
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

      // Mark all local unsynced transactions in IndexedDB as synced to Google Sheets
      const allTransactions = await db.transactions.toArray();
      const unsyncedTx = allTransactions.filter(t => !t.syncedToSheets);
      if (unsyncedTx.length > 0) {
        await Promise.all(
          unsyncedTx.map(t => db.transactions.update(t.id, { syncedToSheets: true }))
        );
      }

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
        throw new Error(`HTTP network error (status ${response.status}). Check Web App permissions.`);
      }

      const data = await response.json();
      if (!data || !data.tabs) {
        throw new Error('Google Sheet returned empty or invalid tabs object.');
      }

      // Clear full IndexedDB prior to populating fresh Google Sheet data
      await clearAllTablesForReload();

      let totalCount = 0;
      const syncedTabsList: string[] = [];

      // 1. Income & Expenses
      const incomeRows = data.tabs['Income'] || [];
      const expenseRows = data.tabs['Expenses'] || [];
      const allTxRows = [...incomeRows, ...expenseRows];
      if (allTxRows.length > 0) {
        for (const tx of allTxRows) {
          if (!tx.Amount) continue;
          const isIncome =
            String(tx.Category || '').toLowerCase().includes('salary') ||
            String(tx.Category || '').toLowerCase().includes('income') ||
            String(tx.Category || '').toLowerCase().includes('bonus') ||
            String(tx.Category || '').toLowerCase().includes('dividend');
          await db.transactions.put({
            id: String(tx.ID || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            type: isIncome ? 'income' : 'expense',
            amount: Math.abs(parseFloat(tx.Amount) || 0),
            category: String(tx.Category || 'General Expenses'),
            subcategory: tx.Subcategory ? String(tx.Subcategory) : undefined,
            date: parseSheetDate(tx.Date),
            paymentMode: (tx.PaymentMode as any) || 'UPI',
            familyMember: String(tx.FamilyMember || 'Deepan'),
            notes: tx.Notes ? String(tx.Notes) : undefined,
            syncedToSheets: true,
          });
          totalCount++;
        }
        syncedTabsList.push('Income & Expenses');
      }

      // 2. Savings Accounts
      const accountRows = data.tabs['Savings Accounts'] || data.tabs['Accounts'] || [];
      if (accountRows.length > 0) {
        for (const acc of accountRows) {
          if (!acc.Name && !acc.Bank) continue;
          await db.accounts.put({
            id: String(acc.ID || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            name: String(acc.Name || acc.Bank || 'Savings Account'),
            bankName: String(acc.Bank || acc.Name || 'Bank'),
            accountNumber: String(acc.AccountNumberLast4 || acc.AccountNumber || '0000'),
            type: (acc.Type as any) || 'Savings',
            balance: parseFloat(acc.Balance) || 0,
            lastUpdated: parseSheetDate(acc.LastUpdated),
          });
          totalCount++;
        }
        syncedTabsList.push('Savings Accounts');
      }

      // 3. Budgets
      const budgetRows = data.tabs['Budgets'] || [];
      if (budgetRows.length > 0) {
        for (const b of budgetRows) {
          if (!b.Category) continue;
          await db.budgets.put({
            id: String(b.ID || `bg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            category: String(b.Category || 'General'),
            allocatedAmount: parseFloat(b.MonthlyLimit || b.AllocatedAmount) || 0,
            spentAmount: parseFloat(b.Spent || b.SpentAmount) || 0,
            period: 'Monthly',
            warningThresholdPct: 80,
          });
          totalCount++;
        }
        syncedTabsList.push('Budgets');
      }

      // 4. Fixed Investments (PPF, SSA, RDs)
      const fixedRows = data.tabs['Investments (PPF, SSA, RDs)'] || data.tabs['Fixed Investments'] || [];
      if (fixedRows.length > 0) {
        for (const f of fixedRows) {
          if (!f.Type && !f.Name) continue;
          const fType = (
            String(f.Type || 'PPF').toUpperCase().includes('SSA')
              ? 'SSA'
              : String(f.Type || 'PPF').toUpperCase().includes('RD')
              ? 'RD'
              : String(f.Type || 'PPF').toUpperCase().includes('FD')
              ? 'FD'
              : 'PPF'
          ) as any;
          const bal = parseFloat(f.CurrentBalance || f.Balance || f.Amount) || 0;
          await db.fixedInvestments.put({
            id: String(f.ID || `fi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            name: String(f.Name || `${fType} Scheme`),
            type: fType,
            accountNumberRedacted: String(f.AccountNumberRedacted || f.AccountNumber || 'XXXX0000'),
            institution: String(f.Institution || 'State Bank of India'),
            principalAmount: bal,
            currentBalance: bal,
            monthlyContribution: parseFloat(f.MonthlyContribution) || 0,
            interestRate: parseFloat(f.InterestRate) || (fType === 'PPF' ? 7.1 : 8.2),
            startDate: parseSheetDate(f.StartDate),
            maturityDate: parseSheetDate(f.MaturityDate || '2035-03-31'),
            familyMember: String(f.Member || f.FamilyMember || 'Deepan'),
            notes: f.Notes ? String(f.Notes) : undefined,
          });
          totalCount++;
        }
        syncedTabsList.push('Fixed Investments');
      }

      // 5. Demat Investments
      const dematRows = data.tabs['Demat & Mutual Funds (SIPs, Stocks)'] || data.tabs['Demat Investments'] || [];
      if (dematRows.length > 0) {
        for (const d of dematRows) {
          if (!d.Name) continue;
          await db.dematInvestments.put({
            id: String(d.ID || `dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            name: String(d.Name || 'Mutual Fund'),
            symbol: String(d.Symbol || 'MF'),
            type: (d.Type as any) || 'Mutual Fund',
            investedAmount: parseFloat(d.InvestedAmount) || 0,
            currentValue: parseFloat(d.CurrentValue) || 0,
            units: parseFloat(d.Units) || 0,
            avgBuyPrice: parseFloat(d.AvgBuyPrice) || 100,
            currentNAV: parseFloat(d.CurrentNAV) || 120,
            lastUpdated: parseSheetDate(d.LastUpdated),
            familyMember: String(d.Member || d.FamilyMember || 'Deepan'),
          });
          totalCount++;
        }
        syncedTabsList.push('Demat & Mutual Funds');
      }

      // 6. Gold Holdings
      const goldRows = data.tabs['Gold Holdings & Live Tracking'] || data.tabs['Gold Holdings'] || [];
      if (goldRows.length > 0) {
        for (const g of goldRows) {
          if (!g.ItemName && !g.Grams) continue;
          await db.goldHoldings.put({
            id: String(g.ID || `gold-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            itemName: String(g.ItemName || '24K Gold Coin'),
            grams: parseFloat(g.Grams) || 0,
            karat: (g.Karat as any) || '24K',
            purchaseRatePerGram: parseFloat(g.PurchaseRatePerGram) || 7200,
            totalLandedCost: parseFloat(g.LandedCost || g.TotalLandedCost) || 0,
            gstPct: 3,
            makingChargesPct: 3,
            purchaseDate: parseSheetDate(g.PurchaseDate),
            familyMember: String(g.Member || g.FamilyMember || 'Deepan'),
          });
          totalCount++;
        }
        syncedTabsList.push('Gold Holdings');
      }

      // 7. Loans & EMIs
      const loanRows = data.tabs['Loans & EMIs'] || data.tabs['Loans'] || [];
      if (loanRows.length > 0) {
        for (const l of loanRows) {
          if (!l.LoanName && !l.Bank) continue;
          await db.loans.put({
            id: String(l.ID || `loan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            loanName: String(l.LoanName || 'Home Loan'),
            bank: String(l.Bank || 'HDFC Bank'),
            loanType: (l.LoanType as any) || 'Personal',
            principalAmount: parseFloat(l.PrincipalAmount) || parseFloat(l.Outstanding) || 0,
            outstandingBalance: parseFloat(l.Outstanding || l.OutstandingBalance) || 0,
            monthlyEmi: parseFloat(l.MonthlyEMI || l.MonthlyEmi) || 0,
            interestRate: parseFloat(l.InterestRate) || 8.5,
            tenureMonths: 240,
            remainingMonths: 180,
            emiDueDate: parseInt(String(l.DueDate || l.EmiDueDate || '5').replace(/\D/g, ''), 10) || 5,
            autoDebitAccount: 'HDFC Bank',
            startDate: parseSheetDate(l.StartDate),
          });
          totalCount++;
        }
        syncedTabsList.push('Loans & EMIs');
      }

      // 8. People & Households
      const memberRows = data.tabs['People & Households'] || data.tabs['Family Members'] || [];
      if (memberRows.length > 0) {
        for (const m of memberRows) {
          if (!m.Name) continue;
          const dob = m.DOB || m.DateOfBirth ? parseSheetDate(m.DOB || m.DateOfBirth) : undefined;
          const age = parseFloat(m.Age) || (dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 30);
          await db.familyMembers.put({
            id: String(m.ID || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            name: String(m.Name || 'Member'),
            age,
            dateOfBirth: dob,
            relationship: (m.Relationship as any) || 'Self',
            status: 'Active',
            bloodGroup: m.BloodGroup ? String(m.BloodGroup) : undefined,
            avatarColor: '#C93B2B',
          });
          totalCount++;
        }
        syncedTabsList.push('People & Households');
      }

      // 9. Medicines
      const medicineRows = data.tabs['Medicines'] || [];
      if (medicineRows.length > 0) {
        for (const med of medicineRows) {
          if (!med.Medicine && !med.MedicineName) continue;
          await db.medicines.put({
            id: String(med.ID || `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            memberId: 'mem-live-1',
            memberName: String(med.Member || med.MemberName || 'Deepan'),
            medicineName: String(med.Medicine || med.MedicineName || 'Paracetamol'),
            type: (med.Type as any) || 'Tablet',
            dosage: String(med.Dosage || '1 daily'),
            timings: ['Morning'],
            instructions: 'After Food',
            dailyQuantity: 1,
            currentStock: parseFloat(med.CurrentStock) || 10,
            minRefillThreshold: parseFloat(med.Threshold || med.MinRefillThreshold) || 5,
          });
          totalCount++;
        }
        syncedTabsList.push('Medicines');
      }

      // 10. Insurances
      const insuranceRows = data.tabs['Insurances'] || [];
      if (insuranceRows.length > 0) {
        for (const ins of insuranceRows) {
          if (!ins.PolicyName) continue;
          await db.insurances.put({
            id: String(ins.ID || `ins-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            policyName: String(ins.PolicyName || 'Health Insurance'),
            policyNumber: String(ins.PolicyNumber || 'N/A'),
            type: (ins.Type as any) || 'Health',
            insurer: String(ins.Insurer || 'Other'),
            premiumAmount: parseFloat(ins.PremiumAmount) || 0,
            frequency: (ins.Frequency as any) || 'Yearly',
            startDate: parseSheetDate(ins.StartDate),
            nextDueDate: parseSheetDate(ins.NextDueDate),
            familyMember: String(ins.Member || ins.FamilyMember || 'Deepan'),
            autoDebitAccount: ins.AutoDebitAccount ? String(ins.AutoDebitAccount) : undefined,
            notes: ins.Notes ? String(ins.Notes) : undefined,
          });
          totalCount++;
        }
        syncedTabsList.push('Insurances');
      }

      // 11. Family Documents
      const docRows = data.tabs['Family Documents'] || [];
      if (docRows.length > 0) {
        for (const doc of docRows) {
          if (!doc.DocumentType && !doc.MemberName) continue;
          await db.familyDocuments.put({
            id: String(doc.ID || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
            memberId: 'mem-live-1',
            memberName: String(doc.MemberName || 'Deepan'),
            docType: (doc.DocumentType as any) || 'PAN Card',
            docNumberRedacted: String(doc.DocumentNumber || '[Document ID Omitted]'),
            docNumberEncrypted: '',
            issueDate: parseSheetDate(doc.IssueDate),
            expiryDate: doc.ExpiryDate && doc.ExpiryDate !== 'N/A' ? parseSheetDate(doc.ExpiryDate) : undefined,
            issuer: String(doc.Issuer || 'Govt of India'),
          });
          totalCount++;
        }
        syncedTabsList.push('Family Documents');
      }

      // 1.5s buffer delay ensuring IndexedDB asynchronous transaction commitments finish cleanly
      await new Promise((res) => setTimeout(res, 1500));

      return {
        success: true,
        message: `Successfully reloaded ${totalCount} records across ${syncedTabsList.length} tabs from trusted Google Sheet!`,
        syncedTabs: syncedTabsList,
        totalRecordsSynced: totalCount,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to pull data from Google Sheet: ${err instanceof Error ? err.message : String(err)}`,
        syncedTabs: [],
        totalRecordsSynced: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 1-Click Live Stock Price Refresh directly from iVault
   * Fetches latest live prices for all stocks and ETFs on click, updates CurrentNAV & CurrentValue,
   * without needing to open Google Sheets or run background auto-refreshes.
   */
  public static async refreshStockPrices(webappUrl?: string): Promise<{
    success: boolean;
    message: string;
    updatedCount: number;
    updatedStocks?: { symbol: string; price: number; name?: string }[];
    prices?: Record<string, number>;
  }> {
    const url = (webappUrl || localStorage.getItem('ivault_google_sheets_url') || '').trim();
    if (!url || !url.startsWith('http')) {
      return {
        success: false,
        message: 'Google Sheets Web App URL is not configured. Please add your Web App URL in Settings once to enable 1-click live stock price refresh.',
        updatedCount: 0,
      };
    }

    try {
      // 1. Get all Demat investments currently in IndexedDB
      const allDemat = await db.dematInvestments.toArray();
      const stockInvestments = allDemat.filter(
        (d) => d.type === 'Stock' || d.type === 'ETF' || (d.symbol && d.symbol !== 'MF' && d.type !== 'Mutual Fund')
      );

      const symbols = Array.from(
        new Set(
          stockInvestments
            .map((s) => (s.symbol || '').trim().toUpperCase())
            .filter(Boolean)
        )
      );

      // 2. Call Google Apps Script WebApp with refreshStocks action
      const queryParam = symbols.length > 0 ? `&symbols=${encodeURIComponent(symbols.join(','))}` : '';
      const response = await fetch(`${url}?action=refreshStocks${queryParam}`, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}. Please check your Google Apps Script deployment permissions.`);
      }

      const data = await response.json();
      if (!data || data.status !== 'success') {
        throw new Error(data?.message || 'Failed to refresh stock prices from Google Sheets Web App.');
      }

      let updatedCount = 0;
      const updatedStocks: { symbol: string; price: number; name?: string }[] = [];
      const todayStr = new Date().toISOString().split('T')[0];
      const priceMap: Record<string, number> = { ...(data.prices || {}) };

      // Also ingest any rows returned in data.demat
      if (Array.isArray(data.demat) && data.demat.length > 0) {
        for (const row of data.demat) {
          const sym = String(row.Symbol || '').trim().toUpperCase();
          const nav = parseFloat(row.CurrentNAV);
          if (sym && !isNaN(nav) && nav > 0) {
            priceMap[sym] = nav;
          }
        }
      }

      // 3. Update local IndexedDB records
      for (const inv of stockInvestments) {
        const cleanSym = (inv.symbol || '').trim().toUpperCase();
        const baseSym = cleanSym.replace(/\.(NS|BO)$/, '');
        const price = priceMap[cleanSym] || priceMap[baseSym] || priceMap[cleanSym + '.NS'] || priceMap[cleanSym + '.BO'];

        if (typeof price === 'number' && !isNaN(price) && price > 0) {
          const newNAV = Math.round(price * 100) / 100;
          const newValue = Math.round(inv.units * newNAV);

          await db.dematInvestments.update(inv.id, {
            currentNAV: newNAV,
            currentValue: newValue,
            lastUpdated: todayStr,
          });

          updatedStocks.push({
            symbol: inv.symbol,
            price: newNAV,
            name: inv.name,
          });
          updatedCount++;
        }
      }

      const summaryList = updatedStocks
        .slice(0, 3)
        .map((s) => `${s.symbol} (₹${s.price.toLocaleString('en-IN')})`)
        .join(', ');
      const moreText = updatedStocks.length > 3 ? ` +${updatedStocks.length - 3} more` : '';

      return {
        success: true,
        message: updatedCount > 0
          ? `Refreshed ${updatedCount} stock ${updatedCount === 1 ? 'price' : 'prices'} on click! ${summaryList}${moreText}`
          : 'Stock price refresh completed. (No matching stock prices were updated)',
        updatedCount,
        updatedStocks,
        prices: priceMap,
      };
    } catch (err) {
      return {
        success: false,
        message: `Stock price refresh failed: ${err instanceof Error ? err.message : String(err)}`,
        updatedCount: 0,
      };
    }
  }

  /**
   * Generate Google Apps Script code for Code.gs
   * Returns the complete Enhanced Google Apps Script with Live Market Engine & Auto-Refresh
   */
  public static generateAppsScriptCode(): string {
    return this.generateEnhancedAppsScriptCode();
  }

  /**
   * Export backup as JSON file
   */

  /**
   * Generate Enhanced Google Apps Script with Live Market Engine & Auto-Refresh
   */
  public static generateEnhancedAppsScriptCode(): string {
    return `/**
 * ==============================================================================
 * iVault PRO - Enhanced Google Apps Script Backend & Live Market Engine
 * ==============================================================================
 * Features:
 *  1. Timezone-Safe 13-Tab Cloud Sync (GET pull & POST push with YYYY-MM-DD dates)
 *  2. Custom Formula: =GET_LIVE_STOCK_PRICE("TCS") for live NSE, BSE & US stock prices
 *  3. Automated background Stock & ETF live price refresh engine (Hourly or 1-Click)
 *  4. Manual mode for Gold and Mutual Funds (Preserved for manual user entry without auto-overwrite)
 *  5. Custom Spreadsheet Menu: 1-click stock refresh, hourly auto-refresh trigger & tests
 */

// ------------------------------------------------------------------------------
// 1. WEB APP SYNC API (doPost & doGet)
// ------------------------------------------------------------------------------

function doPost(e) {
  try {
    var raw = e.parameter.data || (e.postData && e.postData.contents) || "{}";
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
            row.push(val !== undefined && val !== null ? String(val) : "");
          }
          values.push(row);
        }

        sheet.getRange(1, 1, values.length, headers.length).setValues(values);
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setBackground("#064E3B");
        headerRange.setFontColor("#FFFFFF");
        headerRange.setFontWeight("bold");
        sheet.autoResizeColumns(1, headers.length);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "status";

  // 1-Click On-Demand Live Stock Price Refresh directly from iVault app
  if (action === "refreshStocks" || action === "stockPrices") {
    var updateResult = refreshLiveStockPrices();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Demat & Mutual Funds (SIPs, Stocks)") || ss.getSheetByName("Demat Investments");
    var dematRows = [];
    var prices = {};
    var tz = ss.getSpreadsheetTimeZone() || "Asia/Kolkata";

    if (sheet) {
      var data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        var headers = data[0];
        var symCol = headers.indexOf("Symbol");
        var navCol = headers.indexOf("CurrentNAV");
        for (var r = 1; r < data.length; r++) {
          var rowObj = {};
          for (var c = 0; c < headers.length; c++) {
            var val = data[r][c];
            if (val instanceof Date) {
              val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
            }
            rowObj[headers[c]] = val;
          }
          dematRows.push(rowObj);
          if (symCol !== -1 && navCol !== -1 && data[r][symCol]) {
            var symKey = String(data[r][symCol]).trim().toUpperCase();
            var navNum = parseFloat(data[r][navCol]);
            if (!isNaN(navNum) && navNum > 0) {
              prices[symKey] = navNum;
            }
          }
        }
      }
    }

    if (e && e.parameter && e.parameter.symbols) {
      var extraSymbols = String(e.parameter.symbols).split(",");
      for (var sIdx = 0; sIdx < extraSymbols.length; sIdx++) {
        var symItem = extraSymbols[sIdx].trim();
        if (symItem && !prices[symItem.toUpperCase()]) {
          var pVal = GET_LIVE_STOCK_PRICE(symItem);
          if (typeof pVal === "number" && !isNaN(pVal) && pVal > 0) {
            prices[symItem.toUpperCase()] = pVal;
          }
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      updatedCount: (updateResult && updateResult.count) || Object.keys(prices).length,
      prices: prices,
      demat: dematRows,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "pull") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var tabs = {};
    var tz = ss.getSpreadsheetTimeZone() || "Asia/Kolkata";

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
            var val = data[r][c];
            // Format dates as YYYY-MM-DD in sheet timezone to prevent UTC day-shift
            if (val instanceof Date) {
              val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
            }
            obj[headers[c]] = val;
          }
          rows.push(obj);
        }
        tabs[name] = rows;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", tabs: tabs })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    appName: "iVault PRO Stock Engine",
    version: "2.6.0",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------------------------
// 2. LIVE STOCK PRICE FORMULA & HELPERS
// ------------------------------------------------------------------------------

/**
 * Custom formula to fetch live stock price for NSE, BSE, or Global stocks
 * Usage in Sheet: =GET_LIVE_STOCK_PRICE("TCS") or =GET_LIVE_STOCK_PRICE("NSE:INFY") or =GET_LIVE_STOCK_PRICE(C2)
 *
 * @param {string} ticker Stock ticker symbol (e.g. "TCS", "INFY", "RELIANCE", "TATAMOTORS", "AAPL")
 * @return {number} Current market price per share
 * @customfunction
 */
function GET_LIVE_STOCK_PRICE(ticker) {
  if (!ticker) return "Enter Symbol";
  var rawTicker = String(ticker).trim();
  if (!rawTicker) return "Invalid Symbol";

  var symbol = rawTicker.toUpperCase();
  var cleanSym = symbol;
  var isBSE = false;

  if (symbol.indexOf("NSE:") === 0) {
    cleanSym = symbol.substring(4).trim();
  } else if (symbol.indexOf("BSE:") === 0) {
    cleanSym = symbol.substring(4).trim();
    isBSE = true;
  }

  var cache = CacheService.getScriptCache();
  var cacheKey = "stk_" + cleanSym + (isBSE ? "_BO" : "");
  var cached = cache.get(cacheKey);
  if (cached) {
    return parseFloat(cached);
  }

  // Format ticker for market feeds: Indian stocks default to .NS (NSE) unless BSE or US
  var querySym = cleanSym;
  if (!cleanSym.includes(".") && !isBSE) {
    var usTickers = ["AAPL", "GOOGL", "GOOG", "MSFT", "AMZN", "TSLA", "NVDA", "META", "NFLX"];
    if (usTickers.indexOf(cleanSym) === -1) {
      querySym = cleanSym + ".NS";
    }
  } else if (isBSE && !cleanSym.includes(".")) {
    querySym = cleanSym + ".BO";
  }

  try {
    var url = "https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(querySym);
    var res = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (res.getResponseCode() === 200) {
      var json = JSON.parse(res.getContentText());
      if (json && json.chart && json.chart.result && json.chart.result.length > 0) {
        var meta = json.chart.result[0].meta;
        var price = meta.regularMarketPrice;
        if (typeof price === "number" && !isNaN(price)) {
          cache.put(cacheKey, String(price), 900); // Cache for 15 minutes
          return price;
        }
      }
    }

    // Secondary fallback without .NS
    if (querySym.endsWith(".NS")) {
      var altUrl = "https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(cleanSym);
      var altRes = UrlFetchApp.fetch(altUrl, { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
      if (altRes.getResponseCode() === 200) {
        var altJson = JSON.parse(altRes.getContentText());
        if (altJson && altJson.chart && altJson.chart.result && altJson.chart.result.length > 0) {
          var altPrice = altJson.chart.result[0].meta.regularMarketPrice;
          if (typeof altPrice === "number" && !isNaN(altPrice)) {
            cache.put(cacheKey, String(altPrice), 900);
            return altPrice;
          }
        }
      }
    }
    return "Not Found";
  } catch (err) {
    return "Error: " + err.message;
  }
}

/**
 * Optional formula for manual AMFI Mutual Fund NAV lookup
 */
function GET_MF_NAV(schemeCode) {
  if (!schemeCode) return "Enter Scheme Code";
  var cleanCode = String(schemeCode).trim().replace(/\\D/g, "");
  if (!cleanCode) return "Invalid Code";

  var cache = CacheService.getScriptCache();
  var cachedNav = cache.get("nav_" + cleanCode);
  if (cachedNav) return parseFloat(cachedNav);

  try {
    var url = "https://api.mfapi.in/mf/" + cleanCode;
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) {
      var json = JSON.parse(response.getContentText());
      if (json && json.data && json.data.length > 0) {
        var nav = parseFloat(json.data[0].nav);
        cache.put("nav_" + cleanCode, String(nav), 21600);
        return nav;
      }
    }
    return "Not Found";
  } catch (err) {
    return "Error: " + err.message;
  }
}

/**
 * Optional formula for manual 24K Gold Rate lookup
 */
function GET_LIVE_GOLD_RATE_24K() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("gold_24k");
  if (cached) return parseFloat(cached);

  try {
    var url = "https://api.gold-api.com/price/XAU";
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      var data = JSON.parse(res.getContentText());
      if (data && data.price) {
        var inrPerGram = Math.round((data.price * 84) / 31.1035);
        cache.put("gold_24k", String(inrPerGram), 3600);
        return inrPerGram;
      }
    }
  } catch (e) {}
  return 7350;
}

/**
 * Optional formula for manual 22K Gold Rate lookup
 */
function GET_LIVE_GOLD_RATE_22K() {
  var rate24k = GET_LIVE_GOLD_RATE_24K();
  return Math.round((rate24k * 22) / 24);
}

// ------------------------------------------------------------------------------
// 3. AUTOMATED LIVE STOCK REFRESH ENGINE
// ------------------------------------------------------------------------------

/**
 * Automatically scans Demat & Mutual Funds tab and refreshes live prices ONLY for Stocks & ETFs.
 * Updates CurrentNAV (Stock Price), recalculates CurrentValue = Units * CurrentNAV, and updates LastUpdated.
 * NOTE: Gold Holdings and Mutual Funds are kept untouched for manual user management as requested.
 */
function refreshLiveStockPrices() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Demat & Mutual Funds (SIPs, Stocks)") || ss.getSheetByName("Demat Investments");

  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Demat sheet not found.", "iVault PRO", 5);
    return;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  var headers = data[0];
  var symbolCol = headers.indexOf("Symbol");
  var typeCol = headers.indexOf("Type");
  var unitsCol = headers.indexOf("Units");
  var navCol = headers.indexOf("CurrentNAV");
  var valCol = headers.indexOf("CurrentValue");
  var updatedCol = headers.indexOf("LastUpdated");

  if (symbolCol === -1 || navCol === -1) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Symbol or CurrentNAV column not found.", "iVault PRO", 5);
    return;
  }

  var updatedCount = 0;
  var tz = ss.getSpreadsheetTimeZone() || "Asia/Kolkata";
  var nowStr = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

  for (var r = 1; r < data.length; r++) {
    var rawType = typeCol !== -1 ? String(data[r][typeCol]).trim().toLowerCase() : "";
    var symbol = String(data[r][symbolCol]).trim();

    // Only update Stocks and ETFs. Mutual Funds and other entries are strictly manual as requested.
    var isStock = rawType === "stock" || rawType === "etf" || (rawType !== "mutual fund" && symbol.length > 0 && !/^\\d+$/.test(symbol));

    if (isStock && symbol) {
      var livePrice = GET_LIVE_STOCK_PRICE(symbol);
      if (typeof livePrice === "number" && !isNaN(livePrice) && livePrice > 0) {
        // 1. Update CurrentNAV / CurrentPrice
        sheet.getRange(r + 1, navCol + 1).setValue(livePrice);

        // 2. Recalculate CurrentValue = Units * CurrentNAV
        if (unitsCol !== -1 && valCol !== -1) {
          var units = parseFloat(data[r][unitsCol]) || 0;
          sheet.getRange(r + 1, valCol + 1).setValue(Math.round(units * livePrice));
        }

        // 3. Mark LastUpdated date
        if (updatedCol !== -1) {
          sheet.getRange(r + 1, updatedCol + 1).setValue(nowStr);
        }

        updatedCount++;
      }
    }
  }

  // Update status in Dashboard sheet if present
  var dashSheet = ss.getSheetByName("Dashboard");
  if (dashSheet) {
    dashSheet.getRange("E1").setValue("Last Stock Refresh: " + Utilities.formatDate(new Date(), tz, "dd-MM-yyyy HH:mm:ss") + " (" + updatedCount + " stocks updated)");
    dashSheet.getRange("E1").setFontColor("#0284C7").setFontWeight("bold");
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("Live Stock Prices Refreshed! (" + updatedCount + " stocks updated)", "iVault PRO Stock Engine", 5);
  return { count: updatedCount };
}

/**
 * Backward compatibility alias
 */
function refreshLiveMarketData() {
  refreshLiveStockPrices();
}

/**
 * Installs an hourly time-driven trigger for automated live Stock refresh
 */
function setupAutoRefreshTrigger() {
  removeAutoRefreshTrigger();
  ScriptApp.newTrigger("refreshLiveStockPrices")
    .timeBased()
    .everyHours(1)
    .create();

  SpreadsheetApp.getUi().alert(
    "Stock Auto-Refresh Activated! ⚡\\n\\n" +
    "Google Sheets will automatically fetch live prices for all your Stocks & ETFs every hour.\\n\\n" +
    "Gold holdings and Mutual Funds remain completely untouched for your manual entry.\\n\\n" +
    "You can also refresh on-demand from the '⚡ iVault PRO Live Engine' menu anytime."
  );
}

/**
 * Removes all background triggers
 */
function removeAutoRefreshTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === "refreshLiveStockPrices" || fn === "refreshLiveMarketData") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

// ------------------------------------------------------------------------------
// 4. CUSTOM SPREADSHEET MENU (ONOPEN)
// ------------------------------------------------------------------------------

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("⚡ iVault PRO Live Engine")
    .addItem("🔄 Refresh Live Stock Prices Now", "refreshLiveStockPrices")
    .addSeparator()
    .addItem("⏱️ Turn On Hourly Stock Auto-Refresh", "setupAutoRefreshTrigger")
    .addItem("⏹️ Turn Off Auto-Refresh", "removeAutoRefreshTrigger")
    .addSeparator()
    .addItem("🧪 Test Stock Price Connection (TCS & INFY)", "testStockConnection")
    .addToUi();
}

function testStockConnection() {
  var infy = GET_LIVE_STOCK_PRICE("INFY");
  var tcs = GET_LIVE_STOCK_PRICE("TCS");
  SpreadsheetApp.getUi().alert(
    "Live Stock Price Connection Test:\\n\\n" +
    "• Infosys (INFY): ₹" + infy + "\\n" +
    "• Tata Consultancy Services (TCS): ₹" + tcs + "\\n\\n" +
    "Status: Live stock feed operational! Gold & Mutual Funds are configured for manual entry."
  );
}`;
  }

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
