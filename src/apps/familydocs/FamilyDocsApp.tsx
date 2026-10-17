/**
 * @file FamilyDocsApp.tsx
 * Independent Family Documents Application.
 * Accessible directly at /familyDocs.
 * Complete family document vault: Document Health Dashboard, Redacted Vault,
 * Expiry Reminders, Identity & Vehicle Categorization, and Member Profiles.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { db, initializeDatabase } from '../../services/db.service';
import type {
  FamilyDocument,
  FamilyMember,
  AppNotification,
} from '../../types/db.types';

import { EcosystemHeader } from '../../components/ecosystem/EcosystemHeader';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { FamilyDocTrackerModule } from '../../components/familydocs/FamilyDocTrackerModule';
import { NotificationCenterModal } from '../../components/notifications/NotificationCenterModal';

import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Plus,
  Users,
  Calendar,
  Lock,
  Layers,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const FamilyDocsApp: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [activeMember, setActiveMember] = useState<string>('Deepan');
  const [currentView, setCurrentView] = useState<'dashboard' | 'all' | 'expiring' | 'identity' | 'vehicle'>('dashboard');

  // Documents & Members State
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [documents, setDocuments] = useState<FamilyDocument[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [toastNotice, setToastNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastNotice({ type, message });
    setTimeout(() => {
      setToastNotice((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const loadDocsData = useCallback(async () => {
    try {
      await initializeDatabase();
      const [members, docs, notifs] = await Promise.all([
        db.familyMembers.toArray(),
        db.familyDocuments.toArray(),
        db.notifications.toArray().then((list) =>
          list
            .sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())
            .slice(0, 30)
        ),
      ]);

      setFamilyMembers(members);
      setDocuments(docs);
      setNotifications(notifs);
      setIsReady(true);
    } catch (err) {
      console.error('Error loading FamilyDocs data:', err);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadDocsData();
  }, [loadDocsData]);

  // Document Handlers
  const handleAddDocument = async (docData: Omit<FamilyDocument, 'id'>) => {
    await db.familyDocuments.put({ id: `doc-${Date.now()}`, ...docData });
    await loadDocsData();
    showToast(`Document "${docData.docType}" securely saved.`, 'success');
  };

  const handleUpdateDocument = async (doc: FamilyDocument) => {
    await db.familyDocuments.put(doc);
    await loadDocsData();
    showToast(`Document "${doc.docType}" updated.`, 'success');
  };

  const handleDeleteDocument = async (id: string) => {
    await db.familyDocuments.delete(id);
    await loadDocsData();
    showToast('Document deleted.', 'info');
  };

  const handleAddMember = async (memberData: Omit<FamilyMember, 'id'>) => {
    await db.familyMembers.put({ id: `member-${Date.now()}`, ...memberData });
    await loadDocsData();
    showToast(`Family member "${memberData.name}" added.`, 'success');
  };

  const handleUpdateMember = async (member: FamilyMember) => {
    await db.familyMembers.put(member);
    await loadDocsData();
    showToast(`Profile for "${member.name}" updated.`, 'success');
  };

  // Expiry calculations
  const expiringDocs = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return documents.filter((doc) => {
      if (!doc.expiryDate) return false;
      const exp = new Date(doc.expiryDate);
      return exp >= today && exp <= thirtyDaysFromNow;
    });
  }, [documents]);

  const expiredDocs = useMemo(() => {
    const today = new Date();
    return documents.filter((doc) => {
      if (!doc.expiryDate) return false;
      const exp = new Date(doc.expiryDate);
      return exp < today;
    });
  }, [documents]);

  // Category counts based on docType
  const identityCount = documents.filter((d) =>
    ['PAN Card', 'Aadhaar Card', 'Passport', 'Voter ID'].includes(d.docType)
  ).length;
  const vehicleCount = documents.filter((d) =>
    d.docType.startsWith('Vehicle') || d.docType === "Driver's License"
  ).length;
  const healthDocCount = documents.filter((d) => d.docType === 'Health Insurance').length;
  const otherCount = documents.length - identityCount - vehicleCount - healthDocCount;

  const navTabs = [
    { id: 'dashboard', label: 'Vault Dashboard', icon: LayoutDashboard },
    { id: 'all', label: `All Documents (${documents.length})`, icon: FileText },
    {
      id: 'expiring',
      label: `Expiring Soon (${expiringDocs.length + expiredDocs.length})`,
      icon: AlertTriangle,
      badge: expiringDocs.length + expiredDocs.length > 0 ? expiringDocs.length + expiredDocs.length : undefined,
    },
    { id: 'identity', label: `Identity Cards (${identityCount})`, icon: Shield },
    { id: 'vehicle', label: `Vehicle Records (${vehicleCount})`, icon: Layers },
  ];

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Loading FamilyDocs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-[#F4F6F9] text-slate-800 pb-20 overflow-y-auto">
      <OfflineIndicator />

      {/* App Header */}
      <EcosystemHeader
        appName="FamilyDocs"
        appSubtitle="Encrypted Family Records, Masked Redaction & Document Vault"
        appId="familydocs"
        activeMember={activeMember}
        onSelectMember={setActiveMember}
        familyMembers={familyMembers}
        notifications={notifications}
        onOpenNotifications={() => setShowNotificationsModal(true)}
      />

      {/* FamilyDocs Sub-Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ml-0.5">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">
        {currentView === 'dashboard' ? (
          <div className="space-y-4">
            {/* Vault Health Overview Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Shield className="w-4 h-4 text-blue-300" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                    Encrypted Family Vault
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {documents.length} Secure Documents Managed
                </h2>
                <p className="text-xs text-blue-200/80 mt-1 max-w-xl leading-relaxed">
                  All sensitive document numbers are masked by default with client-side SHA-256 redaction.
                  Instant expiry radar prevents document lapses for passports, licenses, and insurance.
                </p>

                {/* Expiry Warning Callout */}
                {(expiringDocs.length > 0 || expiredDocs.length > 0) && (
                  <div className="mt-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
                      <span className="text-xs font-bold text-rose-100">
                        {expiredDocs.length > 0
                          ? `${expiredDocs.length} document(s) have expired!`
                          : `${expiringDocs.length} document(s) expire within 30 days.`}
                      </span>
                    </div>
                    <button
                      onClick={() => setCurrentView('expiring')}
                      className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                      Inspect Expiries
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Document Vault Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setCurrentView('identity')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Identity Records</span>
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-black text-slate-900">{identityCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Aadhaar, Passport, PAN, Voter
                </div>
              </div>

              <div
                onClick={() => setCurrentView('vehicle')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-indigo-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Vehicle Papers</span>
                  <Layers className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl font-black text-slate-900">{vehicleCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  RC, Driving License, PUC &amp; Auto
                </div>
              </div>

              <div
                onClick={() => setCurrentView('all')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Health &amp; Medical</span>
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-xl font-black text-slate-900">{healthDocCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Insurance cards, vaccine records
                </div>
              </div>

              <div
                onClick={() => setCurrentView('all')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Family Members</span>
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-black text-slate-900">{familyMembers.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Linked profiles with document vaults
                </div>
              </div>
            </div>

            {/* Full Vault Module Embedded */}
            <div className="mt-2">
              <FamilyDocTrackerModule
                familyMembers={familyMembers}
                documents={documents}
                onAddDocument={handleAddDocument}
                onUpdateDocument={handleUpdateDocument}
                onDeleteDocument={handleDeleteDocument}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                activeMember={activeMember}
              />
            </div>
          </div>
        ) : (
          /* Dedicated Filtered View */
          <div className="space-y-4">
            <FamilyDocTrackerModule
              familyMembers={familyMembers}
              documents={
                currentView === 'expiring'
                  ? [...expiringDocs, ...expiredDocs]
                  : currentView === 'identity'
                  ? documents.filter((d) =>
                      ['PAN Card', 'Aadhaar Card', 'Passport', 'Voter ID'].includes(d.docType)
                    )
                  : currentView === 'vehicle'
                  ? documents.filter((d) =>
                      d.docType.startsWith('Vehicle') || d.docType === "Driver's License"
                    )
                  : documents
              }
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              activeMember={activeMember}
            />
          </div>
        )}
      </main>

      {/* Notifications Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onRefreshNotifications={loadDocsData}
        onNavigateTab={(tab) => {
          if (tab === 'documents') setCurrentView('all');
        }}
      />

      {/* Toast */}
      {toastNotice && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl shadow-2xl p-3.5 flex items-start gap-3 border animate-fadeIn transition backdrop-blur-md bg-white/95 text-slate-800 border-slate-200">
          <div className="shrink-0 mt-0.5">
            {toastNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toastNotice.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {toastNotice.type === 'info' && <Shield className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-snug">{toastNotice.message}</p>
          </div>
          <button
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
