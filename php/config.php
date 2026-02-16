<?php
/**
 * Загрузка .env и конфиг.
 * .env ищется в корне проекта (на уровень выше php/).
 */
$envFile = dirname(__DIR__) . '/.env';
if (is_readable($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value, " \t\"'");
        putenv("$name=$value");
        $_ENV[$name] = $value;
    }
}

$databaseUrl = getenv('DATABASE_URL') ?: 'mysql://root@localhost:3306/bots_site';
$databaseUrl = preg_replace('#^mysql\+asyncmy://#', 'mysql://', $databaseUrl);

// Парсим mysql://user:password@host:port/dbname (пароль может содержать : и @)
$s = preg_replace('#^mysql://#', '', $databaseUrl);
$at = strrpos($s, '@');
if ($at === false) {
    $dbUser = '';
    $dbPass = '';
    $hostDb = $s;
} else {
    $creds = substr($s, 0, $at);
    $hostDb = substr($s, $at + 1);
    $colon = strpos($creds, ':');
    $dbUser = $colon === false ? urldecode($creds) : urldecode(substr($creds, 0, $colon));
    $dbPass = $colon === false ? '' : urldecode(substr($creds, $colon + 1));
}
$parts = explode('/', $hostDb, 2);
$hostPort = isset($parts[0]) ? $parts[0] : 'localhost';
$dbName = isset($parts[1]) ? $parts[1] : 'bots_site';
$hp = explode(':', $hostPort, 2);
$dbHost = isset($hp[0]) ? $hp[0] : 'localhost';
$dbPort = isset($hp[1]) && $hp[1] !== '' ? (int)$hp[1] : 3306;

$config = [
    'db' => [
        'host' => $dbHost,
        'port' => $dbPort,
        'name' => $dbName,
        'user' => $dbUser,
        'pass' => $dbPass,
    ],
    'secret_key' => getenv('SECRET_KEY') ?: 'dev-secret',
    'admin_username' => getenv('ADMIN_USERNAME') ?: 'admin',
    'admin_password' => getenv('ADMIN_PASSWORD') ?: 'change_me',
    'lead_rate_limit_per_day' => (int)(getenv('LEAD_RATE_LIMIT_PER_DAY') ?: 10),
    'login_attempts_limit' => (int)(getenv('LOGIN_ATTEMPTS_LIMIT') ?: 5),
    'login_attempts_window_minutes' => (int)(getenv('LOGIN_ATTEMPTS_WINDOW_MINUTES') ?: 15),
];
