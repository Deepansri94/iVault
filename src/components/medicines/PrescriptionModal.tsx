import React, { useMemo, useState } from 'react';
import { Download, Search, X } from 'lucide-react';
import type { FamilyMember, Medicine } from '../../types/db.types';
import { PdfPrescriptionService } from '../../services/pdf-prescription.service';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  familyMembers: FamilyMember[];
  initialMemberFilter?: string;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  medicines,
  familyMembers,
  initialMemberFilter = 'all',
}) => {
  const [selectedMember, setSelectedMember] = useState(initialMemberFilter);
  const [searchQuery, setSearchQuery] = useState('');

  const displayedMedicines = useMemo(() => medicines.filter((medicine) => {
    const matchesMember = selectedMember === 'all' || medicine.memberName === selectedMember;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      medicine.medicineName.toLowerCase().includes(query) ||
      medicine.memberName.toLowerCase().includes(query);
    return matchesMember && matchesSearch;
  }), [medicines, selectedMember, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Monthly Medicine Purchase Order</h2>
            <p className="text-xs text-slate-500">Calculates 30-day tablet consumption and procurement quantities</p>
          </div>
          <button onClick={onClose} aria-label="Close medicine list" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 30-Day Refill Procurement Metric Banner */}
        <div className="bg-teal-50/70 border-b border-teal-100 px-5 py-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-teal-800 uppercase font-bold block">30-Day Consumption</span>
              <span className="font-extrabold text-teal-900 text-sm">
                {displayedMedicines.reduce((acc, m) => acc + (m.dailyQuantity || 1) * 30, 0)} units
              </span>
            </div>
            <div className="border-l border-teal-200 pl-4">
              <span className="text-[10px] text-teal-800 uppercase font-bold block">Household Stock</span>
              <span className="font-semibold text-slate-700 text-sm">
                {displayedMedicines.reduce((acc, m) => acc + m.currentStock, 0)} units
              </span>
            </div>
            <div className="border-l border-teal-200 pl-4">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Net To Buy</span>
              <span className="font-black text-emerald-700 text-sm">
                {displayedMedicines.reduce(
                  (acc, m) => acc + Math.max(0, (m.dailyQuantity || 1) * 30 - m.currentStock),
                  0
                )}{' '}
                units
              </span>
            </div>
          </div>
          <span className="text-[11px] text-teal-700 font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-teal-200">
            {displayedMedicines.length} Prescriptions Filtered
          </span>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search medicines or family members"
              className="w-full py-2 text-sm outline-none"
            />
          </label>
          <select
            value={selectedMember}
            onChange={(event) => setSelectedMember(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
            aria-label="Filter by family member"
          >
            <option value="all">All family members</option>
            {familyMembers.map((member) => (
              <option key={member.id} value={member.name}>{member.name}</option>
            ))}
          </select>
          <button
            onClick={() => PdfPrescriptionService.generateMedicineListPdf(displayedMedicines)}
            disabled={displayedMedicines.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs transition"
          >
            <Download className="h-4 w-4" />
            <span>Download 30-Day Order (PDF)</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {displayedMedicines.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No medicines found.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {displayedMedicines.map((medicine) => {
                const need30 = (medicine.dailyQuantity || 1) * 30;
                const toBuy = Math.max(0, need30 - medicine.currentStock);
                return (
                  <li key={medicine.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">{medicine.medicineName}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {medicine.memberName}
                        </span>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Buy: {toBuy} units
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-700">
                      {medicine.type} · {medicine.dosage} · Daily: {medicine.dailyQuantity || 1}/day ({medicine.timings.join(', ')})
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span>30-Day Demand: <strong>{need30}</strong></span>
                      <span>·</span>
                      <span>In Stock: <strong>{medicine.currentStock}</strong></span>
                      <span>·</span>
                      <span>{medicine.instructions}</span>
                    </div>
                    {medicine.doctorNotes && <p className="mt-1 text-xs text-slate-400 italic">Notes: {medicine.doctorNotes}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};
