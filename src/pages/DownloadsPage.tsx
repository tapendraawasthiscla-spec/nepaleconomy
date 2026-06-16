import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, Upload, Trash2, X, FolderOpen,
  ReceiptText, Archive, Ship, Scale, Plus, File,
  Search, Link, Eye, QrCode, Clipboard, ExternalLink, HelpCircle, RefreshCw
} from 'lucide-react';
import { MediaItem, ResourceCategory } from '../types';
import QuickShareButton from '../components/QuickShareButton';
import LightboxPreview from '../components/LightboxPreview';
import { useToast } from '../components/ToastContext';

const LEGAL_SUBCATEGORIES: { id: ResourceCategory; label: string; icon: any; color: string }[] = [
  { id: 'income-tax',  label: 'Income Tax Laws',  icon: ReceiptText,  color: 'text-blue-500' },
  { id: 'vat',         label: 'VAT Guidelines',   icon: ReceiptText,  color: 'text-nexus-cyan' },
  { id: 'excise',      label: 'Excise Circulars', icon: Archive,      color: 'text-nexus-gold' },
  { id: 'customs',     label: 'Customs Accords',  icon: Ship,         color: 'text-purple-500' },
  { id: 'other-laws',  label: 'Other Statutes',   icon: Scale,        color: 'text-red-500' },
];

export default function DownloadsPage({ isAdminMode = false }: { isAdminMode?: boolean }) {
  const { addToast } = useToast();
  
  // Media registries list
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab ] = useState<'legal' | 'general'>('legal');
  const [expandedLegalSection, setExpandedLegalSection] = useState<ResourceCategory | null>('income-tax');
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  
  // File Preview Lightbox states (Section 4 specs)
  const [previewGallery, setPreviewGallery] = useState<{ items: MediaItem[]; index: number } | null>(null);

  // Multi upload queue states (Section 4 specifications)
  const [uploadQueue, setUploadQueue] = useState<{
    file: File;
    displayName: string;
    category: ResourceCategory;
    progress: number;
    uploaded: boolean;
    error: string;
  }[]>([]);

  const fileInputMultiRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data);
      } else {
        addToast('Error synchronizing database documents. Server status: ' + res.status, 'error');
      }
    } catch (err: any) {
      addToast('Failed to connect to document repository server.', 'error');
      console.warn("Failed retrieving upload logs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Retrieve and delete this resource permanently from records?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        }
      });
      if (res.ok) {
        setMediaItems(prev => prev.filter(item => item.id !== id));
        addToast('✓ File deleted from server storage.', 'success');
      }
    } catch {
      addToast('Deletion rejected.', 'error');
    }
  };

  // MULTI UPLOAD HANDLERS (Section 4 specification)
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    const newQueueItems = files.map(f => ({
      file: f,
      displayName: f.name.replace(/\.[^/.]+$/, ""), // strip extension by default
      category: 'general' as ResourceCategory,
      progress: 0,
      uploaded: false,
      error: ''
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);
    if (fileInputMultiRef.current) fileInputMultiRef.current.value = '';
  };

  const handleRemoveQueueItem = (idx: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQueueCategory = (idx: number, cat: ResourceCategory) => {
    setUploadQueue(prev => {
      const updated = [...prev];
      updated[idx].category = cat;
      return updated;
    });
  };

  const handleUpdateQueueName = (idx: number, name: string) => {
    setUploadQueue(prev => {
      const updated = [...prev];
      updated[idx].displayName = name;
      return updated;
    });
  };

  // Physical Multi Upload sequence using XMLHttpRequest for real progress (Section 4 specs)
  const handleUploadAll = async () => {
    const pending = uploadQueue.filter(item => !item.uploaded && !item.error);
    if (!pending.length) {
      addToast('No pending files to upload.', 'info');
      return;
    }

    addToast('Initiating multi-file parallel transmission...', 'info');

    const uploadFilePromise = (indexInQueue: number) => {
      return new Promise<void>((resolve) => {
        const item = uploadQueue[indexInQueue];
        const formData = new FormData();
        
        // Append customized display name with correct ext
        const ext = pathNameExt(item.file.name);
        const resolvedName = item.displayName ? `${item.displayName}${ext}` : item.file.name;
        
        formData.append('file', item.file, resolvedName);
        formData.append('category', item.category);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/media/upload');
        xhr.setRequestHeader('Authorization', localStorage.getItem('ne_admin_token') || '');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setUploadQueue(prev => {
              const updated = [...prev];
              updated[indexInQueue].progress = pct;
              return updated;
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resData = JSON.parse(xhr.responseText);
              setUploadQueue(prev => {
                const updated = [...prev];
                updated[indexInQueue].uploaded = true;
                updated[indexInQueue].progress = 100;
                return updated;
              });
              setMediaItems(prev => [resData.file, ...prev]);
            } catch {
              setUploadQueue(prev => {
                const updated = [...prev];
                updated[indexInQueue].error = 'Parsing error';
                return updated;
              });
            }
          } else {
            setUploadQueue(prev => {
              const updated = [...prev];
              updated[indexInQueue].error = `Error upload (${xhr.status})`;
              return updated;
            });
          }
          resolve();
        };

        xhr.onerror = () => {
          setUploadQueue(prev => {
            const updated = [...prev];
            updated[indexInQueue].error = 'Crashed';
            return updated;
          });
          resolve();
        };

        xhr.send(formData);
      });
    };

    // Parallel sync uploads
    const indexesPending = uploadQueue.map((item, i) => (!item.uploaded ? i : -1)).filter(i => i !== -1);
    await Promise.all(indexesPending.map(idx => uploadFilePromise(idx)));
    addToast('✓ Document transmission complete!', 'success');
  };

  const pathNameExt = (name: string) => {
    const dotIdx = name.lastIndexOf('.');
    return dotIdx !== -1 ? name.slice(dotIdx) : '';
  };

  // Searching filter logic
  const filteredMedia = mediaItems.filter(f => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return f.name.toLowerCase().includes(q) || (f.category || '').toLowerCase().includes(q);
  });

  const getLegalSectionFiles = (catId: ResourceCategory) => {
    return filteredMedia.filter(f => {
      const isPdf = f.type === 'application/pdf' || f.name.slice(-4).toLowerCase() === '.pdf';
      return isPdf && f.category === catId;
    });
  };

  const getGeneralRepositoryFiles = () => {
    return filteredMedia.filter(f => {
      // General includes non classified items and image formats
      const isImage = f.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.svg', '.webp'].some(ext => f.name.toLowerCase().endsWith(ext));
      const hasGeneralTag = f.category === 'general';
      return isImage || hasGeneralTag;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 font-sans text-left relative z-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-nexus-border pb-5 mb-8 select-none text-left leading-none">
        <div className="text-left font-sans">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-nexus-cyan uppercase font-black block">
            LAW REPOSITS & CIRCULARS REGISTRIES
          </span>
          
          <h1 className="text-2.5xl sm:text-3.5xl font-serif font-black text-white leading-tight tracking-tight mt-1 text-left font-serif">
            Sovereign Resource Repository
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-sans font-light mt-1.5 leading-relaxed text-left">
            Directly browse, share, and pre-review certified legislative tax files, excise maps, VAT structures, and export codes with custom short links.
          </p>
        </div>

        {isAdminMode && (
          <button
            onClick={() => setUploadPanelOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-nexus-cyan to-[#0099CC] text-nexus-void font-mono text-xs uppercase tracking-widest font-black rounded-lg transition-all shadow-md shrink-0 cursor-pointer text-center"
          >
            + Upload dossier
          </button>
        )}
      </div>

      {/* Main Tabs (Legal Statutes vs General Media) */}
      <div className="flex bg-[#0D1526] border border-nexus-border p-1 rounded-xl text-xs select-none gap-2 mb-6 max-w-sm">
        <button
          onClick={() => setActiveTab('legal')}
          className={`flex-1 py-2 px-3 rounded-lg font-mono font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'legal' ? 'bg-nexus-cyan text-nexus-void font-bold shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Legal Statutes
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-2 px-3 rounded-lg font-mono font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'general' ? 'bg-nexus-cyan text-nexus-void font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          General Media Repository
        </button>
      </div>

      {/* Live search input filter bar */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-nexus-cyan absolute left-3 top-3 select-none" />
        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter legal directives list or crop index..."
          className="w-full pl-10 pr-4 py-2.5 bg-nexus-card border border-nexus-border rounded-xl text-xs text-white focus:outline-none placeholder-gray-600 focus:border-nexus-cyan transition-colors"
        />
      </div>

      {/* RENDER LISTS */}
      {loading ? (
        <div className="py-20 text-center select-none font-sans">
          <RefreshCw className="w-8 h-8 animate-spin text-nexus-cyan mx-auto mb-2" />
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Syncing database documents...</span>
        </div>
      ) : activeTab === 'legal' ? (
        
        /* ── LEGAL DIRECTIVES TABLE ────────────────────────────────────────── */
        <div className="space-y-4 text-left">
          {LEGAL_SUBCATEGORIES.map((sub) => {
            const files = getLegalSectionFiles(sub.id);
            const isOpen = expandedLegalSection === sub.id;
            const Icon = sub.icon;

            return (
              <div key={sub.id} className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden text-left">
                
                <button
                  onClick={() => setExpandedLegalSection(isOpen ? null : sub.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 text-left">
                    <Icon className={`w-5 h-5 ${sub.color}`} />
                    <span className="font-serif font-black text-white text-sm sm:text-sm font-serif">
                      {sub.label}
                    </span>
                    <span className="text-[10px] font-mono bg-nexus-border text-nexus-cyan px-2 py-0.5 rounded-full select-none font-bold">
                      {files.length}
                    </span>
                  </div>
                  
                  <span className="text-xs text-gray-500 uppercase font-mono tracking-wider font-bold">
                    {isOpen ? 'Collapse [-]' : 'Expand [+]'}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 space-y-3 animate-fade-in text-left border-t border-nexus-border/60 pt-4">
                    {files.length === 0 ? (
                      <p className="text-[11.5px] text-gray-550 italic leading-snug">No certified PDF statues compiled in our {sub.label} catalogue currently.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        {files.map((file) => (
                          <div 
                            key={file.id}
                            className="bg-[#090F1B] border border-nexus-border hover:border-nexus-cyan/40 p-4 rounded-xl flex items-center gap-3 justify-between font-sans text-xs text-left"
                          >
                            <div className="min-w-0 text-left">
                              <h5 className="font-serif font-bold text-white text-sm truncate leading-snug max-w-[200px]" title={file.name}>
                                {file.name}
                              </h5>
                              <div className="flex gap-2 text-[10px] font-mono text-gray-500 mt-1 select-none">
                                <span className="uppercase">{file.size}</span>
                                <span>•</span>
                                <span>PDF</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 select-none">
                              <button
                                onClick={() => {
                                  const subFiles = getLegalSectionFiles(sub.id);
                                  const fileIndex = subFiles.indexOf(file);
                                  setPreviewGallery({ items: subFiles, index: fileIndex >= 0 ? fileIndex : 0 });
                                }}
                                className="p-1 px-2 hover:bg-nexus-cyan/15 border border-nexus-cyan/35 text-nexus-cyan rounded font-mono text-[9px] uppercase font-bold cursor-pointer"
                              >
                                Preview
                              </button>
                              
                              <QuickShareButton url={file.url} title={file.name} variant="badge" />
                              
                              {isAdminMode && (
                                <button
                                  onClick={() => handleDelete(file.id)}
                                  className="p-1 px-1.5 text-danger-red hover:bg-red-500/10 border border-red-500/20 rounded cursor-pointer"
                                  title="Archive delete file"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        /* ── GENERAL REPOSITORY MASONRY ───────────────────────────────────── */
        <div className="text-left font-sans">
          
          {getGeneralRepositoryFiles().length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-nexus-border rounded-xl select-none">
              <FolderOpen className="w-10 h-10 text-gray-700 mx-auto animate-pulse mb-3" />
              <p className="text-sm font-serif font-black text-gray-300">No General Repository files located.</p>
              <p className="text-xs text-gray-500 mt-1">Upload JPEG, PNG or non classified circulars under admin dashboards.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left animate-fade-in">
              {getGeneralRepositoryFiles().map((file) => {
                const isImage = file.type.startsWith('image/');
                return (
                  <div 
                    key={file.id}
                    className="bg-nexus-card border border-nexus-border rounded-xl overflow-hidden p-3.5 flex flex-col justify-between h-[210px] text-left relative group hover:border-nexus-cyan/45"
                  >
                    <div className="text-left space-y-2 flex-grow min-w-0">
                      
                      {/* Image Thumbnail Preview if photo */}
                      {isImage ? (
                        <div className="w-full h-24 bg-nexus-void rounded-lg overflow-hidden select-none border border-nexus-border/50">
                          <img 
                            src={file.url} 
                            alt={file.name} 
                            className="w-full h-full object-cover group-hover:scale-103 duration-300 pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-nexus-void rounded-lg flex items-center justify-center select-none border border-nexus-border">
                          <FileText className="w-8 h-8 text-nexus-cyan animate-pulse" />
                        </div>
                      )}

                      <h5 
                        className="font-serif font-black text-white text-xs truncate leading-snug cursor-pointer select-none"
                        title={file.name}
                        onClick={() => {
                          const genFiles = getGeneralRepositoryFiles();
                          const fileIndex = genFiles.indexOf(file);
                          setPreviewGallery({ items: genFiles, index: fileIndex >= 0 ? fileIndex : 0 });
                        }}
                      >
                        {file.name}
                      </h5>
                    </div>

                    <div className="border-t border-nexus-border/60 pt-2 flex justify-between items-center text-[10px] font-mono select-none">
                      <span className="text-gray-500 font-bold shrink-0">{file.size}</span>
                      
                      <div className="flex bg-[#0A0D15] rounded overflow-hidden select-none border border-nexus-border">
                        <button
                          onClick={() => {
                            const genFiles = getGeneralRepositoryFiles();
                            const fileIndex = genFiles.indexOf(file);
                            setPreviewGallery({ items: genFiles, index: fileIndex >= 0 ? fileIndex : 0 });
                          }}
                          className="px-2 py-0.5 hover:bg-nexus-cyan/15 text-nexus-cyan cursor-pointer"
                          title="View source"
                        >
                          Show
                        </button>
                        <span className="py-0.5 text-nexus-border">|</span>
                        
                        {isAdminMode ? (
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="px-2 py-0.5 hover:bg-danger-red/10 text-danger-red cursor-pointer"
                            title="Delete file"
                          >
                            ✕
                          </button>
                        ) : (
                          <a href={file.url} download className="px-2 py-0.5 hover:bg-white/10 text-white font-bold cursor-pointer">
                            ↓
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Preview SLider slide-out drawer (Section 4 specifications) */}
      {previewGallery && (
        <LightboxPreview 
          items={previewGallery.items}
          startIndex={previewGallery.index}
          onClose={() => setPreviewGallery(null)}
        />
      )}

      {/* MULTI UPLOAD SIDE OVERLAY PANEL (Section 4 specs) */}
      {uploadPanelOpen && isAdminMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none text-left pointer-events-auto">
          <div className="bg-nexus-panel border border-nexus-cyan/35 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-left">
            
            <div className="px-6 py-4 border-b border-nexus-border bg-nexus-void flex items-center justify-between select-none">
              <div className="text-left leading-none font-sans">
                <span className="text-[9.5px] font-mono tracking-widest text-nexus-cyan uppercase font-black">
                  NEXUS PRESS STORAGE MANAGER
                </span>
                <h3 className="text-sm sm:text-base font-serif font-black text-white uppercase mt-1 leading-none font-serif">
                  Publish Multi-Files Dossiers
                </h3>
              </div>

              <button 
                onClick={() => { setUploadPanelOpen(false); setUploadQueue([]); }} 
                className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[12px] text-left font-sans">
              
              {/* Multi Drag Dropzone */}
              <div 
                className="border-2 border-dashed border-nexus-border rounded-xl p-8 bg-nexus-void hover:border-nexus-cyan flex flex-col justify-center items-center text-center cursor-pointer select-none"
                onClick={() => fileInputMultiRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-nexus-cyan animate-pulse mx-auto mb-2" />
                <span className="font-bold text-white text-[12.5px] block">Drag documents files here or click to browse</span>
                <span className="text-[10.5px] text-gray-500 mt-1 select-none">Multiple PDF and Image files selection supported — Max 25 MB/file</span>
                
                <input 
                  ref={fileInputMultiRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleSelectFiles}
                />
              </div>

              {/* Upload queue details (Section 4 specs: filename, size, progress, category select) */}
              {uploadQueue.length > 0 && (
                <div className="space-y-3.5 text-left">
                  <span className="text-[9px] font-mono text-gray-405 font-bold uppercase tracking-wider block border-b border-nexus-border pb-1 text-left select-none">
                    Upload Transmission Queue ({uploadQueue.length} assets)
                  </span>

                  <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pt-1 text-left">
                    {uploadQueue.map((item, idx) => (
                      <div 
                        key={idx}
                        className="bg-nexus-card border border-nexus-border p-3.5 rounded-xl flex flex-col sm:flex-row gap-3.5 justify-between items-stretch text-left font-sans"
                      >
                        <div className="flex-1 min-w-0 text-left space-y-1">
                          <div className="flex items-center gap-2 select-none text-left leading-none font-sans">
                            <span className="text-[10px] font-mono text-gray-400 font-bold shrink-0">#{idx + 1}</span>
                            <span className="text-[10px] uppercase font-mono font-bold leading-none text-nexus-cyan">
                              {item.file.type || 'RAW/PDF'}
                            </span>
                            <span className="text-[9.5px] font-mono text-gray-500 leading-none">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>

                          <div className="text-left space-y-1 pt-1 font-sans">
                            <span className="text-[9.5px] font-mono text-gray-505 block leading-none">Custom Title name:</span>
                            <input 
                              type="text"
                              value={item.displayName}
                              onChange={e => handleUpdateQueueName(idx, e.target.value)}
                              placeholder="Name details override..."
                              className="w-full bg-nexus-void border border-nexus-border rounded p-1 text-[11px] text-white focus:outline-none placeholder-gray-650"
                            />
                          </div>
                        </div>

                        {/* Category specific selector (Section 4 guidelines: select explicitly) */}
                        <div className="flex flex-col justify-between shrink-0 text-left select-none space-y-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-nexus-gold block leading-none font-bold uppercase">Resource category:</span>
                            <select
                              value={item.category}
                              onChange={e => handleUpdateQueueCategory(idx, e.target.value as ResourceCategory)}
                              className="px-2 py-1 bg-nexus-void border border-nexus-border text-[10px] rounded text-nexus-cyan font-mono"
                            >
                              <option value="general">General Media</option>
                              <option value="income-tax">Income Tax Statutes</option>
                              <option value="vat">VAT Guidelines</option>
                              <option value="excise">Excise Circulars</option>
                              <option value="customs">Customs Accords</option>
                              <option value="other-laws">Other Laws</option>
                            </select>
                          </div>

                          {/* Progress indicators or remove buttons */}
                          <div className="flex items-center justify-between select-none text-left">
                            {item.uploaded ? (
                              <span className="text-nexus-green text-[10px] font-mono font-bold">✓ SYNCED</span>
                            ) : item.error ? (
                              <span className="text-danger-red text-[10.5px] font-mono font-bold">⚠️ OVER LIMIT</span>
                            ) : (
                              <div className="w-24 bg-nexus-void border border-nexus-border h-2 rounded-full overflow-hidden shrink-0 relative">
                                <div 
                                  className="absolute top-0 left-0 bg-nexus-cyan h-full duration-150 transition-all"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            )}

                            {!item.uploaded && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQueueItem(idx)}
                                className="text-gray-400 hover:text-red-500 font-bold ml-3 text-[11.5px] cursor-pointer"
                                title="Remove from queue"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-nexus-border flex justify-between items-center select-none bg-nexus-void">
              <span className="text-[10px] font-mono text-gray-500 uppercase font-black">SUPPORT PARALLEL CHANNELS</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setUploadPanelOpen(false); setUploadQueue([]); }}
                  className="px-4 py-2 border border-nexus-border text-gray-450 hover:text-white rounded-lg font-mono uppercase font-bold text-[9.5px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadAll}
                  disabled={uploadQueue.length === 0 || uploadQueue.every(i => i.uploaded)}
                  className="px-5 py-2 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 rounded-lg font-mono uppercase font-black tracking-widest text-[9.5px] cursor-pointer disabled:opacity-40"
                >
                  📡 TRANSMIT ALL
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
