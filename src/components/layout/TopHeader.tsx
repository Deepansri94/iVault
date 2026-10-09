/**
 * @file TopHeader.tsx
 * Top Navigation Header & Brand Status Bar
 *
 * Displays unified wealth status, active family member profile switcher,
 * quick Smart Entry button, and Application Notification radar launcher.
 */

import React, { useState } from 'react';
import {
  Bell,
  Shield,
  Clock,
  Cloud,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { AppNotification } from '../../types/db.types';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface TopHeaderProps {
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenSmartEntry: () => void;
  onOpenProfile?: () => void;
  activeMember: string;
  onSelectMember: (name: string) => void;
  familyMembers: { name: string; age: number; relationship: string; avatarColor: string }[];
  isSheetsConnected?: boolean;
  onPullFromSheets?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  notifications,
  onOpenNotifications,
  onOpenSmartEntry,
  activeMember,
  onSelectMember,
  familyMembers,
  isSheetsConnected = false,
  onPullFromSheets,
}) => {
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <header
      className="relative text-white pt-3 pb-4 px-4 shadow-md transition-colors"
      style={{
        background: 'var(--theme-primary-gradient, linear-gradient(135deg, #C93B2B 0%, #A52316 55%, #002D62 100%))',
        backgroundColor: '#C93B2B',
      }}
    >
      {/* Top utility row */}
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: App Logo & Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-amber-300 text-lg border border-white/30 shadow-inner shrink-0">
            <Shield className="w-5 h-5 text-amber-300 fill-amber-300/30" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold tracking-tight text-white text-sm sm:text-base leading-tight shrink-0">
                iVault <span className="text-amber-300 font-black">PRO</span>
              </span>
            </div>
            <p className="text-[10px] text-white/70 font-medium tracking-wide truncate hidden xs:block">
              Unified Wealth &amp; Family Ecosystem
            </p>
          </div>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition active:scale-95 border border-white/20 cursor-pointer"
            title="Alerts and Application Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[9px] flex items-center justify-center px-1 shadow animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Family Member Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowMemberSelect(!showMemberSelect)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white pl-1 pr-2 sm:pr-2.5 py-1 rounded-xl text-xs font-semibold backdrop-blur-sm transition border border-white/25 cursor-pointer"
              title="Switch Active Member"
            >
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                style={{
                  backgroundColor:
                    familyMembers.find((m) => m.name === activeMember)?.avatarColor || '#002D62',
                }}
              >
                {activeMember.charAt(0)}
              </div>
              <span className="hidden sm:inline font-bold text-xs max-w-[70px] truncate">{activeMember}</span>
            </button>

            {/* Member Dropdown Menu */}
            {showMemberSelect && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-2xl border border-slate-200 py-1.5 text-slate-800 z-50 animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Member
                </div>
                {familyMembers.map((member) => (
                  <button
                    key={member.name}
                    onClick={() => {
                      onSelectMember(member.name);
                      setShowMemberSelect(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 transition ${
                      activeMember === member.name ? 'bg-orange-50 font-bold text-[#C93B2B]' : ''
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div>{member.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {member.relationship} • {member.age} yrs
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Greeting and Status Bar */}
      <div className="max-w-7xl mx-auto mt-3 flex items-center justify-between text-xs border-t border-white/15 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-white/80 font-normal">{greeting}, </span>
          <span className="text-white font-bold">{activeMember}</span>
          <div className="flex items-center gap-1.5 ml-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isSheetsConnected ? 'text-emerald-300' : 'text-white/60'}`}>
              <Cloud className="w-3 h-3" />
              <span>{isSheetsConnected ? 'Sheets Connected' : 'Offline Mode'}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/70 text-[11px]">
          <Clock className="w-3 h-3 text-amber-300" />
          <span>Active</span>
        </div>
      </div>
    </header>
  );
};
