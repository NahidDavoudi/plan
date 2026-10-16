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
  const elName = document.getElementById('meta-name');
  const elDate = document.getElementById('meta-date');
  const elAdvisor = document.getElementById('meta-advisor');
  if (elName && state.meta.name) elName.value = state.meta.name;
  if (elAdvisor && state.meta.advisor) elAdvisor.value = state.meta.advisor;
  if (elDate) {
    elDate.value = state.meta.date ? isoToJalaliString(state.meta.date) : '';
  }
  if (state.meta.major) document.getElementById('meta-major').value = state.meta.major;
  if (state.meta.grade) document.getElementById('meta-grade').value = state.meta.grade;
  updateCurriculumRoot();
  updatePrintSpans();
}

function saveMeta() {
  ['name','advisor'].forEach(k => {
    const el = document.getElementById('meta-' + k);
    if (el) state.meta[k] = el.value;
  });
  // 'date' هو منبع صداقت (ISO) و توسط date-picker مدیریت می‌شود؛ از مقدار input (شمسی) کپی نشود.
  state.meta.major = document.getElementById('meta-major').value;
  state.meta.grade = document.getElementById('meta-grade').value;
}

// ── تبدیل تقویم شمسی ↔ میلادی (بدون وابستگی به کتابخانهٔ خارجی) ──
// الگوریست بörkowski (همان‌چه در jalaali-js استفاده می‌شود)؛ فقط برای فرانت.
//
// state.meta.date همیشه ISO میلادی "YYYY-MM-DD" می‌ماند.
// input تاریخ نمایشی شمسی است؛ تبدیل در اینجا انجام می‌شود.

const JALALI_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
const MIN_JALALI_YEAR = -61;
const MAX_JALALI_YEAR = 3177;

function jDiv(a, b) { return Math.trunc(a / b); }
function jMod(a, b) { return a - jDiv(a, b) * b; }

function jCalCore(jy) {
  var gy = jy + 621;
  var e = -14, n = JALALI_BREAKS[0], t = 0, i = 0, A = 1, L = JALALI_BREAKS.length;
  for (; A < L && (t = JALALI_BREAKS[A], i = t - n, !(jy < t)); A += 1) {
    e = e + 8 * jDiv(i, 33) + jDiv(jMod(i, 33), 4);
    n = t;
  }
  var l = jy - n;
  e = e + 8 * jDiv(l, 33) + jDiv(jMod(l, 33) + 3, 4);
  if (jMod(i, 33) === 4 && i - l === 4) e += 1;
  var march = 20 + e - (jDiv(gy, 4) - jDiv(3 * (jDiv(gy, 100) + 1), 4) - 150);
  return { gy: gy, march: march, jump: i, n: l };
}
function jLeapFromCycle(jump, n) {
  var e = n;
  if (jump - n < 6) e = n - jump + 33 * jDiv(jump + 4, 33);
  var m = jMod(jMod(e + 1, 33) - 1, 4);
  if (m === -1) m = 4;
  return m;
}
function jCalShort(jy) {
  var r = jCalCore(jy);
  return { gy: r.gy, march: r.march };
}
function jCal(jy) {
  var r = jCalCore(jy);
  return { leap: jLeapFromCycle(r.jump, r.n), gy: r.gy, march: r.march };
}
function jGregorianToJDN(gy, gm, gd) {
  var n = jDiv(1461 * (gy + jDiv(gm - 8, 6) + 100100), 4) + jDiv(153 * jMod(gm + 9, 12) + 2, 5) + gd - 34840408;
  n = n - jDiv(3 * jDiv(gy + 100100 + jDiv(gm - 8, 6), 100), 4) + 752;
  return n;
}
function jJalaliToJDN(jy, jm, jd) {
  var n = jCalShort(jy);
  return jGregorianToJDN(n.gy, 3, n.march) + 31 * (jm - 1) - jDiv(jm, 7) * (jm - 7) + jd - 1;
}
function jJDNToGregorian(jdn) {
  var A = 4 * jdn + 139361631;
  A = A + 4 * jDiv(3 * jDiv(4 * jdn + 183187720, 146097), 4) - 3908;
  var e = 5 * jDiv(jMod(A, 1461), 4) + 308;
  var n = jDiv(jMod(e, 153), 5) + 1;
  var t = jMod(jDiv(e, 153), 12) + 1;
  return { gy: jDiv(A, 1461) - 100100 + jDiv(8 - t, 6), gm: t, gd: n };
}
function jJDNToJalali(jdn) {
  var A = jJDNToGregorian(jdn).gy;
  var e = Math.min(A - 621, MAX_JALALI_YEAR);
  var n = jCal(e);
  var t = jdn - jGregorianToJDN(n.gy, 3, n.march);
  if (t >= 0) {
    if (t <= 185) return { jy: e, jm: 1 + jDiv(t, 31), jd: jMod(t, 31) + 1 };
    t -= 186;
  } else {
    e -= 1; t += 179;
    if (n.leap === 1) t += 1;
  }
  return { jy: e, jm: 7 + jDiv(t, 30), jd: jMod(t, 30) + 1 };
}
function jIsLeapYear(jy) { return jLeapFromCycle(jCalCore(jy).jump, jCalCore(jy).n) === 0; }
function jMonthLength(jy, jm) {
  return jm <= 6 ? 31 : (jm <= 11 || jIsLeapYear(jy)) ? 30 : 29;
}
function isValidJalaaliDate(jy, jm, jd) {
  return jy >= MIN_JALALI_YEAR && jy <= MAX_JALALI_YEAR && jm >= 1 && jm <= 12 && jd >= 1 && jd <= jMonthLength(jy, jm);
}

// jy/jm/jd (شمسی) → {gy,gm,gd} (میلادی)
function jalaaliToGregorian(jy, jm, jd) { return jJDNToGregorian(jJalaliToJDN(jy, jm, jd)); }
// gy/gm/gd (میلادی) → {jy,jm,jd} (شمسی)
function gregorianToJalaali(gy, gm, gd) { return jJDNToJalali(jGregorianToJDN(gy, gm, gd)); }

function pad2(n) { return String(n).padStart(2, '0'); }
function pad4(n) { return String(n).padStart(4, '0'); }
function parseISO(iso) {
  var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? { gy: parseInt(m[1], 10), gm: parseInt(m[2], 10), gd: parseInt(m[3], 10) } : null;
}
function isoToJalaliString(iso) {
  var g = parseISO(iso);
  if (!g) return '';
  var j = gregorianToJalaali(g.gy, g.gm, g.gd);
  return pad4(j.jy) + '/' + pad2(j.jm) + '/' + pad2(j.jd);
}

// نمایش تاریخ برای کاربران (لیست‌ها/وضعیت)
window.formatPersianDate = function (iso) {
  if (!iso) return '';
  var d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long' }).format(d);
};

// ── خطای فیلد تاریخ ──
function showDateError() {
  var el = document.getElementById('meta-date-error');
  if (el) el.hidden = false;
}
function hideDateError() {
  var el = document.getElementById('meta-date-error');
  if (el) el.hidden = true;
}

// انتخاب‌شده توسط کاربر در date-picker: شمسی → میلادی ISO → state
function onMetaDateChange() {
  var el = document.getElementById('meta-date');
  var err = document.getElementById('meta-date-error');
  var raw = (el.value || '').trim();
  if (!raw) {
    state.meta.date = '';
    hideDateError();
    saveState();
    return;
  }
  // ورود مستقیم ISO مقبول است (در صورت عدم لود شدن کتابچهٔ نمایشی)
  var m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    var gy = parseInt(m[1], 10), gm = parseInt(m[2], 10), gd = parseInt(m[3], 10);
    var d = new Date(gy, gm - 1, gd);
    if (!isNaN(d.getTime()) && d.getFullYear() === gy && d.getMonth() + 1 === gm && d.getDate() === gd) {
      state.meta.date = pad4(gy) + '-' + pad2(gm) + '-' + pad2(gd);
      hideDateError();
      saveState();
      return;
    }
    showDateError();
    state.meta.date = '';
    saveState();
    return;
  }
  var parts = String(raw).split('/');
  if (parts.length !== 3) { showDateError(); state.meta.date = ''; saveState(); return; }
  var jy = parseInt(parts[0], 10), jm = parseInt(parts[1], 10), jd = parseInt(parts[2], 10);
  if (!isValidJalaaliDate(jy, jm, jd)) { showDateError(); state.meta.date = ''; saveState(); return; }
  var g = jalaaliToGregorian(jy, jm, jd);
  state.meta.date = pad4(g.gy) + '-' + pad2(g.gm) + '-' + pad2(g.gd);
  hideDateError();
  saveState();
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

  // date-picker شمسی (تقویم جلالی برای کاربر، مقدار gửiی همیشه ISO میلادی)
  if (window.jalaliDatepicker) {
    jalaliDatepicker.startWatch({ selector: '#meta-date', autoShow: true, autoHide: true });
    const elDate = document.getElementById('meta-date');
    if (elDate) elDate.addEventListener('change', onMetaDateChange);
  }

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
      const tag = t && t.tagName ? String(t.tagName).toUpperCase() : '';
      const inTree = t instanceof Element && t.closest('#tree-list');
      const isInteractive =
        tag === 'BUTTON' ||
        tag === 'A' ||
        tag === 'SELECT' ||
        tag === 'TEXTAREA' ||
        (t instanceof Element && (t.matches('[role="button"]') || t.matches('[contenteditable="true"]') || t.closest('.activity-chip')));
      if (!isInteractive && !inTree) {
        saveEvent();
      }
    }
  });

  lucide.createIcons();
}

window.__famoStart = init;