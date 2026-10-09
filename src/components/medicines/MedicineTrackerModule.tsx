import React, { useState, useMemo, useEffect } from 'react';
import {
  Pill,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sunrise,
  Sun,
  Moon,
  RefreshCw,
  Sparkles,
  FileText,
  Bell,
  Zap,
  CheckCheck,
  RotateCcw,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { FamilyMember, Medicine } from '../../types/db.types';
import { db } from '../../services/db.service';
import { PrescriptionModal } from './PrescriptionModal';
import { Pagination } from '../common/Pagination';

interface MedicineTrackerModuleProps {
  medicines: Medicine[];
  familyMembers: FamilyMember[];
  onTakeDose: (medicineId: string) => void;
  onRefillStock: (medicineId: string, quantity: number) => void;
  onAddMedicine: (medicine: Omit<Medicine, 'id'>) => Promise<void>;
  onUpdateMedicine: (medicine: Medicine) => Promise<void>;
  onDeleteMedicine: (medicineId: string) => Promise<void>;
  activeMember: string;
  onOpenNotificationsAlerts?: () => void;
  onBatchTakeDoses?: (timing?: 'Morning' | 'Afternoon' | 'Night' | 'all', memberName?: string) => Promise<number>;
  onToggleAutoLogging?: (enabled: boolean) => Promise<void>;
  autoLoggingEnabled?: boolean;
  onRevertDose?: (medicineId: string) => Promise<void>;
}

export const MedicineTrackerModule: React.FC<MedicineTrackerModuleProps> = ({
  medicines,
  familyMembers,
  onTakeDose,
  onRefillStock,
  onAddMedicine,
  onUpdateMedicine,
  onDeleteMedicine,
  activeMember,
  onOpenNotificationsAlerts,
  onBatchTakeDoses,
  onToggleAutoLogging,
  autoLoggingEnabled = true,
  onRevertDose,
}) => {
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [batchActionNotice, setBatchActionNotice] = useState<string | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [medicineActionError, setMedicineActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New Medicine form state
  const [medMemberName, setMedMemberName] = useState(() => {
    const matched = familyMembers.find((m) => m.name.toLowerCase() === activeMember.toLowerCase());
    return matched ? matched.name : (familyMembers[0]?.name || activeMember || 'Self');
  });
  const [medName, setMedName] = useState('');
  const [medType, setMedType] = useState<Medicine['type']>('Tablet');
  const [medDosage, setMedDosage] = useState('500 mg');
  const [medTimings, setMedTimings] = useState<('Morning' | 'Afternoon' | 'Night')[]>(['Morning']);
  const [medInstructions, setMedInstructions] = useState<Medicine['instructions']>('After Food');
  const [medDailyQty, setMedDailyQty] = useState('1');
  const [medCurrentStock, setMedCurrentStock] = useState('30');
  const [medThreshold, setMedThreshold] = useState('7');
  const [medDoctorNotes, setMedDoctorNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const [medPage, setMedPage] = useState(1);
  const [medPageSize, setMedPageSize] = useState(20);

  const filteredMeds = useMemo(() => {
    return medicines.filter(
      (m) => selectedMember === 'all' || m.memberName === selectedMember
    );
  }, [medicines, selectedMember]);

  useEffect(() => {
    setMedPage(1);
  }, [selectedMember]);

  const paginatedMeds = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredMeds.length / medPageSize));
    const safePage = Math.min(Math.max(1, medPage), totalPages);
    const start = (safePage - 1) * medPageSize;
    return filteredMeds.slice(start, start + medPageSize);
  }, [filteredMeds, medPage, medPageSize]);

  const morningMeds = filteredMeds.filter((m) => m.timings.includes('Morning'));
  const afternoonMeds = filteredMeds.filter((m) => m.timings.includes('Afternoon'));
  const nightMeds = filteredMeds.filter((m) => m.timings.includes('Night'));

  const currentHour = new Date().getHours();
  const currentSlot: 'Morning' | 'Afternoon' | 'Night' =
    currentHour < 12 ? 'Morning' : currentHour < 17 ? 'Afternoon' : 'Night';

  const handleBatchLog = async (slot: 'Morning' | 'Afternoon' | 'Night' | 'all') => {
    if (onBatchTakeDoses) {
      const count = await onBatchTakeDoses(slot, selectedMember === 'all' ? undefined : selectedMember);
      setBatchActionNotice(`✓ Auto-logged ${count} medicine dosage${count === 1 ? '' : 's'} successfully!`);
      setTimeout(() => setBatchActionNotice(null), 3500);
    } else {
      // Fallback: log matching meds
      const targets =
        slot === 'all'
          ? filteredMeds
          : filteredMeds.filter((m) => m.timings.includes(slot));
      for (const m of targets) {
        if (m.currentStock > 0) onTakeDose(m.id);
      }
      setBatchActionNotice(`✓ Logged ${targets.length} scheduled doses!`);
      setTimeout(() => setBatchActionNotice(null), 3500);
    }
  };

  const toggleTiming = (t: 'Morning' | 'Afternoon' | 'Night') => {
    if (medTimings.includes(t)) {
      if (medTimings.length > 1) {
        setMedTimings(medTimings.filter((item) => item !== t));
      }
    } else {
      setMedTimings([...medTimings, t]);
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    setIsSaving(true);
    setMedicineActionError('');

    try {
      const memberNameClean = medMemberName.trim() || activeMember || 'Self';
      let targetMember = familyMembers.find(
        (m) => m.name.toLowerCase() === memberNameClean.toLowerCase()
      );

      let targetMemberId = targetMember?.id;
      if (!targetMember) {
        if (familyMembers.length > 0) {
          targetMember = familyMembers[0];
          targetMemberId = targetMember.id;
        } else {
          // Auto-provision a default family member so saving is never blocked
          targetMemberId = `mem-${Date.now()}`;
          const newMember: FamilyMember = {
            id: targetMemberId,
            name: memberNameClean,
            age: 30,
            relationship: 'Self',
            status: 'Active',
            avatarColor: '#047857',
          };
          await db.familyMembers.put(newMember);
        }
      }

      const medicineFields = {
        memberId: targetMemberId || `mem-${Date.now()}`,
        memberName: targetMember ? targetMember.name : memberNameClean,
        medicineName: medName.trim(),
        type: medType,
        dosage: medDosage.trim() || '500 mg',
        timings: medTimings.length > 0 ? medTimings : (['Morning'] as ('Morning' | 'Afternoon' | 'Night')[]),
        instructions: medInstructions,
        dailyQuantity: Math.max(1, Number(medDailyQty) || 1),
        currentStock: Math.max(0, Number(medCurrentStock) || 0),
        minRefillThreshold: Math.max(0, Number(medThreshold) || 0),
        doctorNotes: medDoctorNotes.trim() || undefined,
      };

      if (editingMedicine) {
        await onUpdateMedicine({ ...editingMedicine, ...medicineFields });
      } else {
        await onAddMedicine(medicineFields);
      }

      setMedName('');
      setMedDoctorNotes('');
      setEditingMedicine(null);
      setShowAddModal(false);
    } catch (error) {
      setMedicineActionError(
        error instanceof Error ? error.message : 'Could not save the medicine prescription.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setMedicineActionError('');
    setMedMemberName(medicine.memberName);
    setMedName(medicine.medicineName);
    setMedType(medicine.type);
    setMedDosage(medicine.dosage);
    setMedTimings(medicine.timings);
    setMedInstructions(medicine.instructions);
    setMedDailyQty(String(medicine.dailyQuantity));
    setMedCurrentStock(String(medicine.currentStock));
    setMedThreshold(String(medicine.minRefillThreshold));
    setMedDoctorNotes(medicine.doctorNotes || '');
    setShowAddModal(true);
  };

  const handleDeleteMedicine = async (medicine: Medicine) => {
    if (!window.confirm(`Delete ${medicine.medicineName} for ${medicine.memberName}? This cannot be undone.`)) return;
    try {
      await onDeleteMedicine(medicine.id);
      setMedicineActionError('');
    } catch (error) {
      setMedicineActionError(error instanceof Error ? error.message : 'Could not delete the medicine.');
    }
  };

  const openAddMedicine = () => {
    setEditingMedicine(null);
    setMedicineActionError('');
    const matched = familyMembers.find((m) => m.name.toLowerCase() === activeMember.toLowerCase());
    const defaultMember = matched ? matched.name : (familyMembers[0]?.name || activeMember || 'Self');
    setMedMemberName(defaultMember);
    setMedName('');
    setMedType('Tablet');
    setMedDosage('500 mg');
    setMedTimings(['Morning']);
    setMedInstructions('After Food');
    setMedDailyQty('1');
    setMedCurrentStock('30');
    setMedThreshold('7');
    setMedDoctorNotes('');
    setShowAddModal(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#047857] via-[#064E3B] to-[#022c22] p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-300" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-emerald-200">
              PRESCRIPTION & STOCK ENGINE
            </span>
          </div>
          <h3 className="text-xl font-black mt-1">Family Medicine & Dose Tracker</h3>
          <p className="text-xs text-white/80 mt-0.5">
            Morning, Afternoon & Night dose scheduling with automated threshold alerts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onOpenNotificationsAlerts && (
            <button
              onClick={onOpenNotificationsAlerts}
              className="px-3 py-2 bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-100 font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 border border-indigo-400/40 cursor-pointer"
              title="View Application Notifications and Health Radar for Low Stock & Doses"
            >
              <Bell className="w-4 h-4 text-indigo-200" />
              <span>Alerts Radar</span>
            </button>
          )}

          <button
            onClick={() => setShowPrescriptionModal(true)}
            className="px-3.5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 border border-white/25 cursor-pointer"
            title="View complete prescription chart with morning, afternoon and night dosages"
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            <span>View Prescription</span>
          </button>

          <button
            onClick={openAddMedicine}
            className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-900" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Batch Action Notice Toast */}
      {batchActionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{batchActionNotice}</span>
        </div>
      )}
      {medicineActionError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {medicineActionError}
        </p>
      )}

      {/* Automated Dosage Control Center */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <h4 className="font-extrabold text-slate-900 text-sm">Automated Dosage Schedule</h4>
              {autoLoggingEnabled && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  Daily Auto-Log Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              1-Tap batch log today's scheduled pills, or enable automatic background daily dose deductions
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={autoLoggingEnabled}
                onChange={(e) => onToggleAutoLogging && onToggleAutoLogging(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
              <span>Auto-Deduct Daily</span>
            </label>
          </div>
        </div>

        {/* 1-Tap Quick Batch Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => handleBatchLog('all')}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            title="Log all scheduled medicines for today in one click"
          >
            <Zap className="w-4 h-4 text-emerald-200" />
            <span>Log All Today's ({filteredMeds.length})</span>
          </button>

          <button
            onClick={() => handleBatchLog('Morning')}
            className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
              currentSlot === 'Morning'
                ? 'bg-amber-100 text-amber-950 border-amber-300 ring-1 ring-amber-300 font-extrabold'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            <Sunrise className="w-4 h-4 text-amber-600" />
            <span>Morning ({morningMeds.length})</span>
          </button>

          <button
            onClick={() => handleBatchLog('Afternoon')}
            className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
              currentSlot === 'Afternoon'
                ? 'bg-orange-100 text-orange-950 border-orange-300 ring-1 ring-orange-300 font-extrabold'
                : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200'
            }`}
          >
            <Sun className="w-4 h-4 text-orange-600" />
            <span>Afternoon ({afternoonMeds.length})</span>
          </button>

          <button
            onClick={() => handleBatchLog('Night')}
            className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
              currentSlot === 'Night'
                ? 'bg-indigo-100 text-indigo-950 border-indigo-300 ring-1 ring-indigo-300 font-extrabold'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-600" />
            <span>Night ({nightMeds.length})</span>
          </button>
        </div>
      </div>

      {/* Member Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedMember('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
            selectedMember === 'all'
              ? 'bg-[#C93B2B] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Family ({medicines.length} Prescriptions)
        </button>

        {familyMembers.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMember(m.name)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              selectedMember === m.name
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]"
              style={{ backgroundColor: m.avatarColor }}
            >
              {m.name.charAt(0)}
            </div>
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      {/* Medicine Cards Grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedMeds.map((med) => {
          const isLowStock = med.currentStock <= med.minRefillThreshold;
          const daysSupplyLeft = Math.floor(med.currentStock / (med.dailyQuantity || 1));
          const isTakenToday = med.lastDoseTakenAt ? med.lastDoseTakenAt.startsWith(todayStr) : false;

          return (
            <div
              key={med.id}
              className={`bg-white rounded-2xl p-4 border shadow-xs space-y-3 transition hover:shadow-md ${
                isLowStock ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20' : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-xs font-black">
                  {med.type} • {med.dosage}
                </span>

                <div className="flex items-center gap-1.5">
                  {isTakenToday && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" />
                      <span>Taken Today</span>
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                      isLowStock
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isLowStock ? `⚠️ Low (${med.currentStock})` : `Stock: ${med.currentStock}`}
                  </span>
                </div>
              </div>

              {/* Medicine Name & Member */}
              <div>
                <h4 className="font-bold text-slate-900 text-base">{med.medicineName}</h4>
                <p className="text-[11px] text-slate-500">
                  Prescribed for <strong className="text-slate-800">{med.memberName}</strong> • {med.instructions}
                </p>
              </div>

              {/* Timings Badges */}
              <div className="flex items-center gap-1.5 text-xs">
                {med.timings.includes('Morning') && (
                  <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[10px] flex items-center gap-1 border border-amber-200">
                    <Sunrise className="w-3 h-3 text-amber-600" /> Morning
                  </span>
                )}
                {med.timings.includes('Afternoon') && (
                  <span className="px-2 py-1 rounded-lg bg-orange-50 text-orange-800 font-bold text-[10px] flex items-center gap-1 border border-orange-200">
                    <Sun className="w-3 h-3 text-orange-600" /> Afternoon
                  </span>
                )}
                {med.timings.includes('Night') && (
                  <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-bold text-[10px] flex items-center gap-1 border border-indigo-200">
                    <Moon className="w-3 h-3 text-indigo-600" /> Night
                  </span>
                )}
              </div>

              {/* Stock Bar & Supply Meter */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Estimated Days Remaining</span>
                  <span className={`font-black ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                    ~{daysSupplyLeft} Days ({med.dailyQuantity}/day)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLowStock ? 'bg-rose-500' : 'bg-teal-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((med.currentStock / 30) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Threshold: {med.minRefillThreshold} units</span>
                  {med.lastDoseTakenAt && (
                    <span>Last: {new Date(med.lastDoseTakenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onTakeDose(med.id)}
                  disabled={med.currentStock <= 0}
                  className={`py-2 px-3 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                    isTakenToday
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isTakenToday ? 'Log Again' : 'Log Dose'}</span>
                </button>

                <div className="flex gap-1">
                  <button
                    onClick={() => onRefillStock(med.id, 30)}
                    className="flex-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-teal-600" />
                    <span>+30</span>
                  </button>

                  {onRevertDose && isTakenToday && (
                    <button
                      onClick={() => onRevertDose(med.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition border border-rose-200 cursor-pointer"
                      title="Undo dose logging (+1 stock)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {med.doctorNotes && (
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                  Notes: {med.doctorNotes}
                </p>
              )}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                <span className="text-[10px] text-slate-400 font-medium">Manage Item</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditMedicine(med)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    title="Edit medicine details"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => void handleDeleteMedicine(med)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer border border-rose-200/60"
                    title="Delete medicine"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>

        <Pagination
          currentPage={medPage}
          totalItems={filteredMeds.length}
          itemsPerPage={medPageSize}
          onPageChange={setMedPage}
          onItemsPerPageChange={setMedPageSize}
          pageSizeOptions={[10, 20, 50]}
          itemName="prescriptions"
        />
      </div>

      {/* MODAL: Add Medicine */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div role="dialog" aria-modal="true" tabIndex={-1} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 focus:outline-none">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">{editingMedicine ? 'Edit Medicine' : 'Add New Prescription'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingMedicine(null); setMedicineActionError(''); }} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-3 text-xs">
              {medicineActionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{medicineActionError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Family Member</label>
                  {familyMembers.length > 0 ? (
                    <select
                      value={medMemberName}
                      onChange={(e) => setMedMemberName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                    >
                      {familyMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.relationship})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={medMemberName}
                      onChange={(e) => setMedMemberName(e.target.value)}
                      placeholder="e.g. Self or Deepan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                    />
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Form / Type</label>
                  <select
                    value={medType}
                    onChange={(e) => setMedType(e.target.value as Medicine['type'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Medicine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol or Atorvastatin"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 mg / 1 tab"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Instructions</label>
                  <select
                    value={medInstructions}
                    onChange={(e) => setMedInstructions(e.target.value as Medicine['instructions'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="After Food">After Food</option>
                    <option value="Before Food">Before Food</option>
                    <option value="With Food">With Food</option>
                    <option value="Anytime">Anytime</option>
                  </select>
                </div>
              </div>

              {/* Timings Selector Pills */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Daily Timings</label>
                <div className="flex gap-2">
                  {(['Morning', 'Afternoon', 'Night'] as const).map((t) => {
                    const isSelected = medTimings.includes(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => toggleTiming(t)}
                        className={`flex-1 py-1.5 rounded-xl font-bold border transition ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Qty</label>
                  <input
                    type="number"
                    value={medDailyQty}
                    onChange={(e) => setMedDailyQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={medCurrentStock}
                    onChange={(e) => setMedCurrentStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alert Threshold</label>
                  <input
                    type="number"
                    value={medThreshold}
                    onChange={(e) => setMedThreshold(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Physician / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Balaji consultation"
                  value={medDoctorNotes}
                  onChange={(e) => setMedDoctorNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-bold rounded-xl shadow mt-2 cursor-pointer transition active:scale-98 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Prescription...</span>
                  </>
                ) : (
                  <span>{editingMedicine ? 'Save Medicine Changes' : 'Save Prescription'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Full Family Prescription Chart with Morning, Afternoon & Night Dosages */}
      <PrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        medicines={medicines}
        familyMembers={familyMembers}
        initialMemberFilter={selectedMember}
      />
    </div>
  );
};
