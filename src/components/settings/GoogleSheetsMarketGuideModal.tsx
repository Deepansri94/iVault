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
  ExternalLink,
  HelpCircle,
  Sparkles,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { GoogleSheetsSyncService } from '../../services/google-sheets-sync.service';

interface GoogleSheetsMarketGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  webappUrl?: string;
}

export const GoogleSheetsMarketGuideModal: React.FC<GoogleSheetsMarketGuideModalProps> = ({
  isOpen,
  onClose,
  webappUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'gold' | 'stocks' | 'mutual_funds' | 'template' | 'codegs'>('gold');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const appsScriptCode = GoogleSheetsSyncService.generateAppsScriptCode();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight text-white">
                  Google Sheets Live Prices Setup Guide
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px]">
                  LIVE AUTO-REFRESH
                </span>
              </div>
              <p className="text-xs text-white/70">
                Setup real-time automated formulas for Gold, NSE/BSE Stocks, and Mutual Funds
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
            onClick={() => setActiveTab('gold')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'gold'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span>1. Live Gold (24K &amp; 22K)</span>
          </button>

          <button
            onClick={() => setActiveTab('stocks')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'stocks'
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>2. NSE / BSE Stocks</span>
          </button>

          <button
            onClick={() => setActiveTab('mutual_funds')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'mutual_funds'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LineChart className="w-4 h-4 text-emerald-600" />
            <span>3. Mutual Funds (AMFI NAV)</span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'template'
                ? 'border-purple-600 text-purple-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>4. Complete Sheet Layout</span>
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
            <span>5. Enhanced Code.gs</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* TAB 1: GOLD */}
          {activeTab === 'gold' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>How Google Sheets Tracks Live Gold in India</span>
                </div>
                <p className="leading-relaxed">
                  Google Finance tracks the international spot gold price in Indian Rupees via ticker{' '}
                  <code className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono font-bold text-amber-900">
                    CURRENCY:XAUINR
                  </code>
                  . This gives the price for <strong>1 Troy Ounce</strong> (31.1034768 grams).
                  By dividing by 31.1034768 and applying the Indian domestic import duty &amp; retail tax factor (~12%), you get the accurate real-time Indian 24K and 22K per-gram rate!
                </p>
              </div>

              {/* Formula Cards */}
              <div className="space-y-3">
                {/* 24K Gold Rate */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        24K Pure Gold Rate (₹ / gram)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Formula converts spot troy ounce to gram + Indian domestic retail factor
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          '=ROUND((GOOGLEFINANCE("CURRENCY:XAUINR") / 31.1034768) * 1.12, 0)',
                          'gold24k'
                        )
                      }
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      {copiedKey === 'gold24k' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'gold24k' ? 'Copied!' : 'Copy Formula'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto select-all">
                    =ROUND((GOOGLEFINANCE("CURRENCY:XAUINR") / 31.1034768) * 1.12, 0)
                  </div>
                </div>

                {/* 22K Jewellery Gold Rate */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        22K Standard Jewellery Gold Rate (₹ / gram)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Calculates 91.6% purity standard from 24K cell (assumes 24K rate is in cell B2)
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          '=ROUND(B2 * (22 / 24), 0)',
                          'gold22k'
                        )
                      }
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      {copiedKey === 'gold22k' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'gold22k' ? 'Copied!' : 'Copy Formula'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto select-all">
                    =ROUND(B2 * (22 / 24), 0)
                  </div>
                </div>

                {/* Nippon India Gold ETF (Gold BeES) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        NSE Gold BeES ETF (Nippon India)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Live real-time National Stock Exchange gold trading benchmark
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard('=GOOGLEFINANCE("NSE:GOLDBEES", "price")', 'goldbees')
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      {copiedKey === 'goldbees' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'goldbees' ? 'Copied!' : 'Copy Formula'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto select-all">
                    =GOOGLEFINANCE("NSE:GOLDBEES", "price")
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STOCKS */}
          {activeTab === 'stocks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-blue-900">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Tracking Indian &amp; Global Stocks with GOOGLEFINANCE</span>
                </div>
                <p className="leading-relaxed">
                  For Indian stocks, prefix the ticker symbol with <code className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-mono font-bold">NSE:</code> for National Stock Exchange or <code className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-mono font-bold">BSE:</code> for Bombay Stock Exchange.
                </p>
              </div>

              {/* Formulas Cheat-Sheet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Live Stock Price</span>
                    <button
                      onClick={() => copyToClipboard('=GOOGLEFINANCE("NSE:TCS", "price")', 'tcs_p')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'tcs_p' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] select-all">
                    =GOOGLEFINANCE("NSE:TCS", "price")
                  </code>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Today's Change %</span>
                    <button
                      onClick={() => copyToClipboard('=GOOGLEFINANCE("NSE:RELIANCE", "changepct")', 'rel_chg')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'rel_chg' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] select-all">
                    =GOOGLEFINANCE("NSE:RELIANCE", "changepct")
                  </code>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">52-Week High &amp; Low</span>
                    <button
                      onClick={() => copyToClipboard('=GOOGLEFINANCE("NSE:INFY", "high52")', 'infy_52')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'infy_52' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] select-all">
                    =GOOGLEFINANCE("NSE:INFY", "high52")
                  </code>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">USD to INR Exchange Rate</span>
                    <button
                      onClick={() => copyToClipboard('=GOOGLEFINANCE("CURRENCY:USDINR")', 'usdinr')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'usdinr' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] select-all">
                    =GOOGLEFINANCE("CURRENCY:USDINR")
                  </code>
                </div>
              </div>

              {/* Popular Tickers Reference Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-extrabold text-slate-800">
                  Popular Indian Bluechip Symbols for Google Sheets
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { name: 'Reliance Industries', ticker: 'NSE:RELIANCE', sector: 'Energy & Retail' },
                    { name: 'Tata Consultancy Services', ticker: 'NSE:TCS', sector: 'IT Services' },
                    { name: 'HDFC Bank Ltd', ticker: 'NSE:HDFCBANK', sector: 'Banking' },
                    { name: 'Infosys Ltd', ticker: 'NSE:INFY', sector: 'IT Services' },
                    { name: 'State Bank of India', ticker: 'NSE:SBIN', sector: 'Public Sector Banking' },
                    { name: 'Tata Motors Ltd', ticker: 'NSE:TATAMOTORS', sector: 'Automobile' },
                    { name: 'ITC Ltd', ticker: 'NSE:ITC', sector: 'FMCG' },
                    { name: 'Nifty 50 Index ETF', ticker: 'NSE:NIFTYBEES', sector: 'Broad Market ETF' },
                  ].map((row, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900">{row.name}</span>
                        <span className="text-[10px] text-slate-400 block">{row.sector}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800 text-[11px]">
                          {row.ticker}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`=GOOGLEFINANCE("${row.ticker}", "price")`, `tick_${idx}`)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          {copiedKey === `tick_${idx}` ? 'Copied' : 'Copy Formula'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MUTUAL FUNDS */}
          {activeTab === 'mutual_funds' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                  <LineChart className="w-4 h-4 text-emerald-600" />
                  <span>How to Fetch Live Indian Mutual Fund NAVs</span>
                </div>
                <p className="leading-relaxed">
                  While standard <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold">GOOGLEFINANCE</code> covers stock market ETFs (like NIFTYBEES), regular mutual funds report daily official Net Asset Values (NAV) through the Association of Mutual Funds in India (AMFI).
                </p>
                <p className="leading-relaxed">
                  Our enhanced <strong>Code.gs</strong> includes a custom function: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold">=GET_MF_NAV(schemeCode)</code> which fetches the exact daily official NAV in 1 millisecond using the free high-speed AMFI API!
                </p>
              </div>

              {/* Step by Step */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <span className="font-extrabold text-slate-900 text-sm block">
                  How to Use =GET_MF_NAV() in Your Google Sheet
                </span>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p>
                      Copy and deploy the <strong>Enhanced Code.gs</strong> (from Tab 5 of this modal) into your Google Sheet's Apps Script editor.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <p>
                      In any cell of your Google Sheet, type: <code className="bg-slate-100 font-mono font-bold text-emerald-800 px-1 rounded">=GET_MF_NAV(122639)</code>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <p>
                      Press Enter. The cell immediately displays the latest live official NAV in Rupees!
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Sample Mutual Fund Formula</span>
                    <button
                      onClick={() => copyToClipboard('=GET_MF_NAV(122639)', 'mf_sample')}
                      className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'mf_sample' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs select-all">
                    =GET_MF_NAV(122639)
                  </div>
                </div>
              </div>

              {/* Popular Mutual Funds Scheme Code Cheat-Sheet */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-extrabold text-slate-800">
                  Popular Indian Mutual Fund AMFI Codes Cheat-Sheet
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { name: 'Parag Parikh Flexi Cap Fund (Direct Growth)', code: '122639', type: 'Flexi Cap Equity' },
                    { name: 'Mirae Asset Large Cap Fund (Direct Growth)', code: '118834', type: 'Large Cap Equity' },
                    { name: 'HDFC Balanced Advantage Fund (Direct Growth)', code: '101762', type: 'Hybrid / Dynamic' },
                    { name: 'Quant Small Cap Fund (Direct Growth)', code: '120828', type: 'Small Cap Equity' },
                    { name: 'SBI Bluechip Fund (Direct Growth)', code: '119598', type: 'Large Cap' },
                    { name: 'Nippon India Small Cap Fund (Direct Growth)', code: '118778', type: 'Small Cap' },
                  ].map((fund, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900">{fund.name}</span>
                        <span className="text-[10px] text-slate-400 block">{fund.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold">AMFI Code:</span>
                        <code className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-black text-[11px]">
                          {fund.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`=GET_MF_NAV(${fund.code})`, `mf_c_${idx}`)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          {copiedKey === `mf_c_${idx}` ? 'Copied' : 'Copy Formula'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEMPLATE LAYOUT */}
          {activeTab === 'template' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-purple-900">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Recommended "Live Market Tracker" Sheet Structure</span>
                </div>
                <p className="leading-relaxed">
                  You can create a new tab in your Google Sheet called <strong>Live Market Rates</strong>. Below is the ideal ready-to-copy table structure you can paste directly into your sheet!
                </p>
              </div>

              {/* Table Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#C93B2B] text-white font-extrabold">
                        <th className="p-2.5 border-r border-red-700">Asset / Instrument</th>
                        <th className="p-2.5 border-r border-red-700">Type</th>
                        <th className="p-2.5 border-r border-red-700">Google Sheet Formula</th>
                        <th className="p-2.5">Live Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">24K Pure Gold (1g)</td>
                        <td className="p-2.5 text-amber-600 font-bold">Precious Metal</td>
                        <td className="p-2.5 font-mono text-[11px] text-blue-700 bg-slate-50">
                          =ROUND((GOOGLEFINANCE("CURRENCY:XAUINR")/31.1034768)*1.12, 0)
                        </td>
                        <td className="p-2.5 font-black text-amber-600">₹7,250 / g</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">22K Standard Gold (1g)</td>
                        <td className="p-2.5 text-amber-600 font-bold">Jewellery</td>
                        <td className="p-2.5 font-mono text-[11px] text-blue-700 bg-slate-50">
                          =ROUND(D2*(22/24), 0)
                        </td>
                        <td className="p-2.5 font-black text-amber-600">₹6,650 / g</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Reliance Industries</td>
                        <td className="p-2.5 text-blue-600 font-bold">NSE Stock</td>
                        <td className="p-2.5 font-mono text-[11px] text-blue-700 bg-slate-50">
                          =GOOGLEFINANCE("NSE:RELIANCE", "price")
                        </td>
                        <td className="p-2.5 font-black text-slate-900">₹2,940.50</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">TCS Ltd</td>
                        <td className="p-2.5 text-blue-600 font-bold">NSE Stock</td>
                        <td className="p-2.5 font-mono text-[11px] text-blue-700 bg-slate-50">
                          =GOOGLEFINANCE("NSE:TCS", "price")
                        </td>
                        <td className="p-2.5 font-black text-slate-900">₹4,215.00</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Parag Parikh Flexi Cap</td>
                        <td className="p-2.5 text-emerald-600 font-bold">Mutual Fund</td>
                        <td className="p-2.5 font-mono text-[11px] text-blue-700 bg-slate-50">
                          =GET_MF_NAV(122639)
                        </td>
                        <td className="p-2.5 font-black text-emerald-600">₹85.42</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Copy CSV layout */}
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `Asset / Instrument,Type,Google Sheet Formula\n24K Pure Gold (1g),Precious Metal,"=ROUND((GOOGLEFINANCE(""CURRENCY:XAUINR"")/31.1034768)*1.12, 0)"\n22K Standard Gold (1g),Jewellery,"=ROUND(D2*(22/24), 0)"\nReliance Industries,NSE Stock,"=GOOGLEFINANCE(""NSE:RELIANCE"", ""price"")"\nTCS Ltd,NSE Stock,"=GOOGLEFINANCE(""NSE:TCS"", ""price"")"\nParag Parikh Flexi Cap,Mutual Fund,"=GET_MF_NAV(122639)"`,
                      'csv_template'
                    )
                  }
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  {copiedKey === 'csv_template' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'csv_template' ? 'Template Copied!' : 'Copy Template as CSV'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: ENHANCED CODE.GS */}
          {activeTab === 'codegs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <Code2 className="w-4 h-4 text-slate-700" />
                  <span>Enhanced Google Apps Script (Code.gs) with Live Market Engine</span>
                </div>
                <p className="leading-relaxed">
                  This script supports high-speed 13-tab iVault Pro database backup, <strong>plus</strong> the custom <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold">GET_MF_NAV(schemeCode)</code> function and an automated live market tracking setup!
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  Paste into Extensions &gt; Apps Script in your Google Sheet:
                </span>
                <button
                  onClick={() => copyToClipboard(appsScriptCode, 'codegs_full')}
                  className="px-4 py-2 bg-[#C93B2B] hover:bg-[#A52316] text-white font-extrabold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedKey === 'codegs_full' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'codegs_full' ? 'Copied Code.gs!' : 'Copy Full Code.gs Script'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs max-h-80 overflow-y-auto leading-relaxed border border-slate-800">
                <pre>{appsScriptCode}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Formulas update automatically in Google Sheets every 15-20 minutes during market hours.</span>
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
