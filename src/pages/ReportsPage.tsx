import React, { useState, useEffect } from 'react';
import {
  FileText, Download, TrendingUp, Sparkles, Plus, Trash2, X,
  Bookmark, Link2, Eye, Calendar, User, Search, RefreshCw, BarChart2
} from 'lucide-react';
import { EconomicReport as Report } from '../types';
import LightboxPreview from '../components/LightboxPreview';
import QuickShareButton from '../components/QuickShareButton';
import { useToast } from '../components/ToastContext';

export default function ReportsPage({ isAdminMode = false }: { isAdminMode?: boolean }) {
  const { addToast } = useToast();
  
  // States
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Overlay management
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  
  // File Preview Lightbox
  const [previewGallery, setPreviewGallery] = useState<{ items: { url: string; name: string; type: string }[]; index: number } | null>(null);

  const openReportPreview = (rep: Report) => {
    const items = filteredReports.map(r => ({
      url: r.fileUrl,
      name: r.title,
      type: 'application/pdf'
    }));
    const index = filteredReports.findIndex(r => r.id === rep.id);
    if (index >= 0) {
      setPreviewGallery({ items, index });
    } else {
      setPreviewGallery({
        items: [{ url: rep.fileUrl, name: rep.title, type: 'application/pdf' }],
        index: 0
      });
    }
  };

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCover, setFormCover] = useState('https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formSize, setFormSize] = useState('2.4 MB');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formDate, setFormDate] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        addToast('Error synchronizing macroeconomic briefings. Status: ' + res.status, 'error');
      }
    } catch (err: any) {
      addToast('Failed to connect to reports repository server.', 'error');
      console.warn("Reports mapping failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openForCreate = () => {
    setEditingReport(null);
    setFormTitle('');
    setFormDesc('');
    setFormCover('https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80');
    setFormFileUrl('');
    setFormSize('1.8 MB');
    setFormFeatured(false);
    setFormDate(new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    setEditorOpen(true);
  };

  const openForEdit = (rep: Report) => {
    setEditingReport(rep);
    setFormTitle(rep.title);
    setFormDesc(rep.description);
    setFormCover(rep.coverUrl || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80');
    setFormFileUrl(rep.fileUrl);
    setFormSize(rep.size || '2.0 MB');
    setFormFeatured(rep.isFeatured || false);
    setFormDate(rep.date || 'Jan 2026');
    setEditorOpen(true);
  };

  // Live download click counter mapping
  const handleDownloadCounter = async (rep: Report) => {
    try {
      const updated = { ...rep, downloadCount: (rep.downloadCount || 0) + 1 };
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        // Increment client-side tally silently
        setReports(prev => prev.map(item => item.id === rep.id ? { ...item, downloadCount: (item.downloadCount || 0) + 1 } : item));
      }
    } catch {
      // Swollow silently
    }
  };

  const handleCommitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formFileUrl.trim()) return;

    const repObj: Report = {
      id: editingReport ? editingReport.id : `rep-${Date.now()}`,
      title: formTitle.trim(),
      description: formDesc.trim(),
      pdfUrl: formFileUrl.trim(), // keeping compatible schema types
      fileUrl: formFileUrl.trim(),
      coverUrl: formCover.trim(),
      size: formSize.trim(),
      downloadCount: editingReport ? editingReport.downloadCount : 0,
      isFeatured: formFeatured,
      date: formDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        },
        body: JSON.stringify(repObj)
      });

      if (res.ok) {
        addToast(editingReport ? '✓ Advisory record override complete.' : '✓ Sovereign Advisory report indexed.', 'success');
        setEditorOpen(false);
        fetchReports();
      } else {
        addToast('Invalid credential token.', 'error');
      }
    } catch {
      addToast('Core server communication failure.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently wipe this analytical brief from catalog?')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': localStorage.getItem('ne_admin_token') || ''
        }
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
        addToast('✓ Report cleared from sitemaps.', 'success');
      }
    } catch {
      addToast('Error archiving report.', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addToast('Transmitting document brief to repository...', 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': localStorage.getItem('ne_admin_token') || '' },
        body: formData
      });
      if (!res.ok) throw new Error();
      const payload = await res.json();
      setFormFileUrl(payload.file.url);
      setFormSize(payload.file.size);
      addToast('✓ PDF briefs linked and size parsed!', 'success');
    } catch {
      addToast('Media storage upload error.', 'error');
    }
  };

  // Search logic filter
  const filteredReports = reports.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  const featuredReport = reports.find(r => r.isFeatured);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 font-sans text-left relative z-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-nexus-border pb-5 mb-8 select-none text-left leading-none">
        <div className="text-left font-sans">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-nexus-cyan uppercase font-black block">
            SOVEREIGN RESEARCH &amp; CORRIDORS BRIEFINGS
          </span>
          <h1 className="text-2.5xl sm:text-3.5xl font-serif font-black text-white leading-tight tracking-tight mt-1 text-left font-serif">
            Advisory Research &amp; Bulletins
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-sans font-light mt-1.5 leading-relaxed text-left">
            Analyze audited, fact-verified, sovereign macroeconomic briefings parsed for international rating compliance.
          </p>
        </div>

        {isAdminMode && (
          <button
            onClick={openForCreate}
            className="px-5 py-2.5 bg-gradient-to-r from-nexus-cyan to-[#0099CC] text-nexus-void font-mono text-xs uppercase tracking-widest font-black rounded-lg transition-all shadow-md shrink-0 cursor-pointer text-center font-bold"
          >
            + Index reports
          </button>
        )}
      </div>

      <div className="relative mb-8">
        <Search className="w-4 h-4 text-nexus-cyan absolute left-3 top-3 select-none" />
        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter technical briefings, monetary maps, trade corridors..."
          className="w-full pl-10 pr-4 py-2.5 bg-nexus-card border border-nexus-border rounded-xl text-xs text-white focus:outline-none placeholder-gray-600 focus:border-nexus-cyan"
        />
      </div>

      {/* Featured briefing banner (Section 10 specs, distinct badge, download counts) */}
      {featuredReport && !searchQuery.trim() && (
        <div className="bg-[#0E1527] border border-nexus-cyan/45 rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-left relative overflow-hidden shadow-2xl">
          
          {/* Subtle mesh background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-nexus-cyan/10 to-transparent pointer-events-none" />

          {/* Left panel 4 cols: cover preview */}
          <div className="md:col-span-4 relative h-48 rounded-xl overflow-hidden border border-nexus-border select-none bg-nexus-void shadow-sm shrink-0">
            <img 
              src={featuredReport.coverUrl || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80'} 
              alt={featuredReport.title}
              className="w-full h-full object-cover pointer-events-none" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2.5 left-2.5 bg-nexus-cyan text-nexus-void font-mono text-[7px] font-black uppercase tracking-widest py-0.5 px-2 rounded border border-white/20 select-none">
              FEATURED DISPATCH
            </div>
          </div>

          {/* Right panel 8 cols: metadata parameters */}
          <div className="md:col-span-8 text-left space-y-3 relative z-10">
            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 font-bold select-none text-left leading-none">
              <span className="text-nexus-cyan uppercase bg-nexus-cyan/15 px-1.5 py-0.2 rounded font-black">Sovereign advisory bulletin</span>
              <span>•</span>
              <span>{featuredReport.date}</span>
            </div>

            <h3 className="font-serif font-black text-white text-lg sm:text-xl md:text-2xl line-clamp-2 leading-tight text-left font-serif">
              {featuredReport.title}
            </h3>

            <p className="text-[12px] sm:text-xs text-gray-300 font-sans font-light leading-relaxed text-left">
              {featuredReport.description}
            </p>

            <div className="flex items-center gap-4 select-none leading-none pt-2.5">
              <span className="text-[11px] font-mono text-[#00D4FF] font-black uppercase tracking-wider">
                📥 {featuredReport.downloadCount || 0} SECURE CLICKS RECORDED
              </span>

              <div className="flex bg-[#070B15] border border-nexus-border rounded-lg p-0.5 overflow-hidden font-mono text-[9px] uppercase font-bold shrink-0">
                <button
                  onClick={() => openReportPreview(featuredReport)}
                  className="px-3 py-1 hover:bg-nexus-cyan/15 text-nexus-cyan cursor-pointer transition-colors"
                >
                  Quick view
                </button>
                <span className="py-1 text-nexus-border select-none shrink-0">|</span>
                
                <a 
                  href={featuredReport.fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={() => handleDownloadCounter(featuredReport)}
                  className="px-3 py-1 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 cursor-pointer font-black transition-colors"
                >
                  Download Pdf ({featuredReport.size})
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* RENDER GRID REPORTS LIST */}
      {loading ? (
        <div className="py-20 text-center select-none font-sans">
          <RefreshCw className="w-8 h-8 animate-spin text-nexus-cyan mx-auto mb-2" />
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest leading-none">Syncing reports records...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-16 border-2 border-dashed border-nexus-border rounded-xl text-center select-none space-y-2">
          <Bookmark className="w-10 h-10 text-gray-700 mx-auto animate-bounce-short" />
          <h4 className="font-serif font-black text-white text-sm">Clear of analytical briefings</h4>
          <p className="text-xs text-gray-500">No matching advisory directives mapped in current logs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
          {filteredReports.map((rep) => {
            const isFeaturedTag = rep.isFeatured;
            return (
              <div 
                key={rep.id}
                className="bg-nexus-card border border-nexus-border rounded-xl p-4.5 flex flex-col justify-between h-[360px] text-left relative group hover:border-nexus-cyan/40 shadow-sm"
              >
                <div className="text-left space-y-3 min-w-0 flex-grow">
                  
                  {/* Cover crop image */}
                  <div className="w-full h-36 bg-nexus-void rounded-lg overflow-hidden border border-nexus-border relative select-none shrink-0">
                    <img 
                      src={rep.coverUrl || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80'} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-102 duration-300 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                    {isFeaturedTag && (
                      <span className="absolute top-2 left-2 bg-nexus-cyan text-nexus-void text-[6.5px] font-mono font-black py-0.5 px-1.5 rounded uppercase leading-none select-none">
                        Featured circular
                      </span>
                    )}
                  </div>

                  <div className="text-left space-y-1.5 min-w-0 leading-none font-sans">
                    <div className="flex justify-between text-[8px] font-mono text-gray-550 leading-none select-none">
                      <span>{rep.date}</span>
                      <span className="uppercase text-nexus-cyan font-bold">{rep.size}</span>
                    </div>

                    <h4 
                      onClick={() => openReportPreview(rep)}
                      className="font-serif font-black text-white text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-nexus-cyan group-hover:underline cursor-pointer text-left font-serif"
                    >
                      {rep.title}
                    </h4>

                    <p className="text-[10.5px] leading-relaxed text-gray-400 font-sans font-light line-clamp-3 text-left">
                      {rep.description}
                    </p>
                  </div>

                </div>

                <div className="border-t border-nexus-border/60 pt-3.5 mt-3 flex items-center justify-between text-[10px] font-mono select-none">
                  <span className="text-nexus-gold font-bold uppercase block leading-none shrink-0" title="Secure reads click counts">
                    📡 {rep.downloadCount || 0} downloads
                  </span>

                  <div className="flex bg-[#0A0D15] rounded overflow-hidden select-none border border-nexus-border font-mono text-[8px] uppercase font-bold shrink-0">
                    <button
                      onClick={() => openReportPreview(rep)}
                      className="px-2 py-0.5 hover:bg-nexus-cyan/15 text-nexus-cyan cursor-pointer"
                    >
                      Show
                    </button>
                    <span className="py-0.5 text-nexus-border shrink-0 select-none">|</span>
                    
                    <a 
                      href={rep.fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={() => handleDownloadCounter(rep)}
                      className="px-2 py-0.5 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 cursor-pointer font-black"
                    >
                      Get PDF
                    </a>

                    {isAdminMode && (
                      <>
                        <span className="py-0.5 text-nexus-border shrink-0 select-none">|</span>
                        <button
                          onClick={() => openForEdit(rep)}
                          className="px-2 py-0.5 hover:bg-white/10 text-white cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="py-0.5 text-nexus-border shrink-0 select-none">|</span>
                        <button
                          onClick={() => handleDelete(rep.id)}
                          className="px-2 py-0.5 hover:bg-danger-red/10 text-danger-red cursor-pointer font-black"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Preview PDF files lightbox */}
      {previewGallery && (
        <LightboxPreview 
          items={previewGallery.items}
          startIndex={previewGallery.index}
          onClose={() => setPreviewGallery(null)}
        />
      )}

      {/* Editor Full Slide-over Panel (Section 10 specifications CRUD modal) */}
      {editorOpen && isAdminMode && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 select-none text-left pointer-events-auto animate-fade-in">
          <div className="bg-nexus-panel border border-nexus-cyan/35 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden text-left">
            
            <div className="px-6 py-4 border-b border-nexus-border bg-nexus-void flex items-center justify-between select-none">
              <div className="text-left font-sans leading-none">
                <span className="text-[9px] font-mono tracking-widest text-nexus-cyan uppercase font-black">
                  NEXUS PRESS BRIEFINGS REC-WRITER
                </span>
                <h3 className="text-sm sm:text-base font-serif font-black text-white uppercase mt-1 leading-none font-serif">
                  {editingReport ? 'Override brief stats' : 'Index advisory brochure brief'}
                </h3>
              </div>

              <button 
                onClick={() => setEditorOpen(false)} 
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCommitSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-left font-sans">
              
              <div className="text-left font-sans space-y-1">
                <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px]">
                  Briefing report Title Headline *
                </label>
                <input 
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g., Q3 Forex Reserve Trends Circular..."
                  className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white focus:outline-none placeholder-gray-650"
                />
              </div>

              <div className="text-left font-sans space-y-1">
                <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px]">
                  Description Abstract bulletin
                </label>
                <textarea 
                  rows={2}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Provide brief analytical highlight snapshot summary of this PDF circular..."
                  className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white focus:outline-none placeholder-gray-655"
                />
              </div>

              {/* Cover Image URL setting */}
              <div className="text-left font-sans space-y-1">
                <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px]">
                  Brochure cover Image display URL
                </label>
                <input 
                  type="url"
                  value={formCover}
                  onChange={e => setFormCover(e.target.value)}
                  className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white font-mono"
                />
              </div>

              {/* PDF Document uploader / Link mapping */}
              <div className="p-4 bg-nexus-panel border border-nexus-border rounded-xl space-y-3 text-left">
                <div className="flex justify-between items-center text-[9px] font-mono text-gray-405 font-bold uppercase leading-none select-none">
                  <span>Certified PDF brochure dossier *</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-left bg-nexus-void p-3 rounded border border-dashed border-nexus-border hover:border-nexus-cyan text-center cursor-pointer relative">
                    <span className="font-bold text-white block text-[10.5px]">Upload briefing PDF</span>
                    <span className="text-[9px] text-gray-500 block">Fast server linking</span>
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col justify-center text-left">
                    <label className="text-[9px] font-mono text-gray-550 block mb-1">OR LINK EXTERNAL SOURCE PDF URL</label>
                    <input 
                      type="url"
                      required
                      placeholder="https://nepaleconomy.com/uploads/..."
                      value={formFileUrl}
                      onChange={e => setFormFileUrl(e.target.value)}
                      className="w-full px-2 py-1 bg-nexus-void border border-[#1b263b] rounded text-[10.5px] text-nexus-cyan font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-left font-sans">
                  <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">PDF File size metrics</label>
                  <input 
                    type="text"
                    required
                    value={formSize}
                    onChange={e => setFormSize(e.target.value)}
                    className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white"
                  />
                </div>

                <div className="text-left font-sans">
                  <label className="block text-gray-400 uppercase font-mono font-bold tracking-tight text-[9px] mb-1">Publish Date month-year</label>
                  <input 
                    type="text"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-nexus-void border border-nexus-border rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Target Indicator Featured switch (Section 10: CRUD featured flag control) */}
              <div className="p-3 bg-nexus-card border border-nexus-border rounded-xl flex items-center gap-2 select-none text-left">
                <input 
                  type="checkbox"
                  checked={formFeatured}
                  id="flag-featured-report"
                  onChange={e => setFormFeatured(e.target.checked)}
                  className="w-4.5 h-4.5 text-nexus-cyan rounded border-nexus-border focus:ring-0 cursor-pointer"
                />
                <label htmlFor="flag-featured-report" className="text-[10px] font-mono uppercase font-black tracking-wider text-white select-none cursor-pointer">
                  Feature this report on briefings dashboard home banner
                </label>
              </div>

              <div className="pt-4 border-t border-nexus-border flex justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 border border-nexus-border text-gray-400 hover:text-white rounded-lg font-mono uppercase font-bold text-[9.5px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-nexus-cyan text-nexus-void hover:bg-cyan-400 rounded-lg font-mono uppercase font-black tracking-widest text-[9.5px] cursor-pointer"
                >
                  Commit Brief
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
