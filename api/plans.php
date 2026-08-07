<?php
// ============================================
// api/plans.php
// GET    /api/plans.php?student_id=X         — برنامه‌های یک دانش‌آموز
// GET    /api/plans.php?id=X                 — یک برنامه خاص با همه ایونت‌هایش
// POST   /api/plans.php                      — ذخیره کامل یک برنامه هفتگی
// DELETE /api/plans.php?id=X                 — حذف برنامه
// ============================================
require_once __DIR__ . '/../config.php';
setHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$id         = isset($_GET['id'])         ? (int)$_GET['id']         : null;
$student_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : null;
$db = getDB();

// ---- GET ----
if ($method === 'GET') {

    // یک برنامه خاص با همه ایونت‌هایش
    if ($id) {
        $stmt = $db->prepare('
            SELECT p.*, s.name AS student_name, s.grade, s.major
            FROM weekly_plans p
            JOIN students s ON s.id = p.student_id
            WHERE p.id = ?
        ');
        $stmt->execute([$id]);
        $plan = $stmt->fetch();
        if (!$plan) fail('برنامه یافت نشد', 404);

        // ایونت‌ها
        $stmt2 = $db->prepare('
            SELECT * FROM events
            WHERE plan_id = ?
            ORDER BY day_index, time_index
        ');
        $stmt2->execute([$id]);
        $events = $stmt2->fetchAll();

        // گروه‌بندی بر اساس روز
        $byDay = [];
        foreach ($events as $ev) {
            $byDay[$ev['day_name']][] = $ev;
        }

        ok(['plan' => $plan, 'events' => $events, 'by_day' => $byDay]);
    }

    // لیست برنامه‌های یک دانش‌آموز
    if ($student_id) {
        $stmt = $db->prepare('
            SELECT p.id, p.week_date, p.weekly_notes, p.created_at,
                   COUNT(e.id) AS event_count
            FROM weekly_plans p
            LEFT JOIN events e ON e.plan_id = p.id
            WHERE p.student_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        ');
        $stmt->execute([$student_id]);
        ok(['plans' => $stmt->fetchAll()]);
    }

    // همه برنامه‌ها با اطلاعات دانش‌آموز
    $rows = $db->query('
        SELECT p.id, p.week_date, p.created_at,
               s.name AS student_name, s.grade, s.major,
               COUNT(e.id) AS event_count
        FROM weekly_plans p
        JOIN students s ON s.id = p.student_id
        LEFT JOIN events e ON e.plan_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT 200
    ')->fetchAll();
    ok(['plans' => $rows]);
}

// ---- POST: ذخیره کامل یک برنامه هفتگی ----
if ($method === 'POST') {
    $body = getJsonBody();

    // ---- اعتبارسنجی ----
    $name      = trim($body['meta']['name']  ?? '');
    $grade     = trim($body['meta']['grade'] ?? '');
    $major     = trim($body['meta']['major'] ?? '');
    $week_date = trim($body['meta']['date']  ?? '');
    $notes     = trim($body['weeklyNotes']   ?? '');
    $times     = $body['times']  ?? [];
    $events    = $body['events'] ?? [];

    if (!$name)  fail('نام دانش‌آموز الزامی است');
    if (!$grade) fail('پایه الزامی است');

    $db->beginTransaction();
    try {

        // ---- ایجاد یا پیدا کردن دانش‌آموز ----
        $stmt = $db->prepare(
            'SELECT id FROM students WHERE name = ? AND grade = ? LIMIT 1'
        );
        $stmt->execute([$name, $grade]);
        $student = $stmt->fetch();

        if ($student) {
            $student_id = $student['id'];
            // آپدیت رشته در صورت تغییر
            $db->prepare('UPDATE students SET major=? WHERE id=?')
               ->execute([$major ?: null, $student_id]);
        } else {
            $db->prepare('INSERT INTO students (name, grade, major) VALUES (?,?,?)')
               ->execute([$name, $grade, $major ?: null]);
            $student_id = (int)$db->lastInsertId();
        }

        // ---- ایجاد برنامه هفتگی ----
        $db->prepare('
            INSERT INTO weekly_plans (student_id, week_date, weekly_notes, times_json)
            VALUES (?, ?, ?, ?)
        ')->execute([
            $student_id,
            $week_date ?: null,
            $notes     ?: null,
            json_encode($times, JSON_UNESCAPED_UNICODE)
        ]);
        $plan_id = (int)$db->lastInsertId();

        // ---- ثبت ایونت‌ها ----
        $DAY_NAMES = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];

        $stmt = $db->prepare('
            INSERT INTO events (
                plan_id, student_id,
                day_index, day_name, time_index, time_label,
                topic_id, topic_path, topic_path_short, topic_label,
                subject_name, selected_grade,
                title, notes, color
            ) VALUES (
                ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?
            )
        ');

        foreach ($events as $ev) {
            $di = (int)($ev['dayIndex']   ?? 0);
            $ti = (int)($ev['timeIndex']  ?? 0);

            $stmt->execute([
                $plan_id,
                $student_id,
                $di,
                $DAY_NAMES[$di] ?? 'نامشخص',
                $ti,
                $times[$ti] ?? null,
                $ev['topicId']        ?? null,
                $ev['topicPath']      ?? null,
                $ev['topicPathShort'] ?? null,
                $ev['topicLabel']     ?? null,
                $ev['subjectName']    ?? null,
                $ev['selectedGrade']  ?? null,
                $ev['title']          ?? null,
                $ev['notes']          ?? null,
                $ev['color']          ?? 'green',
            ]);
        }

        $db->commit();
        ok([
            'plan_id'    => $plan_id,
            'student_id' => $student_id,
            'saved'      => count($events) . ' ایونت ذخیره شد'
        ], 201);

    } catch (Exception $e) {
        $db->rollBack();
        fail('خطا در ذخیره‌سازی: ' . $e->getMessage(), 500);
    }
}

// ---- DELETE ----
if ($method === 'DELETE') {
    if (!$id) fail('شناسه الزامی است');
    $db->prepare('DELETE FROM weekly_plans WHERE id=?')->execute([$id]);
    ok();
}

fail('متد پشتیبانی نمی‌شود', 405);
