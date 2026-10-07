import React, { useState } from 'react';
import {
  FileText,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Plus,
  Upload,
  UserCheck,
  Calendar,
  Lock,
  Download,
  Pencil,
  Trash2,
  Sparkles,
  Car,
  Info,
  X,
} from 'lucide-react';
import type { FamilyDocument, FamilyMember } from '../../types/db.types';

interface FamilyDocTrackerModuleProps {
  familyMembers: FamilyMember[];
  documents: FamilyDocument[];
  onAddDocument: (doc: Omit<FamilyDocument, 'id'>) => Promise<void>;
  onUpdateDocument: (doc: FamilyDocument) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onAddMember: (member: Omit<FamilyMember, 'id'>) => void;
  activeMember: string;
  sessionMode: 'demo' | 'live';
}

export const FamilyDocTrackerModule: React.FC<FamilyDocTrackerModuleProps> = ({
  familyMembers,
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onAddMember,
  activeMember,
  sessionMode,
}) => {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'identity' | 'vehicle' | 'health' | 'expiring'>('all');
  const [revealedDocIds, setRevealedDocIds] = useState<Record<string, boolean>>({});
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<FamilyDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [documentSaveError, setDocumentSaveError] = useState('');
  const [documentActionError, setDocumentActionError] = useState('');
  const [previewDoc, setPreviewDoc] = useState<FamilyDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // New Document form state
  const [docMemberName, setDocMemberName] = useState(activeMember);
  const [docType, setDocType] = useState<FamilyDocument['docType']>('PAN Card');
  const [docVehicleNumber, setDocVehicleNumber] = useState('');
  const [rawDocId, setRawDocId] = useState('');
  const [docIssueDate, setDocIssueDate] = useState('2022-01-01');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [docIssuer, setDocIssuer] = useState('Government Authority of India');
  const [docNotes, setDocNotes] = useState('');

  // New Member form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('28');
  const [newMemberDateOfBirth, setNewMemberDateOfBirth] = useState('');
  const [newMemberRelationship, setNewMemberRelationship] = useState<FamilyMember['relationship']>('Spouse');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberBlood, setNewMemberBlood] = useState('B+');

  const filteredDocs = documents.filter((d) => {
    if (selectedMemberFilter !== 'all' && d.memberName !== selectedMemberFilter) return false;
    if (categoryFilter === 'identity') {
      return ['PAN Card', 'Aadhaar Card', "Driver's License", 'Passport', 'Voter ID'].includes(d.docType);
    }
    if (categoryFilter === 'vehicle') {
      return (
        [
          'Vehicle RC',
          'Vehicle Insurance',
          'Vehicle Pollution / PUC',
          'Vehicle Service & Warranty',
          'Vehicle Permit / Tax',
          "Driver's License",
        ].includes(d.docType) || !!d.vehicleNumber
      );
    }
    if (categoryFilter === 'health') {
      return d.docType === 'Health Insurance';
    }
    if (categoryFilter === 'expiring') {
      if (!d.expiryDate) return false;
      const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 30;
    }
    return true;
  });

  const toggleReveal = (docId: string) => {
    setRevealedDocIds((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { label: 'Permanent / No Expiry', color: 'bg-slate-100 text-slate-700', isAlert: false };
    const now = new Date().getTime();
    const expiry = new Date(expiryDate).getTime();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { label: '🚨 Expired', color: 'bg-rose-100 text-rose-800 font-bold', isAlert: true };
    }
    if (daysLeft <= 30) {
      return {
        label: `⚠️ Expiring in ${daysLeft} days`,
        color: 'bg-amber-100 text-amber-800 font-bold animate-pulse',
        isAlert: true,
      };
    }
    return {
      label: `✅ Valid until ${expiryDate}`,
      color: 'bg-emerald-100 text-emerald-800',
      isAlert: false,
    };
  };

  const closeDocumentModal = () => {
    setShowAddDocModal(false);
    setEditingDocument(null);
    setSelectedFile(null);
    setDocumentSaveError('');
    setFileInputKey((key) => key + 1);
  };

  const openAddDocument = () => {
    setEditingDocument(null);
    setDocMemberName(activeMember);
    setDocType('PAN Card');
    setRawDocId('');
    setDocIssueDate('2022-01-01');
    setDocExpiryDate('');
    setDocIssuer('Government Authority of India');
    setDocNotes('');
    setSelectedFile(null);
    setDocumentSaveError('');
    setDocumentActionError('');
    setShowAddDocModal(true);
  };

  const openDocumentEditor = (doc: FamilyDocument) => {
    setEditingDocument(doc);
    setDocMemberName(doc.memberName);
    setDocType(doc.docType);
    setRawDocId(doc.docNumberEncrypted || '');
    setDocIssueDate(doc.issueDate);
    setDocExpiryDate(doc.expiryDate || '');
    setDocIssuer(doc.issuer);
    setDocNotes(doc.notes || '');
    setSelectedFile(null);
    setDocumentSaveError('');
    setShowAddDocModal(true);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const member = familyMembers.find((m) => m.name === docMemberName);
    if (!member) {
      setDocumentSaveError('Select a valid family member before saving.');
      return;
    }
    const documentFields: Omit<FamilyDocument, 'id'> = {
      memberId: member.id,
      memberName: member.name,
      docType,
      docNumberRedacted: '[Document ID Omitted]', // Strict redaction standard
      docNumberEncrypted: rawDocId.trim(),
      issueDate: docIssueDate,
      expiryDate: docExpiryDate || undefined,
      issuer: docIssuer.trim(),
      fileName: selectedFile?.name || editingDocument?.fileName,
      fileData: selectedFile || editingDocument?.fileData,
      notes: docNotes || undefined,
    };

    try {
      if (editingDocument) {
        await onUpdateDocument({ ...documentFields, id: editingDocument.id });
      } else {
        await onAddDocument(documentFields);
      }
      setDocumentActionError('');
    } catch (error) {
      setDocumentSaveError(error instanceof Error ? error.message : 'Could not save the document.');
      return;
    }
    setRawDocId('');
    setDocNotes('');
    closeDocumentModal();
  };

  const handleDeleteDocument = async (doc: FamilyDocument) => {
    if (!window.confirm(`Delete ${doc.memberName}'s ${doc.docType}? This cannot be undone.`)) return;
    try {
      await onDeleteDocument(doc.id);
      setDocumentActionError('');
    } catch (error) {
      setDocumentActionError(error instanceof Error ? error.message : 'Could not delete the document.');
    }
  };

  const handleDownloadDocument = (doc: FamilyDocument) => {
    if (!doc.fileData) return;
    const objectUrl = URL.createObjectURL(doc.fileData);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = doc.fileName || `${doc.docType}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const colors = ['#C93B2B', '#002D62', '#047857', '#7E22CE', '#D97706'];
    const randomColor = colors[familyMembers.length % colors.length];
    const dateOfBirth = sessionMode === 'live' ? newMemberDateOfBirth : undefined;
    const age = dateOfBirth ? calculateAge(dateOfBirth) : parseInt(newMemberAge, 10);
    if (!Number.isFinite(age) || age < 0) return;

    onAddMember({
      name: newMemberName.trim(),
      age,
      dateOfBirth,
      relationship: newMemberRelationship,
      status: 'Active',
      phone: newMemberPhone,
      bloodGroup: newMemberBlood,
      avatarColor: randomColor,
    });

    setNewMemberName('');
    setShowAddMemberModal(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#002D62] via-[#052F5F] to-[#1E293B] p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-300" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-amber-200">
              REDACTED FAMILY VAULT
            </span>
          </div>
          <h3 className="text-xl font-black mt-1">Family DocTracker & Member Entities</h3>
          <p className="text-xs text-white/80 mt-0.5">
            Strict redaction with `[Document ID Omitted]` placeholders & 30-day renewal radar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/25 transition"
          >
            + Add Member
          </button>
          <button
            onClick={openAddDocument}
            className="px-3.5 py-2 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold text-xs rounded-xl shadow transition"
          >
            + Secure Document
          </button>
        </div>
      </div>

      {documentActionError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {documentActionError}
        </p>
      )}

      {/* Member Hierarchy Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedMemberFilter('all')}
          className={`px-3 py-2 rounded-xl font-bold transition shrink-0 ${
            selectedMemberFilter === 'all'
              ? 'bg-[#C93B2B] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Members ({documents.length} Docs)
        </button>

        {familyMembers.map((member) => {
          const docCount = documents.filter((d) => d.memberName === member.name).length;
          return (
            <button
              key={member.id}
              onClick={() => setSelectedMemberFilter(member.name)}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-2 shrink-0 ${
                selectedMemberFilter === member.name
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                style={{ backgroundColor: member.avatarColor }}
              >
                {member.name.charAt(0)}
              </div>
              <span>{member.name}</span>
              <span className="text-[10px] text-slate-400">({docCount})</span>
            </button>
          );
        })}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const expiryInfo = getExpiryStatus(doc.expiryDate);
          const isRevealed = revealedDocIds[doc.id];
          const displayedId = isRevealed
            ? doc.docNumberEncrypted || 'ABCDE1234F'
            : doc.docNumberRedacted || '[Document ID Omitted]';

          return (
            <div
              key={doc.id}
              className={`bg-white rounded-2xl p-4 border shadow-xs space-y-3 transition hover:shadow-md ${
                expiryInfo.isAlert ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black">
                  {doc.docType}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${expiryInfo.color}`}>
                  {expiryInfo.label}
                </span>
              </div>

              {/* Member & Issuer */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{doc.memberName}'s {doc.docType}</h4>
                <p className="text-[11px] text-slate-500">Issuer: {doc.issuer}</p>
              </div>

              {/* Secure Document ID Container with Strict Redaction */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#C93B2B]" />
                    <span>Protected Document Number</span>
                  </span>
                  <span
                    className={`font-mono font-bold tracking-wider ${
                      isRevealed ? 'text-slate-900 bg-amber-100 px-1 rounded' : 'text-slate-500'
                    }`}
                  >
                    {displayedId}
                  </span>
                </div>

                <button
                  onClick={() => toggleReveal(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                  title={isRevealed ? 'Mask ID' : 'Reveal ID'}
                >
                  {isRevealed ? <EyeOff className="w-4 h-4 text-slate-700" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>

              {/* Metadata Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block">Issue Date</span>
                  <span className="font-semibold text-slate-700">{doc.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Expiry Date</span>
                  <span className="font-semibold text-slate-700">{doc.expiryDate || 'Permanent'}</span>
                </div>
              </div>

              {/* File Attachment */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 truncate max-w-[170px] text-[11px] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{doc.fileName || 'No file attached'}</span>
                </span>
                {doc.fileData && (
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-50"
                    title="Download attached document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>

              {sessionMode === 'live' && (
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
                  <button onClick={() => openDocumentEditor(doc)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => void handleDeleteDocument(doc)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Add Secure Document */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">{editingDocument ? 'Edit Family Document' : 'Add Family Document'}</h3>
              <button onClick={closeDocumentModal} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Family Member</label>
                  <select
                    value={docMemberName}
                    onChange={(e) => setDocMemberName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.relationship})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as FamilyDocument['docType'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="PAN Card">PAN Card</option>
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Driver's License">Driver's License</option>
                    <option value="Passport">Passport</option>
                    <option value="Health Insurance">Health Insurance</option>
                    <option value="Vehicle RC">Vehicle RC</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Document Identifier (Strictly Redacted on Cloud)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABCDE1234F or DL-042021008"
                  value={rawDocId}
                  onChange={(e) => setRawDocId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={docIssueDate}
                    onChange={(e) => setDocIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={docExpiryDate}
                    onChange={(e) => setDocExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Issuer Organization</label>
                <input
                  type="text"
                  value={docIssuer}
                  onChange={(e) => setDocIssuer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Store the selected file with the document in local IndexedDB. */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document File Scan</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center cursor-pointer hover:bg-slate-50">
                  <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedFile?.name || editingDocument?.fileName || 'Click to attach image / PDF scan'}
                  </span>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    id="docFileInput"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="docFileInput" className="block text-[10px] text-[#C93B2B] font-bold mt-1 cursor-pointer">
                    Browse File
                  </label>
                </div>
              </div>

              {documentSaveError && <p className="text-xs font-semibold text-rose-700">{documentSaveError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 bg-[#C93B2B] hover:bg-[#A52316] text-white font-bold rounded-xl shadow mt-2"
              >
                {editingDocument ? 'Save Document Changes' : 'Store Document in Vault'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Member */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Add Family Member</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{sessionMode === 'live' ? 'Date of Birth' : 'Age'}</label>
                  {sessionMode === 'live' ? (
                    <>
                      <input
                        type="date"
                        required
                        max={new Date().toISOString().slice(0, 10)}
                        value={newMemberDateOfBirth}
                        onChange={(e) => setNewMemberDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                      {newMemberDateOfBirth && (
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          Calculated age: {calculateAge(newMemberDateOfBirth)} years
                        </p>
                      )}
                    </>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={newMemberAge}
                      onChange={(e) => setNewMemberAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Relationship</label>
                  <select
                    value={newMemberRelationship}
                    onChange={(e) => setNewMemberRelationship(e.target.value as FamilyMember['relationship'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                  <input
                    type="text"
                    value={newMemberBlood}
                    onChange={(e) => setNewMemberBlood(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#002D62] hover:bg-[#052F5F] text-white font-bold rounded-xl shadow mt-2"
              >
                Create Member Entity
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function calculateAge(dateOfBirth: string): number {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age--;
  }
  return age;
}
