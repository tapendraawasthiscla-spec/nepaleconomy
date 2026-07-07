/* ============================================================
   ZipScan Pro — Main Application Logic
   Advanced OCR + ZIP Extractor (500 MB support)
   ============================================================ */

'use strict';

// ─── State ────────────────────────────────────────────────────────
const state = {
  results: [],
  cancelled: false,
  startTime: null,
  timerInterval: null,
  activeWorkers: [],
  currentView: 'grid',
  filterMode: 'all',
  searchQuery: '',
};

// ─── DOM References ───────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const dropZone        = $('dropZone');
const fileInput       = $('fileInput');
const browseBtn       = $('browseBtn');
const processingSection = $('processingSection');
const resultsSection  = $('resultsSection');
const processingTitle = $('processingTitle');
const progressLabel   = $('progressLabel');
const progressPct     = $('progressPct');
const progressFill    = $('progressFill');
const statTotal       = $('statTotal');
const statProcessed   = $('statProcessed');
const statFailed      = $('statFailed');
const statWords       = $('statWords');
const statTime        = $('statTime');
const liveQueue       = $('liveQueue');
const cancelBtn       = $('cancelBtn');
const resultsGrid     = $('resultsGrid');
const resultsMeta     = $('resultsMeta');
const searchInput     = $('searchInput');
const previewModal    = $('previewModal');
const modalClose      = $('modalClose');
const modalImage      = $('modalImage');
const modalTextarea   = $('modalTextarea');
const modalTitle      = $('modalTitle');
const modalConfidence = $('modalConfidence');
const toastContainer  = $('toastContainer');

// ─── Settings ─────────────────────────────────────────────────────
const getSettings = () => ({
  lang: $('ocrLang').value,
  psm: parseInt($('ocrMode').value, 10),
  quality: $('imgQuality').value,
  concurrency: parseInt($('concurrency').value, 10),
  preprocess: $('togglePreprocess').checked,
  showConfidence: $('toggleConfidence').checked,
  skipLow: $('toggleAutoSkip').checked,
});

// ─── Supported image MIME types ───────────────────────────────────
const IMAGE_EXTS = new Set([
  'jpg','jpeg','png','bmp','tif','tiff',
  'webp','gif','pbm','pgm','ppm','jfif','heic','heif',
]);
const isImage = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  return IMAGE_EXTS.has(ext);
};

// ─── Background particles ─────────────────────────────────────────
function initParticles() {
  const container = $('bgParticles');
  const colors = ['#6366F1','#06B6D4','#A78BFA','#10B981'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 15;
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${color};
      animation-duration:${duration}s;
      animation-delay:${delay}s;
    `;
    container.appendChild(p);
  }
}
initParticles();

// ─── File Input / Drag & Drop ─────────────────────────────────────
browseBtn.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('click', (e) => {
  if (!e.target.closest('.btn-upload')) fileInput.click();
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// ─── Handle File ──────────────────────────────────────────────────
async function handleFile(file) {
  const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
  if (!file.name.toLowerCase().endsWith('.zip') &&
      file.type !== 'application/zip' &&
      file.type !== 'application/x-zip-compressed') {
    showToast('Please upload a valid .zip file.', 'error'); return;
  }
  if (file.size > MAX_SIZE) {
    showToast(`File too large (${formatBytes(file.size)}). Max is 500 MB.`, 'error'); return;
  }
  showToast(`Loading ${file.name} (${formatBytes(file.size)})…`, 'info');
  resetState();
  processingSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  processingTitle.textContent = 'Reading ZIP Archive…';
  setProgress(0, 'Reading archive…');

  try {
    const zip = await JSZip.loadAsync(file, {
      onprogress: (meta) => {
        const pct = Math.round(meta.percent);
        setProgress(pct * 0.2, `Loading archive… ${pct}%`);
      }
    });

    const imageFiles = [];
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir && isImage(relativePath)) {
        imageFiles.push({ relativePath, zipEntry });
      }
    });

    if (imageFiles.length === 0) {
      showToast('No images found in this ZIP file.', 'error');
      processingSection.classList.add('hidden'); return;
    }

    showToast(`Found ${imageFiles.length} image(s). Starting OCR…`, 'info');
    statTotal.textContent = imageFiles.length;
    await runOCR(imageFiles, zip);

  } catch (err) {
    console.error('ZIP error:', err);
    showToast('Failed to read ZIP: ' + err.message, 'error');
    processingSection.classList.add('hidden');
  }
}

// ─── Reset ────────────────────────────────────────────────────────
function resetState() {
  state.results = [];
  state.cancelled = false;
  state.startTime = Date.now();
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(updateTimer, 1000);
  liveQueue.innerHTML = '';
  statProcessed.textContent = '0';
  statFailed.textContent = '0';
  statWords.textContent = '0';
  statTime.textContent = '0s';
}
function updateTimer() {
  if (!state.startTime) return;
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  statTime.textContent = elapsed >= 60
    ? `${Math.floor(elapsed/60)}m${elapsed%60}s`
    : `${elapsed}s`;
}

// ─── OCR Pipeline ─────────────────────────────────────────────────
async function runOCR(imageFiles, zip) {
  const settings = getSettings();
  const total = imageFiles.length;
  let processed = 0;
  let failed = 0;
  let totalWords = 0;

  processingTitle.textContent = `Running OCR on ${total} image(s)…`;

  // Pre-extract all blobs
  setProgress(20, 'Extracting images from archive…');
  const items = [];
  for (let i = 0; i < imageFiles.length; i++) {
    if (state.cancelled) break;
    const { relativePath, zipEntry } = imageFiles[i];
    const blob = await zipEntry.async('blob');
    items.push({ relativePath, blob });
    setProgress(20 + (i / imageFiles.length) * 10, `Extracting… (${i+1}/${total})`);
  }

  if (state.cancelled) { onCancelled(); return; }

  setProgress(30, 'Initializing Tesseract workers…');

  // Create worker pool
  const numWorkers = Math.min(settings.concurrency, items.length);
  const workers = [];
  for (let w = 0; w < numWorkers; w++) {
    try {
      const worker = await Tesseract.createWorker(settings.lang, 1, {
        logger: () => {},
      });
      await worker.setParameters({ tessedit_pageseg_mode: settings.psm });
      workers.push(worker);
    } catch (e) {
      console.warn('Worker init failed:', e);
    }
  }
  if (workers.length === 0) {
    showToast('Failed to initialize OCR engine.', 'error');
    processingSection.classList.add('hidden'); return;
  }

  state.activeWorkers = workers;
  const queue = [...items];
  const liveItems = {};

  // Worker pool executor
  async function runWorker(worker, idx) {
    while (queue.length > 0 && !state.cancelled) {
      const item = queue.shift();
      if (!item) break;
      const { relativePath, blob } = item;
      const shortName = relativePath.split('/').pop();

      // Add to live queue UI
      const qEl = createQueueItem(shortName, 'processing');
      liveItems[relativePath] = qEl;

      try {
        // Pre-process image if enabled
        const imgUrl = await prepareImage(blob, settings.quality, settings.preprocess);

        // Recognize
        const result = await worker.recognize(imgUrl);
        const text = result.data.text.trim();
        const confidence = Math.round(result.data.confidence);
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

        // Skip if low confidence
        if (settings.skipLow && confidence < 30) {
          qEl.className = 'queue-item failed';
          qEl.querySelector('.queue-dot').style.background = '#F59E0B';
          state.results.push({
            filename: relativePath,
            shortName,
            blob,
            imageUrl: imgUrl,
            text: '',
            confidence,
            words: 0,
            status: 'skipped',
          });
        } else {
          qEl.className = 'queue-item done';
          totalWords += words;
          statWords.textContent = totalWords;
          state.results.push({
            filename: relativePath,
            shortName,
            blob,
            imageUrl: imgUrl,
            text,
            confidence,
            words,
            status: text ? 'success' : 'empty',
          });
        }

        URL.revokeObjectURL(imgUrl);
      } catch (err) {
        console.error('OCR error for', relativePath, err);
        qEl.className = 'queue-item failed';
        failed++;
        statFailed.textContent = failed;
        state.results.push({
          filename: relativePath,
          shortName,
          blob,
          imageUrl: null,
          text: '',
          confidence: 0,
          words: 0,
          status: 'failed',
          error: err.message,
        });
      }

      processed++;
      statProcessed.textContent = processed;
      const pct = 30 + Math.round((processed / total) * 70);
      setProgress(pct, `OCR: ${processed}/${total} images`);
    }
  }

  // Run workers in parallel
  await Promise.all(workers.map((w, i) => runWorker(w, i)));

  // Terminate workers
  await Promise.all(workers.map(w => w.terminate().catch(() => {})));
  state.activeWorkers = [];

  if (state.cancelled) { onCancelled(); return; }

  clearInterval(state.timerInterval);
  setProgress(100, 'Complete!');
  setTimeout(() => showResults(), 500);
}

// ─── Image Pre-processing ─────────────────────────────────────────
async function prepareImage(blob, quality, preprocess) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Upscale for better OCR if quality is high
      if (quality === 'high') {
        const MAX_DIM = 3000;
        const scale = Math.min(MAX_DIM / Math.max(width, height), 2.5);
        if (scale > 1) { width = Math.round(width * scale); height = Math.round(height * scale); }
      } else if (quality === 'medium') {
        const MAX_DIM = 2000;
        const scale = Math.min(MAX_DIM / Math.max(width, height), 1.5);
        if (scale > 1) { width = Math.round(width * scale); height = Math.round(height * scale); }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (preprocess) {
        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      ctx.drawImage(img, 0, 0, width, height);

      if (preprocess) {
        applyPreprocessing(ctx, width, height);
      }

      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('Failed to load image')); };
    img.src = objUrl;
  });
}

function applyPreprocessing(ctx, w, h) {
  // Grayscale conversion
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Convert to grayscale + sharpen
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    data[i] = data[i+1] = data[i+2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);

  // Sharpen kernel
  const sharpened = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(sharpened.data);
  const kernel = [
     0, -1,  0,
    -1,  5, -1,
     0, -1,  0
  ];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let r = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * w + (x + kx)) * 4;
          const k = kernel[(ky + 1) * 3 + (kx + 1)];
          r += src[idx] * k;
        }
      }
      const idx = (y * w + x) * 4;
      sharpened.data[idx] = sharpened.data[idx+1] = sharpened.data[idx+2] = Math.max(0, Math.min(255, r));
    }
  }
  ctx.putImageData(sharpened, 0, 0);
}

// ─── Live Queue UI ────────────────────────────────────────────────
function createQueueItem(name, status) {
  const el = document.createElement('div');
  el.className = `queue-item ${status}`;
  el.innerHTML = `<span class="queue-dot"></span><span class="queue-filename" title="${name}">${name}</span>`;
  liveQueue.appendChild(el);
  liveQueue.scrollTop = liveQueue.scrollHeight;
  return el;
}

// ─── Progress helpers ─────────────────────────────────────────────
function setProgress(pct, label) {
  progressFill.style.width = `${Math.min(100, pct)}%`;
  progressPct.textContent = `${Math.round(pct)}%`;
  if (label) progressLabel.textContent = label;
}

// ─── Cancel ───────────────────────────────────────────────────────
cancelBtn.addEventListener('click', async () => {
  state.cancelled = true;
  cancelBtn.disabled = true;
  cancelBtn.textContent = 'Cancelling…';
  for (const w of state.activeWorkers) {
    try { await w.terminate(); } catch {}
  }
  state.activeWorkers = [];
});
function onCancelled() {
  clearInterval(state.timerInterval);
  processingSection.classList.add('hidden');
  showToast('Processing cancelled.', 'info');
  fileInput.value = '';
}

// ─── Show Results ─────────────────────────────────────────────────
function showResults() {
  processingSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');

  const total = state.results.length;
  const success = state.results.filter(r => r.status === 'success').length;
  const failed = state.results.filter(r => r.status === 'failed').length;
  const empty = state.results.filter(r => r.status === 'empty' || r.status === 'skipped').length;
  const totalWords = state.results.reduce((a, r) => a + r.words, 0);
  const elapsed = Math.round((Date.now() - state.startTime) / 1000);

  resultsMeta.textContent =
    `${total} images processed — ${success} with text, ${empty} empty, ${failed} failed — ` +
    `${totalWords.toLocaleString()} words extracted — ${elapsed}s`;

  renderResults();
}

// ─── Render Results ───────────────────────────────────────────────
function renderResults() {
  const filter = state.filterMode;
  const query = state.searchQuery.toLowerCase();

  const filtered = state.results.filter(r => {
    if (filter === 'success' && r.status !== 'success') return false;
    if (filter === 'failed' && r.status !== 'failed') return false;
    if (filter === 'empty' && r.status !== 'empty' && r.status !== 'skipped') return false;
    if (query && !r.text.toLowerCase().includes(query) && !r.shortName.toLowerCase().includes(query)) return false;
    return true;
  });

  resultsGrid.innerHTML = '';

  if (filtered.length === 0) {
    resultsGrid.innerHTML = `
      <div class="no-results">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#4B5563" stroke-width="2"/>
          <path d="M16 24h16M24 16v16" stroke="#4B5563" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
        </svg>
        <p>No results match your filter/search.</p>
      </div>`;
    return;
  }

  filtered.forEach((r, i) => {
    const card = createResultCard(r, i);
    resultsGrid.appendChild(card);
  });
}

function createResultCard(r, index) {
  const card = document.createElement('div');
  card.className = `result-card status-${r.status}`;
  card.style.animationDelay = `${Math.min(index * 0.04, 0.5)}s`;

  const confidence = r.confidence || 0;
  const confidenceColor = confidence >= 80 ? '#10B981' : confidence >= 50 ? '#F59E0B' : '#EF4444';
  const badgeClass = r.status === 'success' ? 'badge-success' : r.status === 'failed' ? 'badge-failed' : 'badge-empty';
  const badgeLabel = r.status === 'success' ? 'Text Found' : r.status === 'failed' ? 'Failed' : r.status === 'skipped' ? 'Skipped' : 'No Text';

  const hasText = r.text && r.text.length > 0;
  const previewText = hasText ? escapeHtml(r.text.substring(0, 280)) : (r.status === 'failed' ? `Error: ${escapeHtml(r.error || 'Unknown error')}` : 'No text detected in this image.');

  // Build image src (use blob)
  const imgSrc = r.imageUrl || (r.blob ? URL.createObjectURL(r.blob) : '');

  const showConf = $('toggleConfidence').checked;

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img class="card-image" src="${imgSrc}" alt="${escapeHtml(r.shortName)}" loading="lazy" />
      <span class="card-status-badge ${badgeClass}">${badgeLabel}</span>
      ${showConf ? `
        <div class="confidence-bar">
          <div class="confidence-fill" style="width:${confidence}%; background: ${confidenceColor}"></div>
        </div>` : ''}
    </div>
    <div class="card-body">
      <div class="card-filename" title="${escapeHtml(r.filename)}">${escapeHtml(r.shortName)}</div>
      <div class="card-meta">
        ${showConf ? `<span class="card-meta-item" style="color:${confidenceColor}">⬤ ${confidence}% confidence</span>` : ''}
        <span class="card-meta-item">📝 ${r.words.toLocaleString()} words</span>
        <span class="card-meta-item">📄 ${r.text.length.toLocaleString()} chars</span>
      </div>
      <div class="card-text-preview ${hasText ? 'has-text' : 'no-text'}">${previewText}</div>
      <div class="card-actions">
        <button class="card-btn copy" data-idx="${index}" onclick="copyText(${state.results.indexOf(r)})">Copy Text</button>
        <button class="card-btn" onclick="openPreview(${state.results.indexOf(r)})">View Full</button>
      </div>
    </div>`;

  card.addEventListener('click', (e) => {
    if (!e.target.closest('.card-btn')) openPreview(state.results.indexOf(r));
  });

  return card;
}

// ─── Copy Text ────────────────────────────────────────────────────
window.copyText = async function(idx) {
  const r = state.results[idx];
  if (!r) return;
  try {
    await navigator.clipboard.writeText(r.text);
    showToast('Text copied to clipboard!', 'success');
  } catch {
    showToast('Copy failed. Please try manually.', 'error');
  }
};

// ─── Preview Modal ────────────────────────────────────────────────
window.openPreview = function(idx) {
  const r = state.results[idx];
  if (!r) return;
  modalTitle.textContent = r.shortName;
  modalImage.src = r.imageUrl || (r.blob ? URL.createObjectURL(r.blob) : '');
  modalTextarea.value = r.text || '(No text extracted)';
  const confidence = r.confidence || 0;
  const color = confidence >= 80 ? '#10B981' : confidence >= 50 ? '#F59E0B' : '#EF4444';
  modalConfidence.innerHTML = $('toggleConfidence').checked
    ? `<span style="color:${color}; font-weight:600;">⬤ Confidence: ${confidence}%</span> &nbsp;·&nbsp; ${r.words} words &nbsp;·&nbsp; ${r.text.length} chars`
    : `${r.words} words &nbsp;·&nbsp; ${r.text.length} chars`;
  previewModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

modalClose.addEventListener('click', closeModal);
previewModal.addEventListener('click', (e) => { if (e.target === previewModal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
function closeModal() {
  previewModal.classList.add('hidden');
  document.body.style.overflow = '';
}

$('copyModalText').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(modalTextarea.value);
    showToast('Text copied!', 'success');
  } catch {
    showToast('Copy failed.', 'error');
  }
});

// ─── Search & Filter ──────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  state.searchQuery = searchInput.value;
  renderResults();
});

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.filterMode = tab.dataset.filter;
    renderResults();
  });
});

// ─── View Toggle ──────────────────────────────────────────────────
$('viewGrid').addEventListener('click', () => {
  state.currentView = 'grid';
  $('viewGrid').classList.add('active');
  $('viewList').classList.remove('active');
  resultsGrid.classList.remove('list-view');
});
$('viewList').addEventListener('click', () => {
  state.currentView = 'list';
  $('viewList').classList.add('active');
  $('viewGrid').classList.remove('active');
  resultsGrid.classList.add('list-view');
});

// ─── Exports ──────────────────────────────────────────────────────
$('exportTxtBtn').addEventListener('click', () => {
  const lines = state.results.map(r =>
    `===== ${r.filename} =====\n` +
    `Confidence: ${r.confidence}% | Words: ${r.words}\n\n` +
    (r.text || '(No text)') + '\n'
  );
  downloadFile(lines.join('\n' + '─'.repeat(60) + '\n\n'), 'zipscan_results.txt', 'text/plain');
  showToast('TXT export downloaded!', 'success');
});

$('exportJsonBtn').addEventListener('click', () => {
  const data = state.results.map(r => ({
    filename: r.filename,
    status: r.status,
    confidence: r.confidence,
    words: r.words,
    characters: r.text.length,
    text: r.text,
  }));
  downloadFile(JSON.stringify({ exportedAt: new Date().toISOString(), total: data.length, results: data }, null, 2),
    'zipscan_results.json', 'application/json');
  showToast('JSON export downloaded!', 'success');
});

$('exportCsvBtn').addEventListener('click', () => {
  const header = 'filename,status,confidence,words,characters,text';
  const rows = state.results.map(r =>
    [r.filename, r.status, r.confidence, r.words, r.text.length,
     `"${r.text.replace(/"/g, '""')}"`].join(',')
  );
  downloadFile([header, ...rows].join('\n'), 'zipscan_results.csv', 'text/csv');
  showToast('CSV export downloaded!', 'success');
});

$('clearBtn').addEventListener('click', () => {
  state.results = [];
  resultsSection.classList.add('hidden');
  fileInput.value = '';
  clearInterval(state.timerInterval);
  showToast('Ready for a new upload!', 'info');
});

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Toast Notifications ──────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="#059669"/><path d="M5.5 9l2.5 2.5 4.5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="#DC2626"/><path d="M6 6l6 6M12 6L6 12" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="#4F46E5"/><path d="M9 8v4M9 6h.01" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${escapeHtml(msg)}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Utility ──────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Initialize ───────────────────────────────────────────────────
showToast('ZipScan Pro ready! 🇳🇵 Nepali OCR set as default. Upload a ZIP to begin.', 'info');
