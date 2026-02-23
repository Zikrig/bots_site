<?php
require_once __DIR__ . '/config.php';

$c = $config['db'];
$dsn = "mysql:host={$c['host']};port={$c['port']};dbname={$c['name']};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $c['user'], $c['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['detail' => 'Ошибка подключения к БД']);
    exit;
}

// Создание таблиц при первом запуске (идемпотентно)
$pdo->exec("
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    short_description VARCHAR(500) NOT NULL DEFAULT '',
    price DECIMAL(12,2) NULL,
    image_url VARCHAR(512) NOT NULL DEFAULT '',
    image_urls TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_visible TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    comment TEXT,
    attachment_name VARCHAR(255) NULL,
    attachment_url VARCHAR(512) NULL,
    attachment_size BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('new','contacted','closed') NOT NULL DEFAULT 'new'
);
");
// Миграция: колонка image_urls для галереи (если таблица уже была создана раньше)
$hasColumn = $pdo->query("SHOW COLUMNS FROM products LIKE 'image_urls'")->fetch();
if (!$hasColumn) {
    try {
        $pdo->exec("ALTER TABLE products ADD COLUMN image_urls TEXT NULL");
        $pdo->exec("UPDATE products SET image_urls = '[]' WHERE image_urls IS NULL");
    } catch (PDOException $e) {
        // игнорируем, если колонка уже есть или нет прав
    }
}
// Миграция: цена товара
$hasProductPrice = $pdo->query("SHOW COLUMNS FROM products LIKE 'price'")->fetch();
if (!$hasProductPrice) {
    try { $pdo->exec("ALTER TABLE products ADD COLUMN price DECIMAL(12,2) NULL"); } catch (PDOException $e) {}
}
// Миграция: вложения в заявках
$hasLeadAttachmentName = $pdo->query("SHOW COLUMNS FROM leads LIKE 'attachment_name'")->fetch();
if (!$hasLeadAttachmentName) {
    try { $pdo->exec("ALTER TABLE leads ADD COLUMN attachment_name VARCHAR(255) NULL"); } catch (PDOException $e) {}
}
$hasLeadAttachmentUrl = $pdo->query("SHOW COLUMNS FROM leads LIKE 'attachment_url'")->fetch();
if (!$hasLeadAttachmentUrl) {
    try { $pdo->exec("ALTER TABLE leads ADD COLUMN attachment_url VARCHAR(512) NULL"); } catch (PDOException $e) {}
}
$hasLeadAttachmentSize = $pdo->query("SHOW COLUMNS FROM leads LIKE 'attachment_size'")->fetch();
if (!$hasLeadAttachmentSize) {
    try { $pdo->exec("ALTER TABLE leads ADD COLUMN attachment_size BIGINT NULL"); } catch (PDOException $e) {}
}
// Миграция: корректное время создания заявок
try {
    $pdo->exec("UPDATE leads SET created_at = NOW() WHERE created_at = '0000-00-00 00:00:00' OR created_at IS NULL");
    $pdo->exec("ALTER TABLE leads MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
} catch (PDOException $e) {
    // игнорируем, если хостинг ограничивает MODIFY или в таблице нет проблемных данных
}

// Создать админа по умолчанию, если нет ни одного
$stmt = $pdo->query("SELECT COUNT(*) FROM admins");
if ((int)$stmt->fetchColumn() === 0) {
    $hash = password_hash($config['admin_password'], PASSWORD_DEFAULT);
    $st = $pdo->prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)");
    $st->execute([$config['admin_username'], $hash]);
}
