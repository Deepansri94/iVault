/**
 * @file smart-parser.service.ts
 * Natural Language Processing (NLP) Parser for Fast-Track Ledger & Investment Entry
 *
 * Translates conversational English sentences (e.g. "Spent 500 on Groceries",
 * "Invested 2000 in PPF", "Received 50000 Salary") into strongly-typed database records.
 */

import type { Transaction } from '../types/db.types';

/**
 * Result returned by the Smart Parser
 */
export interface SmartParsedResult {
  /** Whether intent extraction succeeded */
  success: boolean;
  /** Inferred business intent */
  intent:
    | 'expense'
    | 'income'
    | 'investment_fixed'
    | 'investment_demat'
    | 'investment_gold'
    | 'medicine_dose'
    | 'unknown';
  /** User-friendly confirmation message */
  message: string;
  /** Inferred structured entity payload */
  data?: any;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
}

/**
 * Service to parse free-form natural language phrases into structured financial records.
 */
export class SmartParserService {
  /**
   * Parses natural language user input into structured financial or medical transaction data.
   *
   * @param input Raw text input from user (e.g., "Spent 450 on Coffee")
   * @param activeMemberName Current active family member name
   * @returns Structured parse result including intent and entity data
   */
  public static parseMessage(
    input: string,
    activeMemberName = 'Deepan'
  ): SmartParsedResult {
    const raw = input.trim();
    if (!raw) {
      return {
        success: false,
        intent: 'unknown',
        message: 'Empty input received. Try: "Spent 500 on Groceries" or "Invested 2000 in PPF".',
        confidence: 0,
      };
    }

    const lower = raw.toLowerCase();

    // 1. Detect Expense Intent: "spent", "paid", "debited", "bought ... for", "expense"
    const expenseRegex =
      /(?:spent|paid|debited|expense of|bought)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:on|for|at|in)?\s*(.*)/i;
    const expenseAltRegex =
      /(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:spent|paid)\s*(?:on|for|at)?\s*(.*)/i;

    let match = lower.match(expenseRegex) || lower.match(expenseAltRegex);
    if (
      match &&
      !lower.includes('gold') &&
      !lower.includes('ppf') &&
      !lower.includes('sip') &&
      !lower.includes('mutual fund') &&
      !lower.includes('stock')
    ) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      const categoryRaw = match[2] ? match[2].trim() : 'General Expenses';
      const category = this.categorizeExpense(categoryRaw);

      return {
        success: true,
        intent: 'expense',
        message: `Logged Expense: ₹${amount.toLocaleString('en-IN')} under ${category}`,
        confidence: 0.95,
        data: {
          type: 'expense' as const,
          amount,
          category,
          subcategory: categoryRaw || 'Quick Entry',
          date: new Date().toISOString().split('T')[0],
          paymentMode: 'UPI' as const,
          familyMember: activeMemberName,
          notes: `Quick Entry: "${input}"`,
          syncedToSheets: false,
        },
      };
    }

    // 2. Detect Income Intent: "received", "credited", "salary", "bonus", "got"
    const incomeRegex =
      /(?:received|credited|got|salary of|bonus of|income of)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:from|as|for)?\s*(.*)/i;
    match = lower.match(incomeRegex);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      const source = match[2] ? match[2].trim() : 'Salary';
      const category = source.toLowerCase().includes('bonus')
        ? 'Bonus'
        : source.toLowerCase().includes('dividend')
        ? 'Dividend'
        : 'Salary';

      return {
        success: true,
        intent: 'income',
        message: `Logged Income: ₹${amount.toLocaleString('en-IN')} (${category})`,
        confidence: 0.92,
        data: {
          type: 'income' as const,
          amount,
          category,
          subcategory: source || 'Direct Credit',
          date: new Date().toISOString().split('T')[0],
          paymentMode: 'Net Banking' as const,
          familyMember: activeMemberName,
          notes: `Quick Entry: "${input}"`,
          syncedToSheets: false,
        },
      };
    }

    // 3. Detect Fixed Investment Intent: PPF, SSA, RD, FD
    if (
      lower.includes('ppf') ||
      lower.includes('ssa') ||
      lower.includes('rd') ||
      lower.includes('fixed deposit')
    ) {
      const amountMatch = lower.match(
        /(?:invested|added|deposited|contributed)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)/i
      );
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 2000;
      const type = lower.includes('ppf')
        ? 'PPF'
        : lower.includes('ssa')
        ? 'SSA'
        : lower.includes('rd')
        ? 'RD'
        : 'FD';

      return {
        success: true,
        intent: 'investment_fixed',
        message: `Allocated to ${type} Investment: ₹${amount.toLocaleString('en-IN')}`,
        confidence: 0.91,
        data: {
          type,
          amount,
          familyMember: activeMemberName,
          institution: type === 'PPF' ? 'State Bank of India' : 'Post Office',
          accountNumber: `XXXX${Math.floor(1000 + Math.random() * 9000)}`,
          maturityDate: new Date(Date.now() + 15 * 365 * 86400000)
            .toISOString()
            .split('T')[0],
          interestRate: type === 'PPF' ? 7.1 : type === 'SSA' ? 8.2 : 6.8,
        },
      };
    }

    // 4. Detect Gold Purchase Intent
    if (lower.includes('gold')) {
      const gramsMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|grams)/i);
      const amountMatch = lower.match(
        /(?:for|cost|worth|rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)/i
      );

      const grams = gramsMatch ? parseFloat(gramsMatch[1]) : 5;
      const totalCost = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ''))
        : grams * 7250;

      return {
        success: true,
        intent: 'investment_gold',
        message: `Registered ${grams}g Gold holding worth ₹${totalCost.toLocaleString('en-IN')}`,
        confidence: 0.88,
        data: {
          familyMember: activeMemberName,
          karat: '24K' as const,
          grams,
          totalLandedCost: totalCost,
          purchaseRatePerGram: Math.round(totalCost / grams),
          hallmarked: true,
          purchaseDate: new Date().toISOString().split('T')[0],
          dealer: 'Tanishq / MMTC-PAMP',
        },
      };
    }

    // 5. Detect Medicine Dose Taken Intent: "took ...", "had dose ...", "paracetamol"
    if (lower.startsWith('took') || lower.startsWith('had') || lower.includes('dose')) {
      const medName = raw.replace(/^(took|had|taken)\s+/i, '').trim();
      return {
        success: true,
        intent: 'medicine_dose',
        message: `Dose logged for: ${medName}`,
        confidence: 0.85,
        data: {
          medicineName: medName,
          memberName: activeMemberName,
          takenAt: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      intent: 'unknown',
      message: `Could not determine command. Examples:\n• "Spent 500 on Groceries"\n• "Invested 2000 in PPF"\n• "Received 50000 Salary"\n• "Bought 10g Gold for 72500"`,
      confidence: 0.1,
    };
  }

  /**
   * Maps natural language subcategories or keywords to standard financial budget categories.
   *
   * @param rawText Description keyword
   * @returns Canonical category name
   */
  public static categorizeExpense(rawText: string): string {
    const s = rawText.toLowerCase();

    if (
      s.includes('grocery') ||
      s.includes('groceries') ||
      s.includes('supermarket') ||
      s.includes('milk') ||
      s.includes('veg') ||
      s.includes('vegetable') ||
      s.includes('provision')
    ) {
      return 'Groceries & Household';
    }
    if (
      s.includes('food') ||
      s.includes('dinner') ||
      s.includes('lunch') ||
      s.includes('swiggy') ||
      s.includes('zomato') ||
      s.includes('restaurant') ||
      s.includes('cafe') ||
      s.includes('coffee')
    ) {
      return 'Dining & Food';
    }
    if (
      s.includes('fuel') ||
      s.includes('petrol') ||
      s.includes('diesel') ||
      s.includes('uber') ||
      s.includes('ola') ||
      s.includes('cab') ||
      s.includes('auto') ||
      s.includes('metro')
    ) {
      return 'Fuel & Transport';
    }
    if (
      s.includes('medicine') ||
      s.includes('pharmacy') ||
      s.includes('doctor') ||
      s.includes('hospital') ||
      s.includes('clinic') ||
      s.includes('apollo') ||
      s.includes('lab')
    ) {
      return 'Healthcare & Medicines';
    }
    if (
      s.includes('bill') ||
      s.includes('electricity') ||
      s.includes('wifi') ||
      s.includes('internet') ||
      s.includes('mobile') ||
      s.includes('recharge') ||
      s.includes('netflix') ||
      s.includes('prime')
    ) {
      return 'Utilities & Subscriptions';
    }
    if (
      s.includes('school') ||
      s.includes('tuition') ||
      s.includes('fee') ||
      s.includes('books') ||
      s.includes('course')
    ) {
      return 'Kids & Education';
    }

    return 'General Expenses';
  }
}
