/* ========================================================
   api.js — ارتباط با سرور: پنل بارگذاری + ذخیره برنامه
   ======================================================== */

// ── LOAD PANEL ──

async function openLoadPanel() {
  document.getElementById('load-panel').classList.add('active');
  document.getElementById('lp-search').value = '';
  document.getElementById('lp-list').innerHTML = '<div class="lp-empty">در حال بارگذاری...</div>';
  try {
    const [sRes, pRes] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/reports.php?type=all_students`)
    ]);
    const sData = await sRes.json();
    const pData = await pRes.json();
    allStudentsData = sData.students || [];
    allPlansData    = pData.students || [];
    renderLoadList(allStudentsData);
  } catch(e) {
    document.getElementById('lp-list').innerHTML = '<div class="lp-empty">خطا در اتصال به سرور</div>';
  }
}

function closeLoadPanel() {
  document.getElementById('load-panel').classList.remove('active');
}

function filterLoadList() {
  const q = document.getElementById('lp-search').value.toLowerCase().trim();
  const filtered = q
    ? allStudentsData.filter(s => s.name.toLowerCase().includes(q))
    : allStudentsData;
  renderLoadList(filtered);
}

function renderLoadList(students) {
  const list = document.getElementById('lp-list');
  if (!students.length) {
    list.innerHTML = '<div class="lp-empty">دانش‌آموزی یافت نشد</div>';
    return;
  }
  list.innerHTML = '';
  students.forEach(s => {
    const item = document.createElement('div');
    item.className = 'lp-item';

    const info = document.createElement('div');
    info.className = 'lp-item-info';
    const name = document.createElement('div');
    name.className = 'lp-item-name';
    name.textContent = s.name;
    const meta = document.createElement('div');
    meta.className = 'lp-item-meta';
    meta.textContent = [GRADE_LABELS[s.grade], MAJOR_LABELS_FA[s.major]].filter(Boolean).join(' — ');
    info.appendChild(name);
    info.appendChild(meta);

    const plansDiv = document.createElement('div');
    plansDiv.className = 'lp-item-plans';

    const newBtn = document.createElement('button');
    newBtn.className = 'lp-plan-btn';
    newBtn.textContent = '🗓 برنامه جدید';
    newBtn.addEventListener('click', async () => {
      await loadStudentTimesOnly(s);
      closeLoadPanel();
    });
    plansDiv.appendChild(newBtn);

    if (s.plan_count > 0) {
      const lastBtn = document.createElement('button');
      lastBtn.className = 'lp-plan-btn';
      lastBtn.textContent = `📋 آخرین برنامه (${s.last_week_date || '—'})`;
      lastBtn.addEventListener('click', async () => {
        await loadLastPlan(s.id);
        closeLoadPanel();
      });
      plansDiv.appendChild(lastBtn);
    }

    item.appendChild(info);
    item.appendChild(plansDiv);
    list.appendChild(item);
  });
}

async function loadStudentTimesOnly(student) {
  try {
    const res = await fetch(`${API_BASE}/plans.php?student_id=${student.id}`);
    const data = await res.json();
    const plans = data.plans || [];

    state.meta.name  = student.name;
    state.meta.grade = student.grade;
    state.meta.major = student.major || '';
    state.meta.date  = '';
    state.events = [];
    state.dayNotes = {};

    if (plans.length > 0) {
      const lastPlan = plans[0];
      const planRes = await fetch(`${API_BASE}/plans.php?id=${lastPlan.id}`);
      const planData = await planRes.json();
      if (planData.plan && planData.plan.times_json) {
        try {
          const times = JSON.parse(planData.plan.times_json);
          if (times && times.length) state.times = normalizeTimes(times);
        } catch(e) {}
      }
    }

    saveState();
    loadMetaFields();
    renderHeader();
    renderBody();
    setStatus(`✓ ${student.name} بارگذاری شد`, '#16a34a');
  } catch(e) {
    alert('خطا در بارگذاری اطلاعات دانش‌آموز');
  }
}

async function loadLastPlan(studentId) {
  try {
    const res = await fetch(`${API_BASE}/plans.php?student_id=${studentId}`);
    const data = await res.json();
    const plans = data.plans || [];
    if (!plans.length) { alert('برنامه‌ای یافت نشد'); return; }

    const planRes = await fetch(`${API_BASE}/plans.php?id=${plans[0].id}`);
    const planData = await planRes.json();
    if (!planData.success) { alert('خطا در بارگذاری برنامه'); return; }

    const plan = planData.plan;
    const events = planData.events || [];

    const student = allStudentsData.find(s => s.id === studentId) || {};

    state.meta.name  = student.name  || plan.student_name || '';
    state.meta.grade = student.grade || plan.grade || '';
    state.meta.major = student.major || plan.major || '';
    state.meta.date  = plan.week_date || '';
    state.weeklyNotes = plan.weekly_notes || '';

    if (plan.times_json) {
      try {
        const t = JSON.parse(plan.times_json);
        if (t?.length) state.times = normalizeTimes(t);
      } catch(e) {}
    }

    state.events = events.map(ev => ({
      id: 'ev_loaded_' + ev.id,
      dayIndex:       ev.day_index,
      timeIndex:      ev.time_index,
      spanDays:       1,
      spanSlots:      1,
      title:          ev.title || '',
      notes:          ev.notes || '',
      color:          ev.color || 'green',
      topicId:        ev.topic_id || '',
      topicPath:      ev.topic_path || '',
      topicLabel:     ev.topic_label || '',
      topicPathShort: ev.topic_path_short || '',
      subjectName:    ev.subject_name || '',
      selectedGrade:  ev.selected_grade || '',
      topics: ev.topic_path_short
        ? [{ id: ev.topic_id, label: ev.topic_label, pathShort: ev.topic_path_short, path: ev.topic_path }]
        : []
    }));

    state.dayNotes = {};

    saveState();
    loadMetaFields();
    renderHeader();
    renderBody();
    const notes = document.getElementById('weekly-notes');
    if (notes) notes.value = state.weeklyNotes;
    setStatus(`✓ برنامه ${plan.week_date || ''} بارگذاری شد`, '#16a34a');
  } catch(e) {
    console.error(e);
    alert('خطا در بارگذاری برنامه');
  }
}

// ── SAVE TO SERVER ──

async function savePlanToServer() {
  saveMeta();
  const notes = document.getElementById('weekly-notes');
  if (notes) state.weeklyNotes = notes.value;

  if (!state.meta.name?.trim()) { alert('لطفاً نام دانش‌آموز را وارد کنید'); document.getElementById('meta-name').focus(); return; }
  if (!state.meta.grade) { alert('لطفاً پایه را انتخاب کنید'); return; }
  if (!state.events.length) { alert('هیچ برنامه‌ای برای ذخیره وجود ندارد'); return; }

  const btn = document.getElementById('btn-save-server');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader" class="icon-sm"></i> در حال ذخیره...';
  lucide.createIcons();
  setStatus('', '');

  try {
    const res = await fetch(`${API_BASE}/plans.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    const data = await res.json();
    if (data.success) {
      setStatus(`✓ ${data.saved} — شناسه: #${data.plan_id}`, '#16a34a');
      state.lastPlanId = data.plan_id;
      localStorage.setItem('planner_v2', JSON.stringify(state));
    } else {
      setStatus('✗ ' + (data.error || 'خطا'), '#dc2626');
    }
  } catch(e) {
    setStatus('✗ خطا در اتصال به سرور', '#dc2626');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="cloud-upload" class="icon-sm"></i> ذخیره در سرور';
    lucide.createIcons();
  }
}

// ── کمکی ──
function setStatus(text, color) {
  const el = document.getElementById('save-status');
  if (!el) return;
  el.textContent = text;
  el.style.color = color || '';
}