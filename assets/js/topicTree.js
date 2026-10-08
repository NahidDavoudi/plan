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

function addSelectedTopic(node, pathShort, fullPath) {
  if (selectedTopics.find(t => t.id === String(node._id))) return;
  selectedTopics.push({ id: String(node._id), label: node.label, pathShort, path: fullPath });
  renderSelectedTopics();
  const parentId = nav.path.length > 0 ? nav.path[nav.path.length - 1] : currentCurriculumRootId;
  renderTreeLevel(parentId);
}

function removeSelectedTopic(id) {
  selectedTopics = selectedTopics.filter(t => t.id !== id);
  renderSelectedTopics();
  const parentId = nav.path.length > 0 ? nav.path[nav.path.length - 1] : currentCurriculumRootId;
  renderTreeLevel(parentId);
}

function renderSelectedTopics() {
  const container = document.getElementById('selected-topics-list');
  if (!container) return;
  if (selectedTopics.length === 0) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  container.innerHTML = '';
  selectedTopics.forEach(t => {
    const tag = document.createElement('div');
    tag.className = 'topic-tag';
    tag.innerHTML = `<span>${t.pathShort || t.label}</span><button onclick="removeSelectedTopic('${t.id}')">×</button>`;
    container.appendChild(tag);
  });
  document.getElementById('sel-topic-id').value    = selectedTopics[0].id;
  document.getElementById('sel-topic-path').value  = selectedTopics[0].path;
  document.getElementById('sel-topic-label').value = selectedTopics[0].label;
  document.getElementById('sel-topic-short').value = selectedTopics[0].pathShort;
  updateBreadcrumb();
}

function renderGradeTabs() {
  const tc = document.getElementById('grade-tabs');
  tc.innerHTML = '';
  if (availableGrades.length <= 1) { tc.style.display = 'none'; return; }
  tc.style.display = 'flex';
  availableGrades.forEach(grade => {
    const tab = document.createElement('button');
    tab.className = 'grade-tab' + (grade === selectedTreeGrade ? ' active' : '');
    tab.textContent = GRADE_LABELS[grade];
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
  if (!topicTreeLoaded) {
    document.getElementById('tree-breadcrumb').textContent = 'در حال بارگذاری...';
    document.getElementById('tree-list').innerHTML = '<div class="loading-indicator">لطفاً صبر کنید...</div>';
    return;
  }
  if (!currentCurriculumRootId) {
    const g = state.meta.grade;
    document.getElementById('tree-breadcrumb').textContent =
      isMiddleSchool(g) ? 'ابتدا پایه را انتخاب کنید' : 'ابتدا رشته و پایه را انتخاب کنید';
    document.getElementById('tree-list').innerHTML =
      '<div style="padding:10px;color:#aaa;font-size:12px;text-align:center;">پایه/رشته انتخاب نشده</div>';
    return;
  }
  renderTreeLevel(currentCurriculumRootId);
  updateBreadcrumb();
}

function renderTreeLevel(nodeId) {
  const list = document.getElementById('tree-list');
  list.innerHTML = '';
  const node = TOPIC_TREE[String(nodeId)];
  if (!node) return;

  if (nav.path.length > 0) {
    const back = document.createElement('div');
    back.className = 'tree-item back-item';
    back.textContent = '↑ بازگشت';
    back.addEventListener('click', () => {
      nav.path.pop();
      const goTo = nav.path.length > 0 ? nav.path[nav.path.length - 1] : currentCurriculumRootId;
      renderTreeLevel(goTo);
      updateBreadcrumb();
    });
    list.appendChild(back);
  }

  const children = node.children || [];
  if (!children.length) {
    list.innerHTML += '<div style="padding:10px;color:#aaa;font-size:11px;text-align:center;">زیرمجموعه‌ای وجود ندارد</div>';
    return;
  }

  children.forEach(childId => {
    const child = TOPIC_TREE[String(childId)];
    if (!child) return;
    const hasKids = !!(child.children?.length);
    const isSelected = selectedTopics.some(t => t.id === String(child._id));

    const row = document.createElement('div');
    row.className = 'tree-item-row' + (isSelected ? ' row-selected' : '');

    const selectBtn = document.createElement('button');
    selectBtn.className = 'tree-select-btn' + (isSelected ? ' active' : '');
    selectBtn.textContent = isSelected ? '✓' : '○';
    selectBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (isSelected) removeSelectedTopic(String(child._id));
      else selectTopic(child, nodeId);
      renderTreeLevel(nodeId);
    });

    const labelEl = document.createElement('span');
    labelEl.className = 'tree-item-label';
    labelEl.textContent = child.label;
    labelEl.addEventListener('click', () => {
      if (isSelected) removeSelectedTopic(String(child._id));
      else selectTopic(child, nodeId);
      renderTreeLevel(nodeId);
    });

    row.appendChild(selectBtn);
    row.appendChild(labelEl);

    if (hasKids) {
      const enterBtn = document.createElement('button');
      enterBtn.className = 'tree-enter-btn';
      enterBtn.textContent = '←';
      enterBtn.addEventListener('click', e => {
        e.stopPropagation();
        nav.path.push(nodeId);
        renderTreeLevel(child._id);
        updateBreadcrumb();
      });
      row.appendChild(enterBtn);
    }
    list.appendChild(row);
  });
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
  if (selectedTopics.length > 0) {
    bc.innerHTML = `<i data-lucide="check" class="icon-sm" style="color:#166534"></i> ${selectedTopics.length} مبحث انتخاب شده`;
    lucide.createIcons();
  } else if (nav.path.length > 0) {
    const labels = nav.path.map(id => TOPIC_TREE[String(id)]?.label).filter(Boolean);
    bc.textContent = labels.join(' > ');
  } else {
    bc.textContent = 'مبحث را انتخاب کنید...';
  }
}