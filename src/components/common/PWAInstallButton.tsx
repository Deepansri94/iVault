/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, ShieldCheck, HelpCircle, RefreshCw } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const isAndroid = typeof window !== 'undefined' && /android/i.test(navigator.userAgent);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white px-2.5 py-1.5 text-xs font-bold backdrop-blur-md transition border border-white/30 shadow-xs cursor-pointer shrink-0"
        title="Install iVault Pro PWA to Home Screen"
      >
        <Download className={`w-3.5 h-3.5 ${isInstallable ? 'animate-bounce text-amber-300' : 'text-white'}`} />
        <span className="whitespace-nowrap">{isInstallable ? 'Install App' : 'Install'}</span>
      </button>

      {/* Installation Guide Dialog */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-800 relative space-y-4 border border-slate-200">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#C93B2B] flex items-center justify-center text-amber-300 font-black text-xl shadow-md shrink-0">
                iV
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Install iVault Pro
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isIOS ? 'Add to iPhone / iPad' : isAndroid ? 'Install on Android Phone' : 'Install on Desktop / Laptop'}
                </p>
              </div>
            </div>

            {/* Android Chrome Instructions */}
            {isAndroid && (
              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="font-extrabold text-slate-900 block text-xs">
                  How to install in Chrome on Android:
                </span>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#C93B2B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong>three dots menu (⋮)</strong> in the top-right corner of Chrome.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#C93B2B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Select <strong>Install app</strong> (or <em>"Add to Home screen"</em>).
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#C93B2B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Tap <strong>Install</strong> on the confirmation prompt. iVault Pro will install directly as a native standalone app!
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong className="block font-bold">Why did it show "This app cannot be installed"?</strong>
                  Android Chrome requires an active Web App Manifest and Service Worker. If you opened the site before the service worker registered, simply refresh the page once or use the 3-dots menu (⋮) to install!
                </div>
              </div>
            )}

            {/* iOS Safari Instructions */}
            {isIOS && (
              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="font-extrabold text-slate-900 block text-xs">
                  How to install in Safari on iOS:
                </span>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#C93B2B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong>Share</strong> button (square icon with upward arrow) at the bottom of Safari.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#C93B2B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Scroll down and tap <strong>Add to Home Screen</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#C93B2B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Tap <strong>Add</strong> in the top-right corner to finish.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop / Other Instructions */}
            {!isIOS && !isAndroid && (
              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="font-extrabold text-slate-900 block text-xs">
                  Desktop Chrome / Edge / Brave:
                </span>
                <p className="leading-relaxed text-[11px]">
                  Click the <strong>Install</strong> icon on the right side of the browser address bar (URL bar), or click the browser menu (⋮) &gt; <strong>Save and share</strong> &gt; <strong>Install iVault Pro</strong>.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowGuide(false);
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Launch Install Dialog</span>
                </button>
              )}
              <button
                onClick={() => setShowGuide(false)}
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-900 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
