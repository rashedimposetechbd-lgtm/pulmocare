-- ========================================================
-- Pulmo Care — Medical Devices & Sleep Care E-Commerce
-- Production MySQL Database Schema & Seed Data for cPanel
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Table structure for table `admins`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `role` ENUM('owner', 'editor') NOT NULL DEFAULT 'editor',
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(191) DEFAULT 'Administrator',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table structure for table `site_settings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `brand_name` VARCHAR(191) NOT NULL DEFAULT 'Pulmo Care',
  `tagline` VARCHAR(255) DEFAULT 'Better Breathing · Better Living',
  `tagline_bn` VARCHAR(255) DEFAULT 'শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে',
  `logo_url` LONGTEXT,
  `favicon_url` LONGTEXT,
  `phone` VARCHAR(50) DEFAULT '01337-708107',
  `whatsapp_number` VARCHAR(50) DEFAULT '8801337708107',
  `email` VARCHAR(191) DEFAULT 'pulmocare2@gmail.com',
  `address` TEXT,
  `facebook_url` TEXT,
  `top_bar_text` TEXT,
  `currency_symbol` VARCHAR(10) DEFAULT '৳',
  `delivery_dhaka` DECIMAL(10,2) DEFAULT 60.00,
  `delivery_outside` DECIMAL(10,2) DEFAULT 120.00,
  `seo_title` VARCHAR(255) DEFAULT 'Pulmo Care | রেসপিরেটরি ও স্লিপ কেয়ার ই-কমার্স — ঢাকা ও সারা বাংলাদেশ',
  `seo_description` TEXT,
  `seo_keywords` TEXT,
  `theme_color` VARCHAR(20) DEFAULT '#0284c7',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings` (
  `id`, `brand_name`, `tagline`, `tagline_bn`, `logo_url`, `favicon_url`,
  `phone`, `whatsapp_number`, `email`, `address`, `facebook_url`,
  `top_bar_text`, `currency_symbol`, `delivery_dhaka`, `delivery_outside`,
  `seo_title`, `seo_description`, `seo_keywords`, `theme_color`
) VALUES (
  1,
  'Pulmo Care',
  'Better Breathing · Better Living',
  'শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে',
  '/assets/pulmo_logo.jpg',
  '/assets/pulmo_logo.jpg',
  '01337-708107',
  '8801337708107',
  'pulmocare2@gmail.com',
  'হাউজ#২৪, রোড#১১, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ',
  'https://www.facebook.com/profile.php?id=61583772040813',
  'ঢাকা ও সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি ও ফ্রি সেটআপ সুবিধা',
  '৳',
  60.00,
  120.00,
  'Pulmo Care | রেসপিরেটরি ও স্লিপ কেয়ার ই-কমার্স — ঢাকা ও সারা বাংলাদেশ',
  'Pulmo Care (Respira) — শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে। জেনুইন CPAP, BiPAP, কম্প্রেসার নেবুলাইজার, পালস অক্সিমিটার ও বিপি মনিটরের বিশ্বস্ত ই-কমার্স শপ।',
  'Pulmo Care, CPAP machine Dhaka, Nebulizer Bangladesh, Pulse Oximeter Dhaka, BiPAP Dhaka, ResHope, Getwell Nebulizer',
  '#0284c7'
);

-- --------------------------------------------------------
-- 3. Table structure for table `categories`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name_en` VARCHAR(191) NOT NULL,
  `name_bn` VARCHAR(191) DEFAULT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `display_order` INT DEFAULT 0,
  `visible` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`id`, `name_en`, `name_bn`, `slug`, `display_order`, `visible`) VALUES
('cpap', 'CPAP & BiPAP', 'সিপ্যাপ ও বাইপ্যাপ', 'cpap', 1, 1),
('nebulizer', 'Nebulizers', 'নেবুলাইজার', 'nebulizer', 2, 1),
('monitors', 'Health Monitors', 'মেডিকেল মনিটর', 'monitors', 3, 1),
('masks', 'Masks & Tubing', 'মাস্ক ও এক্সেসরিজ', 'masks', 4, 1);

-- --------------------------------------------------------
-- 4. Table structure for table `products`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` VARCHAR(128) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `name_en` VARCHAR(255) DEFAULT NULL,
  `name_bn` VARCHAR(255) DEFAULT NULL,
  `slug` VARCHAR(191) DEFAULT NULL,
  `category_id` VARCHAR(64) DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `old_price` DECIMAL(10,2) DEFAULT 0.00,
  `badge` VARCHAR(100) DEFAULT 'ইন স্টক',
  `stock` INT DEFAULT 10,
  `rating` DECIMAL(3,2) DEFAULT 4.90,
  `review_count` INT DEFAULT 20,
  `images` LONGTEXT DEFAULT NULL,
  `features` LONGTEXT DEFAULT NULL,
  `short_desc` TEXT DEFAULT NULL,
  `long_desc` LONGTEXT DEFAULT NULL,
  `is_featured` TINYINT(1) DEFAULT 0,
  `visible` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`category_id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (
  `id`, `name`, `name_en`, `name_bn`, `slug`, `category_id`, `price`, `old_price`,
  `badge`, `stock`, `rating`, `review_count`, `images`, `features`,
  `short_desc`, `long_desc`, `is_featured`, `visible`, `display_order`
) VALUES
(
  'reshope-cpap',
  'ResHope Auto CPAP / BiPAP Device',
  'ResHope Auto CPAP / BiPAP Device',
  'রেসহোপ অটো সিপ্যাপ ও বাইপ্যাপ মেশিন',
  'reshope-cpap',
  'cpap',
  68000.00,
  75000.00,
  'Flagship Therapy',
  5,
  4.90,
  42,
  '["/assets/reshope_cpap.jpg", "/assets/device.jpg"]',
  '["Self-titrating auto pressure algorithm (4 - 25 cmH₂O)", "Built-in heated water chamber humidifier", "Ultra-silent whisper blower (<26 dB)", "Digital color LCD telemetry monitor", "Heated corrugated breathing tube included"]',
  'প্রিমিয়াম অটো সিপ্যাপ ডিভাইস — স্লিপ অ্যাপনিয়া ও শ্বাসকষ্টের রোগীদের জন্য নীরব ও স্বস্তিদায়ক সমাধান।',
  'ResHope Auto CPAP & BiPAP সিস্টেম স্লিপ অ্যাপনিয়া ও সিওপিডি রোগীদের শ্বাসপ্রশ্বাসে স্বয়ংক্রিয় ইতিবাচক বায়ুচাপ প্রদান করে স্বাভাবিক ও প্রশান্ত ঘুম নিশ্চিত করে।',
  1,
  1,
  1
),
(
  'getwell-nebulizer',
  'GETWELL™ Compressor Nebulizer Machine',
  'GETWELL™ Compressor Nebulizer Machine',
  'গেটওয়েল কম্প্রেসার নেবুলাইজার মেশিন',
  'getwell-nebulizer',
  'nebulizer',
  2800.00,
  3400.00,
  'Best Seller',
  25,
  4.90,
  68,
  '["/assets/nebulizer_box.jpg", "/assets/nebulizer_device.jpg"]',
  '["Powerful piston compressor pump", "Ultra-fine aerosol particle size (MMAD < 3.0 µm)", "Full medication cup with adult & pediatric masks", "Low vibration silent operation", "Easy one-button operation for home care"]',
  'শক্তিশালী পিস্টন পাম্প নেবুলাইজার — অ্যাজমা, অ্যালার্জি ও ব্রঙ্কাইটিসের দ্রুত ওষুধ পৌঁছাতে অত্যন্ত কার্যকর।',
  'GETWELL কম্প্রেসার নেবুলাইজার তরল ওষুধকে সূক্ষ্ম কুয়াশায় রূপান্তর করে ফুসফুসের গভীরে সরাসরি পৌঁছে দেয়।',
  0,
  1,
  2
),
(
  'jumper-oximeter',
  'JUMPER™ Fingertip Pulse Oximeter (JPD-500D)',
  'JUMPER™ Fingertip Pulse Oximeter (JPD-500D)',
  'জাম্পার ফিঙ্গারটিপ পালস অক্সিমিটার',
  'jumper-oximeter',
  'monitors',
  1650.00,
  2200.00,
  'FDA Approved',
  40,
  4.80,
  54,
  '["/assets/pulse_oximeter.jpg"]',
  '["Dual-color OLED bright display", "Accurate SpO₂ and Pulse Rate with plethysmograph wave", "Audible alarm & visual pulse bar graph", "Auto power-off after 10 seconds of finger removal", "Lanyard & AAA batteries included"]',
  'ক্লিনিক্যাল নির্ভুলতার পালস অক্সিমিটার — তাৎক্ষণিক রক্তের অক্সিজেন মাত্রা ও পালস রেট পরিমাপের জন্য।',
  'JUMPER JPD-500D পালস অক্সিমিটার উচ্চ সংবেদনশীল সেন্সর দিয়ে কয়েক সেকেন্ডে রক্তে অক্সিজেনের মাত্রা প্রকাশ করে।',
  0,
  1,
  3
),
(
  'bp-monitor-digital',
  'Automatic Digital Arm Blood Pressure Monitor',
  'Automatic Digital Arm Blood Pressure Monitor',
  'ডিজিটাল আর্ম ব্লাড প্রেশার মনিটর',
  'bp-monitor-digital',
  'monitors',
  2450.00,
  3100.00,
  'High Precision',
  18,
  4.80,
  31,
  '["/assets/bp_monitor.jpg"]',
  '["One-touch fast automatic inflation", "WHO blood pressure indicator color bar", "2 x 99 memory sets for dual users", "Irregular heartbeat (IHB) detector", "Large wide-angle backlight LCD screen"]',
  'স্বয়ংক্রিয় ডিজিটাল বিপি মনিটর — ঘরে বসেই সঠিক রক্তচাপ ও অনিয়মিত হৃদস্পন্দন পর্যবেক্ষণ করুন।',
  'সহজে পরিধানযোগ্য কাফ ও লার্জ ব্যাকলাইট ডিসপ্লে সহ রক্তচাপ পরিমাপক যন্ত্র।',
  0,
  1,
  4
),
(
  'cpap-mask-nasal',
  'Ergonomic Silicone Nasal Mask with Headgear',
  'Ergonomic Silicone Nasal Mask with Headgear',
  'সিলিকন সিপ্যাপ ন্যাসাল মাস্ক ও হেডগিয়ার',
  'cpap-mask-nasal',
  'masks',
  4500.00,
  5500.00,
  'Zero-Leak Design',
  12,
  4.70,
  19,
  '["/assets/cpap_mask.jpg"]',
  '["Ultra-soft medical grade liquid silicone cushion", "360-degree swivel elbow for free sleeping movement", "Quick-release magnetic headgear clips", "Multi-hole quiet air vent diffusion"]',
  'আল্ট্রা-সফট সিলিকন ন্যাসাল মাস্ক — লিক-প্রুফ সিল ও রাতের শান্ত ঘুমের নিশ্চয়তা।',
  'সিপ্যাপ মেশিনের সাথে ব্যবহারের জন্য প্রিমিয়াম ন্যাসাল মাস্ক।',
  0,
  1,
  5
),
(
  'heated-tube',
  'Heated Corrugated CPAP Breathing Tube (1.8m)',
  'Heated Corrugated CPAP Breathing Tube (1.8m)',
  'হিটেড সিপ্যাপ ব্রিদিং টিউব (১.৮ মিটার)',
  'heated-tube',
  'masks',
  3200.00,
  3800.00,
  'Anti-Rainout',
  15,
  4.90,
  14,
  '["/assets/breathing_tube.jpg"]',
  '["Integrated copper heating coil prevents condensation/rainout", "Universal standard 22mm connector", "1.8 meter flexible length for free body turning", "Temperature regulated by device humidification"]',
  'হিটেড ব্রিদিং টিউব — টিউবে পানির ফোঁটা জমা হওয়া রোধ করে ও আর্দ্র উষ্ণ বায়ু প্রবাহ বজায় রাখে।',
  'উচ্চমানের গরম করার সুবিধা সম্বলিত সিপ্যাপ টিউব।',
  0,
  1,
  6
);

-- --------------------------------------------------------
-- 5. Table structure for table `media`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `media`;
CREATE TABLE `media` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `media` (`id`, `file_name`, `url`, `storage_path`, `file_path`, `size`, `width`, `height`, `alt`) VALUES
('img_logo', 'pulmo_logo.jpg', '/assets/pulmo_logo.jpg', 'assets/pulmo_logo.jpg', 'assets/pulmo_logo.jpg', 64200, 400, 400, 'Pulmo Care Brand Logo'),
('img_cpap', 'reshope_cpap.jpg', '/assets/reshope_cpap.jpg', 'assets/reshope_cpap.jpg', 'assets/reshope_cpap.jpg', 124000, 800, 800, 'ResHope CPAP Machine'),
('img_neb_box', 'nebulizer_box.jpg', '/assets/nebulizer_box.jpg', 'assets/nebulizer_box.jpg', 'assets/nebulizer_box.jpg', 98000, 800, 800, 'Nebulizer Package Box'),
('img_neb_dev', 'nebulizer_device.jpg', '/assets/nebulizer_device.jpg', 'assets/nebulizer_device.jpg', 'assets/nebulizer_device.jpg', 95000, 800, 800, 'Nebulizer Device'),
('img_oximeter', 'pulse_oximeter.jpg', '/assets/pulse_oximeter.jpg', 'assets/pulse_oximeter.jpg', 'assets/pulse_oximeter.jpg', 84000, 800, 800, 'Pulse Oximeter'),
('img_bp', 'bp_monitor.jpg', '/assets/bp_monitor.jpg', 'assets/bp_monitor.jpg', 'assets/bp_monitor.jpg', 105000, 800, 800, 'Digital Blood Pressure Monitor'),
('img_mask', 'cpap_mask.jpg', '/assets/cpap_mask.jpg', 'assets/cpap_mask.jpg', 'assets/cpap_mask.jpg', 72000, 800, 800, 'CPAP Silicone Mask'),
('img_tube', 'breathing_tube.jpg', '/assets/breathing_tube.jpg', 'assets/breathing_tube.jpg', 'assets/breathing_tube.jpg', 68000, 800, 800, 'Heated Breathing Tube');

-- --------------------------------------------------------
-- 6. Table structure for table `orders`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` VARCHAR(128) PRIMARY KEY,
  `customer_name` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `customer_address` TEXT NOT NULL,
  `zone` VARCHAR(50) DEFAULT 'dhaka',
  `items` LONGTEXT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `delivery_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `channel` ENUM('cod', 'whatsapp') DEFAULT 'cod',
  `status` ENUM('new', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'new',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`status`),
  INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Initial Orders
INSERT INTO `orders` (`id`, `customer_name`, `customer_phone`, `customer_address`, `zone`, `items`, `subtotal`, `delivery_charge`, `total`, `channel`, `status`, `notes`) VALUES
(
  'ord_1740001001',
  'Dr. Mahmudur Rahman',
  '01712-345678',
  'Flat 4B, Concord Tower, Dhanmondi 27, Dhaka',
  'dhaka',
  '[{"productId": "reshope-cpap", "name": "ResHope Auto CPAP / BiPAP Device", "price": 68000, "qty": 1}]',
  68000.00,
  60.00,
  68060.00,
  'cod',
  'confirmed',
  'Customer requested installation demo at home.'
),
(
  'ord_1740001002',
  'Shamim Ahsan',
  '01819-876543',
  'House 12, Road 4, Sector 7, Uttara, Dhaka',
  'dhaka',
  '[{"productId": "getwell-nebulizer", "name": "GETWELL™ Compressor Nebulizer Machine", "price": 2800, "qty": 1}, {"productId": "jumper-oximeter", "name": "JUMPER™ Fingertip Pulse Oximeter", "price": 1650, "qty": 1}]',
  4450.00,
  60.00,
  4510.00,
  'whatsapp',
  'new',
  'Order initiated via WhatsApp catalog.'
);

-- --------------------------------------------------------
-- 7. Table structure for table `inquiries`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `inquiries`;
CREATE TABLE `inquiries` (
  `id` VARCHAR(128) PRIMARY KEY,
  `customer_name` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `product_name` VARCHAR(255) DEFAULT NULL,
  `message` TEXT DEFAULT NULL,
  `status` ENUM('new', 'contacted', 'closed') DEFAULT 'new',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `inquiries` (`id`, `customer_name`, `customer_phone`, `product_name`, `message`, `status`) VALUES
(
  'inq_1740002001',
  'Engineer Tanvir Hossain',
  '01911-223344',
  'ResHope Auto CPAP / BiPAP Device',
  'Doctor prescribed auto CPAP pressure between 8 to 14. Can you set it up for me?',
  'new'
);

-- --------------------------------------------------------
-- 8. Table structure for table `page_sections`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `page_sections`;
CREATE TABLE `page_sections` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) DEFAULT NULL,
  `content_data` LONGTEXT NOT NULL,
  `visible` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `page_sections` (`id`, `title`, `content_data`, `visible`, `display_order`) VALUES
(
  'hero',
  'Hero Banner Section',
  '{"title":"শ্বাস নিতে স্বস্তি,","titleHighlight":"যত্ন হোক সহজে","eyebrow":"Your Trusted Respiratory Care Partner · ঢাকা","description":"স্লিপ অ্যাপনিয়া, হাঁপানি, অ্যালার্জি ও ব্রঙ্কাইটিস রোগীদের জন্য ১০০% জেনুইন ResHope Auto CPAP/BiPAP, GETWELL কম্প্রেসার নেবুলাইজার এবং ক্লিনিক্যাল ডিজিটাল হেলথ মনিটর।","ctaPrimaryText":"পণ্যসমূহ ব্রাউজ করুন","ctaPrimaryLink":"#products","ctaWhatsappText":"হোয়াটসঅ্যাপে অর্ডার","featuredProductId":"reshope-cpap","trustItems":[{"icon":"🛡️","text":"১ বছরের ওয়ারেন্টি"},{"icon":"🚚","text":"দ্রুত হোম ডেলিভারি"},{"icon":"👨‍⚕️","text":"সার্টিফায়েড এক্সপার্ট সেটআপ"}]}',
  1,
  1
),
(
  'trustStrip',
  'Trust Badges Strip',
  '{"items":[{"icon":"🏪","title":"ধানমন্ডি শোরুম","sub":"হাউজ#২৪, রোড#১১, ঢাকা-১২০৫"},{"icon":"📦","title":"ক্যাশ অন ডেলিভারি","sub":"পণ্য দেখে মূল্য পরিশোধ"},{"icon":"🔧","title":"ফ্রি প্রেসার ক্যালিব্রেশন","sub":"ডাক্তারের প্রেসক্রিপশন অনুযায়ী"},{"icon":"📞","title":"২৪/৭ অন-কল হেল্পলাইন","sub":"০১৩৩৭-৭০৮১০৭"}]}',
  1,
  2
),
(
  'about',
  'About Company Section',
  '{"badge":"আমাদের প্রতিশ্রুতি","title":"Pulmo Care — রেসপিরেটরি ও স্লিপ স্বাস্থ্যের বিশ্বস্ত ঠিকানা","description":"ঢাকায় প্রতিষ্ঠিত Pulmo Care শ্বাসকষ্ট, স্লিপ অ্যাপনিয়া ও দীর্ঘস্থায়ী ফুসফুসের রোগে আক্রান্ত রোগীদের সর্বোত্তম সেবা নিশ্চিত করতে প্রতিশ্রুতিবদ্ধ। আমরা সরাসরি আসল উৎপাদক থেকে আমদানি করা আন্তর্জাতিক মানের ডিভাইস সরবরাহ করি।","imageUrl":"/assets/about.jpg","points":["১০০% জেনুইন ও ইন-ট্যাক্ট বক্স মেডিকেল ডিভাইস","ঢাকার ভেতরে দ্রুততম হোম ডেলিভারি ও হ্যান্ডস-অন ডেমো","প্রশিক্ষিত টেকনিশিয়ান দ্বারা রোগীর সুবিধাজনক মাস্ক ফিটিং","বিক্রয়োত্তর সার্ভিসিং, ফিল্টার ও এক্সেসরিজ রিপ্লেসমেন্ট সাপোর্ট"]}',
  1,
  6
);

SET FOREIGN_KEY_CHECKS = 1;
