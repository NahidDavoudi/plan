/* ========================================================
   modal.js — مودال افزودن/ویرایش/حذف ایونت + انتخاب رنگ
   ======================================================== */

// ── انتخاب نوع فعالیت (picker بصری روی select مخفی) ──
const ACTIVITY_CATEGORY_ICONS = {
  'همه': 'layout-grid',
  'تکالیف': 'book-open',
  'تمرین و تست': 'target',
  'آزمون': 'clipboard-check',
  'مطالعه': 'brain',
  'سایر': 'coffee'
};
let activeActivityCat = 'همه';

function _actIcon(name, cls) {
  const i = document.createElement('i');
  i.setAttribute('data-lucide', name);
  if (cls) i.className = cls;
  i.setAttribute('aria-hidden', 'true');
  return i;
}

function getActivityGroups() {
  const sel = document.getElementById('event-title-preset');
  if (!sel) return [];
  return Array.from(sel.querySelectorAll('optgroup')).map(g => ({
    label: g.label,
    items: Array.from(g.querySelectorAll('option')).map(o => ({
      value: o.value,
      label: o.textContent,
      custom: o.value === '__custom__'
    }))
  }));
}

function renderActivityPicker() {
  const catsEl = document.getElementById('activity-cats');
  const gridEl = document.getElementById('activity-grid');
  const sel = document.getElementById('event-title-preset');
  if (!catsEl || !gridEl || !sel) return;

  const groups = getActivityGroups();
  const current = sel.value;

  catsEl.innerHTML = '';
  const catNames = ['همه', ...groups.map(g => g.label)];
  catNames.forEach(name => {
    const active = name === activeActivityCat;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'activity-cat' + (active ? ' active' : '');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.appendChild(_actIcon(ACTIVITY_CATEGORY_ICONS[name] || 'circle', 'icon-sm'));
    const span = document.createElement('span');
    span.textContent = name;
    btn.appendChild(span);
    btn.addEventListener('click', () => {
      activeActivityCat = name;
      renderActivityPicker();
    });
    catsEl.appendChild(btn);
  });

  gridEl.innerHTML = '';
  const visibleGroups = activeActivityCat === 'همه'
    ? groups
    : groups.filter(g => g.label === activeActivityCat);

  visibleGroups.forEach(group => {
    group.items.forEach(item => {
      const active = item.value === current;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'activity-chip' + (active ? ' active' : '') + (item.custom ? ' activity-chip-custom' : '');
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (item.custom) chip.appendChild(_actIcon('pencil-line', 'icon-sm'));
      const span = document.createElement('span');
      span.textContent = item.label;
      chip.appendChild(span);
      chip.addEventListener('click', () => selectActivityItem(item.value));
      gridEl.appendChild(chip);
    });
  });

  if (!gridEl.children.length) {
    const empty = document.createElement('div');
    empty.className = 'activity-empty';
    empty.textContent = 'موردی برای نمایش نیست';
    gridEl.appendChild(empty);
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function selectActivityItem(value) {
  const sel = document.getElementById('event-title-preset');
  if (!sel) return;
  sel.value = value;
  onPresetChange();
  clearActivityError();
  renderActivityPicker();
}

function clearActivityError() {
  const err = document.getElementById('event-title-error');
  if (err) { err.hidden = true; err.textContent = ''; }
}

function showActivityError(msg) {
  const err = document.getElementById('event-title-error');
  if (!err) return;
  err.textContent = msg;
  err.hidden = false;
}

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'event-title') clearActivityError();
});

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

  // reset فرم
  document.getElementById('event-title').value = '';
  document.getElementById('event-title').style.display = 'none';
  document.getElementById('event-title-preset').value = '';
  document.getElementById('event-notes').value = '';
  clearActivityError();
  activeActivityCat = 'همه';
  document.getElementById('sel-topic-id').value = '';
  document.getElementById('sel-topic-path').value = '';
  document.getElementById('sel-topic-label').value = '';
  document.getElementById('sel-topic-short').value = '';
  selectedTopics = [];
  const stl = document.getElementById('selected-topics-list');
  if (stl) { stl.innerHTML = ''; stl.style.display = 'none'; }
  nav.path = [];
  selectedColor = 'green';
  saveMeta();
  updateCurriculumRoot();

  if (eventId) {
    const ev = state.events.find(e => e.id === eventId);
    if (ev) {
      document.getElementById('event-notes').value = ev.notes || '';
      const presetEl = document.getElementById('event-title-preset');
      const customEl = document.getElementById('event-title');
      const titleVal = ev.title || '';
      const opts = Array.from(presetEl.options).map(o => o.value).filter(v => v && v !== '__custom__');
      if (titleVal && opts.includes(titleVal)) {
        presetEl.value = titleVal; customEl.style.display = 'none';
      } else if (titleVal) {
        presetEl.value = '__custom__'; customEl.value = titleVal; customEl.style.display = '';
      }
      if (ev.topics && ev.topics.length > 0) {
        selectedTopics = ev.topics.map(t => ({ ...t }));
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
  renderActivityPicker();
  renderGradeTabs();
  initTree();
  document.getElementById('modal-overlay').classList.add('active');
  setTimeout(() => {
    const modal = document.querySelector('.modal');
    if (modal) modal.focus();
  }, 100);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  isMultiSave = false;
}

function closeModalOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function renderColorPicker() {
  const row = document.getElementById('color-row');
  row.innerHTML = '';
  COLORS.forEach(c => {
    const active = c.id === selectedColor;
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'color-swatch' + (active ? ' selected' : '');
    sw.style.cssText = `background:${c.bg};border-color:${c.border};`;
    sw.title = c.label;
    sw.setAttribute('role', 'radio');
    sw.setAttribute('aria-checked', active ? 'true' : 'false');
    sw.setAttribute('aria-label', c.label);
    sw.addEventListener('click', () => { selectedColor = c.id; renderColorPicker(); });
    row.appendChild(sw);
  });
}

function onPresetChange() {
  const preset = document.getElementById('event-title-preset').value;
  const ci = document.getElementById('event-title');
  if (preset === '__custom__') { ci.style.display = ''; ci.value = ''; ci.focus(); }
  else ci.style.display = 'none';
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

function saveEvent() {
  if (!currentCell) return;
  clearActivityError();
  const presetEl = document.getElementById('event-title-preset');
  const customEl = document.getElementById('event-title');
  const title = presetEl.value === '__custom__'
    ? customEl.value.trim()
    : (presetEl.value || '').trim();
  const notes = document.getElementById('event-notes').value.trim();
  const subjectName = getSubjectNameFromPath();
  const gradeLabel = selectedTreeGrade ? GRADE_LABELS[selectedTreeGrade] : '';

  const topicsToSave = selectedTopics.length > 0 ? [ ...selectedTopics ] : [];
  const firstTopic = topicsToSave[0] || null;

  if (!title && topicsToSave.length === 0) {
    showActivityError('یک مبحث یا نوع فعالیت انتخاب کنید.');
    const activeChip = document.querySelector('#activity-grid .activity-chip.active');
    const focusTarget = activeChip || document.querySelector('#activity-grid .activity-chip');
    if (focusTarget && focusTarget.focus) focusTarget.focus();
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
      else state.events.push({
        id: 'ev_' + Date.now() + '_' + key,
        dayIndex: di, timeIndex: ti,
        spanDays: 1, spanSlots: 1,
        ...baseEvent, createdAt: new Date().toISOString()
      });
    });
    clearSelectedCells();
    isMultiSave = false;
  } else if (editingEventId) {
    const ev = state.events.find(e => e.id === editingEventId);
    if (ev) Object.assign(ev, baseEvent);
  } else {
    state.events.push({
      id: 'ev_' + Date.now(),
      dayIndex: currentCell.dayIndex,
      timeIndex: currentCell.timeIndex,
      spanDays: 1, spanSlots: 1,
      ...baseEvent, createdAt: new Date().toISOString()
    });
  }

  saveState();
  renderBody();
  closeModal();
}

function deleteEvent() {
  if (!editingEventId) return;
  state.events = state.events.filter(e => e.id !== editingEventId);
  saveState();
  renderBody();
  closeModal();
}