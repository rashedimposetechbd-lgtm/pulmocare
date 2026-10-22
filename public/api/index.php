<?php
/**
 * Pulmo Care — cPanel REST API (PHP + MySQL)
 * Handles /api/settings, /api/sections, /api/categories, /api/products, /api/orders, /api/inquiries, /api/media, /api/admins, /api/auth/login
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Normalize path: strip prefix up to /api/
$apiPos = strpos($path, '/api/');
$route = $apiPos !== false ? substr($path, $apiPos + 5) : ltrim($path, '/');
$parts = explode('/', trim($route, '/'));
$resource = $parts[0] ?? '';
$id = $parts[1] ?? null;

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

try {
    switch ($resource) {
        case 'health':
            echo json_encode(['status' => 'ok', 'database' => 'MySQL', 'server' => 'cPanel PHP']);
            break;

        case 'upload':
            require __DIR__ . '/upload.php';
            exit;

        case 'settings':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM site_settings WHERE id = 1 LIMIT 1");
                $row = $stmt->fetch();
                if ($row) {
                    echo json_encode([
                        'id' => $row['id'],
                        'brandName' => $row['brand_name'],
                        'tagline' => $row['tagline'],
                        'taglineBn' => $row['tagline_bn'],
                        'logoUrl' => $row['logo_url'],
                        'faviconUrl' => $row['favicon_url'],
                        'phone' => $row['phone'],
                        'whatsappNumber' => $row['whatsapp_number'],
                        'email' => $row['email'],
                        'address' => $row['address'],
                        'facebookUrl' => $row['facebook_url'],
                        'topBarText' => $row['top_bar_text'],
                        'currencySymbol' => $row['currency_symbol'],
                        'deliveryDhaka' => (float)$row['delivery_dhaka'],
                        'deliveryOutside' => (float)$row['delivery_outside'],
                        'seoTitle' => $row['seo_title'],
                        'seoDescription' => $row['seo_description'],
                        'seoKeywords' => $row['seo_keywords'],
                        'themeColor' => $row['theme_color']
                    ]);
                } else {
                    echo json_encode(null);
                }
            } elseif ($method === 'PUT' || $method === 'POST') {
                try { @$pdo->exec("ALTER TABLE `site_settings` MODIFY COLUMN `logo_url` LONGTEXT, MODIFY COLUMN `favicon_url` LONGTEXT;"); } catch (Exception $e) {}
                $sql = "UPDATE site_settings SET
                    brand_name = :brandName, tagline = :tagline, tagline_bn = :taglineBn,
                    logo_url = :logoUrl, favicon_url = :faviconUrl, phone = :phone,
                    whatsapp_number = :wa, email = :email, address = :addr, facebook_url = :fb,
                    top_bar_text = :topBar, delivery_dhaka = :delDhaka, delivery_outside = :delOut,
                    seo_title = :seoTitle, seo_description = :seoDesc, seo_keywords = :seoKeys,
                    theme_color = :themeColor WHERE id = 1";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':brandName' => $body['brandName'] ?? 'Pulmo Care',
                    ':tagline' => $body['tagline'] ?? '',
                    ':taglineBn' => $body['taglineBn'] ?? '',
                    ':logoUrl' => $body['logoUrl'] ?? '',
                    ':faviconUrl' => $body['faviconUrl'] ?? '',
                    ':phone' => $body['phone'] ?? '',
                    ':wa' => $body['whatsappNumber'] ?? '',
                    ':email' => $body['email'] ?? '',
                    ':addr' => $body['address'] ?? '',
                    ':fb' => $body['facebookUrl'] ?? '',
                    ':topBar' => $body['topBarText'] ?? '',
                    ':delDhaka' => (float)($body['deliveryDhaka'] ?? 60),
                    ':delOut' => (float)($body['deliveryOutside'] ?? 120),
                    ':seoTitle' => $body['seoTitle'] ?? '',
                    ':seoDesc' => $body['seoDescription'] ?? '',
                    ':seoKeys' => $body['seoKeywords'] ?? '',
                    ':themeColor' => $body['themeColor'] ?? '#0284c7'
                ]);
                echo json_encode(['success' => true]);
            }
            break;

        case 'sections':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM page_sections");
                $sections = [];
                while ($row = $stmt->fetch()) {
                    $sections[$row['section_key']] = json_decode($row['content_json'], true) ?? [];
                }
                echo json_encode($sections);
            } elseif ($method === 'PUT' || $method === 'POST') {
                $secKey = $id ?? ($body['id'] ?? 'hero');
                $stmt = $pdo->prepare("INSERT INTO page_sections (section_key, title, content_json, visible, display_order)
                    VALUES (:k, :t, :c, :v, :o)
                    ON DUPLICATE KEY UPDATE content_json = VALUES(content_json), visible = VALUES(visible)");
                $stmt->execute([
                    ':k' => $secKey,
                    ':t' => $body['title'] ?? $secKey,
                    ':c' => json_encode($body),
                    ':v' => (!isset($body['visible']) || $body['visible'] !== false) ? 1 : 0,
                    ':o' => (int)($body['order'] ?? 0)
                ]);
                echo json_encode(['success' => true]);
            }
            break;

        case 'categories':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM categories ORDER BY display_order ASC");
                $cats = [];
                while ($r = $stmt->fetch()) {
                    $cats[] = [
                        'id' => $r['id'],
                        'name' => $r['name_en'],
                        'nameEn' => $r['name_en'],
                        'nameBn' => $r['name_bn'],
                        'slug' => $r['slug'],
                        'displayOrder' => (int)$r['display_order'],
                        'visible' => (bool)$r['visible']
                    ];
                }
                echo json_encode($cats);
            } elseif ($method === 'POST') {
                $catId = $body['id'] ?? ('cat-' . time());
                $stmt = $pdo->prepare("INSERT INTO categories (id, name_en, name_bn, slug, display_order, visible)
                    VALUES (:id, :ne, :nb, :slug, :o, :v)
                    ON DUPLICATE KEY UPDATE name_en = VALUES(name_en), name_bn = VALUES(name_bn), visible = VALUES(visible)");
                $stmt->execute([
                    ':id' => $catId,
                    ':ne' => $body['nameEn'] ?? ($body['name'] ?? ''),
                    ':nb' => $body['nameBn'] ?? '',
                    ':slug' => $body['slug'] ?? $catId,
                    ':o' => (int)($body['displayOrder'] ?? 0),
                    ':v' => (!isset($body['visible']) || $body['visible'] !== false) ? 1 : 0
                ]);
                echo json_encode(['success' => true, 'id' => $catId]);
            } elseif ($method === 'DELETE') {
                $stmt = $pdo->prepare("DELETE FROM categories WHERE id = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true, 'id' => $id]);
            }
            break;

        case 'products':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM products ORDER BY display_order ASC, created_at DESC");
                $prods = [];
                while ($r = $stmt->fetch()) {
                    $images = json_decode($r['images'] ?? '[]', true) ?? [];
                    $features = json_decode($r['features'] ?? '[]', true) ?? [];
                    $prods[] = [
                        'id' => $r['id'],
                        'name' => $r['name'],
                        'nameEn' => $r['name_en'] ?? $r['name'],
                        'nameBn' => $r['name_bn'] ?? $r['name'],
                        'slug' => $r['slug'],
                        'categoryId' => $r['category_id'],
                        'price' => (float)$r['price'],
                        'oldPrice' => $r['old_price'] ? (float)$r['old_price'] : null,
                        'badge' => $r['badge'],
                        'stock' => (int)$r['stock'],
                        'rating' => (float)$r['rating'],
                        'reviewCount' => (int)$r['review_count'],
                        'images' => $images,
                        'image' => $images[0] ?? '/assets/device.jpg',
                        'features' => $features,
                        'shortDesc' => $r['short_desc'],
                        'longDesc' => $r['long_desc'],
                        'isFeatured' => (bool)$r['is_featured'],
                        'visible' => (bool)$r['visible'],
                        'displayOrder' => (int)$r['display_order'],
                        'createdAt' => $r['created_at']
                    ];
                }
                echo json_encode($prods);
            } elseif ($method === 'POST') {
                $prodId = $body['id'] ?? ('prod-' . time());
                $stmt = $pdo->prepare("INSERT INTO products (
                    id, name, name_en, name_bn, slug, category_id, price, old_price,
                    badge, stock, rating, review_count, images, features,
                    short_desc, long_desc, is_featured, visible, display_order
                ) VALUES (
                    :id, :name, :nameEn, :nameBn, :slug, :catId, :price, :oldPrice,
                    :badge, :stock, :rating, :revCount, :images, :features,
                    :shortDesc, :longDesc, :isFeat, :visible, :dOrder
                ) ON DUPLICATE KEY UPDATE
                    name = VALUES(name), name_en = VALUES(name_en), name_bn = VALUES(name_bn),
                    category_id = VALUES(category_id), price = VALUES(price), old_price = VALUES(old_price),
                    badge = VALUES(badge), stock = VALUES(stock), images = VALUES(images), features = VALUES(features),
                    short_desc = VALUES(short_desc), long_desc = VALUES(long_desc),
                    is_featured = VALUES(is_featured), visible = VALUES(visible)");
                $stmt->execute([
                    ':id' => $prodId,
                    ':name' => $body['name'] ?? '',
                    ':nameEn' => $body['nameEn'] ?? ($body['name'] ?? ''),
                    ':nameBn' => $body['nameBn'] ?? ($body['name'] ?? ''),
                    ':slug' => $body['slug'] ?? $prodId,
                    ':catId' => $body['categoryId'] ?? null,
                    ':price' => (float)($body['price'] ?? 0),
                    ':oldPrice' => isset($body['oldPrice']) && $body['oldPrice'] > 0 ? (float)$body['oldPrice'] : null,
                    ':badge' => $body['badge'] ?? '',
                    ':stock' => (int)($body['stock'] ?? 10),
                    ':rating' => (float)($body['rating'] ?? 4.9),
                    ':revCount' => (int)($body['reviewCount'] ?? 20),
                    ':images' => json_encode($body['images'] ?? []),
                    ':features' => json_encode($body['features'] ?? []),
                    ':shortDesc' => $body['shortDesc'] ?? '',
                    ':longDesc' => $body['longDesc'] ?? '',
                    ':isFeat' => !empty($body['isFeatured']) ? 1 : 0,
                    ':visible' => (!isset($body['visible']) || $body['visible'] !== false) ? 1 : 0,
                    ':dOrder' => (int)($body['displayOrder'] ?? 0)
                ]);
                echo json_encode(['success' => true, 'id' => $prodId]);
            } elseif ($method === 'DELETE') {
                $stmt = $pdo->prepare("DELETE FROM products WHERE id = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true, 'id' => $id]);
            }
            break;

        case 'orders':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
                echo json_encode($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $orderId = $body['id'] ?? ('ORD-' . time());
                $stmt = $pdo->prepare("INSERT INTO orders (
                    id, customer_name, customer_phone, customer_email, delivery_address,
                    delivery_zone, delivery_fee, subtotal, total, payment_method, notes, status
                ) VALUES (:id, :name, :phone, :email, :addr, :zone, :fee, :sub, :tot, :pay, :notes, :st)");
                $stmt->execute([
                    ':id' => $orderId,
                    ':name' => $body['customerName'] ?? '',
                    ':phone' => $body['customerPhone'] ?? '',
                    ':email' => $body['customerEmail'] ?? '',
                    ':addr' => $body['deliveryAddress'] ?? '',
                    ':zone' => $body['deliveryZone'] ?? 'dhaka',
                    ':fee' => (float)($body['deliveryFee'] ?? 60),
                    ':sub' => (float)($body['subtotal'] ?? 0),
                    ':tot' => (float)($body['total'] ?? 0),
                    ':pay' => $body['paymentMethod'] ?? 'cash_on_delivery',
                    ':notes' => $body['notes'] ?? '',
                    ':st' => 'pending'
                ]);
                echo json_encode(['success' => true, 'id' => $orderId]);
            } elseif ($method === 'PUT') {
                $stmt = $pdo->prepare("UPDATE orders SET status = :st WHERE id = :id");
                $stmt->execute([':st' => $body['status'] ?? 'pending', ':id' => $id]);
                echo json_encode(['success' => true, 'id' => $id]);
            } elseif ($method === 'DELETE') {
                $stmt = $pdo->prepare("DELETE FROM orders WHERE id = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true, 'id' => $id]);
            }
            break;

        case 'inquiries':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM inquiries ORDER BY created_at DESC");
                echo json_encode($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $stmt = $pdo->prepare("INSERT INTO inquiries (customer_name, customer_phone, product_interest, message, status)
                    VALUES (:name, :phone, :prod, :msg, 'new')");
                $stmt->execute([
                    ':name' => $body['customerName'] ?? '',
                    ':phone' => $body['customerPhone'] ?? '',
                    ':prod' => $body['productInterest'] ?? '',
                    ':msg' => $body['message'] ?? ''
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            } elseif ($method === 'DELETE') {
                $stmt = $pdo->prepare("DELETE FROM inquiries WHERE id = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true, 'id' => $id]);
            }
            break;

        case 'media':
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

            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT id, url, file_name as fileName, COALESCE(storage_path, file_path) as storagePath, size, width, height, alt, uploaded_at as uploadedAt FROM media ORDER BY uploaded_at DESC");
                echo json_encode($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $mediaId = !empty($body['id']) ? $body['id'] : ('img_' . time() . '_' . substr(md5(uniqid()), 0, 6));
                $stmt = $pdo->prepare("INSERT INTO media (id, url, file_name, file_path, storage_path, size, width, height, alt)
                    VALUES (:id, :u, :fn, :fp, :sp, :sz, :w, :h, :alt)
                    ON DUPLICATE KEY UPDATE url = VALUES(url), alt = VALUES(alt)");
                $stmt->execute([
                    ':id' => $mediaId,
                    ':u' => $body['url'] ?? '',
                    ':fn' => $body['fileName'] ?? '',
                    ':fp' => $body['storagePath'] ?? ($body['filePath'] ?? ''),
                    ':sp' => $body['storagePath'] ?? ($body['filePath'] ?? ''),
                    ':sz' => (int)($body['size'] ?? 0),
                    ':w' => (int)($body['width'] ?? 0),
                    ':h' => (int)($body['height'] ?? 0),
                    ':alt' => $body['alt'] ?? ''
                ]);
                echo json_encode(['success' => true, 'id' => $mediaId]);
            } elseif ($method === 'DELETE') {
                $stmt = $pdo->prepare("DELETE FROM media WHERE id = :id OR file_name = :fn");
                $stmt->execute([':id' => $id, ':fn' => $id]);
                echo json_encode(['success' => true, 'id' => $id]);
            }
            break;

        case 'admins':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT id, email, role, display_name as displayName, created_at as createdAt FROM admins");
                echo json_encode($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $stmt = $pdo->prepare("INSERT INTO admins (email, role, password_hash, display_name)
                    VALUES (:em, :ro, 'fixed_hash', :dn)");
                $stmt->execute([
                    ':em' => strtolower(trim($body['email'] ?? '')),
                    ':ro' => $body['role'] ?? 'editor',
                    ':dn' => $body['displayName'] ?? 'Admin'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            } elseif ($method === 'DELETE') {
                $stmt = $pdo->prepare("DELETE FROM admins WHERE id = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true, 'id' => $id]);
            }
            break;

        case 'auth':
            if ($id === 'login' && $method === 'POST') {
                $email = strtolower(trim($body['email'] ?? ''));
                $password = $body['password'] ?? '';
                $adminEmail = strtolower(trim(getenv('ADMIN_EMAIL') ?: ''));
                $adminPassword = getenv('ADMIN_PASSWORD') ?: '';

                if ($adminEmail !== '' && $adminPassword !== '' && $email === $adminEmail && hash_equals($adminPassword, $password)) {
                    echo json_encode([
                        'success' => true,
                        'user' => ['email' => $adminEmail, 'role' => 'owner', 'displayName' => 'Pulmo Care Admin (Owner)']
                    ]);
                    exit;
                }

                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Invalid email or password.']);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'API route not found: ' . $resource]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
