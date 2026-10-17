/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Coins,
  LineChart,
  Copy,
  Check,
  Sparkles,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  Code2,
  Clock,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { GoogleSheetsSyncService } from '../../services/google-sheets-sync.service';

interface GoogleSheetsMarketGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  webappUrl?: string;
  initialTab?: 'stocks' | 'how_to_use' | 'codegs' | 'manual_notes';
}

export const GoogleSheetsMarketGuideModal: React.FC<GoogleSheetsMarketGuideModalProps> = ({
  isOpen,
  onClose,
  webappUrl,
  initialTab = 'stocks',
}) => {
  const [activeTab, setActiveTab] = useState<'stocks' | 'how_to_use' | 'codegs' | 'manual_notes'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const appsScriptCode = GoogleSheetsSyncService.generateEnhancedAppsScriptCode();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight text-white">
                  Google Sheets Live Stock Price Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px]">
                  LIVE STOCK REFRESH
                </span>
              </div>
              <p className="text-xs text-white/70">
                Track live stock prices in your sync sheet with tickers (NSE / BSE / US) • Gold &amp; Mutual Funds manual mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-bold overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'stocks'
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>1. Stock Tickers &amp; Formulas</span>
          </button>

          <button
            onClick={() => setActiveTab('how_to_use')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'how_to_use'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>2. How to Use with Same Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('codegs')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'codegs'
                ? 'border-slate-800 text-slate-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4 text-slate-800" />
            <span>3. Stock Engine Code.gs</span>
          </button>

          <button
            onClick={() => setActiveTab('manual_notes')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'manual_notes'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span>4. Gold &amp; MF Manual Mode</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* TAB 1: STOCKS */}
          {activeTab === 'stocks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-blue-900">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Yes! Your Google Sheet Can Have Live Stock Prices Using Tickers</span>
                </div>
                <p className="leading-relaxed">
                  In your iVault Google Sheet, the tab <strong className="text-blue-900">&quot;Demat &amp; Mutual Funds (SIPs, Stocks)&quot;</strong> stores all your investments. The <strong>Symbol</strong> column holds the stock ticker (e.g. <code>TCS</code>, <code>INFY</code>, <code>RELIANCE</code>, <code>AAPL</code>).
                </p>
                <p className="leading-relaxed text-[11px] text-blue-800">
                  ⚡ <strong>Two ways live prices work:</strong> (1) The automated <strong>Stock Engine</strong> in Code.gs updates <code>CurrentNAV</code> and <code>CurrentValue</code> with 1-click or every hour, or (2) You can enter Google Sheets native formula <code>=GOOGLEFINANCE(&quot;NSE:&quot; &amp; C2, &quot;price&quot;)</code> directly in the cell!
                </p>
              </div>

              {/* Formulas Cheat-Sheet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Custom Script Live Stock Price</span>
                    <button
                      onClick={() => copyToClipboard('=GET_LIVE_STOCK_PRICE("TCS")', 'stk_tcs')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'stk_tcs' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] select-all">
                    =GET_LIVE_STOCK_PRICE(&quot;TCS&quot;)
                  </code>
                  <span className="text-[10px] text-slate-500 block">
                    Fast live feed provided in our Code.gs script. Supports NSE, BSE, &amp; US tickers.
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Native GOOGLEFINANCE Formula</span>
                    <button
                      onClick={() => copyToClipboard('=GOOGLEFINANCE("NSE:TCS", "price")', 'tcs_p')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'tcs_p' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] select-all">
                    =GOOGLEFINANCE(&quot;NSE:TCS&quot;, &quot;price&quot;)
                  </code>
                  <span className="text-[10px] text-slate-500 block">
                    Built-in Google Sheets formula. Prefix NSE: for Indian National Stock Exchange.
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Formula Referring to Symbol Cell</span>
                    <button
                      onClick={() => copyToClipboard('=GOOGLEFINANCE("NSE:" & C2, "price")', 'cell_sym')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'cell_sym' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] select-all">
                    =GOOGLEFINANCE(&quot;NSE:&quot; &amp; C2, &quot;price&quot;)
                  </code>
                  <span className="text-[10px] text-slate-500 block">
                    Assuming column C is Symbol (e.g. INFY). Automatically fetches live price for that row!
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">US &amp; Global Stocks (e.g. Apple)</span>
                    <button
                      onClick={() => copyToClipboard('=GOOGLEFINANCE("AAPL", "price")', 'aapl_p')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'aapl_p' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] select-all">
                    =GOOGLEFINANCE(&quot;AAPL&quot;, &quot;price&quot;)
                  </code>
                  <span className="text-[10px] text-slate-500 block">
                    Direct ticker for US stocks listed on NASDAQ / NYSE.
                  </span>
                </div>
              </div>

              {/* Popular Tickers Reference Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-extrabold text-slate-800 flex items-center justify-between">
                  <span>Popular Indian &amp; Global Stock Tickers</span>
                  <span className="text-[11px] text-slate-500 font-normal">Use these symbols in iVault Demat</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { name: 'Tata Consultancy Services', ticker: 'TCS', exchange: 'NSE:TCS', sector: 'IT Services' },
                    { name: 'Infosys Ltd', ticker: 'INFY', exchange: 'NSE:INFY', sector: 'IT Services' },
                    { name: 'Reliance Industries', ticker: 'RELIANCE', exchange: 'NSE:RELIANCE', sector: 'Energy & Retail' },
                    { name: 'Tata Motors Ltd', ticker: 'TATAMOTORS', exchange: 'NSE:TATAMOTORS', sector: 'Automotive' },
                    { name: 'HDFC Bank Ltd', ticker: 'HDFCBANK', exchange: 'NSE:HDFCBANK', sector: 'Banking & Financials' },
                    { name: 'State Bank of India', ticker: 'SBIN', exchange: 'NSE:SBIN', sector: 'Banking' },
                    { name: 'ITC Ltd', ticker: 'ITC', exchange: 'NSE:ITC', sector: 'FMCG' },
                    { name: 'Apple Inc.', ticker: 'AAPL', exchange: 'NASDAQ:AAPL', sector: 'Global Tech' },
                  ].map((row, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900">{row.name}</span>
                        <span className="text-[10px] text-slate-400 block">{row.sector}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                          {row.ticker}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`=GET_LIVE_STOCK_PRICE("${row.ticker}")`, `tick_${idx}`)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          {copiedKey === `tick_${idx}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOW TO USE WITH SAME SHEET */}
          {activeTab === 'how_to_use' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Step-by-Step: Using Stock Tickers in the Same Google Sheet</span>
                </div>
                <p className="leading-relaxed">
                  You do not need a separate sheet! The single Google Sheet synced with iVault contains all 13 tables, including your stock portfolio. Here is the seamless workflow:
                </p>
              </div>

              {/* Step by step cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-sm">Add Stocks in iVault with Tickers</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      In iVault &gt; FinTracker &gt; <strong>Demat &amp; MF</strong>, click <strong>&quot;Add Investment&quot;</strong>. Choose <strong>Direct Equity Stock</strong> or <strong>Index ETF</strong>. In the <strong>Ticker / Symbol</strong> box, enter the stock symbol (e.g. <code>TCS</code>, <code>INFY</code>, <code>RELIANCE</code>, <code>TATAMOTORS</code>, <code>AAPL</code>).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-sm">Connect Web App URL in iVault</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Paste your Google Sheets Web App URL once in <strong>Settings &gt; Google Sheets Sync</strong> (or right from the Demat refresh setup prompt). This links iVault directly to your Google Sheets live pricing backend.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-sm">Click &quot;Refresh Stock Prices&quot; in iVault (No Need to Open Google Sheets!)</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Simply click the <strong>&quot;Refresh Stock Prices&quot;</strong> button right at the top of your Demat portfolio. iVault communicates with your cloud engine, fetches the latest live price for all your stock tickers, and updates your portfolio valuation instantly on click!
                    </p>
                    <p className="text-emerald-700 text-[11px] font-bold">
                      ✓ Zero background timers or auto-refresh overhead: refresh on click whenever you want! Both your iVault app and Google Sheet stay updated.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-sm">Gold &amp; Mutual Funds Remain 100% Manual</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      As requested, your Gold holdings and Mutual Funds are completely protected from automated overwrites. You can update their purchase rates, grams, or NAVs manually anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE.GS SCRIPT */}
          {activeTab === 'codegs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <Code2 className="w-4 h-4 text-slate-700" />
                  <span>Google Apps Script (Code.gs) Dedicated to Stock Live Refresh</span>
                </div>
                <p className="leading-relaxed">
                  This script supports 13-tab cloud backup with timezone-safe dates, plus the dedicated <strong>Stock Live Refresh Engine</strong>:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                    ✓ Stock &amp; ETF Live Prices (=GET_LIVE_STOCK_PRICE)
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                    ✓ Hourly Stock Background Auto-Refresh
                  </span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                    ✓ Gold &amp; MF Excluded from Auto-Refresh (Manual mode intact)
                  </span>
                </div>
              </div>

              {/* Setup steps */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>How to Paste and Activate in Google Sheets:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900/90 pl-1">
                  <li>In Google Sheets, open <strong>Extensions &gt; Apps Script</strong></li>
                  <li>Paste the script below into <strong>Code.gs</strong> and click Save</li>
                  <li>Click <strong>Deploy &gt; New Deployment &gt; Web App</strong> (Execute as: <em>Me</em>, Access: <em>Anyone</em>)</li>
                  <li>Reload your Google Sheet — the menu <strong>&quot;⚡ iVault PRO Live Engine&quot;</strong> will appear!</li>
                </ol>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  Complete Code.gs script:
                </span>
                <button
                  onClick={() => copyToClipboard(appsScriptCode, 'codegs_full')}
                  className="px-4 py-2 bg-[#C93B2B] hover:bg-[#A52316] text-white font-extrabold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedKey === 'codegs_full' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'codegs_full' ? 'Copied Code.gs!' : 'Copy Code.gs Script'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs max-h-80 overflow-y-auto leading-relaxed border border-slate-800 select-all">
                <pre>{appsScriptCode}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: MANUAL GOLD & MF NOTES */}
          {activeTab === 'manual_notes' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Manual Update Mode for Gold &amp; Mutual Funds</span>
                </div>
                <p className="leading-relaxed">
                  As requested, automated background refresh has been <strong>turned off for Gold rates and Mutual Funds</strong>. This ensures your customized rates, jewellery making charges, or NAVs are never overwritten by automated scripts!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Gold Holdings Manual Tracking</span>
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    In iVault &gt; FinTracker &gt; <strong>Gold Tab</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                    <li>Add or edit ornaments and bullion with your specific purchase rate and making charges.</li>
                    <li>Update your preferred current market rate per gram whenever you check with your local jeweller.</li>
                    <li>Google Sheets backup preserves your exact figures without altering them.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <LineChart className="w-4 h-4 text-emerald-600" />
                    <span>Mutual Funds Manual Tracking</span>
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    In iVault &gt; FinTracker &gt; <strong>Demat &amp; MF Tab</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                    <li>Edit any Mutual Fund or SIP item to update your latest units and reported NAV.</li>
                    <li>You have full control over the valuations without external API dependencies.</li>
                    <li>Only items designated as <strong>Direct Equity Stock</strong> or <strong>Index ETF</strong> participate in stock refresh.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                💡 <strong>Optional manual formulas:</strong> If you ever wish to look up benchmark rates inside your sheet on demand, helper formulas like <code>=GET_LIVE_GOLD_RATE_24K()</code> and <code>=GET_MF_NAV(schemeCode)</code> remain available in Code.gs as standard custom functions.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Stock prices refresh using standard tickers in your same Google Sheet.</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
