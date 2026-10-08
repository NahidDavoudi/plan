/* ========================================================
   state.js — state سراسری + متغیرهای runtime + persistence
   ======================================================== */

let state = {
  meta: { major:'', grade:'' },
  times: cloneDefaultTimes(),
  events: [],
  dayNotes: {},          // TODO: حذف یا پیاده‌سازی UI (فعلاً بی‌استفاده)
  weeklyNotes: ''
};

// ── multi-select ──
let selectedCells  = new Set();
let isMultiMode    = false;
let isMultiSave    = false;

// ── drag & drop ── (اعلام‌شده در اینجا تا table.js قبل از drag.js لود می‌شود)
let _suppressClick = false;

// ── مودال ──
let currentCell    = null;
let editingEventId = null;
let selectedColor  = 'green';
let selectedTopics = [];

// ── topic tree ──
let TOPIC_TREE           = {};
let topicTreeLoaded      = false;
let nav                  = { path: [] };
let currentCurriculumRootId = null;
let availableGrades      = [];
let selectedTreeGrade    = null;

// ── پنل بارگذاری ──
let allStudentsData = [];
let allPlansData    = [];

// ── print ──
let PRINT_TRUNCATE_MAX = null;

// ── SPAN (بازه رویداد: گسترش افقی/عمودی در جدول) ──
// spanSlots = تعداد ستون‌های زمان (گسترش افقی)، spanDays = تعداد ردیف‌های روز (گسترش عمودی)
// خوانایی: در این مارک‌آپ هر «ردیف» یک روز و هر «ستون» یک بازه زمانی است.

function normalizeEventSpans() {
  if (!Array.isArray(state.events)) { state.events = []; return; }
  const maxDays  = DAYS.length;
  const maxTimes = state.times.length;
  state.events.forEach(ev => {
    if (!ev || typeof ev !== 'object') return;
    // clamp لنگر به مرز جدول (مثلاً بعد از resetTimesToDefault یا حذف ستون زمان)
    const di = Math.min(maxDays  - 1, Math.max(0, parseInt(ev.dayIndex, 10)  || 0));
    const ti = Math.min(maxTimes - 1, Math.max(0, parseInt(ev.timeIndex, 10) || 0));
    let sd = parseInt(ev.spanDays, 10);
    let st = parseInt(ev.spanSlots, 10);
    if (!Number.isFinite(sd) || sd < 1) sd = 1;   // backward-compat: ایونت‌های قدیمی → ۱×۱
    if (!Number.isFinite(st) || st < 1) st = 1;
    ev.dayIndex  = di;
    ev.timeIndex = ti;
    ev.spanDays  = Math.max(1, Math.min(sd, maxDays  - di));
    ev.spanSlots = Math.max(1, Math.min(st, maxTimes - ti));
  });
  resolveSpanOverlaps();
}

// ایمن‌سازی بعد از تغییرات ساختاری (حذف ستون زمان، ریست تایم‌ها، داده قدیمی):
// اگر ناحیهٔ دو ایونت هم‌پوشانی شد، ایونت‌های بعدی در ترتیب آرایه span را
// تا رفع برخورد کوچک می‌کنند (فقط کوچک‌سازی، هرگز جابجایی/حذف).
// قاعده قاطع و تکرارپذیر: هر ایونت باید ناحیه‌اش نسبت به همه آزاد باشد؛
// ایونت‌هایی که لنگر مشترک دارند (۱×۱ روی هم) قابل رفع نیستند و همانا
// ایونت اول آرایه رندر می‌شود (رف pre-existing).
function resolveSpanOverlaps() {
  const events = state.events.filter(e => e && typeof e === 'object');
  for (const ev of events) {
    while (ev.spanSlots > 1 &&
           !regionIsFree(ev.dayIndex, ev.timeIndex, ev.spanDays, ev.spanSlots, [ev.id])) {
      ev.spanSlots--;
    }
    while (ev.spanDays > 1 &&
           !regionIsFree(ev.dayIndex, ev.timeIndex, ev.spanDays, ev.spanSlots, [ev.id])) {
      ev.spanDays--;
    }
  }
}

// آیا سلول (di,ti) تحت پوشش ایونت ev است؟
function eventCoversCell(ev, di, ti) {
  const d0 = ev.dayIndex, t0 = ev.timeIndex;
  if (!(d0 >= 0) || !(t0 >= 0)) return false;
  const sd = ev.spanDays  || 1, st = ev.spanSlots || 1;
  return di >= d0 && di < d0 + sd && ti >= t0 && ti < t0 + st;
}

// آیا ناحیه [day..day+spanDays) × [time..time+spanSlots) خالی است؟
// ignoreIds: ایونت‌هایی که در حال جابجایی/کپی هستند و نباید مانع محاسبه شوند.
function regionIsFree(day, time, spanDays, spanSlots, ignoreIds) {
  if (!(day >= 0) || !(time >= 0)) return false;
  if (day + spanDays > DAYS.length || time + spanSlots > state.times.length) return false;
  const ignore = ignoreIds || [];
  for (let di = day; di < day + spanDays; di++) {
    for (let ti = time; ti < time + spanSlots; ti++) {
      for (const ev of state.events) {
        if (!ev || ignore.indexOf(ev.id) !== -1) continue;
        if (eventCoversCell(ev, di, ti)) return false;
      }
    }
  }
  return true;
}

// الگوریتم انتخاب جایگاه کپی (قاطع/تکرارپذیر):
//  ۱) همان روز، سلول‌های پایین‌تر از مبدأ (timeIndex+1 → انتها) با همان span
//  ۲) همان روز، سلول‌های بالاتر از مبدأ (timeIndex-1 → ۰) با همان span
//  ۳) همان روز، پایین‌تر با span پیش‌فرض ۱×۱
//  ۴) همان روز، بالاتر با span پیش‌فرض ۱×۱
//  ۵) روزهای دیگر به ترتیب چرخشی (روز+۱، روز+۲، …، wraps)، هر روز از ستون ۰، با همان span
//  ۶) روزهای دیگر به همان ترتیب، با span ۱×۱
// اگر هیچ جایی پیدا نشد → null (شبکه کاملاً پر است).
function findDuplicateSlot(ev) {
  const nD = DAYS.length, nT = state.times.length;
  const di = ev.dayIndex, ti = ev.timeIndex;
  const sd0 = ev.spanDays || 1, st0 = ev.spanSlots || 1;
  const layouts = (sd0 === 1 && st0 === 1) ? [[1, 1]] : [[sd0, st0], [1, 1]];
  const fits = (d, t, sd, st) => regionIsFree(d, t, sd, st);

  for (const [sd, st] of layouts) {                       // ۱ + ۲
    for (let t = ti + 1; t <= nT - st; t++)
      if (fits(di, t, sd, st)) return { dayIndex: di, timeIndex: t, spanDays: sd, spanSlots: st };
    for (let t = ti - 1; t >= 0; t--)
      if (fits(di, t, sd, st)) return { dayIndex: di, timeIndex: t, spanDays: sd, spanSlots: st };
  }
  for (const [sd, st] of layouts) {                       // ۵ + ۶
    for (let k = 1; k < nD; k++) {
      const d = (di + k) % nD;
      for (let t = 0; t <= nT - st; t++)
        if (fits(d, t, sd, st)) return { dayIndex: d, timeIndex: t, spanDays: sd, spanSlots: st };
    }
  }
  return null;
}

// ── PERSISTENCE ──

function saveState() {
  saveMeta();  // تابع در main.js
  const notes = document.getElementById('weekly-notes');
  if (notes) state.weeklyNotes = notes.value;
  normalizeEventSpans(); // اطمینان از اینکه localStorage همیشه span معتبر دارد
  try { localStorage.setItem('planner_v2', JSON.stringify(state)); } catch(e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem('planner_v2');
    if (!raw) return;
    const saved = JSON.parse(raw);
    state = { ...state, ...saved };
    if (!saved.times || !Array.isArray(saved.times) || saved.times.length < 10) {
      state.times = cloneDefaultTimes();
    } else {
      state.times = normalizeTimes(saved.times);
    }
    // مهاجرت داده‌های قدیمی: نبودِ spanDays/spanSlots → ۱×۱
    normalizeEventSpans();
  } catch(e) {}
}