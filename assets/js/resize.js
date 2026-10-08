/* ========================================================
   resize.js — گسترش/تغییر اندازه ایونت‌ها روی شبکه (pointer events)
   محور افقی = spanSlots (ستون‌های زمان)، محور عمودی = spanDays (ردیف‌های روز).
   هندل‌ها با event delegation روی document شنیده می‌شوند → بعد از renderBody
   نیازی به bind مجدد نیست. Sortable با filter='.resize-handle' کنار گذاشته شده.
   ======================================================== */

let _isResizing = false;
let _resizeCtx  = null;

document.addEventListener('pointerdown', function (e) {
  if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
  if (document.body.classList.contains('is-dragging')) return;
  if (_suppressClick) return;

  const handle = e.target && e.target.closest ? e.target.closest('.resize-handle') : null;
  if (!handle) return;

  const chip = handle.closest('.event-chip');
  const td   = handle && handle.closest('.event-cell');
  if (!chip || !td || !td._eventId) return;

  const ev = state.events.find(x => x.id === td._eventId);
  if (!ev) return;

  const colEls = Array.from(document.querySelectorAll('#header-row th.time-cell'));
  const rowEls = Array.from(document.querySelectorAll('#planner-body tr'));
  if (!colEls.length || colEls.length !== state.times.length || rowEls.length !== DAYS.length) return;

  e.preventDefault();
  e.stopPropagation();
  if (_resizeCtx) _cancelResize();

  _isResizing = true;
  _suppressClick = true;
  document.body.classList.add('is-resizing');

  const ctx = {
    ev,
    axis: handle.dataset.axis || 'x',
    colRects: colEls.map(el => el.getBoundingClientRect()),
    rowRects: rowEls.map(el => el.getBoundingClientRect()),
    st0: ev.spanSlots,
    sd0: ev.spanDays,
    newSt: ev.spanSlots,
    newSd: ev.spanDays,
    valid: true,
    moved: false,
    ghost: null,
    handle,
    cleanup: null
  };
  _resizeCtx = ctx;

  const onMove = ev2 => { ev2.preventDefault(); _resizeMove(ctx, ev2); };
  const onUp   = ev2 => _endResize(ctx, false);
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
  handle.addEventListener('pointercancel', onUp);
  ctx.cleanup = () => {
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
    handle.removeEventListener('pointercancel', onUp);
    try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
  };
  try { handle.setPointerCapture(e.pointerId); } catch (err) {}
}, false);

// نزدیک‌ترین ایندکس ستون/ردیف به مختصات داده‌شده (داخل یا نزدیک‌ترین لبه)
function _nearestRectIndex(rects, v) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (v >= r.left && v <= r.right) return i;
    const d = v < r.left ? r.left - v : v - r.right;
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

function _resizeMove(ctx, e) {
  ctx.moved = true;
  const nT = state.times.length, nD = DAYS.length;

  let st = ctx.st0, sd = ctx.sd0;
  if (ctx.axis === 'x' || ctx.axis === 'xy') {
    st = _nearestRectIndex(ctx.colRects, e.clientX) - ctx.ev.timeIndex + 1;
  }
  if (ctx.axis === 'y' || ctx.axis === 'xy') {
    sd = _nearestRectIndex(ctx.rowRects, e.clientY) - ctx.ev.dayIndex + 1;
  }
  // حداقل ۱×۱، حداکثر = مرز جدول
  st = Math.max(1, Math.min(st, nT - ctx.ev.timeIndex));
  sd = Math.max(1, Math.min(sd, nD - ctx.ev.dayIndex));

  ctx.newSt = st;
  ctx.newSd = sd;
  ctx.valid = regionIsFree(ctx.ev.dayIndex, ctx.ev.timeIndex, sd, st, [ctx.ev.id]);

  // پیش‌نمایش زنده: ghost روی ناحیه هدف
  if (!ctx.ghost) {
    ctx.ghost = document.createElement('div');
    ctx.ghost.className = 'resize-ghost';
    document.body.appendChild(ctx.ghost);
  }
  const cA = ctx.colRects[ctx.ev.timeIndex];
  const cB = ctx.colRects[ctx.ev.timeIndex + st - 1];
  const rA = ctx.rowRects[ctx.ev.dayIndex];
  const rB = ctx.rowRects[ctx.ev.dayIndex + sd - 1];
  const left   = Math.min(cA.left, cB.left);
  const right  = Math.max(cA.right, cB.right);
  const top    = Math.min(rA.top, rB.top);
  const bottom = Math.max(rA.bottom, rB.bottom);
  ctx.ghost.style.left = left + 'px';
  ctx.ghost.style.top = top + 'px';
  ctx.ghost.style.width  = (right - left) + 'px';
  ctx.ghost.style.height = (bottom - top) + 'px';
  ctx.ghost.classList.toggle('invalid', !ctx.valid);
}

function _endResize(ctx, cancelled) {
  if (_resizeCtx !== ctx) return;
  if (ctx.cleanup) ctx.cleanup();
  if (ctx.ghost) { ctx.ghost.remove(); ctx.ghost = null; }
  _resizeCtx = null;
  _isResizing = false;
  document.body.classList.remove('is-resizing');
  setTimeout(() => { _suppressClick = false; }, 80);

  const changed = !cancelled && ctx.moved && ctx.valid &&
                  (ctx.newSt !== ctx.st0 || ctx.newSd !== ctx.sd0);
  if (changed) {
    ctx.ev.spanSlots = ctx.newSt;   // برخورد؟ validated → rollback بدون تغییر
    ctx.ev.spanDays  = ctx.newSd;
    saveState();
  }
  if (ctx.moved) renderBody();
}

function _cancelResize() {
  if (!_resizeCtx) return;
  _endResize(_resizeCtx, true);
}
