/**
 * @file SmartQuickEntryModal.tsx
 * Natural Language Fast-Track Financial Entry Modal
 *
 * Replaces external messaging bots with an elegant, in-app assistant that parses
 * natural language sentences directly into strongly-typed ledger transactions or investments.
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  DollarSign,
  TrendingUp,
  Coins,
  Pill,
} from 'lucide-react';
import { SmartParserService, type SmartParsedResult } from '../../services/smart-parser.service';
import { db } from '../../services/db.service';
import { GoogleSheetsSyncService } from '../../services/google-sheets-sync.service';
import type { Transaction } from '../../types/db.types';
import { useFormFocus } from '../../hooks/useFormFocus';

interface SmartQuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMember: string;
  onEntrySaved: () => void;
}

export const SmartQuickEntryModal: React.FC<SmartQuickEntryModalProps> = ({
  isOpen,
  onClose,
  activeMember,
  onEntrySaved,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState<SmartParsedResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const modalRef = useFormFocus<HTMLDivElement>(isOpen);

  if (!isOpen) return null;

  const sampleCommands = [
    'Spent 450 on Dinner',
    'Paid 1200 for Electricity bill',
    'Spent 850 on Groceries',
    'Invested 5000 in PPF',
    'Received 65000 Salary',
    'Bought 10g Gold for 72500',
    'Took Paracetamol 650mg',
  ];

  const handleInputChange = (text: string) => {
    setInputText(text);
    setSaveSuccess(false);
    if (text.trim().length > 3) {
      const result = SmartParserService.parseMessage(text, activeMember);
      setParsedResult(result);
    } else {
      setParsedResult(null);
    }
  };

  const handleSelectSample = (sample: string) => {
    handleInputChange(sample);
  };

  const handleSaveEntry = async () => {
    if (!parsedResult || !parsedResult.success || !parsedResult.data) return;

    setIsSaving(true);
    try {
      if (parsedResult.intent === 'expense' || parsedResult.intent === 'income') {
        const tx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ...parsedResult.data,
        };
        await db.transactions.put(tx);

        // Update corresponding budget spent amount if expense
        if (tx.type === 'expense') {
          const budget = await db.budgets.where('category').equals(tx.category).first();
          if (budget) {
            budget.spentAmount += tx.amount;
            await db.budgets.put(budget);
          }
        }
      } else if (parsedResult.intent === 'investment_fixed') {
        await db.fixedInvestments.put({
          id: `fi-${Date.now()}`,
          ...parsedResult.data,
        });
      } else if (parsedResult.intent === 'investment_gold') {
        await db.goldHoldings.put({
          id: `gold-${Date.now()}`,
          ...parsedResult.data,
        });
      }

      // Trigger background sync to Google Sheets if webapp URL configured
      const current = await db.appSettings.get('default');
      if (
        current?.sheetsWebappUrl &&
        current.sheetsWebappUrl.startsWith('http') &&
        current.autoSyncEnabled !== false
      ) {
        try {
          await GoogleSheetsSyncService.syncWithGoogleAppsScript(current.sheetsWebappUrl);
          const now = new Date().toISOString();
          await db.appSettings.update('default', { lastSyncTime: now });
        } catch (syncErr) {
          console.warn('Auto-sync during smart entry failed:', syncErr);
        }
      }

      setSaveSuccess(true);
      onEntrySaved();
      setTimeout(() => {
        setInputText('');
        setParsedResult(null);
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div ref={modalRef} role="dialog" aria-modal="true" className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Smart Natural Language Entry</h3>
              <p className="text-xs text-purple-200">
                Type naturally — iVault parses categories, amounts, and intent automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input & Form Body */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Enter Natural Sentence for {activeMember}
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="e.g. Spent 450 on Coffee or Invested 2000 in PPF"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white placeholder-slate-400 pr-10 shadow-xs"
                autoFocus
              />
              <Sparkles className="w-4 h-4 text-purple-500 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Tap an example:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleCommands.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Live NLP Parse Preview Card */}
          {parsedResult && (
            <div
              className={`p-3.5 rounded-xl border transition ${
                parsedResult.success
                  ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  {parsedResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Inferred Intent: {parsedResult.intent.toUpperCase()}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Unrecognized Sentence</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200">
                  Confidence: {Math.round(parsedResult.confidence * 100)}%
                </span>
              </div>

              <p className="text-xs font-medium leading-relaxed">{parsedResult.message}</p>

              {parsedResult.success && parsedResult.data && (
                <div className="mt-2.5 pt-2 border-t border-purple-200/60 grid grid-cols-2 gap-2 text-[11px]">
                  {parsedResult.data.amount && (
                    <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                      <span className="text-slate-400 block font-semibold text-[10px]">Amount</span>
                      <span className="font-extrabold text-slate-800">
                        ₹{parsedResult.data.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {parsedResult.data.category && (
                    <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                      <span className="text-slate-400 block font-semibold text-[10px]">Category</span>
                      <span className="font-extrabold text-slate-800">{parsedResult.data.category}</span>
                    </div>
                  )}
                  {parsedResult.data.grams && (
                    <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                      <span className="text-slate-400 block font-semibold text-[10px]">Gold Weight</span>
                      <span className="font-extrabold text-slate-800">{parsedResult.data.grams}g (24K)</span>
                    </div>
                  )}
                  {parsedResult.data.date && (
                    <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                      <span className="text-slate-400 block font-semibold text-[10px]">Date</span>
                      <span className="font-extrabold text-slate-800">{parsedResult.data.date}</span>
                    </div>
                  )}
                  <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                    <span className="text-slate-400 block font-semibold text-[10px]">Family Member</span>
                    <span className="font-extrabold text-slate-800">{activeMember}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Record recorded successfully to your offline vault!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveEntry}
            disabled={!parsedResult?.success || isSaving}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Recording...' : 'Record to Vault'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
