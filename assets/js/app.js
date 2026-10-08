const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const MIDDLE_SCHOOL_MAP = { "7th": 2, "8th": 3, "9th": 4 };
const CURRICULUM_MAP = {
  math:       { "10th": 1602, "11th": 1603, "12th": 13775 },
  humanities: { "10th": 5639, "11th": 5640, "12th": 13820 },
  tajrobi:    { "10th": 9183, "11th": 9184, "12th": 13810 }
};
const GRADE_LABELS = { "7th":"هفتم","8th":"هشتم","9th":"نهم","10th":"دهم","11th":"یازدهم","12th":"دوازدهم" };
function isMiddleSchool(g) { return ['7th','8th','9th'].includes(g); }

const COLORS = [
  { id:'sky',     bg:'#e0f2fe',text:'#0c4a6e',border:'#7dd3fc', label:'آبی خیلی روشن' },
  { id:'blue',    bg:'#dbeafe',text:'#1e3a8a',border:'#93c5fd', label:'آبی' },
  { id:'indigo',  bg:'#e0e7ff',text:'#1e1b4b',border:'#a5b4fc', label:'نیلی' },
  { id:'navy',    bg:'#c7d2fe',text:'#1e40af',border:'#818cf8', label:'آبی نفتی' },
  { id:'cyan',    bg:'#cffafe',text:'#164e63',border:'#67e8f9', label:'سیان' },
  { id:'teal',    bg:'#ccfbf1',text:'#134e4a',border:'#5eead4', label:'فیروزه‌ای' },
  { id:'aqua',    bg:'#e0fcff',text:'#133b5c',border:'#76e4f7', label:'آکوآ' },
  { id:'green',     bg:'#dcfce7',text:'#14532d',border:'#86efac', label:'سبز' },
  { id:'emerald',   bg:'#d1fae5',text:'#064e3b',border:'#6ee7b7', label:'زمردی' },
  { id:'mint',      bg:'#f0fff4',text:'#064e3b',border:'#bbf7d0', label:'نعنایی' },
  { id:'lime',      bg:'#ecfccb',text:'#365314',border:'#bef264', label:'لیمویی' },
  { id:'olive',     bg:'#fafaf0',text:'#585c1b',border:'#d9e67a', label:'زیتونی' },
  { id:'yellow',     bg:'#fef9c3',text:'#713f12',border:'#fde047', label:'زرد' },
  { id:'gold',       bg:'#fefce8',text:'#854d0e',border:'#eab308', label:'طلایی' },
  { id:'amber',      bg:'#fef3c7',text:'#78350f',border:'#fcd34d', label:'کهربا' },
  { id:'orange',    bg:'#ffedd5',text:'#7c2d12',border:'#fdba74', label:'نارنجی' },
  { id:'peach',     bg:'#fff7ed',text:'#9a3412',border:'#fdba74', label:'هلو' },
  { id:'rose',    bg:'#ffe4e6',text:'#881337',border:'#fda4af', label:'رز' },
  { id:'pink',    bg:'#fce7f3',text:'#831843',border:'#f9a8d4', label:'پینک' },
  { id:'fuchsia', bg:'#fae8ff',text:'#701a75',border:'#e879f9', label:'فوشیا' },
  { id:'red',     bg:'#fee2e2',text:'#7f1d1d',border:'#fca5a5', label:'قرمز' },
  { id:'crimson', bg:'#f8d7da',text:'#842029',border:'#f5c2c7', label:'قرمز تیره' },
  { id:'violet',  bg:'#ede9fe',text:'#3b0764',border:'#c4b5fd', label:'بنفش تیره' },
  { id:'purple',  bg:'#f3e8ff',text:'#4c1d95',border:'#d8b4fe', label:'بنفش' },
  { id:'lavender',bg:'#f6e6ff',text:'#6d28d9',border:'#e9d5ff', label:'یاس بنفش' },
  { id:'slate',   bg:'#f1f5f9',text:'#0f172a',border:'#cbd5e1', label:'سلیت' },
  { id:'gray',    bg:'#f3f4f6',text:'#1f2937',border:'#d1d5db', label:'خاکستری' },
  { id:'stone',   bg:'#fafaf9',text:'#44403c',border:'#d6d3d1', label:'استون' },
  { id:'brown',   bg:'#fdf2e4',text:'#5c3317',border:'#d4a06a', label:'قهوه‌ای' },
];

// ── TIME HELPERS ──
// حالت جدید: هر زمان یک آبجکت {start, end} است.
// حالت قدیم: رشته‌ای مثل '5-6' یا '5:00-6:00' — به‌صورت خودکار migrate می‌شود.
const DEFAULT_TIMES = [
  { start: '5:00',  end: '- 6:00'  },
  { start: '6:00',  end: '- 7:00'  },
  { start: '7:00',  end: '- 8:00'  },
  { start: '8:00',  end: '- 9:00'  },
  { start: '9:00',  end: '- 10:00' },
  { start: '10:00', end: '- 11:00' },
  { start: '11:00', end: '- 12:00' },
  { start: '12:00', end: '- 13:00' },
  { start: '13:00', end: '- 14:00' },
  { start: '14:00', end: '- 15:00' },
  { start: '15:00', end: '- 16:00' },
  { start: '16:00', end: '- 17:00' },
  { start: '17:00', end: '- 18:00' },
  { start: '18:00', end: '- 19:00' },
  { start: '19:00', end: '- 20:00' },
  { start: '20:00', end: '- 21:00' },
  { start: '21:00', end: '- 22:00' },
  { start: '22:00', end: '- 23:00' },
  { start: '23:00', end: '- 24:00' },
];

function normalizeTime(t) {
  if (t && typeof t === 'object' && ('start' in t || 'end' in t)) {
    return { start: String(t.start || '').trim(), end: String(t.end || '').trim() };
  }
  if (typeof t === 'string') {
    const idx = t.indexOf('-');
    if (idx > -1) return { start: t.slice(0, idx).trim(), end: t.slice(idx + 1).trim() };
    return { start: t.trim(), end: '' };
  }
  return { start: '', end: '' };
}
function normalizeTimes(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return DEFAULT_TIMES.map(t => ({...t}));
  return arr.map(normalizeTime);
}
function formatTime(t) {
  if (!t) return '';
  if (typeof t === 'string') return t;
  const s = (t.start || '').trim();
  const e = (t.end   || '').trim();
  if (s && e) return `${s} - ${e}`;
  return s || e || '';
}
function cloneDefaultTimes() {
  return DEFAULT_TIMES.map(t => ({ ...t }));
}

function shortenLabel(l) {
  if (!l) return l;
  const i = l.indexOf(':');
  return i > -1 ? l.substring(0, i).trim() : l;
}
function truncateWords(str, maxWords = 3) {
  if (!str) return str;
  const words = str.trim().split(/\s+/);
  if (words.length <= maxWords) return str;
  return words.slice(0, maxWords).join(' ') + '…';
}
function truncatePath(pathShort, maxWords = 4) {
  if (!pathShort) return pathShort;
  const parts = pathShort.split('|').map(s => s.trim());
  if (parts.length === 0) return pathShort;
  parts[parts.length - 1] = truncateWords(parts[parts.length - 1], maxWords);
  return parts.join(' | ');
}
function displayPrefix(parts) {
  return parts.join(' | ');
}

let TOPIC_TREE = {};
let topicTreeLoaded = false;

async function loadTopicTree() {
  try {
    const r = await fetch('lernito_topic_tree.json');
    if (!r.ok) throw new Error('not found');
    TOPIC_TREE = await r.json();
    topicTreeLoaded = true;
  } catch(e) {
    console.error('topic tree:', e);
  }
}

// ── STATE ──
let state = {
  meta: { major:'', grade:'' },
  times: cloneDefaultTimes(),
  events: [],
  dayNotes: {},
  weeklyNotes: ''
};

// ── MULTI-SELECT ──
let selectedCells = new Set();
let isMultiMode = false;
let isMultiSave = false;

let currentCell = null;
let editingEventId = null;
let nav = { path: [] };
let selectedColor = 'green';
let currentCurriculumRootId = null;
let availableGrades = [];
let selectedTreeGrade = null;
let selectedTopics = [];

function toggleMultiMode(on) {
  isMultiMode = on;
  if (!on) { selectedCells.clear(); updateMultiBar(); }
  document.querySelectorAll('.event-cell').forEach(td => {
    td.classList.toggle('cell-selecting', on);
  });
}
function toggleCellSelect(di, ti) {
  const key = `${di}_${ti}`;
  if (selectedCells.has(key)) selectedCells.delete(key);
  else selectedCells.add(key);
  const td = document.querySelector(`td[data-day="${di}"][data-time="${ti}"]`);
  if (td) td.classList.toggle('cell-selected', selectedCells.has(key));
  updateMultiBar();
}
function updateMultiBar() {
  const bar = document.getElementById('multi-action-bar');
  const cnt = selectedCells.size;
  if (cnt > 0) {
    bar.classList.add('visible');
    document.getElementById('multi-count').textContent = cnt + ' خانه انتخاب شده';
    lucide.createIcons();
  } else {
    bar.classList.remove('visible');
  }
}
function clearSelectedCells() {
  selectedCells.forEach(key => {
    const [di, ti] = key.split('_');
    const td = document.querySelector(`td[data-day="${di}"][data-time="${ti}"]`);
    if (td) td.classList.remove('cell-selected');
  });
  selectedCells.clear();
  updateMultiBar();
}
function openModalForSelected() {
  if (selectedCells.size === 0) return;
  const [di, ti] = [...selectedCells][0].split('_').map(Number);
  currentCell = { dayIndex: di, timeIndex: ti };
  editingEventId = null;
  isMultiSave = true;
  _openModalInternal(di, ti, null);
}

// ── TOPIC PICKER ──
function addSelectedTopic(node, pathShort, fullPath) {
  if (selectedTopics.find(t => t.id === String(node._id))) return;
  selectedTopics.push({ id: String(node._id), label: node.label, pathShort, path: fullPath });
  renderSelectedTopics();
  renderTreeLevel(nav.path.length > 0 ? nav.path[nav.path.length-1] : currentCurriculumRootId);
}
function removeSelectedTopic(id) {
  selectedTopics = selectedTopics.filter(t => t.id !== id);
  renderSelectedTopics();
  renderTreeLevel(nav.path.length > 0 ? nav.path[nav.path.length-1] : currentCurriculumRootId);
}
function renderSelectedTopics() {
  const container = document.getElementById('selected-topics-list');
  if (!container) return;
  if (selectedTopics.length === 0) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  container.innerHTML = '';
  selectedTopics.forEach(t => {
    const tag = document.createElement('div');
    tag.className = 'topic-tag';
    tag.innerHTML = `<span>${t.pathShort || t.label}</span><button onclick="removeSelectedTopic('${t.id}')">×</button>`;
    container.appendChild(tag);
  });
  document.getElementById('sel-topic-id').value    = selectedTopics[0].id;
  document.getElementById('sel-topic-path').value  = selectedTopics[0].path;
  document.getElementById('sel-topic-label').value = selectedTopics[0].label;
  document.getElementById('sel-topic-short').value = selectedTopics[0].pathShort;
  updateBreadcrumb();
}

// ── META ──
function updatePrintSpans() {
  const ml = {'':'','math':'ریاضی','tajrobi':'تجربی','humanities':'انسانی'};
  const gl = {'':'','7th':'هفتم','8th':'هشتم','9th':'نهم','10th':'دهم','11th':'یازدهم','12th':'دوازدهم'};
  const ms = document.getElementById('meta-major-print');
  const gs = document.getElementById('meta-grade-print');
  if (ms) ms.textContent = ml[document.getElementById('meta-major').value] || '';
  if (gs) gs.textContent = gl[document.getElementById('meta-grade').value] || '';
}

async function init() {
  await loadTopicTree();
  loadState();
  renderBody();
  renderHeader();
  renderColorPicker();
  loadMetaFields();
  const notes = document.getElementById('weekly-notes');
  if (notes && state.weeklyNotes) notes.value = state.weeklyNotes;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeLoadPanel(); clearSelectedCells(); }
    if (e.key === 'Enter' && document.getElementById('modal-overlay').classList.contains('active')) {
      if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') saveEvent();
    }
  });
  lucide.createIcons();
}

function loadMetaFields() {
  ['name','date','advisor'].forEach(k => {
    const el = document.getElementById('meta-' + k);
    if (el && state.meta[k]) el.value = state.meta[k];
  });
  if (state.meta.major) document.getElementById('meta-major').value = state.meta.major;
  if (state.meta.grade) document.getElementById('meta-grade').value = state.meta.grade;
  updateCurriculumRoot();
  updatePrintSpans();
}
function saveMeta() {
  ['name','date','advisor'].forEach(k => {
    const el = document.getElementById('meta-' + k);
    if (el) state.meta[k] = el.value;
  });
  state.meta.major = document.getElementById('meta-major').value;
  state.meta.grade = document.getElementById('meta-grade').value;
}
function onPresetChange() {
  const preset = document.getElementById('event-title-preset').value;
  const ci = document.getElementById('event-title');
  if (preset === '__custom__') { ci.style.display = ''; ci.value = ''; ci.focus(); }
  else ci.style.display = 'none';
}
function onMajorOrGradeChange() {
  saveMeta(); updateCurriculumRoot(); updatePrintSpans(); saveState();
}
function updateCurriculumRoot() {
  const major = state.meta.major, grade = state.meta.grade;
  const mw = document.getElementById('meta-major-wrap');
  if (mw) mw.style.display = isMiddleSchool(grade) ? 'none' : '';
  availableGrades = [];
  if (grade === '12th') availableGrades = ['12th','11th','10th'];
  else if (grade === '11th') availableGrades = ['11th','10th'];
  else availableGrades = [grade];
  selectedTreeGrade = grade;
  if (!grade) { currentCurriculumRootId = null; return; }
  if (isMiddleSchool(grade)) { currentCurriculumRootId = MIDDLE_SCHOOL_MAP[grade]; }
  else if (major && CURRICULUM_MAP[major]?.[grade]) { currentCurriculumRootId = CURRICULUM_MAP[major][grade]; }
  else currentCurriculumRootId = null;
}

// ── RENDER HEADER (دو اینپوت: شروع/پایان) ──
function renderHeader() {
  const row = document.getElementById('header-row');
  // پاک‌کردن ستون‌های قبلی (به‌جز اولین و آخری)
  while (row.children.length > 2) row.removeChild(row.children[1]);
  const last = row.lastElementChild;

  state.times.forEach((t, i) => {
    const th = document.createElement('th');
    th.className = 'time-cell';

    const startInp = document.createElement('input');
    startInp.type = 'text';
    startInp.className = 'time-edit time-edit-start';
    startInp.value = t.start || '';
    startInp.placeholder = 'شروع';
    startInp.dataset.idx = i;
    startInp.dataset.part = 'start';
    startInp.addEventListener('input', e => {
      state.times[i].start = e.target.value;
      saveState();
    });

    const endInp = document.createElement('input');
    endInp.type = 'text';
    endInp.className = 'time-edit time-edit-end';
    endInp.value = t.end || '';
    endInp.placeholder = 'پایان';
    endInp.dataset.idx = i;
    endInp.dataset.part = 'end';
    endInp.addEventListener('input', e => {
      state.times[i].end = e.target.value;
      saveState();
    });

    const del = document.createElement('button');
    del.className = 'delete-time-btn no-print';
    del.title = 'حذف';
    del.innerHTML = '×';
    del.addEventListener('click', e => { e.stopPropagation(); deleteTimeColumn(i); });

    th.appendChild(startInp);
    th.appendChild(endInp);
    th.appendChild(del);
    row.insertBefore(th, last);
  });
  lucide.createIcons();
}

function deleteTimeColumn(i) {
  if (state.times.length <= 1) { alert('حداقل یک ستون لازم است'); return; }
  state.events = state.events.filter(e => e.timeIndex !== i);
  state.events.forEach(e => { if (e.timeIndex > i) e.timeIndex--; });
  state.times.splice(i, 1);
  saveState(); renderHeader(); renderBody();
}
function addTimeColumn() {
  state.times.push({ start: '', end: '' });
  saveState(); renderHeader(); renderBody();
}

function renderBody() {
  const tbody = document.getElementById('planner-body');
  tbody.innerHTML = '';
  DAYS.forEach((day, di) => {
    const tr = document.createElement('tr');
    const tdDay = document.createElement('td');
    tdDay.className = 'day-label'; tdDay.textContent = day;
    tr.appendChild(tdDay);
    state.times.forEach((_, ti) => {
      const td = document.createElement('td');
      td.className = 'event-cell';
      td.dataset.day = di; td.dataset.time = ti;
      renderCell(td, di, ti);
      td.addEventListener('click', e => {
        if (e.ctrlKey || e.metaKey || isMultiMode) {
          e.stopPropagation();
          toggleCellSelect(di, ti);
          return;
        }
        if (td._hasEvent) openModal(di, ti, td._eventId);
        else openModal(di, ti, null);
      });
      tr.appendChild(td);
    });
    const tdAdd = document.createElement('td');
    tdAdd.className = 'no-print';
    tdAdd.style.cssText = 'border:1px solid var(--border);background:#fafaf9;';
    tr.appendChild(tdAdd);
    tbody.appendChild(tr);
  });
}

function renderCell(td, di, ti) {
  td._hasEvent = false; td._eventId = null;
  const ev = state.events.find(e => e.dayIndex === di && e.timeIndex === ti);
  const inner = document.createElement('div');
  inner.className = 'event-cell-inner';

  if (ev) {
    td._hasEvent = true; td._eventId = ev.id;
    const col = COLORS.find(c => c.id === ev.color) || COLORS[1];
    const chip = document.createElement('div');
    chip.className = 'event-chip';
    chip.style.cssText = `background:${col.bg};color:${col.text};border:1px solid ${col.border}`;

    const topics = ev.topics || (ev.topicPathShort ? [{ pathShort: ev.topicPathShort }] : []);
    if (topics.length === 1) {
      const b = document.createElement('div');
      b.className = 'event-breadcrumb';
      b.textContent = truncatePath(topics[0].pathShort || topics[0].path || '');
      chip.appendChild(b);
    } else if (topics.length > 1) {
      const allParts = topics.map(t => (t.pathShort || '').split('|').map(s => s.trim()));
      let prefixLen = 0;
      const minLen = Math.min(...allParts.map(p => p.length));
      for (let i = 0; i < minLen - 1; i++) {
        if (allParts.every(p => p[i] === allParts[0][i])) prefixLen = i + 1;
        else break;
      }
      if (prefixLen > 0) {
        const b = document.createElement('div');
        b.className = 'event-breadcrumb';
        b.textContent = displayPrefix(allParts[0].slice(0, prefixLen));
        chip.appendChild(b);
      }
      const uniqueParts = allParts.map(p => p.slice(prefixLen).join(' | ')).filter(Boolean);
      if (uniqueParts.length > 0) {
        const b = document.createElement('div');
        b.className = 'event-breadcrumb';
        b.style.fontWeight = '700';
        b.textContent = uniqueParts.map(u => truncateWords(u, 4)).join(' · ');
        chip.appendChild(b);
      }
    } else if (ev.topicPathShort || ev.topicPath) {
      const b = document.createElement('div');
      b.className = 'event-breadcrumb';
      b.textContent = truncatePath(ev.topicPathShort || ev.topicPath);
      chip.appendChild(b);
    }

    if (ev.title) {
      const tt = document.createElement('div');
      tt.className = 'event-title-text'; tt.textContent = ev.title;
      chip.appendChild(tt);
    }
    if (ev.notes) {
      const nt = document.createElement('div');
      nt.className = 'event-notes-text'; nt.textContent = ev.notes;
      chip.appendChild(nt);
    }
    inner.appendChild(chip);
  } else {
    const hint = document.createElement('span');
    hint.className = 'empty-hint'; hint.textContent = '+';
    inner.appendChild(hint);
  }
  td.innerHTML = '';
  td.appendChild(inner);
}

// ── MODAL ──
function openModal(di, ti, eventId) {
  currentCell = { dayIndex: di, timeIndex: ti };
  editingEventId = eventId;
  isMultiSave = false;
  _openModalInternal(di, ti, eventId);
}

function _openModalInternal(di, ti, eventId) {
  const day = DAYS[di];
  const time = formatTime(state.times[ti]);
  document.getElementById('modal-title').textContent =
    (editingEventId ? 'ویرایش' : isMultiSave ? `افزودن به ${selectedCells.size} خانه` : 'افزودن') +
    ' — ' + day + (time ? ' / ' + time : '');

  document.getElementById('event-title').value = '';
  document.getElementById('event-title').style.display = 'none';
  document.getElementById('event-title-preset').value = '';
  document.getElementById('event-notes').value = '';
  document.getElementById('sel-topic-id').value = '';
  document.getElementById('sel-topic-path').value = '';
  document.getElementById('sel-topic-label').value = '';
  document.getElementById('sel-topic-short').value = '';
  selectedTopics = [];
  const stl = document.getElementById('selected-topics-list');
  if (stl) { stl.innerHTML = ''; stl.style.display = 'none'; }
  nav.path = [];
  selectedColor = 'green';
  saveMeta(); updateCurriculumRoot();

  if (eventId) {
    const ev = state.events.find(e => e.id === eventId);
    if (ev) {
      document.getElementById('event-notes').value = ev.notes || '';
      const presetEl = document.getElementById('event-title-preset');
      const customEl = document.getElementById('event-title');
      const titleVal = ev.title || '';
      const opts = Array.from(presetEl.options).map(o => o.value).filter(v => v && v !== '__custom__');
      if (titleVal && opts.includes(titleVal)) { presetEl.value = titleVal; customEl.style.display = 'none'; }
      else if (titleVal) { presetEl.value = '__custom__'; customEl.value = titleVal; customEl.style.display = ''; }
      if (ev.topics && ev.topics.length > 0) {
        selectedTopics = ev.topics.map(t => ({...t}));
        renderSelectedTopics();
      } else if (ev.topicId) {
        selectedTopics = [{ id: ev.topicId, label: ev.topicLabel, pathShort: ev.topicPathShort, path: ev.topicPath }];
        renderSelectedTopics();
      }
      selectedColor = ev.color || 'green';
      if (ev.selectedGrade) {
        selectedTreeGrade = ev.selectedGrade;
        currentCurriculumRootId = isMiddleSchool(ev.selectedGrade)
          ? MIDDLE_SCHOOL_MAP[ev.selectedGrade]
          : (CURRICULUM_MAP[state.meta.major]?.[ev.selectedGrade] || currentCurriculumRootId);
      }
    }
    document.getElementById('btn-delete').style.display = '';
  } else {
    document.getElementById('btn-delete').style.display = 'none';
  }

  renderColorPicker();
  renderGradeTabs();
  initTree();
  document.getElementById('modal-overlay').classList.add('active');
  setTimeout(() => document.getElementById('event-title-preset').focus(), 100);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  isMultiSave = false;
}
function closeModalOverlay(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }

function renderGradeTabs() {
  const tc = document.getElementById('grade-tabs');
  tc.innerHTML = '';
  if (availableGrades.length <= 1) { tc.style.display = 'none'; return; }
  tc.style.display = 'flex';
  availableGrades.forEach(grade => {
    const tab = document.createElement('button');
    tab.className = 'grade-tab' + (grade === selectedTreeGrade ? ' active' : '');
    tab.textContent = GRADE_LABELS[grade];
    tab.addEventListener('click', () => {
      selectedTreeGrade = grade;
      currentCurriculumRootId = isMiddleSchool(grade)
        ? MIDDLE_SCHOOL_MAP[grade]
        : (CURRICULUM_MAP[state.meta.major]?.[grade] || null);
      nav.path = [];
      renderGradeTabs(); initTree();
    });
    tc.appendChild(tab);
  });
}

function initTree() {
  nav.path = [];
  if (!topicTreeLoaded) {
    document.getElementById('tree-breadcrumb').textContent = 'در حال بارگذاری...';
    document.getElementById('tree-list').innerHTML = '<div class="loading-indicator">لطفاً صبر کنید...</div>';
    return;
  }
  if (!currentCurriculumRootId) {
    const g = state.meta.grade;
    document.getElementById('tree-breadcrumb').textContent = isMiddleSchool(g) ? 'ابتدا پایه را انتخاب کنید' : 'ابتدا رشته و پایه را انتخاب کنید';
    document.getElementById('tree-list').innerHTML = '<div style="padding:10px;color:#aaa;font-size:12px;text-align:center;">پایه/رشته انتخاب نشده</div>';
    return;
  }
  renderTreeLevel(currentCurriculumRootId);
  updateBreadcrumb();
}

function renderTreeLevel(nodeId) {
  const list = document.getElementById('tree-list');
  list.innerHTML = '';
  const node = TOPIC_TREE[String(nodeId)];
  if (!node) return;

  if (nav.path.length > 0) {
    const back = document.createElement('div');
    back.className = 'tree-item back-item'; back.textContent = '↑ بازگشت';
    back.addEventListener('click', () => {
      nav.path.pop();
      const goTo = nav.path.length > 0 ? nav.path[nav.path.length-1] : currentCurriculumRootId;
      renderTreeLevel(goTo); updateBreadcrumb();
    });
    list.appendChild(back);
  }

  const children = node.children || [];
  if (!children.length) {
    list.innerHTML += '<div style="padding:10px;color:#aaa;font-size:11px;text-align:center;">زیرمجموعه‌ای وجود ندارد</div>';
    return;
  }

  children.forEach(childId => {
    const child = TOPIC_TREE[String(childId)];
    if (!child) return;
    const hasKids = !!(child.children?.length);
    const isSelected = selectedTopics.some(t => t.id === String(child._id));

    const row = document.createElement('div');
    row.className = 'tree-item-row' + (isSelected ? ' row-selected' : '');

    const selectBtn = document.createElement('button');
    selectBtn.className = 'tree-select-btn' + (isSelected ? ' active' : '');
    selectBtn.textContent = isSelected ? '✓' : '○';
    selectBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (isSelected) removeSelectedTopic(String(child._id));
      else selectTopic(child, nodeId);
      renderTreeLevel(nodeId);
    });

    const labelEl = document.createElement('span');
    labelEl.className = 'tree-item-label';
    labelEl.textContent = child.label;
    labelEl.addEventListener('click', () => {
      if (isSelected) removeSelectedTopic(String(child._id));
      else selectTopic(child, nodeId);
      renderTreeLevel(nodeId);
    });

    row.appendChild(selectBtn); row.appendChild(labelEl);

    if (hasKids) {
      const enterBtn = document.createElement('button');
      enterBtn.className = 'tree-enter-btn'; enterBtn.textContent = '←';
      enterBtn.addEventListener('click', e => {
        e.stopPropagation();
        nav.path.push(nodeId);
        renderTreeLevel(child._id); updateBreadcrumb();
      });
      row.appendChild(enterBtn);
    }
    list.appendChild(row);
  });
}

function selectTopic(node, currentNodeId) {
  const allNodeIds = [...nav.path, currentNodeId].filter(id => id !== undefined && String(id) !== String(currentCurriculumRootId));
  const allNodes   = allNodeIds.map(id => TOPIC_TREE[String(id)]).filter(Boolean);

  const topicShort = shortenLabel(node.label);
  const gradeLabel = GRADE_LABELS[selectedTreeGrade] || '';

  const pathParts = [...allNodes.map(n => shortenLabel(n.label)), shortenLabel(node.label)];
  if (gradeLabel && pathParts.length > 1) pathParts.splice(1, 0, gradeLabel);
  else if (gradeLabel && pathParts.length === 1) pathParts.push(gradeLabel);
  let shortPathStr = pathParts.join(' | ');

  const fullLabels = [...allNodes.map(n => n.label), node.label];
  let pathStr = fullLabels.join(' > ');
  if (selectedTreeGrade && selectedTreeGrade !== state.meta.grade) pathStr = `[${gradeLabel}] ` + pathStr;

  addSelectedTopic(node, shortPathStr, pathStr);
}

function getSubjectNameFromPath() {
  if (nav.path.length > 0) {
    const n = TOPIC_TREE[String(nav.path[0])];
    if (n) return n.label;
  }
  if (selectedTopics.length > 0) {
    const p = selectedTopics[0].pathShort || '';
    return p.split('|')[0].trim();
  }
  return '';
}

function updateBreadcrumb() {
  const bc = document.getElementById('tree-breadcrumb');
  if (selectedTopics.length > 0) {
    bc.innerHTML = `<i data-lucide="check" class="icon-sm" style="color:#166534"></i> ${selectedTopics.length} مبحث انتخاب شده`;
    lucide.createIcons();
  } else if (nav.path.length > 0) {
    const labels = nav.path.map(id => TOPIC_TREE[String(id)]?.label).filter(Boolean);
    bc.textContent = labels.join(' > ');
  } else {
    bc.textContent = 'مبحث را انتخاب کنید...';
  }
}

function renderColorPicker() {
  const row = document.getElementById('color-row');
  row.innerHTML = '';
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (c.id === selectedColor ? ' selected' : '');
    sw.style.cssText = `background:${c.bg};border-color:${c.border};`;
    sw.title = c.label;
    sw.addEventListener('click', () => { selectedColor = c.id; renderColorPicker(); });
    row.appendChild(sw);
  });
}

function saveEvent() {
  if (!currentCell) return;
  const presetEl = document.getElementById('event-title-preset');
  const customEl = document.getElementById('event-title');
  const title = presetEl.value === '__custom__' ? customEl.value.trim() : (presetEl.value || '').trim();
  const notes = document.getElementById('event-notes').value.trim();
  const subjectName = getSubjectNameFromPath();
  const gradeLabel = selectedTreeGrade ? GRADE_LABELS[selectedTreeGrade] : '';

  const topicsToSave = selectedTopics.length > 0 ? [...selectedTopics] : [];
  const firstTopic = topicsToSave[0] || null;

  if (!title && topicsToSave.length === 0) {
    const inp = document.getElementById('event-title-preset');
    inp.style.borderColor = '#dc2626'; inp.focus();
    setTimeout(() => inp.style.borderColor = '', 1500);
    return;
  }

  const baseEvent = {
    title, notes, subjectName, gradeLabel,
    selectedGrade: selectedTreeGrade,
    color: selectedColor,
    topics: topicsToSave,
    topicId:        firstTopic?.id        || '',
    topicPath:      firstTopic?.path      || '',
    topicLabel:     firstTopic?.label     || '',
    topicPathShort: firstTopic?.pathShort || '',
  };

  if (isMultiSave) {
    selectedCells.forEach(key => {
      const [di, ti] = key.split('_').map(Number);
      const existing = state.events.find(e => e.dayIndex === di && e.timeIndex === ti);
      if (existing) Object.assign(existing, baseEvent);
      else state.events.push({ id: 'ev_' + Date.now() + '_' + key, dayIndex: di, timeIndex: ti, ...baseEvent, createdAt: new Date().toISOString() });
    });
    clearSelectedCells();
    isMultiSave = false;
  } else if (editingEventId) {
    const ev = state.events.find(e => e.id === editingEventId);
    if (ev) Object.assign(ev, baseEvent);
  } else {
    state.events.push({ id: 'ev_' + Date.now(), dayIndex: currentCell.dayIndex, timeIndex: currentCell.timeIndex, ...baseEvent, createdAt: new Date().toISOString() });
  }

  saveState(); renderBody(); closeModal();
}

function deleteEvent() {
  if (!editingEventId) return;
  state.events = state.events.filter(e => e.id !== editingEventId);
  saveState(); renderBody(); closeModal();
}

function clearAll() {
  if (!confirm('همه برنامه‌ها پاک شوند؟')) return;
  state.events = []; saveState(); renderBody();
}

function resetTimesToDefault() {
  if (!confirm('تایم‌های جدول به حالت پیش‌فرض (۵ تا ۲۴) برگردد؟')) return;
  state.times = cloneDefaultTimes();
  saveState(); renderHeader(); renderBody();
}

function saveState() {
  saveMeta();
  const notes = document.getElementById('weekly-notes');
  if (notes) state.weeklyNotes = notes.value;
  try { localStorage.setItem('planner_v2', JSON.stringify(state)); } catch(e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem('planner_v2');
    if (raw) {
      const saved = JSON.parse(raw);
      state = { ...state, ...saved };
      if (!saved.times || !Array.isArray(saved.times) || saved.times.length < 10) {
        state.times = cloneDefaultTimes();
      } else {
        state.times = normalizeTimes(saved.times);
      }
    }
  } catch(e) {}
}

// ── LOAD PANEL ──
let allStudentsData = [];
let allPlansData = [];

async function openLoadPanel() {
  document.getElementById('load-panel').classList.add('active');
  document.getElementById('lp-search').value = '';
  document.getElementById('lp-list').innerHTML = '<div class="lp-empty">در حال بارگذاری...</div>';
  try {
    const [sRes, pRes] = await Promise.all([
      fetch(`${API_BASE}/students.php`),
      fetch(`${API_BASE}/reports.php?type=all_students`)
    ]);
    const sData = await sRes.json();
    const pData = await pRes.json();
    allStudentsData = sData.students || [];
    allPlansData = pData.students || [];
    renderLoadList(allStudentsData);
  } catch(e) {
    document.getElementById('lp-list').innerHTML = '<div class="lp-empty">خطا در اتصال به سرور</div>';
  }
}
function closeLoadPanel() {
  document.getElementById('load-panel').classList.remove('active');
}
function filterLoadList() {
  const q = document.getElementById('lp-search').value.toLowerCase().trim();
  const filtered = q ? allStudentsData.filter(s => s.name.toLowerCase().includes(q)) : allStudentsData;
  renderLoadList(filtered);
}

const GRADE_LABELS_FA = {'7th':'هفتم','8th':'هشتم','9th':'نهم','10th':'دهم','11th':'یازدهم','12th':'دوازدهم'};
const MAJOR_LABELS_FA = {'math':'ریاضی','tajrobi':'تجربی','humanities':'انسانی'};

function renderLoadList(students) {
  const list = document.getElementById('lp-list');
  if (!students.length) { list.innerHTML = '<div class="lp-empty">دانش‌آموزی یافت نشد</div>'; return; }
  list.innerHTML = '';
  students.forEach(s => {
    const item = document.createElement('div');
    item.className = 'lp-item';
    const info = document.createElement('div');
    info.className = 'lp-item-info';
    const name = document.createElement('div');
    name.className = 'lp-item-name'; name.textContent = s.name;
    const meta = document.createElement('div');
    meta.className = 'lp-item-meta';
    meta.textContent = [GRADE_LABELS_FA[s.grade], MAJOR_LABELS_FA[s.major]].filter(Boolean).join(' — ');
    info.appendChild(name); info.appendChild(meta);

    const plansDiv = document.createElement('div');
    plansDiv.className = 'lp-item-plans';

    const newBtn = document.createElement('button');
    newBtn.className = 'lp-plan-btn';
    newBtn.textContent = '🗓 برنامه جدید';
    newBtn.addEventListener('click', async () => {
      await loadStudentTimesOnly(s);
      closeLoadPanel();
    });
    plansDiv.appendChild(newBtn);

    if (s.plan_count > 0) {
      const lastBtn = document.createElement('button');
      lastBtn.className = 'lp-plan-btn';
      lastBtn.textContent = `📋 آخرین برنامه (${s.last_week_date || '—'})`;
      lastBtn.addEventListener('click', async () => {
        await loadLastPlan(s.id);
        closeLoadPanel();
      });
      plansDiv.appendChild(lastBtn);
    }

    item.appendChild(info); item.appendChild(plansDiv);
    list.appendChild(item);
  });
}

async function loadStudentTimesOnly(student) {
  try {
    const res = await fetch(`${API_BASE}/plans.php?student_id=${student.id}`);
    const data = await res.json();
    const plans = data.plans || [];

    state.meta.name  = student.name;
    state.meta.grade = student.grade;
    state.meta.major = student.major || '';
    state.meta.date  = '';
    state.events = [];
    state.dayNotes = {};

    if (plans.length > 0) {
      const lastPlan = plans[0];
      const planRes = await fetch(`${API_BASE}/plans.php?id=${lastPlan.id}`);
      const planData = await planRes.json();
      if (planData.plan && planData.plan.times_json) {
        try {
          const times = JSON.parse(planData.plan.times_json);
          if (times && times.length) state.times = normalizeTimes(times);
        } catch(e) {}
      }
    }

    saveState(); loadMetaFields(); renderHeader(); renderBody();
    document.getElementById('save-status').textContent = `✓ ${student.name} بارگذاری شد`;
    document.getElementById('save-status').style.color = '#16a34a';
  } catch(e) {
    alert('خطا در بارگذاری اطلاعات دانش‌آموز');
  }
}

async function loadLastPlan(studentId) {
  try {
    const res = await fetch(`${API_BASE}/plans.php?student_id=${studentId}`);
    const data = await res.json();
    const plans = data.plans || [];
    if (!plans.length) { alert('برنامه‌ای یافت نشد'); return; }

    const planRes = await fetch(`${API_BASE}/plans.php?id=${plans[0].id}`);
    const planData = await planRes.json();
    if (!planData.success) { alert('خطا در بارگذاری برنامه'); return; }

    const plan = planData.plan;
    const events = planData.events || [];

    const student = allStudentsData.find(s => s.id === studentId) || {};

    state.meta.name  = student.name  || plan.student_name || '';
    state.meta.grade = student.grade || plan.grade || '';
    state.meta.major = student.major || plan.major || '';
    state.meta.date  = plan.week_date || '';
    state.weeklyNotes = plan.weekly_notes || '';

    if (plan.times_json) {
      try {
        const t = JSON.parse(plan.times_json);
        if (t?.length) state.times = normalizeTimes(t);
      } catch(e) {}
    }

    state.events = events.map(ev => ({
      id: 'ev_loaded_' + ev.id,
      dayIndex:       ev.day_index,
      timeIndex:      ev.time_index,
      title:          ev.title || '',
      notes:          ev.notes || '',
      color:          ev.color || 'green',
      topicId:        ev.topic_id || '',
      topicPath:      ev.topic_path || '',
      topicLabel:     ev.topic_label || '',
      topicPathShort: ev.topic_path_short || '',
      subjectName:    ev.subject_name || '',
      selectedGrade:  ev.selected_grade || '',
      topics: ev.topic_path_short ? [{ id: ev.topic_id, label: ev.topic_label, pathShort: ev.topic_path_short, path: ev.topic_path }] : []
    }));

    state.dayNotes = {};

    saveState(); loadMetaFields(); renderHeader(); renderBody();
    const notes = document.getElementById('weekly-notes');
    if (notes) notes.value = state.weeklyNotes;
    document.getElementById('save-status').textContent = `✓ برنامه ${plan.week_date || ''} بارگذاری شد`;
    document.getElementById('save-status').style.color = '#16a34a';
  } catch(e) {
    console.error(e);
    alert('خطا در بارگذاری برنامه');
  }
}

// ── SERVER SAVE ──
const API_BASE = 'api';

async function savePlanToServer() {
  saveMeta();
  const notes = document.getElementById('weekly-notes');
  if (notes) state.weeklyNotes = notes.value;

  if (!state.meta.name?.trim()) { alert('لطفاً نام دانش‌آموز را وارد کنید'); document.getElementById('meta-name').focus(); return; }
  if (!state.meta.grade) { alert('لطفاً پایه را انتخاب کنید'); return; }
  if (!state.events.length) { alert('هیچ برنامه‌ای برای ذخیره وجود ندارد'); return; }

  const btn = document.getElementById('btn-save-server');
  const status = document.getElementById('save-status');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader" class="icon-sm"></i> در حال ذخیره...';
  lucide.createIcons(); status.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/plans.php`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    const data = await res.json();
    if (data.success) {
      status.style.color = '#16a34a';
      status.textContent = `✓ ${data.saved} — شناسه: #${data.plan_id}`;
      state.lastPlanId = data.plan_id;
      localStorage.setItem('planner_v2', JSON.stringify(state));
    } else {
      status.style.color = '#dc2626';
      status.textContent = '✗ ' + (data.error || 'خطا');
    }
  } catch(e) {
    status.style.color = '#dc2626'; status.textContent = '✗ خطا در اتصال به سرور';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="cloud-upload" class="icon-sm"></i> ذخیره در سرور';
    lucide.createIcons();
  }
}

// ── SMART PRINT ──
function smartPrint() {
  const table = document.getElementById('planner-table');
  if (!table) { window.print(); return; }

  const colCount = state.times.length;

  let fontSize, truncateMax, cellH;
  if (colCount > 16) {
    fontSize = 6.5; truncateMax = 2; cellH = 44;
  } else if (colCount > 12) {
    fontSize = 9.5; truncateMax = 3; cellH = 50;
  } else if (colCount > 8) {
    fontSize = 10.5; truncateMax = 4; cellH = 58;
  } else if (colCount > 5) {
    fontSize = 13; truncateMax = 5; cellH = 68;
  } else {
    fontSize = 9.5; truncateMax = 99; cellH = 82;
  }

  document.documentElement.style.setProperty('--print-font-bc',   fontSize + 'px');
  document.documentElement.style.setProperty('--print-font-title', (fontSize - 0.5) + 'px');
  document.documentElement.style.setProperty('--print-cell-h',    cellH + 'px');
  document.documentElement.style.setProperty('--print-truncate',  truncateMax);

  PRINT_TRUNCATE_MAX = truncateMax;

  window.print();

  setTimeout(() => {
    PRINT_TRUNCATE_MAX = null;
    document.documentElement.style.removeProperty('--print-font-bc');
    document.documentElement.style.removeProperty('--print-font-title');
    document.documentElement.style.removeProperty('--print-cell-h');
    document.documentElement.style.removeProperty('--print-truncate');
  }, 2000);
}

let PRINT_TRUNCATE_MAX = null;

init();