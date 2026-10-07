/**
 * @file NotificationCenterModal.tsx
 * In-App Notification Center and Health Radar Modal
 *
 * Displays automated alerts, due dates, low-stock warnings, and provides actions
 * to audit system status, mark read, clear, or configure desktop browser notifications.
 */

import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Trash2,
  RefreshCw,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Pill,
  Landmark,
  FileText,
  DollarSign,
  Laptop,
  Gift,
} from 'lucide-react';
import type { AppNotification } from '../../types/db.types';
import { NotificationService } from '../../services/notification.service';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onRefreshNotifications: () => void;
  onNavigateTab: (tab: string) => void;
}

type FilterCategory = 'all' | 'unread' | 'budget' | 'medicine' | 'loan' | 'doc_expiry' | 'birthday';

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefreshNotifications,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [isAuditing, setIsAuditing] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    if (filter === 'budget') return item.type === 'budget';
    if (filter === 'medicine') return item.type === 'medicine';
    if (filter === 'loan') return item.type === 'loan';
    if (filter === 'doc_expiry') return item.type === 'doc_expiry';
    if (filter === 'birthday') return item.type === 'birthday';
    return true;
  });

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      await NotificationService.runAutomatedNotificationAudits();
      onRefreshNotifications();
    } finally {
      setIsAuditing(false);
    }
  };

  const handleMarkAllRead = async () => {
    await NotificationService.markAllAsRead();
    onRefreshNotifications();
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all application notifications?')) {
      await NotificationService.clearAllNotifications();
      onRefreshNotifications();
    }
  };

  const handleMarkRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    onRefreshNotifications();
  };

  const handleDelete = async (id: string) => {
    await NotificationService.deleteNotification(id);
    onRefreshNotifications();
  };

  const handleRequestDesktopPermission = async () => {
    const permission = await NotificationService.requestDesktopPermission();
    setDesktopPermission(permission);
    if (permission === 'granted') {
      NotificationService.sendDesktopNotification(
        'iVault Pro Alerts Enabled',
        'You will now receive desktop notifications for critical refills, budget limits, and loan dues.'
      );
    }
  };

  const handleNotificationClick = (item: AppNotification) => {
    if (!item.read) {
      handleMarkRead(item.id);
    }
    if (item.linkTab) {
      onNavigateTab(item.linkTab);
      onClose();
    }
  };

  const getCategoryIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'medicine':
        return <Pill className="w-4 h-4 text-emerald-600" />;
      case 'loan':
        return <Landmark className="w-4 h-4 text-blue-600" />;
      case 'doc_expiry':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'birthday':
        return <Gift className="w-4 h-4 text-pink-600" />;
      case 'budget':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getSeverityBadge = (severity: AppNotification['severity']) => {
    switch (severity) {
      case 'danger':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            <span>Critical</span>
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Warning</span>
          </span>
        );
      case 'success':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Resolved</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-500" />
            <span>Info</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Bell className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Application Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-black text-xs">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Automated health radar for budgets, medicine stock, loan dues, and document renewals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'unread'
                  ? 'bg-amber-500 text-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('budget')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'budget'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Budgets
            </button>
            <button
              onClick={() => setFilter('medicine')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'medicine'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Medicines
            </button>
            <button
              onClick={() => setFilter('loan')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'loan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Loans
            </button>
            <button
              onClick={() => setFilter('doc_expiry')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'doc_expiry'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Docs
            </button>
            <button
              onClick={() => setFilter('birthday')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                filter === 'birthday'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>🎂</span>
              <span>Birthdays</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              title="Run Automated Health Audit now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing...' : 'Run Audit'}</span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition cursor-pointer"
                title="Mark all as read"
              >
                Mark Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Notification Banner */}
        {desktopPermission !== 'granted' && (
          <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <Laptop className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Get notified on your desktop for critical medicine refills and budget alerts</span>
            </div>
            <button
              onClick={handleRequestDesktopPermission}
              className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shrink-0 cursor-pointer transition shadow-xs"
            >
              Enable Browser Alerts
            </button>
          </div>
        )}

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-700 text-base">All Caught Up!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  No active notifications in this category. All budgets, medicine stocks, and loan EMIs are operating smoothly.
                </p>
              </div>
              <button
                onClick={handleRunAudit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Run Health Audit</span>
              </button>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition flex gap-3 items-start relative group ${
                  notif.read
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-white border-indigo-300 shadow-sm ring-1 ring-indigo-200/50'
                }`}
              >
                {/* Category Icon */}
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 mt-0.5">
                  {getCategoryIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Unread" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getSeverityBadge(notif.severity)}
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    {notif.linkTab ? (
                      <button
                        onClick={() => handleNotificationClick(notif)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>View in {notif.linkTab.toUpperCase()}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2">
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="text-slate-300 hover:text-rose-600 transition cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero-Knowledge Offline Storage · Local Audits</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
