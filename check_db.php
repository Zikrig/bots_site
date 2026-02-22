<?php
/**
 * Проверка БД: откройте в браузере или запустите php check_db.php
 * После проверки удалите или переименуйте файл (безопасность).
 */
header('Content-Type: text/plain; charset=utf-8');

echo "=== Проверка БД ===\n\n";

try {
    require_once __DIR__ . '/php/config.php';
    $c = $config['db'];
    $dsn = "mysql:host={$c['host']};port={$c['port']};dbname={$c['name']};charset=utf8mb4";
    $pdo = new PDO($dsn, $c['user'], $c['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "1. Подключение к БД: OK\n";
} catch (PDOException $e) {
    echo "1. Подключение: ОШИБКА\n   " . $e->getMessage() . "\n";
    exit;
}

// Таблицы
try {
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "2. Таблицы: " . implode(', ', $tables) . "\n";
} catch (PDOException $e) {
    echo "2. SHOW TABLES: ОШИБКА\n   " . $e->getMessage() . "\n";
    exit;
}

// Колонки products
if (in_array('products', $tables)) {
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM products")->fetchAll(PDO::FETCH_COLUMN);
        echo "3. Колонки products: " . implode(', ', $cols) . "\n";
        if (!in_array('image_urls', $cols)) {
            echo "   ВНИМАНИЕ: колонки image_urls нет. Выполните:\n";
            echo "   ALTER TABLE products ADD COLUMN image_urls TEXT NULL;\n";
            echo "   UPDATE products SET image_urls = '[]' WHERE image_urls IS NULL;\n";
        } else {
            echo "   image_urls: есть\n";
        }
    } catch (PDOException $e) {
        echo "3. SHOW COLUMNS products: ОШИБКА\n   " . $e->getMessage() . "\n";
    }

    // Пробный SELECT (как в API)
    try {
        $pdo->query("SELECT id, title, image_url, image_urls FROM products LIMIT 1")->fetch();
        echo "4. SELECT из products (с image_urls): OK\n";
    } catch (PDOException $e) {
        echo "4. SELECT products: ОШИБКА\n   " . $e->getMessage() . "\n";
    }
} else {
    echo "3. Таблица products отсутствует (будет создана при первом запросе к API).\n";
}

echo "\n=== Конец проверки ===\n";
