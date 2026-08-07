<?php
// ============================================
// api/reports.php
// گزارش‌های تحلیلی برای مشاور
//
// GET /api/reports.php?type=student_summary&student_id=X
//     — خلاصه فعالیت یک دانش‌آموز (چه مباحثی، چند بار)
//
// GET /api/reports.php?type=week_detail&plan_id=X
//     — جزئیات کامل یک هفته به تفکیک روز
//
// GET /api/reports.php?type=subject_stats&student_id=X
//     — آمار درس‌ها (چه درسی چقدر وقت گرفته)
//
// GET /api/reports.php?type=all_students
//     — لیست همه شاگردها با آخرین برنامه
// ============================================
require_once __DIR__ . '/../config.php';
setHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail('فقط GET', 405);

$type       = $_GET['type']       ?? '';
$student_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : null;
$plan_id    = isset($_GET['plan_id'])    ? (int)$_GET['plan_id']    : null;
$db = getDB();

// ============================================
// خلاصه یک دانش‌آموز
// ============================================
if ($type === 'student_summary') {
    if (!$student_id) fail('student_id الزامی است');

    // اطلاعات پایه
    $student = $db->prepare('SELECT * FROM students WHERE id=?');
    $student->execute([$student_id]);
    $studentData = $student->fetch();
    if (!$studentData) fail('دانش‌آموز یافت نشد', 404);

    // تعداد برنامه‌ها
    $stmt = $db->prepare('SELECT COUNT(*) AS cnt FROM weekly_plans WHERE student_id=?');
    $stmt->execute([$student_id]);
    $planCount = $stmt->fetch()['cnt'];

    // تعداد کل ایونت‌ها
    $stmt = $db->prepare('SELECT COUNT(*) AS cnt FROM events WHERE student_id=?');
    $stmt->execute([$student_id]);
    $eventCount = $stmt->fetch()['cnt'];

    // پرتکرارترین درس‌ها
    $stmt = $db->prepare('
        SELECT subject_name, COUNT(*) AS cnt
        FROM events
        WHERE student_id=? AND subject_name IS NOT NULL
        GROUP BY subject_name
        ORDER BY cnt DESC
        LIMIT 10
    ');
    $stmt->execute([$student_id]);
    $topSubjects = $stmt->fetchAll();

    // پرتکرارترین نوع فعالیت
    $stmt = $db->prepare('
        SELECT title, COUNT(*) AS cnt
        FROM events
        WHERE student_id=? AND title IS NOT NULL
        GROUP BY title
        ORDER BY cnt DESC
        LIMIT 10
    ');
    $stmt->execute([$student_id]);
    $topActivities = $stmt->fetchAll();

    // آخرین ۵ برنامه
    $stmt = $db->prepare('
        SELECT p.id, p.week_date, p.created_at, COUNT(e.id) AS event_count
        FROM weekly_plans p
        LEFT JOIN events e ON e.plan_id = p.id
        WHERE p.student_id=?
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT 5
    ');
    $stmt->execute([$student_id]);
    $recentPlans = $stmt->fetchAll();

    ok([
        'student'        => $studentData,
        'plan_count'     => (int)$planCount,
        'event_count'    => (int)$eventCount,
        'top_subjects'   => $topSubjects,
        'top_activities' => $topActivities,
        'recent_plans'   => $recentPlans,
    ]);
}

// ============================================
// جزئیات کامل یک هفته
// ============================================
if ($type === 'week_detail') {
    if (!$plan_id) fail('plan_id الزامی است');

    $stmt = $db->prepare('
        SELECT p.*, s.name AS student_name, s.grade, s.major
        FROM weekly_plans p
        JOIN students s ON s.id = p.student_id
        WHERE p.id=?
    ');
    $stmt->execute([$plan_id]);
    $plan = $stmt->fetch();
    if (!$plan) fail('برنامه یافت نشد', 404);

    $stmt = $db->prepare('
        SELECT * FROM events
        WHERE plan_id=?
        ORDER BY day_index ASC, time_index ASC
    ');
    $stmt->execute([$plan_id]);
    $events = $stmt->fetchAll();

    // گروه‌بندی بر اساس روز
    $DAY_NAMES = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
    $schedule = [];
    foreach ($DAY_NAMES as $day) {
        $schedule[$day] = [];
    }
    foreach ($events as $ev) {
        $schedule[$ev['day_name']][] = [
            'time'          => $ev['time_label'],
            'subject'       => $ev['subject_name'],
            'topic'         => $ev['topic_path_short'],
            'activity'      => $ev['title'],
            'notes'         => $ev['notes'],
            'color'         => $ev['color'],
            'selected_grade'=> $ev['selected_grade'],
        ];
    }

    ok([
        'plan'     => $plan,
        'schedule' => $schedule,
        'total'    => count($events),
    ]);
}

// ============================================
// آمار درس‌ها برای یک دانش‌آموز
// ============================================
if ($type === 'subject_stats') {
    if (!$student_id) fail('student_id الزامی است');

    $stmt = $db->prepare('
        SELECT
            e.subject_name,
            e.selected_grade,
            e.title AS activity_type,
            COUNT(*) AS count,
            GROUP_CONCAT(DISTINCT e.topic_path_short ORDER BY e.topic_path_short SEPARATOR " | ") AS topics
        FROM events e
        WHERE e.student_id=? AND e.subject_name IS NOT NULL
        GROUP BY e.subject_name, e.selected_grade, e.title
        ORDER BY e.subject_name, count DESC
    ');
    $stmt->execute([$student_id]);
    $rows = $stmt->fetchAll();

    // خلاصه به تفکیک درس
    $bySubject = [];
    foreach ($rows as $r) {
        $sub = $r['subject_name'];
        if (!isset($bySubject[$sub])) {
            $bySubject[$sub] = ['total' => 0, 'activities' => []];
        }
        $bySubject[$sub]['total'] += (int)$r['count'];
        $bySubject[$sub]['activities'][] = [
            'type'   => $r['activity_type'],
            'count'  => (int)$r['count'],
            'topics' => $r['topics'],
            'grade'  => $r['selected_grade'],
        ];
    }

    ok(['by_subject' => $bySubject]);
}

// ============================================
// لیست همه شاگردها با آخرین برنامه
// ============================================
if ($type === 'all_students') {
    $rows = $db->query('
        SELECT
            s.id, s.name, s.grade, s.major, s.created_at,
            COUNT(DISTINCT p.id)  AS plan_count,
            COUNT(e.id)           AS total_events,
            MAX(p.week_date)      AS last_week_date,
            MAX(p.created_at)     AS last_plan_at
        FROM students s
        LEFT JOIN weekly_plans p ON p.student_id = s.id
        LEFT JOIN events e       ON e.student_id = s.id
        GROUP BY s.id
        ORDER BY last_plan_at DESC
    ')->fetchAll();

    ok(['students' => $rows]);
}

fail('نوع گزارش نامعتبر است. مقادیر مجاز: student_summary, week_detail, subject_stats, all_students');
