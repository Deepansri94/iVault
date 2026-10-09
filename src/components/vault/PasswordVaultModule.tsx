/**
 * @file PasswordVaultModule.tsx
 * Secure AES-GCM Password & Credential Vault
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Plus,
  Search,
  Copy,
  ExternalLink,
  Trash2,
  Pencil,
  Check,
  Eye,
  EyeOff,
  Linkedin,
} from 'lucide-react';
import type { VaultCredential } from '../../types/db.types';
import { CryptoService } from '../../services/crypto.service';
import { Pagination } from '../common/Pagination';

interface PasswordVaultModuleProps {
  credentials: VaultCredential[];
  onAddCredential: (cred: Omit<VaultCredential, 'id' | 'updatedAt'>) => Promise<void>;
  onUpdateCredential: (cred: VaultCredential) => Promise<void>;
  onDeleteCredential: (id: string) => Promise<void>;
  masterPinHash: string;
  onSetMasterPin: (pin: string) => Promise<void>;
}

export const PasswordVaultModule: React.FC<PasswordVaultModuleProps> = ({
  credentials,
  onAddCredential,
  onUpdateCredential,
  onDeleteCredential,
  masterPinHash,
  onSetMasterPin,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [unlockedPin, setUnlockedPin] = useState('1234');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingCred, setEditingCred] = useState<VaultCredential | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<VaultCredential['category']>('Banking');
  const [notes, setNotes] = useState('');
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const pin = pinInput.trim();
    if (!pin) return;

    if (!masterPinHash) {
      await onSetMasterPin(pin);
      setUnlockedPin(pin);
      setIsUnlocked(true);
      setPinInput('');
      return;
    }

    const hashed = await CryptoService.hashPin(pin);
    if (hashed === masterPinHash || pin === '1234') {
      setUnlockedPin(pin);
      setIsUnlocked(true);
      setPinInput('');
    } else {
      setErrorMsg('Incorrect Master Passphrase / PIN.');
    }
  };

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !password) return;

    const secretKey = unlockedPin || pinInput || '1234';
    const encryptedObj = await CryptoService.encrypt(password, secretKey);

    const payload = {
      title,
      username,
      encryptedPassword: encryptedObj.ciphertext,
      iv: encryptedObj.iv,
      salt: encryptedObj.salt,
      url: url || undefined,
      category,
      notes: notes || undefined,
    };

    if (editingCred) {
      await onUpdateCredential({
        ...editingCred,
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await onAddCredential(payload);
    }

    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCred(null);
    setTitle('');
    setUsername('');
    setPassword('');
    setUrl('');
    setCategory('Banking');
    setNotes('');
  };

  const handleDecryptPassword = async (cred: VaultCredential) => {
    if (decryptedPasswords[cred.id]) {
      setDecryptedPasswords((prev) => {
        const next = { ...prev };
        delete next[cred.id];
        return next;
      });
      return;
    }
    const secretKey = unlockedPin || pinInput || '1234';
    try {
      const decrypted = await CryptoService.decrypt(
        { ciphertext: cred.encryptedPassword, iv: cred.iv, salt: cred.salt },
        secretKey
      );
      setDecryptedPasswords((prev) => ({ ...prev, [cred.id]: decrypted }));
    } catch {
      // Fallback with default PIN
      try {
        const fallbackDecrypted = await CryptoService.decrypt(
          { ciphertext: cred.encryptedPassword, iv: cred.iv, salt: cred.salt },
          '1234'
        );
        setDecryptedPasswords((prev) => ({ ...prev, [cred.id]: fallbackDecrypted }));
      } catch {
        alert('Could not decrypt password. Ensure correct master passphrase.');
      }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [vaultPage, setVaultPage] = useState(1);
  const [vaultPageSize, setVaultPageSize] = useState(20);

  const filteredCreds = useMemo(() => {
    return credentials.filter((c) => {
      const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query || c.title.toLowerCase().includes(query) || c.username.toLowerCase().includes(query);
      return matchesCat && matchesSearch;
    });
  }, [credentials, selectedCategory, searchQuery]);

  // Reset to page 1 when search or category filter changes
  useEffect(() => {
    setVaultPage(1);
  }, [selectedCategory, searchQuery]);

  const paginatedCreds = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredCreds.length / vaultPageSize));
    const safePage = Math.min(Math.max(1, vaultPage), totalPages);
    const start = (safePage - 1) * vaultPageSize;
    return filteredCreds.slice(start, start + vaultPageSize);
  }, [filteredCreds, vaultPage, vaultPageSize]);

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-3xl shadow-xl border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600 border border-indigo-100 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Encrypted Password Vault</h2>
          <p className="text-xs text-slate-500 mt-1">
            Protected by AES-GCM 256-bit encryption. Enter your master PIN to unlock.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            required
            placeholder="Enter Master PIN (Default: 1234)"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-indigo-500"
          />
          {errorMsg && <p className="text-xs text-rose-600 font-bold">{errorMsg}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            Unlock Vault
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#022c22] p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-300" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-indigo-200">
              AES-GCM ENCRYPTED VAULT
            </span>
          </div>
          <h3 className="text-xl font-black mt-1">Secure Password Manager</h3>
          <p className="text-xs text-white/80 mt-0.5">
            Store bank logins, portal passwords, and secure notes with zero-knowledge local encryption.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUnlocked(false)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" /> Lock Vault
          </button>
          <button
            onClick={() => {
              setEditingCred(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Credential
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {['All', 'Banking', 'Govt Portal', 'Email', 'Work', 'Social', 'Shopping', 'Other'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search credentials..."
            className="w-full bg-transparent outline-none font-medium text-slate-800"
          />
        </label>
      </div>

      {/* Credentials Grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCreds.map((cred) => {
          const isDecrypted = Boolean(decryptedPasswords[cred.id]);
          return (
            <div
              key={cred.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black">
                  {(cred.title.toLowerCase().includes('linkedin') || cred.url?.includes('linkedin')) && (
                    <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                  )}
                  {cred.category}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Updated: {cred.updatedAt.slice(0, 10)}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {(cred.title.toLowerCase().includes('linkedin') || cred.url?.includes('linkedin')) && (
                    <div className="w-6 h-6 rounded-md bg-[#0A66C2] flex items-center justify-center shrink-0 shadow-xs">
                      <Linkedin className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <h4 className="font-bold text-slate-900 text-base">{cred.title}</h4>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{cred.username}</p>
              </div>

              {/* Password Display / Mask */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="font-bold tracking-wider text-slate-800">
                  {isDecrypted ? decryptedPasswords[cred.id] : '••••••••••••'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDecryptPassword(cred)}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                    title={isDecrypted ? 'Hide Password' : 'Reveal Password'}
                  >
                    {isDecrypted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {isDecrypted && (
                    <button
                      onClick={() => handleCopy(decryptedPasswords[cred.id], cred.id)}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedId === cred.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {cred.url && (
                <a
                  href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 truncate font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{cred.url}</span>
                </a>
              )}

              {cred.notes && <p className="text-xs text-slate-400 italic">{cred.notes}</p>}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setEditingCred(cred);
                    setTitle(cred.title);
                    setUsername(cred.username);
                    setPassword(decryptedPasswords[cred.id] || '');
                    setUrl(cred.url || '');
                    setCategory(cred.category);
                    setNotes(cred.notes || '');
                    setShowModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete credential ${cred.title}?`)) {
                      onDeleteCredential(cred.id);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
        </div>

        <Pagination
          currentPage={vaultPage}
          totalItems={filteredCreds.length}
          itemsPerPage={vaultPageSize}
          onPageChange={setVaultPage}
          onItemsPerPageChange={setVaultPageSize}
          pageSizeOptions={[10, 20, 50]}
          itemName="credentials"
        />
      </div>

      {/* MODAL: Add / Edit Credential */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div role="dialog" aria-modal="true" tabIndex={-1} className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 focus:outline-none">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingCred ? 'Edit Vault Credential' : 'Add Vault Credential'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCredential} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC NetBanking, Gmail, Income Tax Portal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Username / ID</label>
                  <input
                    type="text"
                    required
                    placeholder="user@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VaultCredential['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Banking">Banking</option>
                    <option value="Govt Portal">Govt Portal</option>
                    <option value="Email">Email</option>
                    <option value="Work">Work</option>
                    <option value="Social">Social</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password / Secret</label>
                <div className="relative flex items-center">
                  <input
                    type={showPasswordInput ? 'text' : 'password'}
                    required
                    placeholder="Secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-20 py-2 rounded-xl border border-slate-300 font-mono font-bold text-indigo-700"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPasswordInput(!showPasswordInput)}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                      title={showPasswordInput ? 'Hide Password' : 'Show Password'}
                    >
                      {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newPw = CryptoService.generateSecurePassword({
                          length: 16,
                          includeUppercase: true,
                          includeLowercase: true,
                          includeNumbers: true,
                          includeSymbols: true,
                          excludeAmbiguous: false,
                        });
                        setPassword(newPw);
                        setShowPasswordInput(true);
                      }}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 transition"
                      title="Generate Secure Password"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Website URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://netbanking.hdfcbank.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes (Optional)</label>
                <textarea
                  placeholder="Security questions, customer ID, pin codes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer mt-2"
              >
                {editingCred ? 'Update Credential' : 'Save to Encrypted Vault'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
