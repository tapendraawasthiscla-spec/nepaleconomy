// src/pages/DownloadsPage.tsx
// Downloads page with Legal Documents (subcategories) and Other Downloads
// Admin can upload files; public can view and download them

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, Upload, Trash2, X, FolderOpen,
  BookOpen, ReceiptText, ShoppingCart, Ship, Scale, Archive, Plus, File, ChevronDown, ChevronRight
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DownloadFile {
  id: string;
  name: string;
  description: string;
  category: 'legal' | 'other';
  subcategory: string;
  fileData: string;       // base64
  fileType: string;       // MIME type
  fileSize: string;       // human-readable
  uploadedAt: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ne_downloads';

const LEGAL_SUBCATEGORIES = [
  { id: 'income-tax',  label: 'Income Tax',  icon: ReceiptText,  color: 'text-blue-600' },
  { id: 'vat',         label: 'VAT',         icon: ShoppingCart, color: 'text-green-600' },
  { id: 'excise',      label: 'Excise',      icon: Archive,      color: 'text-purple-600' },
  { id: 'customs',     label: 'Customs',     icon: Ship,         color: 'text-orange-600' },
  { id: 'other-laws',  label: 'Other Laws',  icon: Scale,        color: 'text-red-600' },
];

// ── Storage helpers ──────────────────────────────────────────────────────────

function loadFiles(): DownloadFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DownloadFile[];
  } catch { /* ignore */ }
  return [];
}

function saveFiles(files: DownloadFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (e) {
    console.warn('Could not save download files:', e);
    throw new Error('Storage limit reached. Try uploading a smaller file.');
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function FileCard({ file, isAdmin, onDelete }: { file: DownloadFile; isAdmin: boolean; onDelete: (id: string) => void }) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.fileData;
    link.download = file.name;
    link.click();
  };

  const isPdf = file.fileType === 'application/pdf';

  return (
    <div className="flex items-start gap-4 p-4 bg-white dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-700 hover:border-accent-gold/50 hover:shadow-md transition-all duration-200 group">
      {/* Icon */}
      <div className={`p-3 rounded-lg shrink-0 ${isPdf ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
        <FileText className={`w-6 h-6 ${isPdf ? 'text-red-500' : 'text-blue-500'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-serif font-bold text-secondary-navy dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-primary-crimson dark:group-hover:text-accent-gold transition-colors">
          {file.name}
        </h4>
        {file.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
            {file.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-gray-400">
          <span className="uppercase font-bold">{file.fileType.split('/')[1] || 'FILE'}</span>
          <span>•</span>
          <span>{file.fileSize}</span>
          <span>•</span>
          <span>{new Date(file.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-2 bg-secondary-navy hover:bg-black dark:bg-accent-gold dark:hover:bg-yellow-400 text-white dark:text-secondary-navy text-[10px] font-mono font-bold uppercase rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
        {isAdmin && (
          <button
            onClick={() => onDelete(file.id)}
            className="p-2 rounded-lg border border-red-200 dark:border-red-900 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Delete file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
  category,
  subcategory,
  onClose,
  onUpload,
}: {
  category: 'legal' | 'other';
  subcategory: string;
  onClose: () => void;
  onUpload: (file: DownloadFile) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setError('File too large. Maximum size is 8 MB.');
      return;
    }
    setSelectedFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedFile) { setError('Please select a file.'); return; }
    if (!name.trim()) { setError('Please enter a name for this file.'); return; }
    setUploading(true);
    setError('');
    try {
      const base64 = await fileToBase64(selectedFile);
      const newFile: DownloadFile = {
        id: `dl-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: name.trim(),
        description: description.trim(),
        category,
        subcategory,
        fileData: base64,
        fileType: selectedFile.type || 'application/octet-stream',
        fileSize: formatBytes(selectedFile.size),
        uploadedAt: new Date().toISOString(),
      };
      onUpload(newFile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed. Try a smaller file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-secondary-navy rounded-2xl shadow-2xl w-full max-w-lg border border-border-warm dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-warm dark:border-gray-700">
          <h3 className="font-serif font-black text-lg text-secondary-navy dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent-gold" />
            Upload File
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border-warm dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-accent-gold transition-colors"
          >
            {selectedFile ? (
              <div className="space-y-1">
                <File className="w-8 h-8 text-accent-gold mx-auto" />
                <p className="font-mono font-bold text-sm text-secondary-navy dark:text-white">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(selectedFile.size)}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Click to browse files</p>
                <p className="text-xs text-gray-400">PDF, DOC, DOCX, XLS, XLSX, Images — max 8 MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-1">Document Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Income Tax Act 2079"
              className="w-full border border-border-warm dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-transparent dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-gold"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this document…"
              rows={2}
              className="w-full border border-border-warm dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-transparent dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-gold resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-warm dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-mono font-bold uppercase border border-border-warm dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !selectedFile}
            className="px-5 py-2 text-xs font-mono font-bold uppercase bg-primary-crimson text-white rounded-lg hover:bg-[#6B0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {uploading ? (
              <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading…</>
            ) : (
              <><Upload className="w-3.5 h-3.5" />Upload</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

interface DownloadsPageProps {
  isAdminMode?: boolean;
}

export default function DownloadsPage({ isAdminMode = false }: DownloadsPageProps) {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [expandedLegal, setExpandedLegal] = useState<string | null>('income-tax');
  const [expandedOther, setExpandedOther] = useState(true);
  const [uploadModal, setUploadModal] = useState<{ category: 'legal' | 'other'; subcategory: string } | null>(null);

  useEffect(() => {
    setFiles(loadFiles());
  }, []);

  const handleUpload = (file: DownloadFile) => {
    const updated = [file, ...files];
    setFiles(updated);
    try {
      saveFiles(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this file?')) return;
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    saveFiles(updated);
  };

  const legalFiles = (subcategory: string) =>
    files.filter(f => f.category === 'legal' && f.subcategory === subcategory);

  const otherFiles = files.filter(f => f.category === 'other');

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 font-sans">

      {/* Page Header */}
      <div className="mb-8 text-left">
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Resource Library</span>
        </div>
        <h1 className="font-serif font-black text-3xl text-secondary-navy dark:text-white mb-2">
          Downloads
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          Access and download official legal documents, regulations, and other resources relevant to Nepal's economic and business environment.
        </p>
      </div>

      <div className="space-y-6">

        {/* ── Legal Documents Section ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-secondary-navy rounded-2xl border border-border-warm dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-border-warm dark:border-gray-700 bg-gradient-to-r from-secondary-navy/5 to-transparent dark:from-accent-gold/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-navy dark:bg-accent-gold rounded-lg">
                  <BookOpen className="w-5 h-5 text-white dark:text-secondary-navy" />
                </div>
                <div>
                  <h2 className="font-serif font-black text-xl text-secondary-navy dark:text-white">
                    Legal Documents
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Tax laws, regulations, and official government documents
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-secondary-navy/10 dark:bg-accent-gold/10 text-secondary-navy dark:text-accent-gold px-2.5 py-1 rounded-full font-bold">
                {files.filter(f => f.category === 'legal').length} files
              </span>
            </div>
          </div>

          {/* Subcategories */}
          <div className="divide-y divide-border-warm dark:divide-gray-700">
            {LEGAL_SUBCATEGORIES.map(sub => {
              const subFiles = legalFiles(sub.id);
              const isOpen = expandedLegal === sub.id;
              const IconComp = sub.icon;

              return (
                <div key={sub.id}>
                  {/* Subcategory header */}
                  <button
                    onClick={() => setExpandedLegal(isOpen ? null : sub.id)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <IconComp className={`w-4.5 h-4.5 ${sub.color}`} style={{ width: '18px', height: '18px' }} />
                      <span className="font-serif font-bold text-secondary-navy dark:text-white">
                        {sub.label}
                      </span>
                      <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                        {subFiles.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <span
                          onClick={e => { e.stopPropagation(); setUploadModal({ category: 'legal', subcategory: sub.id }); }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-accent-gold/10 text-amber-700 dark:text-accent-gold hover:bg-accent-gold/20 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add File
                        </span>
                      )}
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {/* Files grid */}
                  {isOpen && (
                    <div className="px-6 pb-5">
                      {subFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <FileText className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            No documents uploaded yet
                          </p>
                          {isAdmin && (
                            <button
                              onClick={() => setUploadModal({ category: 'legal', subcategory: sub.id })}
                              className="mt-3 text-xs font-mono font-bold text-primary-crimson underline cursor-pointer"
                            >
                              + Upload the first document
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {subFiles.map(f => (
                            <FileCard key={f.id} file={f} isAdmin={isAdmin} onDelete={handleDelete} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Other Downloads Section ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-secondary-navy rounded-2xl border border-border-warm dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Section Header */}
          <button
            onClick={() => setExpandedOther(v => !v)}
            className="w-full px-6 py-5 border-b border-border-warm dark:border-gray-700 bg-gradient-to-r from-primary-crimson/5 to-transparent dark:from-primary-crimson/10 hover:from-primary-crimson/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-crimson rounded-lg">
                  <Archive className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="font-serif font-black text-xl text-secondary-navy dark:text-white">
                    Other Downloads
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Reports, data, guides, and miscellaneous resources
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-primary-crimson/10 text-primary-crimson px-2.5 py-1 rounded-full font-bold">
                  {otherFiles.length} files
                </span>
                {expandedOther ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
          </button>

          {expandedOther && (
            <div className="p-6">
              {isAdmin && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setUploadModal({ category: 'other', subcategory: 'general' })}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase bg-primary-crimson text-white rounded-lg hover:bg-[#6B0000] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add File
                  </button>
                </div>
              )}

              {otherFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Archive className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No files uploaded yet
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setUploadModal({ category: 'other', subcategory: 'general' })}
                      className="mt-3 text-xs font-mono font-bold text-primary-crimson underline cursor-pointer"
                    >
                      + Upload the first file
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {otherFiles.map(f => (
                    <FileCard key={f.id} file={f} isAdmin={isAdmin} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <UploadModal
          category={uploadModal.category}
          subcategory={uploadModal.subcategory}
          onClose={() => setUploadModal(null)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}
