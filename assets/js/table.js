/* ========================================================
   table.js — رندر جدول، سلول‌ها، multi-select، ستون‌های زمان
   ======================================================== */

// ── MULTI-SELECT ──

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

// ── HEADER (ستون‌های زمان با دو اینپوت شروع/پایان) ──

function renderHeader() {
  const row = document.getElementById('header-row');
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
    del.setAttribute('aria-label', 'حذف ستون زمان');
    del.innerHTML = '<i data-lucide="x" class="icon-sm" aria-hidden="true"></i>';
    del.addEventListener('click', e => { e.stopPropagation(); deleteTimeColumn(i); });

    th.appendChild(startInp);
    th.appendChild(endInp);
    th.appendChild(del);
    row.insertBefore(th, last);
  });
  lucide.createIcons();
}

function addTimeColumn() {
  state.times.push({ start: '', end: '' });
  saveState(); renderHeader(); renderBody();
}

function deleteTimeColumn(i) {
  if (state.times.length <= 1) { alert('حداقل یک ستون لازم است'); return; }
  state.events = state.events.filter(e => e.timeIndex !== i);
  state.events.forEach(e => { if (e.timeIndex > i) e.timeIndex--; });
  state.times.splice(i, 1);
  saveState(); renderHeader(); renderBody();
}

function resetTimesToDefault() {
  if (!confirm('تایم‌های جدول به حالت پیش‌فرض (۵ تا ۲۴) برگردد؟')) return;
  state.times = cloneDefaultTimes();
  saveState(); renderHeader(); renderBody();
}

// ── BODY ──
// رویکرد رندر span: از colspan/rowspan واقعی روی <td> استفاده می‌شود.
// چون tbody از نو ساخته می‌شود، هر ردیف فقط سلول‌های «لنگر» و سلول‌های خالیِ
// پوشش‌نده را می‌سازد؛ سلول‌هایی که توسط rowspan/colspan دیگری پوشش داده
// شده‌اند اصلاً ساخته نمی‌شوند → کلیک روی ناحیه پوشش‌شده همان td لنگر را
// می‌زند (و مودال ایونت واقعی باز می‌شود) و آن‌ها target رها شدن درگ نیستند.

function renderBody() {
  const tbody = document.getElementById('planner-body');
  tbody.innerHTML = '';
  normalizeEventSpans();

  const covered = new Set(); // "di_ti" های پوشش‌شده توسط rowspan از ردیف‌های بالاتر
  const nTimes  = state.times.length;

  DAYS.forEach((day, di) => {
    const tr = document.createElement('tr');
    const tdDay = document.createElement('td');
    tdDay.className = 'day-label';
    tdDay.textContent = day;
    tr.appendChild(tdDay);

    for (let ti = 0; ti < nTimes; ti++) {
      if (covered.has(di + '_' + ti)) continue; // توسط rowspan بالاتر مصرف شده

      const ev = state.events.find(e => e.dayIndex === di && e.timeIndex === ti);
      const td = document.createElement('td');
      td.className = 'event-cell';
      td.dataset.day = di;
      td.dataset.time = ti;

      if (ev) {
        const sd = ev.spanDays, st = ev.spanSlots;
        if (sd > 1) td.rowSpan = sd;
        if (st > 1) td.colSpan = st;
        for (let rd = 0; rd < sd; rd++) {
          for (let rt = 0; rt < st; rt++) {
            if (rd === 0 && rt === 0) continue;
            if (di + rd < DAYS.length && ti + rt < nTimes) covered.add((di + rd) + '_' + (ti + rt));
          }
        }
      }

      renderCell(td, ev);

      td.addEventListener('click', e => {
        if (_suppressClick) return;
        if (e.ctrlKey || e.metaKey || isMultiMode) {
          e.stopPropagation();
          toggleCellSelect(di, ti);
          return;
        }
        openModal(di, ti, td._hasEvent ? td._eventId : null);
      });
      tr.appendChild(td);
    }

    const tdAdd = document.createElement('td');
    tdAdd.className = 'no-print';
    tdAdd.style.cssText = 'border:1px solid var(--border);background:#fafaf9;';
    tr.appendChild(tdAdd);
    tbody.appendChild(tr);
  });

  if (typeof initDragAndDrop === 'function') initDragAndDrop();
}

function renderCell(td, ev) {
  td._hasEvent = false;
  td._eventId = null;
  const inner = document.createElement('div');
  inner.className = 'event-cell-inner';

  if (ev) {
    td._hasEvent = true;
    td._eventId = ev.id;
    const col = COLORS.find(c => c.id === ev.color) || COLORS[1];
    const chip = document.createElement('div');
    chip.className = 'event-chip';
    chip.dataset.eventId = ev.id;
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
      tt.className = 'event-title-text';
      tt.textContent = ev.title;
      chip.appendChild(tt);
    }
    if (ev.notes) {
      const nt = document.createElement('div');
      nt.className = 'event-notes-text';
      nt.textContent = ev.notes;
      chip.appendChild(nt);
    }

    // ── دسته‌های resize (pointer events در resize.js) ──
    const hX = document.createElement('div');
    hX.className = 'resize-handle resize-handle-x no-print';
    hX.dataset.axis = 'x';
    hX.title = 'تغییر عرض';
    const hY = document.createElement('div');
    hY.className = 'resize-handle resize-handle-y no-print';
    hY.dataset.axis = 'y';
    hY.title = 'تغییر ارتفاع';
    const hC = document.createElement('div');
    hC.className = 'resize-handle resize-handle-xy no-print';
    hC.dataset.axis = 'xy';
    hC.title = 'تغییر عرض و ارتفاع';
    chip.appendChild(hX);
    chip.appendChild(hY);
    chip.appendChild(hC);

    inner.appendChild(chip);
  } else {
    const hint = document.createElement('span');
    hint.className = 'empty-hint';
    hint.textContent = '+';
    inner.appendChild(hint);
  }
  td.innerHTML = '';
  td.appendChild(inner);
}