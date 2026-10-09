/* ========================================================
   topicTree.js — لود درخت مباحث + انتخاب مبحث در مودال
   ======================================================== */

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

function _treeIcon(name, cls) {
  const i = document.createElement('i');
  i.setAttribute('data-lucide', name);
  if (cls) i.className = cls;
  i.setAttribute('aria-hidden', 'true');
  return i;
}

function addSelectedTopic(node, pathShort, fullPath) {
  if (selectedTopics.find(t => String(t.id) === String(node._id))) return;
  selectedTopics.push({ id: String(node._id), label: node.label, pathShort, path: fullPath });
  renderSelectedTopics();
  const parentId = nav.path.length > 0 ? nav.path[nav.path.length - 1] : currentCurriculumRootId;
  renderTreeLevel(parentId);
}

function removeSelectedTopic(id) {
  selectedTopics = selectedTopics.filter(t => String(t.id) !== String(id));
  renderSelectedTopics();
  const parentId = nav.path.length > 0 ? nav.path[nav.path.length - 1] : currentCurriculumRootId;
  renderTreeLevel(parentId);
}

function renderSelectedTopics() {
  const container = document.getElementById('selected-topics-list');
  if (!container) return;
  container.innerHTML = '';
  if (selectedTopics.length === 0) { container.style.display = 'none'; updateBreadcrumb(); return; }
  container.style.display = 'flex';
  selectedTopics.forEach(t => {
    const tag = document.createElement('div');
    tag.className = 'topic-tag';
    tag.setAttribute('role', 'listitem');

    const text = document.createElement('span');
    text.className = 'topic-tag-text';
    text.textContent = t.pathShort || t.label;
    tag.appendChild(text);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'topic-tag-remove';
    btn.setAttribute('aria-label', 'حذف مبحث');
    btn.title = 'حذف';
    btn.appendChild(_treeIcon('x', 'icon-sm'));
    btn.addEventListener('click', () => removeSelectedTopic(String(t.id)));
    tag.appendChild(btn);

    container.appendChild(tag);
  });
  document.getElementById('sel-topic-id').value    = selectedTopics[0].id;
  document.getElementById('sel-topic-path').value  = selectedTopics[0].path;
  document.getElementById('sel-topic-label').value = selectedTopics[0].label;
  document.getElementById('sel-topic-short').value = selectedTopics[0].pathShort;
  updateBreadcrumb();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderGradeTabs() {
  const tc = document.getElementById('grade-tabs');
  if (!tc) return;
  tc.innerHTML = '';
  if (availableGrades.length <= 1) { tc.style.display = 'none'; return; }
  tc.style.display = 'flex';
  availableGrades.forEach(grade => {
    const isActive = grade === selectedTreeGrade;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'grade-tab' + (isActive ? ' active' : '');
    tab.textContent = GRADE_LABELS[grade];
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.addEventListener('click', () => {
      selectedTreeGrade = grade;
      currentCurriculumRootId = isMiddleSchool(grade)
        ? MIDDLE_SCHOOL_MAP[grade]
        : (CURRICULUM_MAP[state.meta.major]?.[grade] || null);
      nav.path = [];
      renderGradeTabs();
      initTree();
    });
    tc.appendChild(tab);
  });
}

function initTree() {
  nav.path = [];
  const bc = document.getElementById('tree-breadcrumb');
  const list = document.getElementById('tree-list');
  if (!topicTreeLoaded) {
    bc.textContent = 'در حال بارگذاری...';
    list.innerHTML = '<div class="loading-indicator">لطفاً صبر کنید...</div>';
    return;
  }
  if (!currentCurriculumRootId) {
    const g = state.meta.grade;
    bc.textContent = isMiddleSchool(g) ? 'ابتدا پایه را انتخاب کنید' : 'ابتدا رشته و پایه را انتخاب کنید';
    list.innerHTML = '<div class="tree-empty">پایه/رشته انتخاب نشده</div>';
    return;
  }
  renderTreeLevel(currentCurriculumRootId);
  updateBreadcrumb();
}

function _focusTreeRow(id) {
  if (id === undefined || id === null) return;
  const row = document.querySelector(`#tree-list .tree-item-row[data-id="${id}"]`);
  if (row) row.focus();
}

function _toggleTreeSelection(child, nodeId, isSelected) {
  if (isSelected) removeSelectedTopic(String(child._id));
  else selectTopic(child, nodeId);
  renderTreeLevel(nodeId);
  _focusTreeRow(String(child._id));
}

function _enterTreeChild(nodeId, childId) {
  nav.path.push(nodeId);
  renderTreeLevel(childId);
  updateBreadcrumb();
  const first = document.querySelector('#tree-list .tree-item-row');
  if (first) first.focus();
}

function _goBackInTree() {
  const popped = nav.path.pop();
  const goTo = nav.path.length > 0 ? nav.path[nav.path.length - 1] : currentCurriculumRootId;
  renderTreeLevel(goTo);
  updateBreadcrumb();
  _focusTreeRow(popped);
}

function renderTreeLevel(nodeId) {
  const list = document.getElementById('tree-list');
  list.innerHTML = '';
  const node = TOPIC_TREE[String(nodeId)];
  if (!node) return;

  if (nav.path.length > 0) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'tree-item back-item';
    back.appendChild(_treeIcon('chevron-right', 'icon-sm'));
    const backLabel = document.createElement('span');
    backLabel.textContent = 'بازگشت';
    back.appendChild(backLabel);
    back.addEventListener('click', _goBackInTree);
    list.appendChild(back);
  }

  const children = node.children || [];
  if (!children.length) {
    const empty = document.createElement('div');
    empty.className = 'tree-empty';
    empty.textContent = 'زیرمجموعه‌ای وجود ندارد';
    list.appendChild(empty);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  children.forEach(childId => {
    const child = TOPIC_TREE[String(childId)];
    if (!child) return;
    const hasKids = !!(child.children && child.children.length);
    const isSelected = selectedTopics.some(t => String(t.id) === String(child._id));

    const row = document.createElement('div');
    row.className = 'tree-item-row' + (isSelected ? ' row-selected' : '');
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    row.setAttribute('tabindex', '0');
    row.dataset.id = String(child._id);

    const mark = document.createElement('span');
    mark.className = 'tree-select-btn' + (isSelected ? ' active' : '');
    mark.setAttribute('aria-hidden', 'true');
    mark.appendChild(_treeIcon(isSelected ? 'check' : 'circle', 'icon-sm'));

    const typeIcon = _treeIcon(hasKids ? 'folder' : 'file-text', 'icon-sm tree-type-icon');

    const labelEl = document.createElement('span');
    labelEl.className = 'tree-item-label';
    labelEl.textContent = child.label;

    row.appendChild(mark);
    row.appendChild(typeIcon);
    row.appendChild(labelEl);

    row.addEventListener('click', () => _toggleTreeSelection(child, nodeId, isSelected));
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        _toggleTreeSelection(child, nodeId, isSelected);
      } else if (e.key === 'ArrowLeft' && hasKids) {
        e.preventDefault();
        _enterTreeChild(nodeId, child._id);
      } else if (e.key === 'ArrowRight' && nav.path.length > 0) {
        e.preventDefault();
        _goBackInTree();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const options = Array.from(list.querySelectorAll('.tree-item-row'));
        const idx = options.indexOf(row);
        const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
        if (options[next]) options[next].focus();
      }
    });

    if (hasKids) {
      const enterBtn = document.createElement('span');
      enterBtn.className = 'tree-enter-btn';
      enterBtn.setAttribute('aria-hidden', 'true');
      enterBtn.title = 'ورود به زیرمجموعه (کلید چپ)';
      enterBtn.appendChild(_treeIcon('chevron-left', 'icon-sm'));
      enterBtn.addEventListener('click', e => {
        e.stopPropagation();
        _enterTreeChild(nodeId, child._id);
      });
      row.appendChild(enterBtn);
    }
    list.appendChild(row);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function selectTopic(node, currentNodeId) {
  const allNodeIds = [...nav.path, currentNodeId]
    .filter(id => id !== undefined && String(id) !== String(currentCurriculumRootId));
  const allNodes = allNodeIds.map(id => TOPIC_TREE[String(id)]).filter(Boolean);

  const gradeLabel = GRADE_LABELS[selectedTreeGrade] || '';

  const pathParts = [...allNodes.map(n => shortenLabel(n.label)), shortenLabel(node.label)];
  if (gradeLabel && pathParts.length > 1) pathParts.splice(1, 0, gradeLabel);
  else if (gradeLabel && pathParts.length === 1) pathParts.push(gradeLabel);
  const shortPathStr = pathParts.join(' | ');

  const fullLabels = [...allNodes.map(n => n.label), node.label];
  let pathStr = fullLabels.join(' > ');
  if (selectedTreeGrade && selectedTreeGrade !== state.meta.grade) {
    pathStr = `[${gradeLabel}] ` + pathStr;
  }

  addSelectedTopic(node, shortPathStr, pathStr);
}

function updateBreadcrumb() {
  const bc = document.getElementById('tree-breadcrumb');
  if (!bc) return;
  bc.innerHTML = '';
  if (selectedTopics.length > 0) {
    bc.appendChild(_treeIcon('check', 'icon-sm tree-bc-icon'));
    const span = document.createElement('span');
    span.textContent = selectedTopics.length + ' مبحث انتخاب شده';
    bc.appendChild(span);
  } else if (nav.path.length > 0) {
    const labels = nav.path.map(id => TOPIC_TREE[String(id)]?.label).filter(Boolean);
    labels.forEach((label, idx) => {
      if (idx > 0) bc.appendChild(_treeIcon('chevron-left', 'icon-sm tree-bc-sep'));
      const seg = document.createElement('span');
      seg.className = 'tree-bc-seg';
      seg.textContent = label;
      bc.appendChild(seg);
    });
  } else {
    bc.textContent = 'مبحث را انتخاب کنید...';
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}
