/**
 * @file smart-parser.service.spec.ts
 * Unit Test Suite for Smart Natural Language Processing (NLP) Parser
 */

import { describe, it, expect } from 'vitest';
import { SmartParserService } from '../services/smart-parser.service';

describe('SmartParserService (NLP & Intent Extraction)', () => {
  it('should parse expense text: "Spent 500 on Groceries"', () => {
    const result = SmartParserService.parseMessage('Spent 500 on Groceries', 'Deepan');
    expect(result.success).toBe(true);
    expect(result.intent).toEqual('expense');
    expect(result.data.amount).toEqual(500);
    expect(result.data.category).toEqual('Groceries & Household');
    expect(result.data.familyMember).toEqual('Deepan');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('should parse expense with INR currency symbol: "Paid ₹1,250 for Dinner"', () => {
    const result = SmartParserService.parseMessage('Paid ₹1,250 for Dinner', 'Rani');
    expect(result.success).toBe(true);
    expect(result.intent).toEqual('expense');
    expect(result.data.amount).toEqual(1250);
    expect(result.data.category).toEqual('Dining & Food');
    expect(result.data.familyMember).toEqual('Rani');
  });

  it('should parse income text: "Received 50000 Salary"', () => {
    const result = SmartParserService.parseMessage('Received 50000 Salary', 'Deepan');
    expect(result.success).toBe(true);
    expect(result.intent).toEqual('income');
    expect(result.data.amount).toEqual(50000);
    expect(result.data.category).toEqual('Salary');
  });

  it('should parse dividend income text: "Credited 1500 dividend"', () => {
    const result = SmartParserService.parseMessage('Credited 1500 dividend', 'Deepan');
    expect(result.success).toBe(true);
    expect(result.intent).toEqual('income');
    expect(result.data.amount).toEqual(1500);
    expect(result.data.category).toEqual('Dividend');
  });

  it('should parse fixed investment text: "Invested 2000 in PPF"', () => {
    const result = SmartParserService.parseMessage('Invested 2000 in PPF', 'Deepan');
    expect(result.success).toBe(true);
    expect(result.intent).toEqual('investment_fixed');
    expect(result.data.type).toEqual('PPF');
    expect(result.data.amount).toEqual(2000);
  });

  it('should parse SSA fixed investment text: "Added 5000 to SSA"', () => {
    const result = SmartParserService.parseMessage('Added 5000 to SSA', 'Deepan');
    expect(result.success).toBe(true);
    expect(result.intent).toEqual('investment_fixed');
    expect(result.data.type).toEqual('SSA');
    expect(result.data.amount).toEqual(5000);
  });

  it('should parse gold purchase text: "Bought 10g Gold for 72500"', () => {
    const result = SmartParserService.parseMessage('Bought 10g Gold for 72500', 'Deepan');
    expect(result.success).toBe(true);
    expect(result.intent).toEqual('investment_gold');
    expect(result.data.grams).toEqual(10);
    expect(result.data.totalLandedCost).toEqual(72500);
  });

  it('should parse medicine intake text: "Took Paracetamol 650mg"', () => {
    const result = SmartParserService.parseMessage('Took Paracetamol 650mg', 'Kalyani Amma');
    expect(result.success).toBe(true);
    expect(result.intent).toEqual('medicine_dose');
    expect(result.data.medicineName).toEqual('Paracetamol 650mg');
    expect(result.data.memberName).toEqual('Kalyani Amma');
  });

  it('should accurately categorize various expense descriptions', () => {
    expect(SmartParserService.categorizeExpense('uber cab fare')).toEqual('Fuel & Transport');
    expect(SmartParserService.categorizeExpense('apollo pharmacy medicine')).toEqual('Healthcare & Medicines');
    expect(SmartParserService.categorizeExpense('netflix subscription')).toEqual('Utilities & Subscriptions');
    expect(SmartParserService.categorizeExpense('school tuition fee')).toEqual('Kids & Education');
    expect(SmartParserService.categorizeExpense('general shopping')).toEqual('General Expenses');
  });

  it('should handle empty or whitespace input gracefully', () => {
    const result = SmartParserService.parseMessage('   ', 'Deepan');
    expect(result.success).toBe(false);
    expect(result.intent).toEqual('unknown');
    expect(result.confidence).toEqual(0);
  });

  it('should handle unparseable text gracefully without throwing errors', () => {
    const result = SmartParserService.parseMessage('What is the weather outside today?', 'Deepan');
    expect(result.success).toBe(false);
    expect(result.intent).toEqual('unknown');
  });
});
