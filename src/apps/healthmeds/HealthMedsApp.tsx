/**
 * @file HealthMedsApp.tsx
 * Independent Health & Medication Application.
 * Accessible directly at /healthMeds.
 * Comprehensive family medicine tracker: Today's Dosage Schedule,
 * Stock Refill Radar, Prescription Generator, Batch Logging & Member Profiles.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { db, initializeDatabase } from '../../services/db.service';
import { NotificationService } from '../../services/notification.service';
import type {
  Medicine,
  FamilyMember,
  AppSettings,
  AppNotification,
} from '../../types/db.types';

import { EcosystemHeader } from '../../components/ecosystem/EcosystemHeader';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { MedicineTrackerModule } from '../../components/medicines/MedicineTrackerModule';
import { PrescriptionModal } from '../../components/medicines/PrescriptionModal';
import { NotificationCenterModal } from '../../components/notifications/NotificationCenterModal';

import {
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  Sunrise,
  Sun,
  Moon,
  Plus,
  RefreshCw,
  LayoutDashboard,
  Zap,
  AlertCircle,
  X,
} from 'lucide-react';

export const HealthMedsApp: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [activeMember, setActiveMember] = useState<string>('Deepan');
  const [currentView, setCurrentView] = useState<'schedule' | 'cabinet' | 'refills' | 'prescriptions'>('schedule');

  // Medical State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
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

  const loadMedicalData = useCallback(async () => {
    try {
      await initializeDatabase();
      const [meds, members, sets, notifs] = await Promise.all([
        db.medicines.toArray(),
        db.familyMembers.toArray(),
        db.appSettings.get('default'),
        db.notifications.toArray().then((list) =>
          list
            .sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())
            .slice(0, 30)
        ),
      ]);

      setMedicines(meds);
      setFamilyMembers(members);
      setSettings(sets || null);
      setNotifications(notifs);
      setIsReady(true);
    } catch (err) {
      console.error('Error loading HealthMeds data:', err);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadMedicalData();
  }, [loadMedicalData]);

  // Handlers
  const handleTakeDose = async (medicineId: string) => {
    const med = await db.medicines.get(medicineId);
    if (!med) return;

    med.currentStock = Math.max(0, med.currentStock - (med.dailyQuantity || 1));
    med.lastDoseTakenAt = new Date().toISOString();
    await db.medicines.put(med);

    if (med.currentStock <= med.minRefillThreshold) {
      await NotificationService.dispatchNotification({
        type: 'medicine',
        title: `💊 Refill Alert: ${med.medicineName}`,
        message: `Stock for ${med.memberName} is down to ${med.currentStock} units.`,
        severity: med.currentStock === 0 ? 'danger' : 'warning',
        linkTab: 'medicines',
      });
    }

    await loadMedicalData();
    showToast(`Dose taken for ${med.medicineName}. Remaining: ${med.currentStock}`, 'success');
  };

  const handleRefillStock = async (medicineId: string, quantity: number) => {
    const med = await db.medicines.get(medicineId);
    if (!med) return;

    med.currentStock += quantity;
    await db.medicines.put(med);
    await loadMedicalData();
    showToast(`Refilled ${quantity} units for ${med.medicineName}. New stock: ${med.currentStock}`, 'success');
  };

  const handleBatchTakeDoses = async (
    timing?: 'Morning' | 'Afternoon' | 'Night' | 'all',
    memberName?: string
  ): Promise<number> => {
    const allMeds = await db.medicines.toArray();
    const targets = allMeds.filter((m) => {
      if (memberName && memberName !== 'all' && m.memberName !== memberName) return false;
      if (timing && timing !== 'all' && !m.timings.includes(timing)) return false;
      return true;
    });

    let updatedCount = 0;
    for (const med of targets) {
      if (med.currentStock > 0) {
        med.currentStock = Math.max(0, med.currentStock - (med.dailyQuantity || 1));
        med.lastDoseTakenAt = new Date().toISOString();
        await db.medicines.put(med);
        updatedCount++;
      }
    }

    await loadMedicalData();
    showToast(`Batch logged ${updatedCount} dose(s) successfully!`, 'success');
    return updatedCount;
  };

  const handleRevertDose = async (medicineId: string) => {
    const med = await db.medicines.get(medicineId);
    if (!med) return;

    med.currentStock += med.dailyQuantity || 1;
    med.lastDoseTakenAt = undefined;
    await db.medicines.put(med);
    await loadMedicalData();
    showToast(`Dose reverted for ${med.medicineName}.`, 'info');
  };

  const handleAddMedicine = async (medicineData: Omit<Medicine, 'id'>) => {
    await db.medicines.put({ id: `med-${Date.now()}`, ...medicineData });
    await loadMedicalData();
    showToast(`Added medicine "${medicineData.medicineName}".`, 'success');
  };

  const handleUpdateMedicine = async (medicine: Medicine) => {
    await db.medicines.put(medicine);
    await loadMedicalData();
    showToast(`Updated medicine "${medicine.medicineName}".`, 'success');
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    await db.medicines.delete(medicineId);
    await loadMedicalData();
    showToast('Medicine removed.', 'info');
  };

  const handleToggleAutoLogging = async (enabled: boolean) => {
    await db.appSettings.update('default', { autoLogDosagesEnabled: enabled });
    setSettings((prev) => (prev ? { ...prev, autoLogDosagesEnabled: enabled } : prev));
    showToast(`Auto-logging ${enabled ? 'enabled' : 'disabled'}.`, 'info');
  };

  // Stock and Schedule calculations
  const lowStockMeds = useMemo(() => {
    return medicines.filter((m) => m.currentStock <= m.minRefillThreshold);
  }, [medicines]);

  const todayDateStr = new Date().toISOString().split('T')[0];

  const pendingMorning = useMemo(() => {
    return medicines.filter(
      (m) =>
        m.timings.includes('Morning') &&
        (!m.lastDoseTakenAt || !m.lastDoseTakenAt.startsWith(todayDateStr))
    );
  }, [medicines, todayDateStr]);

  const pendingNight = useMemo(() => {
    return medicines.filter(
      (m) =>
        m.timings.includes('Night') &&
        (!m.lastDoseTakenAt || !m.lastDoseTakenAt.startsWith(todayDateStr))
    );
  }, [medicines, todayDateStr]);

  const navTabs = [
    { id: 'schedule', label: "Today's Schedule & Adherence", icon: LayoutDashboard },
    { id: 'cabinet', label: `Medicine Cabinet (${medicines.length})`, icon: Pill },
    {
      id: 'refills',
      label: `Refill Alarms (${lowStockMeds.length})`,
      icon: AlertTriangle,
      badge: lowStockMeds.length > 0 ? lowStockMeds.length : undefined,
    },
    { id: 'prescriptions', label: 'Doctor Prescriptions', icon: FileText },
  ];

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Loading HealthMeds...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-[#F4F6F9] text-slate-800 pb-20 overflow-y-auto">
      <OfflineIndicator />

      {/* App Header */}
      <EcosystemHeader
        appName="HealthMeds"
        appSubtitle="Family Prescriptions, Timed Dosage Alarms & Stock Refill Radar"
        appId="healthmeds"
        activeMember={activeMember}
        onSelectMember={setActiveMember}
        familyMembers={familyMembers}
        notifications={notifications}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        rightActions={
          <button
            onClick={() => setShowPrescriptionModal(true)}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition border border-white/20 cursor-pointer"
            title="Generate Printable Prescription Chart"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prescription Chart</span>
          </button>
        }
      />

      {/* Sub-Navigation */}
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
                      ? 'bg-teal-600 text-white shadow-xs'
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">
        {currentView === 'schedule' ? (
          <div className="space-y-4">
            {/* Today's Dosage Pulse Card */}
            <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <Clock className="w-4 h-4 text-teal-300" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                      Daily Adherence Pulse
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/20">
                    {new Date().toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {medicines.length} Tracked Prescriptions
                </h2>
                <p className="text-xs text-teal-100/80 mt-1 max-w-xl">
                  Intelligent dosage alarms, stock depletion forecast, and multi-member schedule.
                </p>

                {/* Batch Action Bar */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {pendingMorning.length > 0 && (
                    <button
                      onClick={() => handleBatchTakeDoses('Morning')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black transition shadow-xs cursor-pointer"
                    >
                      <Sunrise className="w-3.5 h-3.5" />
                      Take All Morning ({pendingMorning.length})
                    </button>
                  )}

                  {pendingNight.length > 0 && (
                    <button
                      onClick={() => handleBatchTakeDoses('Night')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition shadow-xs cursor-pointer"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      Take All Night ({pendingNight.length})
                    </button>
                  )}

                  <button
                    onClick={() => setShowPrescriptionModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-sm transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Generate PDF Prescription
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setCurrentView('schedule')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Morning Doses</span>
                  <Sunrise className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl font-black text-slate-900">{pendingMorning.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Pending for today</div>
              </div>

              <div
                onClick={() => setCurrentView('schedule')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-indigo-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Night Doses</span>
                  <Moon className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-xl font-black text-slate-900">{pendingNight.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Pending for tonight</div>
              </div>

              <div
                onClick={() => setCurrentView('refills')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-rose-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Low Stock Alarms</span>
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-xl font-black text-rose-600">{lowStockMeds.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Require pharmacy refill</div>
              </div>

              <div
                onClick={() => setCurrentView('cabinet')}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-teal-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400">Cabinet Total</span>
                  <Pill className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-xl font-black text-slate-900">{medicines.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Active medication lines</div>
              </div>
            </div>

            {/* Embedded Medicine Module */}
            <div className="mt-2">
              <MedicineTrackerModule
                medicines={medicines}
                familyMembers={familyMembers}
                onTakeDose={handleTakeDose}
                onRefillStock={handleRefillStock}
                onAddMedicine={handleAddMedicine}
                onUpdateMedicine={handleUpdateMedicine}
                onDeleteMedicine={handleDeleteMedicine}
                activeMember={activeMember}
                onOpenNotificationsAlerts={() => setShowNotificationsModal(true)}
                onBatchTakeDoses={handleBatchTakeDoses}
                onRevertDose={handleRevertDose}
                onToggleAutoLogging={handleToggleAutoLogging}
                autoLoggingEnabled={settings?.autoLogDosagesEnabled ?? true}
              />
            </div>
          </div>
        ) : currentView === 'cabinet' ? (
          <div className="space-y-4">
            <MedicineTrackerModule
              medicines={medicines}
              familyMembers={familyMembers}
              onTakeDose={handleTakeDose}
              onRefillStock={handleRefillStock}
              onAddMedicine={handleAddMedicine}
              onUpdateMedicine={handleUpdateMedicine}
              onDeleteMedicine={handleDeleteMedicine}
              activeMember={activeMember}
              onOpenNotificationsAlerts={() => setShowNotificationsModal(true)}
              onBatchTakeDoses={handleBatchTakeDoses}
              onRevertDose={handleRevertDose}
              onToggleAutoLogging={handleToggleAutoLogging}
              autoLoggingEnabled={settings?.autoLogDosagesEnabled ?? true}
            />
          </div>
        ) : currentView === 'refills' ? (
          <div className="space-y-4">
            <MedicineTrackerModule
              medicines={lowStockMeds}
              familyMembers={familyMembers}
              onTakeDose={handleTakeDose}
              onRefillStock={handleRefillStock}
              onAddMedicine={handleAddMedicine}
              onUpdateMedicine={handleUpdateMedicine}
              onDeleteMedicine={handleDeleteMedicine}
              activeMember={activeMember}
              onOpenNotificationsAlerts={() => setShowNotificationsModal(true)}
              onBatchTakeDoses={handleBatchTakeDoses}
              onRevertDose={handleRevertDose}
              onToggleAutoLogging={handleToggleAutoLogging}
              autoLoggingEnabled={settings?.autoLogDosagesEnabled ?? true}
            />
          </div>
        ) : currentView === 'prescriptions' ? (
          <div className="space-y-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Doctor Prescriptions & Charts</h3>
                <p className="text-xs text-slate-500">Comprehensive active prescription chart grouped by family member.</p>
              </div>
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Open PDF Prescription Generator
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familyMembers.map((mem) => {
                const memMeds = medicines.filter((m) => m.memberName === mem.name);
                if (memMeds.length === 0) return null;
                return (
                  <div key={mem.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        {mem.name} ({mem.relationship})
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {memMeds.length} prescription{memMeds.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {memMeds.map((med) => (
                        <div key={med.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {med.medicineName} <span className="text-slate-500 font-normal">({med.dosage})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Timings: <span className="font-semibold text-teal-700">{med.timings.join(', ')}</span> • {med.instructions}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-black text-slate-800 block">Stock: {med.currentStock}</span>
                            <span className="text-[10px] text-slate-400">Daily: {med.dailyQuantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {medicines.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-semibold">
                  No prescriptions added in the medical cabinet yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Prescription Chart Modal */}
      <PrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        medicines={medicines}
        familyMembers={familyMembers}
        initialMemberFilter="all"
      />

      {/* Notifications Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onRefreshNotifications={loadMedicalData}
        onNavigateTab={(tab) => {
          if (tab === 'medicines') setCurrentView('cabinet');
        }}
      />

      {/* Toast */}
      {toastNotice && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl shadow-2xl p-3.5 flex items-start gap-3 border animate-fadeIn transition backdrop-blur-md bg-white/95 text-slate-800 border-slate-200">
          <div className="shrink-0 mt-0.5">
            {toastNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toastNotice.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {toastNotice.type === 'info' && <Pill className="w-5 h-5 text-teal-600" />}
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
