/* ========================================================
   contextmenu.js — منوی راست‌کلیک روی event-chip
   (event delegation سراسری → بدون نیاز به bind مجدد بعد از renderBody)
   ======================================================== */

let _ctxMenu      = null;   // تنها یک نمونه منو (ساخت یک‌بار، استفاده مجدد)
let _ctxTargetId  = null;   // شناسه ایونت هدف (نه خود شیء، تا بعد از re-render هم معتبر بماند)

function ensureContextMenu() {
  if (_ctxMenu) return _ctxMenu;

  const m = document.createElement('div');
  m.id = 'event-context-menu';
  m.setAttribute('role', 'menu');
  m.innerHTML =
    '<button type="button" class="ctx-item" role="menuitem" data-action="duplicate">' +
      '<i data-lucide="copy" class="icon-sm"></i><span>کپی</span></button>' +
    '<button type="button" class="ctx-item" role="menuitem" data-action="edit">' +
      '<i data-lucide="pencil" class="icon-sm"></i><span>ویرایش</span></button>' +
    '<button type="button" class="ctx-item ctx-danger" role="menuitem" data-action="delete">' +
      '<i data-lucide="trash-2" class="icon-sm"></i><span>حذف</span></button>';
  document.body.appendChild(m);

  m.addEventListener('click', e => {
    const item = e.target.closest('.ctx-item');
    if (!item) return;
    e.stopPropagation();
    runContextAction(item.dataset.action);
  });

  // کلیدهای جهت‌دار + Escape (اجباری) + Enter
  m.addEventListener('keydown', e => {
    const items = Array.from(m.querySelectorAll('.ctx-item'));
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1) % items.length].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeContextMenu();
    } else if (e.key === 'Home') {
      e.preventDefault(); items[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault(); items[items.length - 1].focus();
    }
  });

  if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
  _ctxMenu = m;
  return m;
}

function closeContextMenu() {
  if (_ctxMenu) _ctxMenu.classList.remove('visible');
  _ctxTargetId = null;
}

function openContextMenu(e, td) {
  const ev = state.events.find(x => x.id === td._eventId);
  if (!ev) return;
  _ctxTargetId = ev.id;

  const m = ensureContextMenu();
  m.style.left = '0px';
  m.style.top  = '0px';
  m.classList.add('visible');

  // جایگذاری نزدک مکان نشانگر + جلوگیری از خروج از viewport
  const w = m.offsetWidth, h = m.offsetHeight;
  let left = e.clientX + 6;
  let top  = e.clientY + 6;
  if (left + w > window.innerWidth  - 8) left = e.clientX - w - 6;
  if (top  + h > window.innerHeight - 8) top  = e.clientY - h - 6;
  left = Math.max(8, Math.min(left, window.innerWidth  - w - 8));
  top  = Math.max(8, Math.min(top,  window.innerHeight - h - 8));
  m.style.left = left + 'px';
  m.style.top  = top + 'px';

  const first = m.querySelector('.ctx-item');
  if (first) first.focus();
}

function runContextAction(action) {
  const id = _ctxTargetId;
  closeContextMenu();
  if (!id) return;
  const ev = state.events.find(x => x.id === id);
  if (!ev) return;

  if (action === 'duplicate') {
    const slot = findDuplicateSlot(ev);
    if (!slot) { alert('جای خالی کافی برای کپی وجود ندارد'); return; }
    state.events.push({
      ...ev,
      id: 'ev_' + Date.now() + '_c' + Math.random().toString(36).slice(2, 7),
      dayIndex:  slot.dayIndex,
      timeIndex: slot.timeIndex,
      spanDays:  slot.spanDays,
      spanSlots: slot.spanSlots,
      createdAt: new Date().toISOString()
    });
    saveState();
    renderBody();
  } else if (action === 'edit') {
    openModal(ev.dayIndex, ev.timeIndex, ev.id);
  } else if (action === 'delete') {
    if (!confirm('این برنامه حذف شود؟')) return;
    state.events = state.events.filter(x => x.id !== id);
    saveState();
    renderBody();
  }
}

function _menuSuppressActive() {
  return document.body.classList.contains('is-dragging') ||
         _suppressClick ||
         (typeof _isResizing !== 'undefined' && _isResizing);
}

// ── listeners سراسری (فقط یک‌بار در لود اسکریپت) ──

document.addEventListener('contextmenu', e => {
  const inMenu = _ctxMenu && _ctxMenu.contains(e.target);
  if (inMenu) { e.preventDefault(); return; }

  const chip = e.target.closest ? e.target.closest('.event-chip') : null;
  if (!chip) { closeContextMenu(); return; }   // راست‌کلیک عادی بیرون از چیپ دست‌نخورده می‌ماند

  e.preventDefault();                          // منوی مرورگر فقط روی چیپ سرکوب می‌شود
  if (_menuSuppressActive()) return;           // هنگام درگ/resize منو باز نشود
  const td = chip.closest('.event-cell');
  if (!td || !td._eventId) return;
  openContextMenu(e, td);
});

document.addEventListener('pointerdown', e => {
  if (_ctxMenu && !_ctxMenu.contains(e.target)) closeContextMenu();
}, true);

document.addEventListener('click', e => {
  if (_ctxMenu && !_ctxMenu.contains(e.target)) closeContextMenu();
}, true);

// بسته شدن با اسکرول (capture تا اسکرول هر ظرف اسکرول‌شونده‌ای هم گرفته شود)
window.addEventListener('scroll', closeContextMenu, true);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeContextMenu();
}, true);
