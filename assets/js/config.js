const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];

const MIDDLE_SCHOOL_MAP = { "7th":  2, "8th": 3, "9th": 4 };

const CURRICULUM_MAP = {
  math:       { "10th": 1602, "11th": 1603, "12th": 13775 },
  humanities: { "10th": 5639, "11th": 5640, "12th": 13820 },
  tajrobi:    { "10th": 9183, "11th": 9184, "12th": 13810 }
};

const GRADE_LABELS = {
  "7th":"هفتم","8th":"هشتم","9th":"نهم",
  "10th":"دهم","11th":"یازدهم","12th":"دوازدهم"
};
const MAJOR_LABELS_FA = { 'math':'ریاضی','tajrobi':'تجربی','humanities':'انسانی' };


const COLORS = [
  { id:'sky',     bg:'#e0f2fe',text:'#0c4a6e',border:'#7dd3fc', label:'آبی خیلی روشن' },
  { id:'blue',    bg:'#dbeafe',text:'#1e3a8a',border:'#93c5fd', label:'آبی' },
  { id:'indigo',  bg:'#e0e7ff',text:'#1e1b4b',border:'#a5b4fc', label:'نیلی' },
  { id:'navy',    bg:'#c7d2fe',text:'#1e40af',border:'#818cf8', label:'آبی نفتی' },
  { id:'cyan',    bg:'#cffafe',text:'#164e63',border:'#67e8f9', label:'سیان' },
  { id:'teal',    bg:'#ccfbf1',text:'#134e4a',border:'#5eead4', label:'فیروزه‌ای' },
  { id:'aqua',    bg:'#e0fcff',text:'#133b5c',border:'#76e4f7', label:'آکوآ' },
  { id:'green',   bg:'#dcfce7',text:'#14532d',border:'#86efac', label:'سبز' },
  { id:'emerald', bg:'#d1fae5',text:'#064e3b',border:'#6ee7b7', label:'زمردی' },
  { id:'mint',    bg:'#f0fff4',text:'#064e3b',border:'#bbf7d0', label:'نعنایی' },
  { id:'lime',    bg:'#ecfccb',text:'#365314',border:'#bef264', label:'لیمویی' },
  { id:'olive',   bg:'#fafaf0',text:'#585c1b',border:'#d9e67a', label:'زیتونی' },
  { id:'yellow',  bg:'#fef9c3',text:'#713f12',border:'#fde047', label:'زرد' },
  { id:'gold',    bg:'#fefce8',text:'#854d0e',border:'#eab308', label:'طلایی' },
  { id:'amber',   bg:'#fef3c7',text:'#78350f',border:'#fcd34d', label:'کهربا' },
  { id:'orange',  bg:'#ffedd5',text:'#7c2d12',border:'#fdba74', label:'نارنجی' },
  { id:'peach',   bg:'#fff7ed',text:'#9a3412',border:'#fdba74', label:'هلو' },
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

const DEFAULT_TIMES = [
  { start:'5:00',  end:'6:00'  }, { start:'6:00',  end:'7:00'  },
  { start:'7:00',  end:'8:00'  }, { start:'8:00',  end:'9:00'  },
  { start:'9:00',  end:'10:00' }, { start:'10:00', end:'11:00' },
  { start:'11:00', end:'12:00' }, { start:'12:00', end:'13:00' },
  { start:'13:00', end:'14:00' }, { start:'14:00', end:'15:00' },
  { start:'15:00', end:'16:00' }, { start:'16:00', end:'17:00' },
  { start:'17:00', end:'18:00' }, { start:'18:00', end:'19:00' },
  { start:'19:00', end:'20:00' }, { start:'20:00', end:'21:00' },
  { start:'21:00', end:'22:00' }, { start:'22:00', end:'23:00' },
  { start:'23:00', end:'24:00' },
];

// ── HELPERS ──

function isMiddleSchool(grade) {
  return ['7th','8th','9th'].includes(grade);
}

function normalizeTime(t) {
  if (t && typeof t === 'object' && ('start' in t || 'end' in t)) {
    return { start: String(t.start || '').trim(), end: String(t.end || '').trim() };
  }
  if (typeof t === 'string') {
    const i = t.indexOf('-');
    if (i > -1) return { start: t.slice(0, i).trim(), end: t.slice(i + 1).trim() };
    return { start: t.trim(), end: '' };
  }
  return { start: '', end: '' };
}
function normalizeTimes(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return cloneDefaultTimes();
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

// ── SERVER VOCABULARY ADAPTERS ──

function gradeToString(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' && /th$/.test(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n + 'th' : String(value);
}

function gradeToNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const m = String(value).match(/\d+/);
  return m ? Number(m[0]) : null;
}

const FIELD_TO_MAJOR = { 'ریاضی': 'math', 'تجربی': 'tajrobi', 'انسانی': 'humanities', 'راهنمایی': '' };
const MAJOR_TO_FIELD = { 'math': 'ریاضی', 'tajrobi': 'تجربی', 'humanities': 'انسانی', '': 'راهنمایی' };

function fieldToMajor(field) {
  if (!field) return '';
  if (FIELD_TO_MAJOR[field] !== undefined) return FIELD_TO_MAJOR[field];
  if (MAJOR_LABELS_FA[field] !== undefined) return field;
  return '';
}

function majorToField(major) {
  if (!major) return 'راهنمایی';
  return MAJOR_TO_FIELD[major] || major;
}