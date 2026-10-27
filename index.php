<?php require_once __DIR__ . '/config.php'; ?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php echo famo_config_script(); ?>
<title>پلنر هفتگی مشاور</title>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script src="<?php echo famo_asset('js/libs/lucide.min.js', 'assets/js/libs/lucide.min.js'); ?>"></script>
<!-- Favicon Multi-size -->
<link rel="icon" type="image/png" sizes="16x16" href="<?php echo famo_asset('images/favicon-16.png', $base . '../shared/images/favicon-16.png'); ?>">
<link rel="icon" type="image/png" sizes="32x32" href="<?php echo famo_asset('images/favicon-32.png', $base . '../shared/images/favicon-32.png'); ?>">
<link rel="icon" type="image/png" sizes="96x96" href="<?php echo famo_asset('images/favicon-96.png', $base . '../shared/images/favicon-96.png'); ?>">
<link href="assets/style.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/jalalidatepicker@0.6.0/dist/jalalidatepicker.min.css" rel="stylesheet">
</head>
<body>
  <div class="print-watermark">
    <!-- لوگوی خود را اینجا قرار دهید. جایگزین آدرس src زیر کنید -->
    <img src="assets/logo.PNG/500x500" alt="Watermark" class="watermark-image">
  </div>
<div class="toolbar no-print">
  <span class="toolbar-brand"><i data-lucide="clipboard-list" class="icon"></i> پلنر هفتگی مشاور</span>
  <span id="save-status" style="font-size:12px;color:var(--text-muted);"></span>
  <button class="btn btn-ghost" onclick="resetTimesToDefault()" title="بازگشت تایم‌ها به حالت پیش‌فرض"><i data-lucide="clock" class="icon-sm"></i> ریست تایم</button>
  <button class="btn btn-ghost" onclick="openLoadPanel()"><i data-lucide="users" class="icon-sm"></i> بارگذاری برنامه</button>
  <button class="btn btn-ghost" onclick="clearAll()"><i data-lucide="trash-2" class="icon-sm"></i> پاک کردن</button>
  <button class="btn btn-success" id="btn-save-server" onclick="savePlanToServer()"><i data-lucide="cloud-upload" class="icon-sm"></i> ذخیره در سرور</button>
  <button class="btn btn-primary" onclick="smartPrint()"><i data-lucide="printer" class="icon-sm"></i> چاپ A4</button>
</div>

<div id="multi-action-bar">
  <span id="multi-count">۰ خانه انتخاب شده</span>
  <button onclick="openModalForSelected()"><i data-lucide="plus" class="icon-sm" aria-hidden="true"></i> افزودن به همه</button>
  <button onclick="clearSelectedCells()" class="bar-cancel"><i data-lucide="x" class="icon-sm" aria-hidden="true"></i> لغو</button>
</div>

<div class="container">
  <div class="meta-card">

    <!-- ستون ۱: لوگو -->
    <div class="meta-logo">
      <img src="logo.png" alt="Famo Logo">
      <div class="meta-logo-text">
        <span class="meta-logo-title">Famo Konkur Academy</span>
        <span class="meta-logo-sub">برنامه‌ریزی هفتگی</span>
      </div>
    </div>

    <!-- ستون ۲: نام+تاریخ بالا / رشته+پایه پایین -->
    <div class="meta-info">
      <div class="meta-info-top">
        <div class="meta-field meta-field-name">
          <span class="meta-label">نام دانش‌آموز</span>
          <input class="meta-input" id="meta-name" type="text" placeholder="نام کامل..." oninput="saveState()">
        </div>
        <div class="meta-field meta-field-date">
          <span class="meta-label">تاریخ</span>
          <input class="meta-input" id="meta-date" data-jdp placeholder="۱۴۰۴/۰۷/۲۴">
          <p class="form-error" id="meta-date-error" role="alert" hidden>لطفاً تاریخ معتبری انتخاب کنید</p>
        </div>
      </div>
      <div class="meta-info-bottom">
        <div class="meta-field meta-field-grade" id="meta-major-wrap">
          <span class="meta-label">رشته</span>
          <select class="meta-select" id="meta-major" onchange="onMajorOrGradeChange()">
            <option value="">انتخاب کنید</option>
            <option value="math">ریاضی</option>
            <option value="tajrobi">تجربی</option>
            <option value="humanities">انسانی</option>
          </select>
          <span class="meta-grade-print" id="meta-major-print"></span>
        </div>
        <div class="meta-field meta-field-grade">
          <span class="meta-label">پایه</span>
          <select class="meta-select" id="meta-grade" onchange="onMajorOrGradeChange()">
            <option value="">انتخاب کنید</option>
            <optgroup label="متوسطه اول">
              <option value="7th">هفتم</option>
              <option value="8th">هشتم</option>
              <option value="9th">نهم</option>
            </optgroup>
            <optgroup label="متوسطه دوم">
              <option value="10th">دهم</option>
              <option value="11th">یازدهم</option>
              <option value="12th">دوازدهم</option>
            </optgroup>
          </select>
          <span class="meta-grade-print" id="meta-grade-print"></span>
        </div>
      </div>
    </div>

    <!-- ستون ۳: یادداشت هفتگی -->
    <div class="meta-notes-col">
      <span class="meta-label"><i data-lucide="sticky-note" class="icon-sm" aria-hidden="true"></i> یادداشت هفتگی</span>
      <textarea class="meta-notes-input" id="weekly-notes" placeholder="یادداشت‌های کلی هفته را اینجا بنویسید..." oninput="saveState()"></textarea>
    </div>

  </div>

  <div class="grid-card">
    <div class="grid-scroll">
      <table id="planner-table">
        <thead>
          <tr id="header-row">
            <th class="day-label" style="background:#f0ede8;border:1px solid var(--border);">روز / زمان</th>
            <th class="add-time-th no-print">
              <button class="add-time-btn" onclick="addTimeColumn()" title="افزودن ستون زمان"><i data-lucide="plus" class="icon"></i></button>
            </th>
          </tr>
        </thead>
        <tbody id="planner-body"></tbody>
      </table>
    </div>
  </div>

</div>


<!-- LOAD PANEL -->
<div id="load-panel" onclick="if(event.target===this)closeLoadPanel()">
  <div id="load-panel-inner">
    <div id="load-panel-header">
      <span class="load-panel-title"><i data-lucide="folder-open" class="icon-sm" aria-hidden="true"></i> بارگذاری برنامه دانش‌آموز</span>
      <button type="button" onclick="closeLoadPanel()" class="panel-close" aria-label="بستن" title="بستن"><i data-lucide="x" class="icon" aria-hidden="true"></i></button>
    </div>
    <div id="load-panel-body">
      <input class="lp-search" id="lp-search" type="text" placeholder="جستجوی نام دانش‌آموز..." oninput="filterLoadList()">
      <div class="lp-list" id="lp-list"><div class="lp-empty">در حال بارگذاری...</div></div>
    </div>
  </div>
</div>

<!-- MODAL -->
<div class="modal-overlay" id="modal-overlay" onclick="closeModalOverlay(event)">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1" onclick="event.stopPropagation()">
    <div class="modal-header">
      <span id="modal-title">افزودن برنامه</span>
      <button type="button" class="modal-close" onclick="closeModal()" aria-label="بستن" title="بستن"><i data-lucide="x" class="icon" aria-hidden="true"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group" role="group" aria-labelledby="topics-label">
        <span class="form-label" id="topics-label"><i data-lucide="book-open" class="icon-sm" aria-hidden="true"></i> مباحث <span class="topics-hint">(می‌توانید چند مبحث انتخاب کنید)</span></span>
        <div id="selected-topics-list" class="selected-topics-list" role="list" aria-label="مباحث انتخاب‌شده" style="display:none;"></div>
        <div class="tree-nav" aria-labelledby="topics-label">
          <div class="grade-tabs" id="grade-tabs" role="tablist" aria-label="انتخاب پایه"></div>
          <div class="tree-breadcrumb" id="tree-breadcrumb">ابتدا رشته و پایه را انتخاب کنید</div>
          <div class="tree-list" id="tree-list" role="listbox" aria-multiselectable="true" aria-label="درخت مباحث"></div>
        </div>
        <input type="hidden" id="sel-topic-id">
        <input type="hidden" id="sel-topic-path">
        <input type="hidden" id="sel-topic-label">
        <input type="hidden" id="sel-topic-short">
      </div>

      <div class="form-group" role="group" aria-labelledby="activity-label">
        <span class="form-label" id="activity-label"><i data-lucide="pencil" class="icon-sm" aria-hidden="true"></i> نوع فعالیت</span>
        <select id="event-title-preset" class="preset-hidden" onchange="onPresetChange()" tabindex="-1" aria-hidden="true">
          <option value="">— انتخاب از لیست —</option>
          <optgroup label="تکالیف">
            <option>درس روز</option>
            <option>درس فردا</option>
            <option>مرور</option>
          </optgroup>
          <optgroup label="تمرین و تست">
            <option>حل تمرین</option>
            <option>تست کتاب</option>
            <option>تست کنکور</option>
            <option>تست زماندار</option>
            <option>کار با منبع</option>
          </optgroup>
          <optgroup label="آزمون">
            <option>آزمون تشریحی</option>
            <option>آزمون چهارگزینه‌ای</option>
            <option>شبیه‌سازی کنکور</option>
          </optgroup>
          <optgroup label="مطالعه">
            <option>مطالعه درسنامه</option>
            <option>مطالعه کتاب درسی</option>
            <option>مطالعه موازی کتاب و درسنامه</option>
          </optgroup>
          <optgroup label="سایر">
            <option>رفع اشکال</option>
            <option>ویدیو</option>
            <option>جمع بندی</option>
            <option>ناهار</option>
            <option>شام</option>
            <option>صبحانه</option>
            <option>استراحت</option>
            <option>مدرسه</option>
            <option>کلاس</option>
            <option>فرهنگیان</option>
            <option value="__custom__">دستی بنویس</option>
          </optgroup>
        </select>
        <div class="activity-picker">
          <div class="activity-cats" id="activity-cats" role="group" aria-label="فیلتر دسته‌بندی"></div>
          <div class="activity-grid" id="activity-grid" aria-label="انتخاب نوع فعالیت"></div>
        </div>
        <input class="form-input" id="event-title" type="text" aria-label="نوع فعالیت دستی" placeholder="نوع فعالیت را بنویسید..." style="display:none;margin-top:8px">
        <p class="form-error" id="event-title-error" role="alert" hidden></p>
      </div>

      <div class="form-group">
        <label class="form-label" for="event-notes"><i data-lucide="file-text" class="icon-sm" aria-hidden="true"></i> یادداشت (اختیاری)</label>
        <textarea class="form-textarea" id="event-notes" placeholder="توضیح بیشتر..."></textarea>
      </div>

      <div class="form-group" role="group" aria-labelledby="color-label">
        <span class="form-label" id="color-label"><i data-lucide="palette" class="icon-sm" aria-hidden="true"></i> رنگ</span>
        <div class="color-row" id="color-row" role="radiogroup" aria-label="انتخاب رنگ"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary" onclick="saveEvent()"><i data-lucide="check" class="icon-sm" aria-hidden="true"></i> ذخیره</button>
      <button type="button" class="btn btn-danger" id="btn-delete" onclick="deleteEvent()" style="display:none"><i data-lucide="trash-2" class="icon-sm" aria-hidden="true"></i> حذف</button>
      <button type="button" class="btn btn-ghost" onclick="closeModal()">بستن</button>
    </div>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jalalidatepicker@0.6.0/dist/jalalidatepicker.min.js"></script>
<script src="assets/js/bootstrap.js"></script>
<script src="assets/js/config.js"></script>
<script src="assets/js/state.js"></script>
<script src="assets/js/topicTree.js"></script>
<script src="assets/js/table.js"></script>
<script src="assets/js/drag.js"></script>
<script src="assets/js/resize.js"></script>
<script src="assets/js/contextmenu.js"></script>
<script src="assets/js/modal.js"></script>
<script src="assets/js/api.js"></script>
<script src="assets/js/print.js"></script>
<script src="assets/js/main.js"></script>
<script src="assets/js/auth.js"></script></body>
</html>
