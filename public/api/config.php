<?php
/**
 * Pulmo Care — cPanel MySQL Database Configuration
 * Set your cPanel MySQL Database credentials here.
 */

define('DB_HOST', getenv('MYSQL_HOST') ?: 'localhost');
define('DB_USER', getenv('MYSQL_USER') ?: '');
define('DB_PASS', getenv('MYSQL_PASSWORD') ?: '');
define('DB_NAME', getenv('MYSQL_DATABASE') ?: '');
define('DB_PORT', getenv('MYSQL_PORT') ?: '3306');

function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        if (DB_USER === '' || DB_PASS === '' || DB_NAME === '') {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database environment variables are not configured.'
            ]);
            exit;
        }

        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database connection failed.'
            ]);
            exit;
        }
    }
    return $pdo;
}
