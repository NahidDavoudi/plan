/* ========================================================
   main.js — init، متادیتا، curriculum root، کیبورد، clearAll
   ======================================================== */

// ── META FIELDS ──

function updatePrintSpans() {
  const ml = { '':'', ...MAJOR_LABELS_FA };
  const gl = { '':'', ...GRADE_LABELS };
  const ms = document.getElementById('meta-major-print');
  const gs = document.getElementById('meta-grade-print');
  if (ms) ms.textContent = ml[document.getElementById('meta-major').value] || '';
  if (gs) gs.textContent = gl[document.getElementById('meta-grade').value] || '';
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

function onMajorOrGradeChange() {
  saveMeta();
  updateCurriculumRoot();
  updatePrintSpans();
  saveState();
}

function updateCurriculumRoot() {
  const major = state.meta.major;
  const grade = state.meta.grade;

  const mw = document.getElementById('meta-major-wrap');
  if (mw) mw.style.display = isMiddleSchool(grade) ? 'none' : '';

  if (grade === '12th')      availableGrades = ['12th','11th','10th'];
  else if (grade === '11th') availableGrades = ['11th','10th'];
  else                       availableGrades = [grade];

  selectedTreeGrade = grade;

  if (!grade) { currentCurriculumRootId = null; return; }
  if (isMiddleSchool(grade)) {
    currentCurriculumRootId = MIDDLE_SCHOOL_MAP[grade];
  } else if (major && CURRICULUM_MAP[major]?.[grade]) {
    currentCurriculumRootId = CURRICULUM_MAP[major][grade];
  } else {
    currentCurriculumRootId = null;
  }
}

// ── MISC ──

function clearAll() {
  if (!confirm('همه برنامه‌ها پاک شوند؟')) return;
  state.events = [];
  saveState();
  renderBody();
}

// ── INIT ──

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
    if (e.key === 'Escape') {
      closeModal();
      closeLoadPanel();
      clearSelectedCells();
    }
    if (e.key === 'Enter' && document.getElementById('modal-overlay').classList.contains('active')) {
      const t = e.target;
      const tag = t.tagName;
      const inTree = t.closest && t.closest('#tree-list');
      if (tag !== 'TEXTAREA' && tag !== 'SELECT' && tag !== 'BUTTON' && !inTree) {
        saveEvent();
      }
    }
  });

  lucide.createIcons();
}

window.__famoStart = init;