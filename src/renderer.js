const PAD_COUNT = 16;
const pads = Array(PAD_COUNT).fill(null);
const pool = [];
let selectedPad = 0;
let currentAudio = null;

const grid = document.getElementById('pad-grid');
const sampleList = document.getElementById('sample-list');
const toast = document.getElementById('toast');

function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('visible'), 2600);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function renderPads() {
  grid.innerHTML = '';
  pads.forEach((pad, index) => {
    const button = document.createElement('button');
    button.className = `pad ${selectedPad === index ? 'selected' : ''} ${pad ? 'loaded' : ''}`;
    button.innerHTML = `<span class="pad-number">${String(index + 1).padStart(2, '0')}</span><span class="pad-symbol">${pad ? '●' : '+'}</span><span class="pad-name">${escapeHtml(pad?.label || 'EMPTY')}</span>`;
    button.addEventListener('click', () => { selectedPad = index; renderPads(); });
    button.addEventListener('dblclick', () => pad && previewPad(index));
    grid.appendChild(button);
  });
  document.getElementById('loaded-count').textContent = pads.filter(Boolean).length;
}
function renderPool() {
  document.getElementById('pool-count').textContent = `${pool.length} FILE${pool.length === 1 ? '' : 'S'}`;
  sampleList.innerHTML = pool.length ? '' : '<div class="empty">Your imported samples will show up here.</div>';
  pool.forEach((sample, index) => {
    const row = document.createElement('div');
    row.className = 'sample-row';
    row.innerHTML = `<span class="audio-dot">♪</span><span class="sample-filename" title="${escapeHtml(sample.name)}">${escapeHtml(sample.name)}</span><button class="assign-button" title="Assign to selected pad">Assign</button>`;
    row.querySelector('button').addEventListener('click', () => assignSample(index));
    sampleList.appendChild(row);
  });
}
function assignSample(poolIndex, padIndex = selectedPad) {
  const sample = pool[poolIndex];
  if (!sample) return;
  pads[padIndex] = { index: padIndex, label: sample.name.replace(/\.[^.]+$/, '').slice(0, 20), path: sample.path };
  selectedPad = (padIndex + 1) % PAD_COUNT;
  renderPads();
}
async function previewPad(index) {
  const pad = pads[index];
  if (!pad) return;
  try {
    if (currentAudio) currentAudio.pause();
    const url = await window.kitMaker.readAudio(pad.path);
    currentAudio = new Audio(url);
    await currentAudio.play();
  } catch (error) { notify(`Could not preview audio: ${error.message}`); }
}
async function importAudio() {
  const files = await window.kitMaker.pickAudio();
  if (!files.length) return;
  const seen = new Set(pool.map(item => item.path));
  for (const file of files) if (!seen.has(file.path)) pool.push(file);
  renderPool();
  notify(`Imported ${files.length} audio file${files.length === 1 ? '' : 's'}.`);
}
function applyManifest(result) {
  const manifest = result.manifest;
  document.getElementById('kit-name').value = manifest.name || 'Untitled Kit';
  if (manifest.template) document.getElementById('layout').value = manifest.template;
  (manifest.pads || []).slice(0, PAD_COUNT).forEach((pad, index) => {
    if (!pad?.path) return;
    const resolved = `${result.folder}/${pad.path.replaceAll('/', window.navigator.userAgent.includes('Windows') ? '\\' : '/')}`;
    pads[index] = { index, label: pad.label || pad.sourceName || `Pad ${index + 1}`, path: resolved };
    if (!pool.some(item => item.path === resolved)) pool.push({ name: pad.sourceName || pad.path.split('/').pop(), path: resolved });
  });
  renderPads(); renderPool();
}
async function openKit() {
  const result = await window.kitMaker.pickKitFolder();
  if (!result) return;
  if (result.manifest) { applyManifest(result); notify('Kit opened.'); return; }
  for (const name of result.files || []) {
    const filePath = `${result.folder}/${name}`;
    if (!pool.some(item => item.path === filePath)) pool.push({ name, path: filePath });
  }
  renderPool();
  if (!pool.length) notify('No supported audio files found in that folder.');
  else notify(`Imported ${result.files.length} audio file${result.files.length === 1 ? '' : 's'} from folder.`);
}
async function exportKit() {
  const name = document.getElementById('kit-name').value.trim() || 'Untitled Kit';
  const result = await window.kitMaker.exportKit({ name, template: document.getElementById('layout').value, pads });
  if (!result.canceled) notify(`Kit exported to ${result.folder}`);
}
document.getElementById('import-audio').addEventListener('click', importAudio);
document.getElementById('open-kit').addEventListener('click', openKit);
document.getElementById('export-kit').addEventListener('click', exportKit);
renderPads(); renderPool();
