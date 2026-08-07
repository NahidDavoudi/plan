<?php
// ============================================
// api/students.php
// GET    /api/students.php        — لیست همه دانش‌آموزان
// POST   /api/students.php        — ایجاد دانش‌آموز جدید
// PUT    /api/students.php?id=X   — ویرایش
// DELETE /api/students.php?id=X   — حذف
// ============================================
require_once __DIR__ . '/../config.php';
setHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db     = getDB();

// ---- GET ----
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM students WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        $row ? ok(['student' => $row]) : fail('دانش‌آموز یافت نشد', 404);
    }
    $rows = $db->query('SELECT * FROM students ORDER BY name')->fetchAll();
    ok(['students' => $rows]);
}

// ---- POST ----
if ($method === 'POST') {
    $body  = getJsonBody();
    $name  = trim($body['name']  ?? '');
    $grade = trim($body['grade'] ?? '');
    $major = trim($body['major'] ?? '');

    if (!$name || !$grade) fail('نام و پایه الزامی است');

    $stmt = $db->prepare(
        'INSERT INTO students (name, grade, major) VALUES (?, ?, ?)'
    );
    $stmt->execute([$name, $grade, $major ?: null]);
    ok(['id' => (int)$db->lastInsertId()], 201);
}

// ---- PUT ----
if ($method === 'PUT') {
    if (!$id) fail('شناسه الزامی است');
    $body  = getJsonBody();
    $name  = trim($body['name']  ?? '');
    $grade = trim($body['grade'] ?? '');
    $major = trim($body['major'] ?? '');

    if (!$name || !$grade) fail('نام و پایه الزامی است');

    $stmt = $db->prepare(
        'UPDATE students SET name=?, grade=?, major=? WHERE id=?'
    );
    $stmt->execute([$name, $grade, $major ?: null, $id]);
    ok();
}

// ---- DELETE ----
if ($method === 'DELETE') {
    if (!$id) fail('شناسه الزامی است');
    $db->prepare('DELETE FROM students WHERE id=?')->execute([$id]);
    ok();
}

fail('متد پشتیبانی نمی‌شود', 405);
