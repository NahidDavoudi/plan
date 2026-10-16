/* ========================================================
   api.js — ارتباط با سرور: پنل بارگذاری + ذخیره برنامه
   ======================================================== */

// ── LOAD PANEL ──

async function openLoadPanel() {
  document.getElementById('load-panel').classList.add('active');
  document.getElementById('lp-search').value = '';
  document.getElementById('lp-list').innerHTML = '<div class="lp-empty">در حال بارگذاری...</div>';
  try {
    const API = await window.FamoAPI;
    const res = await API.get('/students/overview');
    const rows = (res.data && res.data.students) || [];
    allStudentsData = rows.map(s => ({
      id: s.id,
      name: s.name,
      grade: gradeToString(s.grade),
      major: fieldToMajor(s.field),
      plan_count: s.plan_count || 0,
      last_week_date: s.last_week_date || ''
    }));
    allPlansData = allStudentsData;
    renderLoadList(allStudentsData);
  } catch (e) {
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
    newBtn.innerHTML = '<i data-lucide="calendar-plus" class="icon-sm" aria-hidden="true"></i><span>برنامه جدید</span>';
    newBtn.addEventListener('click', async () => {
      await loadStudentTimesOnly(s);
      closeLoadPanel();
    });
    plansDiv.appendChild(newBtn);

    if (s.plan_count > 0) {
      const lastBtn = document.createElement('button');
      lastBtn.className = 'lp-plan-btn';
      const lastIcon = document.createElement('i');
      lastIcon.setAttribute('data-lucide', 'history');
      lastIcon.className = 'icon-sm';
      lastIcon.setAttribute('aria-hidden', 'true');
      const lastText = document.createElement('span');
      lastText.textContent = `آخرین برنامه (${formatPersianDate(s.last_week_date) || '—'})`;
      lastBtn.appendChild(lastIcon);
      lastBtn.appendChild(lastText);
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
  lucide.createIcons();
}

async function loadStudentTimesOnly(student) {
  try {
    const API = await window.FamoAPI;
    const res = await API.get(`/plans?student_id=${encodeURIComponent(student.id)}`);
    const plans = (res.data && res.data.plans) || [];

    // مقدار پیش‌فرض از لیست دانش‌آموزان
    let name = student.name || '';
    let grade = student.grade || '';
    let major = student.major || '';

    // ریست state برای برنامه جدید
    state.meta.date = '';
    state.studentId = student.id;
    state.lastPlanId = null;
    state.events = [];
    state.dayNotes = {};
    state.weeklyNotes = '';

    if (plans.length > 0) {
      const lastPlan = plans[0];
      const planRes = await API.get(`/plans/${encodeURIComponent(lastPlan.id)}`);
      const payload = planRes.data || {};
      const plan = payload.plan || {};
      const serverStudent = payload.student || {};

      // نام: اولویت با دانش‌آموز سرور، بعد plan.student_name
      if (serverStudent.name) name = serverStudent.name;
      else if (plan.student_name) name = plan.student_name;

      // پایه: اگر سرور مقدار معتبر داد
      const sGrade = (serverStudent.grade !== undefined && serverStudent.grade !== null && serverStudent.grade !== '')
        ? serverStudent.grade
        : plan.student_grade;
      if (sGrade !== undefined && sGrade !== null && sGrade !== '') {
        grade = gradeToString(sGrade);
      }

      // رشته: اگر سرور مقدار معتبر داد
      const sField = serverStudent.field || plan.student_field;
      if (sField) {
        major = fieldToMajor(sField);
      }

      // تایم‌ها
      if (plan.times_json) {
        try {
          const times = typeof plan.times_json === 'string'
            ? JSON.parse(plan.times_json)
            : plan.times_json;
          if (times && times.length) state.times = normalizeTimes(times);
        } catch (e) {
          console.error('times_json parse error:', e);
        }
      }

      state.lastPlanId = lastPlan.id;
    }

    // ── ست کردن state ──
    state.meta.name = name;
    state.meta.grade = grade;
    state.meta.major = major;

    // ── پر کردن صریح فیلدهای DOM (fallback مطمئن) ──
    const elName = document.getElementById('meta-name');
    const elMajor = document.getElementById('meta-major');
    const elGrade = document.getElementById('meta-grade');
    const elDate = document.getElementById('meta-date');
    if (elName) elName.value = name;
    if (elMajor) elMajor.value = major;
    if (elGrade) elGrade.value = grade;
    if (elDate) elDate.value = '';

    // همگام‌سازی curriculum root و برچسب‌های چاپ
    if (typeof updateCurriculumRoot === 'function') updateCurriculumRoot();
    if (typeof updatePrintSpans === 'function') updatePrintSpans();

    // یادداشت هفتگی خالی شود
    const notes = document.getElementById('weekly-notes');
    if (notes) notes.value = '';

    // ذخیره در localStorage (saveMeta چون DOM درست پر شده، state را خراب نمی‌کند)
    saveState();

    renderHeader();
    renderBody();
    setStatus(`${name} بارگذاری شد`, '#16a34a');
  } catch (e) {
    console.error(e);
    alert('خطا در بارگذاری اطلاعات دانش‌آموز');
  }
}

async function loadLastPlan(studentId) {
  try {
    const API = await window.FamoAPI;
    const res = await API.get(`/plans?student_id=${encodeURIComponent(studentId)}`);
    const plans = (res.data && res.data.plans) || [];
    if (!plans.length) { alert('برنامه‌ای یافت نشد'); return; }

    const planRes = await API.get(`/plans/${encodeURIComponent(plans[0].id)}`);
    const payload = planRes.data || {};
    const plan = payload.plan || {};
    const events = payload.events || [];
    const serverStudent = payload.student || {};
    const student = allStudentsData.find(s => String(s.id) === String(studentId)) || {};

    state.meta.name = student.name || serverStudent.name || '';
    state.meta.grade = student.grade || gradeToString(serverStudent.grade) || '';
    state.meta.major = student.major || fieldToMajor(serverStudent.field) || '';
    state.meta.date = plan.week_date || '';
    state.weeklyNotes = plan.weekly_notes || '';
    state.studentId = studentId;
    state.lastPlanId = plans[0].id;

    if (plan.times_json) {
      try {
        const t = typeof plan.times_json === 'string' ? JSON.parse(plan.times_json) : plan.times_json;
        if (t && t.length) state.times = normalizeTimes(t);
      } catch (e) { }
    }

    state.events = events.map(ev => ({
      id: 'ev_loaded_' + ev.id,
      dayIndex: ev.day_index,
      timeIndex: ev.time_index,
      spanDays: 1,
      spanSlots: 1,
      title: ev.title || '',
      notes: ev.notes || '',
      color: ev.color || 'green',
      topicId: ev.topic_id || '',
      topicPath: ev.topic_path || '',
      topicLabel: ev.topic_label || '',
      topicPathShort: ev.topic_path_short || '',
      subjectName: ev.subject_name || '',
      selectedGrade: ev.selected_grade || '',
      topics: Array.isArray(ev.topics) && ev.topics.length
        ? ev.topics
        : (ev.topic_path_short
          ? [{ id: ev.topic_id, label: ev.topic_label, pathShort: ev.topic_path_short, path: ev.topic_path }]
          : [])
    }));

    state.dayNotes = {};

    loadMetaFields();
    saveState();
    renderHeader();
    renderBody();
    const notes = document.getElementById('weekly-notes');
    if (notes) notes.value = state.weeklyNotes;
    setStatus(`برنامه ${formatPersianDate(plan.week_date) || ''} بارگذاری شد`, '#16a34a');
  } catch (e) {
    console.error(e);
    alert('خطا در بارگذاری برنامه');
  }
}

// ── SAVE TO SERVER ──

async function savePlanToServer() {
  saveMeta();
  const notes = document.getElementById('weekly-notes');
  if (notes) state.weeklyNotes = notes.value;

  if (!state.meta.name || !state.meta.name.trim()) { alert('لطفاً نام دانش‌آموز را وارد کنید'); document.getElementById('meta-name').focus(); return; }
  if (!state.meta.grade) { alert('لطفاً پایه را انتخاب کنید'); return; }
  if (!state.meta.date) { showDateError(); document.getElementById('meta-date').focus(); return; }
  if (!state.events.length) { alert('هیچ برنامه‌ای برای ذخیره وجود ندارد'); return; }

  const btn = document.getElementById('btn-save-server');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader" class="icon-sm"></i> در حال ذخیره...';
  lucide.createIcons();
  setStatus('', '');

  try {
    const API = await window.FamoAPI;
    const payload = {
      plan_id: state.lastPlanId || undefined,
      student_id: state.studentId || undefined,
      week_date: state.meta.date || '',
      weekly_notes: state.weeklyNotes || '',
      times: state.times,
      events: state.events,
      meta: {
        name: state.meta.name,
        grade: gradeToNumber(state.meta.grade),
        field: majorToField(state.meta.major)
      }
    };
    const res = await API.post('/plans', payload);
    const data = res.data || {};
    setStatus(`${data.saved || 'ذخیره شد'} — شناسه: #${data.plan_id}`, '#16a34a');
    state.lastPlanId = data.plan_id;
    if (data.student_id) state.studentId = data.student_id;
    localStorage.setItem('planner_v2', JSON.stringify(state));
  } catch (e) {
    setStatus(e && e.message ? e.message : 'خطا در اتصال به سرور', '#dc2626');
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
