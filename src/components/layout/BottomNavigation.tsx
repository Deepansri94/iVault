import React from 'react';
import {
  Home,
  TrendingUp,
  FileText,
  Pill,
  KeyRound,
  Sliders,
} from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  lowStockCount: number;
  expiringDocsCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
  expiringDocsCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'fintracker', label: 'FinTracker', icon: TrendingUp },
    {
      id: 'documents',
      label: 'Family Docs',
      icon: FileText,
      badge: expiringDocsCount > 0 ? expiringDocsCount : undefined,
    },
    {
      id: 'medicines',
      label: 'Health/Meds',
      icon: Pill,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: 'vault', label: 'Vault', icon: KeyRound },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto flex items-center justify-around px-2 py-1.5 sm:py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative group ${
                isActive ? 'text-[#C93B2B]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Optional Notification Badge */}
              {tab.badge !== undefined && (
                <span className="absolute top-0 right-1/4 -translate-y-1 translate-x-2 min-w-[16px] h-4 rounded-full bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center px-1 shadow animate-pulse">
                  {tab.badge}
                </span>
              )}

              {/* Icon Container with subtle pill highlight for active tab */}
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-orange-50 text-[#C93B2B] scale-105' : 'group-hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight leading-tight mt-0.5 ${
                  isActive ? 'font-black text-[#C93B2B]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
