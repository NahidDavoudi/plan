<?php
// ============================================
// config.php — تنظیمات اتصال به دیتابیس
// ============================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'nadcot_plan');
define('DB_USER', 'nadcot_nahid');        // نام کاربری MySQL
define('DB_PASS', 'Mhmd5076!');            // رمز عبور MySQL
define('DB_CHARSET', 'utf8mb4');

/**
 * اتصال PDO به دیتابیس
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode([
                'success' => false,
                'error'   => 'خطا در اتصال به دیتابیس: ' . $e->getMessage()
            ]));
        }
    }
    return $pdo;
}

/**
 * هدرهای CORS و JSON
 */
function setHeaders(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * خواندن body JSON از request
 */
function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * پاسخ موفق
 */
function ok(array $data = [], int $code = 200): void {
    http_response_code($code);
    echo json_encode(['success' => true, ...$data], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * پاسخ خطا
 */
function fail(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
