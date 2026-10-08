/* ========================================================
   drag.js — Drag & Drop با SortableJS (جابجایی + کپی با Ctrl/Cmd)
   ======================================================== */

let _dragCopyMode = false;
let _copyKeyHeld  = false;

// پشتیبان: اگر evt.originalEvent در onStart در دسترس نبود
document.addEventListener('keydown', e => {
  if (e.key === 'Control' || e.key === 'Meta') _copyKeyHeld = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'Control' || e.key === 'Meta') _copyKeyHeld = false;
});
window.addEventListener('blur', () => { _copyKeyHeld = false; });

function initDragAndDrop() {
  if (typeof Sortable === 'undefined') return;

  document.querySelectorAll('.event-cell-inner').forEach(inner => {
    if (inner._sortable) return;

    inner._sortable = Sortable.create(inner, {
      group: { name: 'planner', pull: true, put: true },
      animation: 150,
      distance: 5,
      draggable: '.event-chip',
      filter: '.resize-handle',        // دسته‌های resize هرگز درگ Sortable را شروع نمی‌کنند
      preventOnFilter: false,
      ghostClass:  'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass:   'sortable-drag',

      onStart: evt => {
        _suppressClick = true;
        const oe = evt.originalEvent;
        _dragCopyMode = !!((oe && (oe.ctrlKey || oe.metaKey)) || _copyKeyHeld);
        document.body.classList.add('is-dragging');
        if (_dragCopyMode) document.body.classList.add('is-copying');
      },

      onEnd: evt => {
        document.body.classList.remove('is-dragging', 'is-copying');
        setTimeout(() => { _suppressClick = false; }, 80);
        handleDrop(evt);
      }
    });
  });
}

function handleDrop(evt) {
  const fromTd = evt.from.closest('.event-cell');
  const toTd   = evt.to.closest('.event-cell');
  if (!fromTd || !toTd) { renderBody(); return; }

  const fromDay  = +fromTd.dataset.day;
  const fromTime = +fromTd.dataset.time;
  const toDay    = +toTd.dataset.day;
  const toTime   = +toTd.dataset.time;

  if (fromDay === toDay && fromTime === toTime) { renderBody(); return; }

  const sourceEvent = state.events.find(
    e => e.dayIndex === fromDay && e.timeIndex === fromTime
  );
  if (!sourceEvent) { renderBody(); return; }

  const targetEvent = state.events.find(
    e => e.dayIndex === toDay && e.timeIndex === toTime
  );

  normalizeEventSpans();
  const sSd = sourceEvent.spanDays, sSt = sourceEvent.spanSlots;

  if (_dragCopyMode) {
    // کپی: ایونت مقصد (در صورت وجود) جایگزین می‌شود؛ مبدأ سر جایش می‌ماند.
    // اعتبارسنجی: ناحیه مقصد باید (به‌جز مقصد قبلی و مبدأ) خالی باشد.
    const ignore = [sourceEvent.id];
    if (targetEvent) ignore.push(targetEvent.id);
    if (!regionIsFree(toDay, toTime, sSd, sSt, ignore)) { renderBody(); return; }

    if (targetEvent) state.events = state.events.filter(e => e !== targetEvent);
    state.events.push({
      ...sourceEvent,
      id: 'ev_' + Date.now() + '_c' + Math.random().toString(36).slice(2, 7),
      dayIndex: toDay,
      timeIndex: toTime,
      spanDays: sSd,
      spanSlots: sSt,
      createdAt: new Date().toISOString()
    });
  } else {
    const ignore = [sourceEvent.id];
    if (targetEvent) ignore.push(targetEvent.id);

    // هر دو باید در جایگاه جدیدشان بدون برخورد باشند (جابجایی دوطرفه)
    if (!regionIsFree(toDay, toTime, sSd, sSt, ignore)) { renderBody(); return; }
    if (targetEvent) {
      if (!regionIsFree(fromDay, fromTime, targetEvent.spanDays, targetEvent.spanSlots, ignore)) {
        renderBody(); return;
      }
      targetEvent.dayIndex  = fromDay;
      targetEvent.timeIndex = fromTime;
    }
    sourceEvent.dayIndex  = toDay;
    sourceEvent.timeIndex = toTime;
  }

  saveState();
  renderBody();
}
