/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  UserCheck,
  RotateCcw,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface SessionModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionMode: 'demo' | 'live';
  onSwitchToLiveMode: (primaryName: string) => Promise<void>;
  onResetToDemoMode: () => Promise<void>;
  activeMember: string;
}

export const SessionModeModal: React.FC<SessionModeModalProps> = ({
  isOpen,
  onClose,
  sessionMode,
  onSwitchToLiveMode,
  onResetToDemoMode,
  activeMember,
}) => {
  const [userName, setUserName] = useState(activeMember || 'Deepan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isLive = sessionMode === 'live';

  const handleConfirmLive = async () => {
    setIsSubmitting(true);
    try {
      await onSwitchToLiveMode(userName.trim() || 'Self');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDemo = async () => {
    setIsSubmitting(true);
    try {
      await onResetToDemoMode();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between"
          style={{
            background: isLive
              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              : 'linear-gradient(135deg, #C93B2B 0%, #A52316 100%)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
              {isLive ? <UserCheck className="w-5 h-5 text-emerald-200" /> : <Sparkles className="w-5 h-5 text-amber-200" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Session Mode Control</h3>
              <p className="text-xs text-white/80 mt-0.5">
                Current: <strong className="uppercase">{sessionMode} Session</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Current State Explanation */}
          <div className={`p-4 rounded-2xl border ${isLive ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {isLive ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live Personal Mode is Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Demo Mode is Currently Active</span>
                </>
              )}
            </div>
            <p className="mt-1.5 leading-relaxed text-[11px] opacity-90">
              {isLive
                ? 'You are managing genuine personal finances with zero dummy data. All transactions and balances reflect your real entries.'
                : 'Showing Prime Bank sample accounts, dummy loans, mutual funds, and demo family records so you can explore all features risk-free.'}
            </p>
          </div>

          {/* Action Choice */}
          {!isLive ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Primary Account Holder Name for Live Session:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deepan / Self"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-[#C93B2B]"
                />
                <span className="text-[11px] text-slate-500 block">
                  Switching to Live clears the demo records and creates a clean ledger for your real finances.
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmLive}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>Switch to Live Mode Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Want to explore the sample data again or demonstrate all features with sample accounts?
              </p>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDemo}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore Sample Demo Data</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Themes &amp; Google Sheets sync remain intact</span>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
