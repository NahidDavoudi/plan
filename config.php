<?php

require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

// Load .env once
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Optional: validate required vars
$dotenv->required(['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_CHARSET'])->notEmpty();

/**
 * Get PDO singleton
 */
function getDB(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            $_ENV['DB_HOST'],
            $_ENV['DB_NAME'],
            $_ENV['DB_CHARSET']
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO(
                $dsn,
                $_ENV['DB_USER'],
                $_ENV['DB_PASS'] ?? '',
                $options
            );
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode([
                'success' => false,
                'error'   => 'خطا در اتصال به دیتابیس: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE));
        }
    }

    return $pdo;
}

/**
 * CORS + JSON headers
 */
function setHeaders(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Read JSON body
 */
function getJsonBody(): array {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Success response
 */
function ok(array $data = [], int $code = 200): void {
    http_response_code($code);
    echo json_encode(['success' => true, ...$data], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Error response
 */
function fail(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}