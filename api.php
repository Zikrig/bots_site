<?php
/**
 * Единая точка входа для API /api/v1/*
 * Подключение: .htaccess → RewriteRule ^api/v1/(.*)$ api.php?path=$1 [L,QSA]
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}

session_start();

require_once __DIR__ . '/php/db.php';

$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// PATCH/DELETE через POST с _method (если не поддерживается)
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$pathParts = $path ? explode('/', $path) : [];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

// ---------- Роутинг ----------

// GET /products — публичный список товаров
if ($path === 'products' && $method === 'GET') {
    $stmt = $pdo->query("SELECT id, title, slug, description, short_description, image_url, sort_order, is_visible, created_at, updated_at FROM products WHERE is_visible = 1 ORDER BY sort_order, id");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['created_at'] = $r['created_at'] ?? '';
        $r['updated_at'] = $r['updated_at'] ?? '';
    }
    echo json_encode($rows);
    exit;
}

// POST /leads — создать заявку (с лимитом по IP)
if ($path === 'leads' && $method === 'POST') {
    $phone = isset($body['phone']) ? trim((string)$body['phone']) : '';
    if (strlen($phone) < 10 || strlen($phone) > 20) {
        http_response_code(400);
        echo json_encode(['detail' => 'Телефон должен быть от 10 до 20 символов']);
        exit;
    }
    $name = isset($body['name']) ? trim(substr((string)$body['name'], 0, 255)) : null;
    $comment = isset($body['comment']) ? trim(substr((string)$body['comment'], 0, 2000)) : null;
    $st = $pdo->prepare("INSERT INTO leads (phone, name, comment) VALUES (?, ?, ?)");
    $st->execute([$phone, $name ?: null, $comment ?: null]);
    $id = (int)$pdo->lastInsertId();
    $row = $pdo->query("SELECT id, phone, name, comment, created_at, status FROM leads WHERE id = $id")->fetch(PDO::FETCH_ASSOC);
    $row['created_at'] = $row['created_at'] ?? '';
    http_response_code(201);
    echo json_encode($row);
    exit;
}

// ---------- Admin (проверка сессии) ----------
function requireAdmin() {
    global $pdo;
    if (empty($_SESSION['admin_id'])) {
        http_response_code(401);
        echo json_encode(['detail' => 'Требуется авторизация']);
        exit;
    }
    $st = $pdo->prepare("SELECT id, username FROM admins WHERE id = ?");
    $st->execute([$_SESSION['admin_id']]);
    $admin = $st->fetch(PDO::FETCH_ASSOC);
    if (!$admin) {
        unset($_SESSION['admin_id']);
        http_response_code(401);
        echo json_encode(['detail' => 'Пользователь не найден']);
        exit;
    }
    return $admin;
}

// POST /admin/login
if ($path === 'admin/login' && $method === 'POST') {
    $username = isset($body['username']) ? trim((string)$body['username']) : '';
    $password = isset($body['password']) ? $body['password'] : '';
    if ($username === '' || $password === '') {
        http_response_code(401);
        echo json_encode(['detail' => 'Неверный логин или пароль']);
        exit;
    }
    $st = $pdo->prepare("SELECT id, username, password_hash FROM admins WHERE username = ?");
    $st->execute([$username]);
    $admin = $st->fetch(PDO::FETCH_ASSOC);
    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        http_response_code(401);
        echo json_encode(['detail' => 'Неверный логин или пароль']);
        exit;
    }
    $_SESSION['admin_id'] = (int)$admin['id'];
    echo json_encode(['id' => (int)$admin['id'], 'username' => $admin['username']]);
    exit;
}

// POST /admin/logout
if ($path === 'admin/logout' && $method === 'POST') {
    unset($_SESSION['admin_id']);
    echo json_encode(['ok' => true]);
    exit;
}

// GET /admin/me
if ($path === 'admin/me' && $method === 'GET') {
    $admin = requireAdmin();
    echo json_encode(['id' => (int)$admin['id'], 'username' => $admin['username']]);
    exit;
}

// GET /admin/products — список всех
if ($path === 'admin/products' && $method === 'GET') {
    requireAdmin();
    $stmt = $pdo->query("SELECT id, title, slug, description, short_description, image_url, sort_order, is_visible, created_at, updated_at FROM products ORDER BY sort_order, id");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['created_at'] = $r['created_at'] ?? '';
        $r['updated_at'] = $r['updated_at'] ?? '';
    }
    echo json_encode($rows);
    exit;
}

// POST /admin/products — создать
if ($path === 'admin/products' && $method === 'POST') {
    requireAdmin();
    $title = isset($body['title']) ? trim((string)$body['title']) : '';
    if ($title === '') {
        http_response_code(400);
        echo json_encode(['detail' => 'Название обязательно']);
        exit;
    }
    $slug = isset($body['slug']) ? trim(substr((string)$body['slug'], 0, 255)) : null;
    $slug = $slug === '' ? null : $slug;
    $description = isset($body['description']) ? (string)$body['description'] : '';
    $short_description = isset($body['short_description']) ? substr((string)$body['short_description'], 0, 500) : '';
    $image_url = isset($body['image_url']) ? substr((string)$body['image_url'], 0, 512) : '';
    $sort_order = isset($body['sort_order']) ? (int)$body['sort_order'] : 0;
    $is_visible = isset($body['is_visible']) ? (bool)$body['is_visible'] : true;
    $st = $pdo->prepare("INSERT INTO products (title, slug, description, short_description, image_url, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $st->execute([$title, $slug, $description, $short_description, $image_url, $sort_order, $is_visible ? 1 : 0]);
    $id = (int)$pdo->lastInsertId();
    $row = $pdo->query("SELECT id, title, slug, description, short_description, image_url, sort_order, is_visible, created_at, updated_at FROM products WHERE id = $id")->fetch(PDO::FETCH_ASSOC);
    foreach (['created_at', 'updated_at'] as $k) { $row[$k] = $row[$k] ?? ''; }
    http_response_code(201);
    echo json_encode($row);
    exit;
}

// GET /admin/products/{id}
if (preg_match('#^admin/products/(\d+)$#', $path, $m) && $method === 'GET') {
    requireAdmin();
    $id = (int)$m[1];
    $stmt = $pdo->prepare("SELECT id, title, slug, description, short_description, image_url, sort_order, is_visible, created_at, updated_at FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(404);
        echo json_encode(['detail' => 'Товар не найден']);
        exit;
    }
    $row['created_at'] = $row['created_at'] ?? '';
    $row['updated_at'] = $row['updated_at'] ?? '';
    echo json_encode($row);
    exit;
}

// PATCH /admin/products/{id}
if (preg_match('#^admin/products/(\d+)$#', $path, $m) && $method === 'PATCH') {
    requireAdmin();
    $id = (int)$m[1];
    $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['detail' => 'Товар не найден']);
        exit;
    }
    $updates = [];
    $params = [];
    $fields = ['title' => 's', 'slug' => 's', 'description' => 's', 'short_description' => 's', 'image_url' => 's', 'sort_order' => 'i', 'is_visible' => 'b'];
    foreach ($fields as $key => $type) {
        if (!array_key_exists($key, $body)) continue;
        if ($key === 'slug') {
            $v = trim((string)$body[$key]);
            $v = $v === '' ? null : substr($v, 0, 255);
            $updates[] = "slug = ?";
            $params[] = $v;
        } elseif ($key === 'short_description') {
            $updates[] = "short_description = ?";
            $params[] = substr((string)$body[$key], 0, 500);
        } elseif ($key === 'image_url') {
            $updates[] = "image_url = ?";
            $params[] = substr((string)$body[$key], 0, 512);
        } elseif ($key === 'is_visible') {
            $updates[] = "is_visible = ?";
            $params[] = (bool)$body[$key] ? 1 : 0;
        } elseif ($key === 'sort_order') {
            $updates[] = "sort_order = ?";
            $params[] = (int)$body[$key];
        } else {
            $updates[] = "$key = ?";
            $params[] = $key === 'title' ? trim((string)$body[$key]) : (string)$body[$key];
        }
    }
    if (!empty($updates)) {
        $params[] = $id;
        $pdo->prepare("UPDATE products SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
    }
    $row = $pdo->query("SELECT id, title, slug, description, short_description, image_url, sort_order, is_visible, created_at, updated_at FROM products WHERE id = $id")->fetch(PDO::FETCH_ASSOC);
    $row['created_at'] = $row['created_at'] ?? '';
    $row['updated_at'] = $row['updated_at'] ?? '';
    echo json_encode($row);
    exit;
}

// DELETE /admin/products/{id}
if (preg_match('#^admin/products/(\d+)$#', $path, $m) && $method === 'DELETE') {
    requireAdmin();
    $id = (int)$m[1];
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['detail' => 'Товар не найден']);
        exit;
    }
    http_response_code(204);
    exit;
}

// GET /admin/leads
if ($path === 'admin/leads' && $method === 'GET') {
    requireAdmin();
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $valid = ['new', 'contacted', 'closed'];
    $where = in_array($status, $valid) ? "WHERE status = " . $pdo->quote($status) : "";
    $stmt = $pdo->query("SELECT id, phone, name, comment, created_at, status FROM leads $where ORDER BY created_at DESC LIMIT 200");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) { $r['created_at'] = $r['created_at'] ?? ''; }
    echo json_encode($rows);
    exit;
}

// PATCH /admin/leads/{id}
if (preg_match('#^admin/leads/(\d+)$#', $path, $m) && $method === 'PATCH') {
    requireAdmin();
    $id = (int)$m[1];
    $status = isset($body['status']) ? $body['status'] : '';
    if (!in_array($status, ['new', 'contacted', 'closed'])) {
        $row = $pdo->query("SELECT id, phone, name, comment, created_at, status FROM leads WHERE id = $id")->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['detail' => 'Заявка не найдена']);
            exit;
        }
        $row['created_at'] = $row['created_at'] ?? '';
        echo json_encode($row);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE leads SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['detail' => 'Заявка не найдена']);
        exit;
    }
    $row = $pdo->query("SELECT id, phone, name, comment, created_at, status FROM leads WHERE id = $id")->fetch(PDO::FETCH_ASSOC);
    $row['created_at'] = $row['created_at'] ?? '';
    echo json_encode($row);
    exit;
}

http_response_code(404);
echo json_encode(['detail' => 'Not found']);
