<?php
/**
 * Pulmo Care — cPanel Image Upload Handler
 * Saves uploaded images directly into the uploads/ directory on cPanel
 * and registers metadata in MySQL media table.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

// 1. Determine upload directory
$targetDir = __DIR__ . '/../uploads/';
if (!file_exists($targetDir)) {
    @mkdir($targetDir, 0755, true);
}
if (!is_writable($targetDir)) {
    @chmod($targetDir, 0755);
}

// 2. Validate upload
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No file field named "file" found in request.']);
    exit;
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
        UPLOAD_ERR_FORM_SIZE  => 'The uploaded file exceeds the MAX_FILE_SIZE directive specified in the HTML form.',
        UPLOAD_ERR_PARTIAL    => 'The uploaded file was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder on the server.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk on server.',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload.'
    ];
    $errMsg = $uploadErrors[$file['error']] ?? ('Upload failed with error code: ' . $file['error']);
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $errMsg]);
    exit;
}

$maxSize = 15 * 1024 * 1024; // 15MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'File exceeds maximum size limit (15MB).']);
    exit;
}

$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!$extension) {
    $extension = 'webp';
}

// Allow standard web images
$allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'];
if (!in_array($extension, $allowed)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid image format. Allowed: JPG, PNG, WebP, GIF, SVG, AVIF.']);
    exit;
}

$cleanBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', $originalName);
$uniqueFileName = 'img_' . time() . '_' . $cleanBase . '.' . $extension;
$destination = $targetDir . $uniqueFileName;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to move uploaded file to target folder: ' . $targetDir . '. Please check cPanel folder write permissions (chmod 755).'
    ]);
    exit;
}

// 3. Compute public URL (handles root or subdirectory installation like /pulmocare)
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$apiPos = strpos($requestUri, '/api/');
$basePrefix = ($apiPos !== false && $apiPos > 0) ? substr($requestUri, 0, $apiPos) : '';
$publicUrl = $basePrefix . '/uploads/' . $uniqueFileName;

// 4. Register in MySQL media table
$mediaId = 'img_' . time() . '_' . substr(md5(uniqid()), 0, 6);
$savedToDb = false;

try {
    require_once __DIR__ . '/config.php';
    $pdo = getDbConnection();
    if ($pdo) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `media` (
            `id` VARCHAR(128) PRIMARY KEY,
            `file_name` VARCHAR(255) NOT NULL,
            `url` TEXT NOT NULL,
            `storage_path` VARCHAR(255) DEFAULT NULL,
            `file_path` VARCHAR(255) DEFAULT NULL,
            `size` INT DEFAULT 0,
            `width` INT DEFAULT 0,
            `height` INT DEFAULT 0,
            `alt` VARCHAR(255) DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $stmt = $pdo->prepare("INSERT INTO `media` (`id`, `file_name`, `url`, `storage_path`, `file_path`, `size`, `width`, `height`, `alt`)
            VALUES (:id, :fn, :u, :sp, :fp, :sz, 0, 0, :alt)");
        $stmt->execute([
            ':id' => $mediaId,
            ':fn' => $uniqueFileName,
            ':u' => $publicUrl,
            ':sp' => 'uploads/' . $uniqueFileName,
            ':fp' => 'uploads/' . $uniqueFileName,
            ':sz' => $file['size'],
            ':alt' => str_replace('_', ' ', $cleanBase)
        ]);
        $savedToDb = true;
    }
} catch (Exception $e) {
    // Non-fatal for image file
    error_log("Upload media table save note: " . $e->getMessage());
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'id' => $mediaId,
    'url' => $publicUrl,
    'fileName' => $uniqueFileName,
    'storagePath' => 'uploads/' . $uniqueFileName,
    'size' => $file['size'],
    'alt' => str_replace('_', ' ', $cleanBase),
    'savedToDb' => $savedToDb
]);
