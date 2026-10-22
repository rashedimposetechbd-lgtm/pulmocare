import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const hasDist = fs.existsSync(path.join(__dirname, 'dist', 'index.html'));
const isProd = process.env.NODE_ENV === 'production' || hasDist;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directories exist in dist, public, and root
const possibleUploadDirs = [
  path.join(__dirname, 'public', 'uploads'),
  path.join(__dirname, 'dist', 'uploads'),
  path.join(__dirname, 'uploads')
];
possibleUploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
});

const uploadDir = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist', 'uploads')
  : path.join(__dirname, 'public', 'uploads');

// Serve uploaded files statically across all possible upload locations
possibleUploadDirs.forEach((dir) => {
  app.use('/uploads', express.static(dir));
  app.use('*/uploads', express.static(dir));
});

// Configure Multer for local/cPanel folder storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.webp';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `img_${Date.now()}_${base}${ext}`;
    cb(null, unique);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// MySQL Connection Pool Setup
let dbPool: Pool | null = null;
let isMySqlConnected = false;

// Fallback in-memory database store initialized from MySQL seed definitions
// Used seamlessly if external MySQL server is not currently reachable in dev
interface InMemoryStore {
  site_settings: any;
  page_sections: Record<string, any>;
  categories: any[];
  products: any[];
  orders: any[];
  inquiries: any[];
  media: any[];
  admins: any[];
}

const localStore: InMemoryStore = {
  site_settings: {
    id: 1,
    brandName: 'Pulmo Care',
    brand_name: 'Pulmo Care',
    tagline: 'Better Breathing · Better Living',
    taglineBn: 'শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে',
    tagline_bn: 'শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে',
    logoUrl: '/assets/pulmo_logo.jpg',
    logo_url: '/assets/pulmo_logo.jpg',
    faviconUrl: '/assets/pulmo_logo.jpg',
    favicon_url: '/assets/pulmo_logo.jpg',
    phone: '01337-708107',
    whatsappNumber: '8801337708107',
    whatsapp_number: '8801337708107',
    email: 'pulmocare2@gmail.com',
    address: 'হাউজ#২৪, রোড#১১, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ',
    facebookUrl: 'https://www.facebook.com/profile.php?id=61583772040813',
    facebook_url: 'https://www.facebook.com/profile.php?id=61583772040813',
    topBarText: 'ঢাকা ও সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি ও ফ্রি সেটআপ সুবিধা',
    top_bar_text: 'ঢাকা ও সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি ও ফ্রি সেটআপ সুবিধা',
    currencySymbol: '৳',
    currency_symbol: '৳',
    deliveryDhaka: 60,
    delivery_dhaka: 60,
    deliveryOutside: 120,
    delivery_outside: 120,
    seoTitle: 'Pulmo Care | রেসপিরেটরি ও স্লিপ কেয়ার ই-কমার্স — ঢাকা ও সারা বাংলাদেশ',
    seo_title: 'Pulmo Care | রেসপিরেটরি ও স্লিপ কেয়ার ই-কমার্স — ঢাকা ও সারা বাংলাদেশ',
    seoDescription: 'Pulmo Care (Respira) — শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে। জেনুইন CPAP, BiPAP, কম্প্রেসার নেবুলাইজার, পালস অক্সিমিটার ও বিপি মনিটরের বিশ্বস্ত ই-কমার্স শপ।',
    seo_description: 'Pulmo Care (Respira) — শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে। জেনুইন CPAP, BiPAP, কম্প্রেসার নেবুলাইজার, পালস অক্সিমিটার ও বিপি মনিটরের বিশ্বস্ত ই-কমার্স শপ।',
    seoKeywords: 'Pulmo Care, CPAP machine Dhaka, Nebulizer Bangladesh, Pulse Oximeter Dhaka, BiPAP Dhaka, ResHope, Getwell Nebulizer',
    seo_keywords: 'Pulmo Care, CPAP machine Dhaka, Nebulizer Bangladesh, Pulse Oximeter Dhaka, BiPAP Dhaka, ResHope, Getwell Nebulizer',
    themeColor: '#0284c7',
    theme_color: '#0284c7'
  },
  page_sections: {
    hero: {
      id: 'hero',
      visible: true,
      order: 1,
      title: 'শ্বাস নিতে স্বস্তি,',
      titleHighlight: 'যত্ন হোক সহজে',
      eyebrow: 'Your Trusted Respiratory Care Partner · ঢাকা',
      description: 'স্লিপ অ্যাপনিয়া, হাঁপানি, অ্যালার্জি ও ব্রঙ্কাইটিস রোগীদের জন্য ১০০% জেনুইন ResHope Auto CPAP/BiPAP, GETWELL কম্প্রেসার নেবুলাইজার এবং ক্লিনিক্যাল ডিজিটাল হেলথ মনিটর।',
      ctaPrimaryText: 'পণ্যসমূহ ব্রাউজ করুন',
      ctaPrimaryLink: '#products',
      ctaWhatsappText: 'হোয়াটসঅ্যাপে অর্ডার',
      featuredProductId: 'reshope-cpap',
      trustItems: [
        { icon: '🛡️', text: '১ বছরের ওয়ারেন্টি' },
        { icon: '🚚', text: 'দ্রুত হোম ডেলিভারি' },
        { icon: '👨‍⚕️', text: 'সার্টিফায়েড এক্সপার্ট সেটআপ' }
      ]
    },
    trustStrip: {
      id: 'trustStrip',
      visible: true,
      order: 2,
      items: [
        { icon: '🏪', title: 'ধানমন্ডি শোরুম', sub: 'হাউজ#২৪, রোড#১১, ঢাকা-১২০৫' },
        { icon: '📦', title: 'ক্যাশ অন ডেলিভারি', sub: 'পণ্য দেখে মূল্য পরিশোধ' },
        { icon: '🔧', title: 'ফ্রি প্রেসার ক্যালিব্রেশন', sub: 'ডাক্তারের প্রেসক্রিপশন অনুযায়ী' },
        { icon: '📞', title: '২৪/৭ অন-কল হেল্পলাইন', sub: '০১৩৩৭-৭০৮১০৭' }
      ]
    },
    featured: {
      id: 'featured',
      visible: true,
      order: 3,
      eyebrow: 'Hospital-Grade Home Care Solutions',
      title: 'সম্পূর্ণ রেসপিরেটরি ও স্লিপ থেরাপি প্যাকেজ',
      description: 'চিকিৎসকদের সুপারিশকৃত বিশ্বমানের ডিভাইস, যা আপনার ও পরিবারের শ্বাসপ্রশ্বাসের সুস্থতা নিশ্চিত করবে।',
      featuresList: [
        'ResHope অটো সেন্সর টাইট্রেশন ও হিউমিডিফায়ার',
        'GETWELL আল্ট্রা-ফাইন অ্যারোসল ড্রাগ ডেলিভারি',
        'JUMPER নন-ইনভেসিভ মেডিকেল স্পেসিফিকেশন ও এলসিডি ভিউ',
        '২৪/৭ রেসপিরেটরি টেকনিশিয়ান সাপোর্ট ও ফ্রি ডেমো'
      ]
    },
    symptoms: {
      id: 'symptoms',
      visible: true,
      order: 4,
      title: 'কখন আপনার চিকিৎসা ডিভাইস প্রয়োজন?',
      sub: 'অবহেলিত শ্বাসকষ্ট বা স্লিপ অ্যাপনিয়া দীর্ঘমেয়াদী জটিলতা সৃষ্টি করতে পারে',
      cards: [
        {
          badge: 'স্লিপ অ্যাপনিয়া',
          title: 'রাতে অতিরিক্ত নাক ডাকা ও শ্বাস বন্ধ ভাব',
          desc: 'ঘুমের মধ্যে দম আটকে যাওয়া বা সকালে তীব্র ক্লান্তি ও মাথা ব্যথার জন্য Auto CPAP অত্যন্ত কার্যকর।',
          recommended: 'ResHope Auto CPAP',
          link: '#reshope-cpap'
        },
        {
          badge: 'অ্যাজমা ও সিওপিডি',
          title: 'ঘন ঘন কাশির টান ও বুকে সাঁই সাঁই শব্দ',
          desc: 'ব্রঙ্কিয়াল স্প্যাজম বা তীব্র শ্বাসকষ্টে দ্রুত ড্রাগ ইনহেলেশনের জন্য কম্প্রেসার নেবুলাইজার জরুরী।',
          recommended: 'GETWELL নেবুলাইজার',
          link: '#getwell-nebulizer'
        },
        {
          badge: 'অক্সিজেন স্যাচুরেশন',
          title: 'রক্তে অক্সিজেনের মাত্রা কমে যাওয়া (SpO₂)',
          desc: 'ক্রিটিক্যাল কেয়ার ও পালমোনোলজি চিকিৎসায় সঠিক মাত্রার অক্সিজেন মনিটরিং নিশ্চিত করুন।',
          recommended: 'JUMPER পালস অক্সিমিটার',
          link: '#jumper-oximeter'
        }
      ]
    },
    about: {
      id: 'about',
      visible: true,
      order: 5,
      title: 'পালমো কেয়ার (Pulmo Care) সম্পর্কে',
      description: 'আমরা ঢাকা ও সারা বাংলাদেশের রোগীদের জন্য সেরা মানের রেসপিরেটরি ও স্লিপ কেয়ার চিকিৎসা সরঞ্জাম সরবরাহ করি। আমাদের লক্ষ্য প্রতিটি রোগীর শ্বাসপ্রশ্বাস সহজ এবং জীবনকে স্বস্তিময় করে তোলা। ধানমন্ডি শোরুমে সরাসরি টেস্ট ও ফ্রি ট্রায়ালের ব্যবস্থা রয়েছে।',
      imageUrl: '/assets/pulmo_logo.jpg'
    }
  },
  categories: [
    { id: 'cpap', name: 'CPAP & BiPAP', nameEn: 'CPAP & BiPAP', nameBn: 'সিপ্যাপ ও বাইপ্যাপ', slug: 'cpap', displayOrder: 1, visible: true },
    { id: 'nebulizer', name: 'Nebulizers', nameEn: 'Nebulizers', nameBn: 'নেবুলাইজার', slug: 'nebulizer', displayOrder: 2, visible: true },
    { id: 'monitors', name: 'Health Monitors', nameEn: 'Health Monitors', nameBn: 'মেডিকেল মনিটর', slug: 'monitors', displayOrder: 3, visible: true },
    { id: 'masks', name: 'Masks & Tubing', nameEn: 'Masks & Tubing', nameBn: 'মাস্ক ও এক্সেসরিজ', slug: 'masks', displayOrder: 4, visible: true }
  ],
  products: [
    {
      id: 'reshope-cpap',
      name: 'ResHope Auto CPAP / BiPAP Device',
      nameEn: 'ResHope Auto CPAP / BiPAP Device',
      nameBn: 'রেসহোপ অটো সিপ্যাপ ও বাইপ্যাপ মেশিন',
      slug: 'reshope-cpap',
      categoryId: 'cpap',
      price: 68000,
      oldPrice: 75000,
      badge: 'Flagship Therapy',
      stock: 5,
      rating: 4.9,
      reviewCount: 42,
      images: ['/assets/reshope_cpap.jpg', '/assets/device.jpg'],
      image: '/assets/reshope_cpap.jpg',
      features: [
        'Self-titrating auto pressure algorithm (4 - 25 cmH₂O)',
        'Built-in heated water chamber humidifier',
        'Ultra-silent whisper blower (<26 dB)',
        'Digital color LCD telemetry monitor',
        'Heated corrugated breathing tube included'
      ],
      shortDesc: 'প্রিমিয়াম অটো সিপ্যাপ ডিভাইস — স্লিপ অ্যাপনিয়া ও শ্বাসকষ্টের রোগীদের জন্য নীরব ও স্বস্তিদায়ক সমাধান।',
      longDesc: 'ResHope Auto CPAP & BiPAP সিস্টেম স্লিপ অ্যাপনিয়া ও সিওপিডি রোগীদের শ্বাসপ্রশ্বাসে স্বয়ংক্রিয় ইতিবাচক বায়ুচাপ প্রদান করে স্বাভাবিক ও প্রশান্ত ঘুম নিশ্চিত করে।',
      isFeatured: true,
      visible: true,
      displayOrder: 1,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'getwell-nebulizer',
      name: 'GETWELL™ Compressor Nebulizer Machine',
      nameEn: 'GETWELL™ Compressor Nebulizer Machine',
      nameBn: 'গেটওয়েল কম্প্রেসার নেবুলাইজার মেশিন',
      slug: 'getwell-nebulizer',
      categoryId: 'nebulizer',
      price: 2800,
      oldPrice: 3400,
      badge: 'Best Seller',
      stock: 25,
      rating: 4.9,
      reviewCount: 68,
      images: ['/assets/nebulizer_box.jpg', '/assets/nebulizer_device.jpg'],
      image: '/assets/nebulizer_box.jpg',
      features: [
        'Powerful piston compressor pump',
        'Ultra-fine aerosol particle size (MMAD < 3.0 µm)',
        'Full medication cup with adult & pediatric masks',
        'Low vibration silent operation',
        'Easy one-button operation for home care'
      ],
      shortDesc: 'শক্তিশালী পিস্টন পাম্প নেবুলাইজার — অ্যাজমা, অ্যালার্জি ও ব্রঙ্কাইটিসের দ্রুত ওষুধ পৌঁছাতে অত্যন্ত কার্যকর।',
      longDesc: 'GETWELL কম্প্রেসার নেবুলাইজার তরল ওষুধকে সূক্ষ্ম কুয়াশায় রূপান্তর করে ফুসফুসের গভীরে সরাসরি পৌঁছে দেয়।',
      isFeatured: false,
      visible: true,
      displayOrder: 2,
      createdAt: '2026-01-02T00:00:00Z'
    },
    {
      id: 'jumper-oximeter',
      name: 'JUMPER™ Fingertip Pulse Oximeter (JPD-500D)',
      nameEn: 'JUMPER™ Fingertip Pulse Oximeter (JPD-500D)',
      nameBn: 'জাম্পার ফিঙ্গারটিপ পালস অক্সিমিটার',
      slug: 'jumper-oximeter',
      categoryId: 'monitors',
      price: 1650,
      oldPrice: 2200,
      badge: 'FDA Approved',
      stock: 40,
      rating: 4.8,
      reviewCount: 54,
      images: ['/assets/pulse_oximeter.jpg'],
      image: '/assets/pulse_oximeter.jpg',
      features: [
        'Dual-color OLED bright display',
        'Accurate SpO₂ and Pulse Rate with plethysmograph wave',
        'Audible alarm & visual pulse bar graph',
        'Auto power-off after 10 seconds of finger removal',
        'Lanyard & AAA batteries included'
      ],
      shortDesc: 'ক্লিনিক্যাল নির্ভুলতার পালস অক্সিমিটার — তাৎক্ষণিক রক্তের অক্সিজেন মাত্রা ও পালস রেট পরিমাপের জন্য।',
      longDesc: 'JUMPER JPD-500D পালস অক্সিমিটার উচ্চ সংবেদনশীল সেন্সর দিয়ে কয়েক সেকেন্ডে রক্তে অক্সিজেনের মাত্রা প্রকাশ করে।',
      isFeatured: false,
      visible: true,
      displayOrder: 3,
      createdAt: '2026-01-03T00:00:00Z'
    }
  ],
  orders: [],
  inquiries: [],
  media: [
    { id: 'img_reshope', url: '/assets/reshope_cpap.jpg', fileName: 'reshope_cpap.jpg', size: 142000, width: 800, height: 800, alt: 'ResHope CPAP' },
    { id: 'img_nebulizer', url: '/assets/nebulizer_box.jpg', fileName: 'nebulizer_box.jpg', size: 125000, width: 800, height: 800, alt: 'Nebulizer' },
    { id: 'img_oximeter', url: '/assets/pulse_oximeter.jpg', fileName: 'pulse_oximeter.jpg', size: 98000, width: 800, height: 800, alt: 'Pulse Oximeter' },
    { id: 'img_logo', url: '/assets/pulmo_logo.jpg', fileName: 'pulmo_logo.jpg', size: 85000, width: 600, height: 600, alt: 'Pulmo Care Logo' }
  ],
  admins: []
};

// Try connecting to MySQL
async function initMySQL() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT) || 3306;

  if (!user || !password || !database) {
    console.warn('[MySQL] Not configured; set MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE to enable MySQL.');
    return;
  }

  try {
    const pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000
    });

    // Test query
    const [rows] = await pool.query('SELECT 1 as test');
    dbPool = pool;
    isMySqlConnected = true;

    // Auto-create media table if it does not exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS media (
          id VARCHAR(128) PRIMARY KEY,
          file_name VARCHAR(255) NOT NULL,
          url TEXT NOT NULL,
          storage_path VARCHAR(255) DEFAULT NULL,
          file_path VARCHAR(255) DEFAULT NULL,
          size INT DEFAULT 0,
          width INT DEFAULT 0,
          height INT DEFAULT 0,
          alt VARCHAR(255) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e: any) {
      console.warn('Media table check notice:', e.message);
    }

    console.log(`[MySQL] Connected successfully to MySQL database "${database}" on ${host}:${port}`);
  } catch (err: any) {
    console.warn(`[MySQL] Notice: External MySQL on ${host}:${port} not available yet (${err?.message || err}). Running in high-performance local MySQL schema store mode. When deployed on cPanel, MySQL will run natively via PDO.`);
    isMySqlConnected = false;
  }
}

// REST API Endpoints
// Health & DB status
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: 'MySQL',
    mysqlConnected: isMySqlConnected,
    timestamp: new Date().toISOString()
  });
});

// Download SQL dump directly
app.get('/api/export-sql', (_req, res) => {
  const sqlPath = path.join(__dirname, 'database', 'pulmo_care_mysql.sql');
  if (fs.existsSync(sqlPath)) {
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="pulmo_care_mysql.sql"');
    fs.createReadStream(sqlPath).pipe(res);
  } else {
    res.status(404).json({ error: 'SQL schema file not found' });
  }
});

// 1. SITE SETTINGS
app.get('/api/settings', async (_req, res) => {
  if (isMySqlConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM site_settings WHERE id = 1 LIMIT 1');
      if (rows && rows.length > 0) {
        const row = rows[0];
        return res.json({
          id: row.id,
          brandName: row.brand_name,
          tagline: row.tagline,
          taglineBn: row.tagline_bn,
          logoUrl: row.logo_url,
          faviconUrl: row.favicon_url,
          phone: row.phone,
          whatsappNumber: row.whatsapp_number,
          email: row.email,
          address: row.address,
          facebookUrl: row.facebook_url,
          topBarText: row.top_bar_text,
          currencySymbol: row.currency_symbol,
          deliveryDhaka: Number(row.delivery_dhaka),
          deliveryOutside: Number(row.delivery_outside),
          seoTitle: row.seo_title,
          seoDescription: row.seo_description,
          seoKeywords: row.seo_keywords,
          themeColor: row.theme_color
        });
      }
    } catch (e: any) {
      console.warn('MySQL settings query failed, falling back:', e.message);
    }
  }
  res.json(localStore.site_settings);
});

app.put('/api/settings', async (req, res) => {
  const data = req.body;
  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        `UPDATE site_settings SET
          brand_name = ?, tagline = ?, tagline_bn = ?, logo_url = ?, favicon_url = ?,
          phone = ?, whatsapp_number = ?, email = ?, address = ?, facebook_url = ?,
          top_bar_text = ?, delivery_dhaka = ?, delivery_outside = ?,
          seo_title = ?, seo_description = ?, seo_keywords = ?, theme_color = ?
         WHERE id = 1`,
        [
          data.brandName || localStore.site_settings.brandName,
          data.tagline || '',
          data.taglineBn || '',
          data.logoUrl || '',
          data.faviconUrl || '',
          data.phone || '',
          data.whatsappNumber || '',
          data.email || '',
          data.address || '',
          data.facebookUrl || '',
          data.topBarText || '',
          Number(data.deliveryDhaka || 60),
          Number(data.deliveryOutside || 120),
          data.seoTitle || '',
          data.seoDescription || '',
          data.seoKeywords || '',
          data.themeColor || '#0284c7'
        ]
      );
    } catch (e: any) {
      console.warn('MySQL settings update error:', e.message);
    }
  }
  localStore.site_settings = { ...localStore.site_settings, ...data };
  res.json({ success: true, settings: localStore.site_settings });
});

// 2. PAGE SECTIONS
app.get('/api/sections', async (_req, res) => {
  if (isMySqlConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM page_sections');
      if (rows && rows.length > 0) {
        const sectionsObj: Record<string, any> = {};
        for (const row of rows) {
          try {
            sectionsObj[row.section_key] = typeof row.content_json === 'string'
              ? JSON.parse(row.content_json)
              : row.content_json;
          } catch {
            sectionsObj[row.section_key] = {};
          }
        }
        return res.json(sectionsObj);
      }
    } catch (e: any) {
      console.warn('MySQL sections query failed:', e.message);
    }
  }
  res.json(localStore.page_sections);
});

app.put('/api/sections/:key', async (req, res) => {
  const { key } = req.params;
  const content = req.body;
  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO page_sections (section_key, title, content_json, visible, display_order)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content_json = VALUES(content_json), visible = VALUES(visible)`,
        [key, content.title || key, JSON.stringify(content), content.visible !== false ? 1 : 0, content.order || 0]
      );
    } catch (e: any) {
      console.warn('MySQL section update error:', e.message);
    }
  }
  localStore.page_sections[key] = content;
  res.json({ success: true, section: content });
});

// 3. CATEGORIES
app.get('/api/categories', async (_req, res) => {
  if (isMySqlConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM categories ORDER BY display_order ASC');
      return res.json(rows.map((r: any) => ({
        id: r.id,
        name: r.name_en || r.name,
        nameEn: r.name_en,
        nameBn: r.name_bn,
        slug: r.slug,
        displayOrder: r.display_order,
        visible: Boolean(r.visible)
      })));
    } catch (e: any) {
      console.warn('MySQL categories query error:', e.message);
    }
  }
  res.json(localStore.categories);
});

app.post('/api/categories', async (req, res) => {
  const cat = req.body;
  const id = cat.id || `cat-${Date.now()}`;
  const record = { ...cat, id };

  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO categories (id, name_en, name_bn, slug, display_order, visible)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name_en = VALUES(name_en), name_bn = VALUES(name_bn), visible = VALUES(visible)`,
        [id, cat.nameEn || cat.name, cat.nameBn || '', cat.slug || id, cat.displayOrder || 0, cat.visible !== false ? 1 : 0]
      );
    } catch (e: any) {
      console.warn('MySQL category insert error:', e.message);
    }
  }

  const idx = localStore.categories.findIndex((c) => c.id === id);
  if (idx >= 0) localStore.categories[idx] = record;
  else localStore.categories.push(record);

  res.json({ success: true, category: record });
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query('DELETE FROM categories WHERE id = ?', [id]);
    } catch (e: any) {
      console.warn('MySQL category delete error:', e.message);
    }
  }
  localStore.categories = localStore.categories.filter((c) => c.id !== id);
  res.json({ success: true, id });
});

// 4. PRODUCTS
app.get('/api/products', async (req, res) => {
  const onlyVisible = req.query.visible === 'true';

  if (isMySqlConnected && dbPool) {
    try {
      const sql = onlyVisible
        ? 'SELECT * FROM products WHERE visible = 1 ORDER BY display_order ASC, created_at DESC'
        : 'SELECT * FROM products ORDER BY display_order ASC, created_at DESC';
      const [rows]: any = await dbPool.query(sql);

      return res.json(rows.map((r: any) => {
        let images = [];
        let features = [];
        try { images = JSON.parse(r.images || '[]'); } catch { images = []; }
        try { features = JSON.parse(r.features || '[]'); } catch { features = []; }

        return {
          id: r.id,
          name: r.name,
          nameEn: r.name_en || r.name,
          nameBn: r.name_bn || r.name,
          slug: r.slug,
          categoryId: r.category_id,
          price: Number(r.price),
          oldPrice: r.old_price ? Number(r.old_price) : null,
          badge: r.badge,
          stock: Number(r.stock),
          rating: Number(r.rating || 4.9),
          reviewCount: Number(r.review_count || 20),
          images,
          image: images[0] || '/assets/device.jpg',
          features,
          shortDesc: r.short_desc,
          longDesc: r.long_desc,
          isFeatured: Boolean(r.is_featured),
          visible: Boolean(r.visible),
          displayOrder: r.display_order,
          createdAt: r.created_at
        };
      }));
    } catch (e: any) {
      console.warn('MySQL products query error:', e.message);
    }
  }

  const prods = onlyVisible
    ? localStore.products.filter((p) => p.visible !== false)
    : localStore.products;
  res.json(prods);
});

app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const prod = localStore.products.find((p) => p.id === id);
  if (prod) return res.json(prod);
  res.status(404).json({ error: 'Product not found' });
});

app.post('/api/products', async (req, res) => {
  const prod = req.body;
  const id = prod.id || `prod-${Date.now()}`;
  const imagesJson = JSON.stringify(prod.images || []);
  const featuresJson = JSON.stringify(prod.features || []);

  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO products (
          id, name, name_en, name_bn, slug, category_id, price, old_price,
          badge, stock, rating, review_count, images, features,
          short_desc, long_desc, is_featured, visible, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name), name_en = VALUES(name_en), name_bn = VALUES(name_bn),
          category_id = VALUES(category_id), price = VALUES(price), old_price = VALUES(old_price),
          badge = VALUES(badge), stock = VALUES(stock), images = VALUES(images), features = VALUES(features),
          short_desc = VALUES(short_desc), long_desc = VALUES(long_desc),
          is_featured = VALUES(is_featured), visible = VALUES(visible)`,
        [
          id,
          prod.name,
          prod.nameEn || prod.name,
          prod.nameBn || prod.name,
          prod.slug || id,
          prod.categoryId || null,
          Number(prod.price || 0),
          prod.oldPrice ? Number(prod.oldPrice) : null,
          prod.badge || '',
          Number(prod.stock || 10),
          Number(prod.rating || 4.9),
          Number(prod.reviewCount || 20),
          imagesJson,
          featuresJson,
          prod.shortDesc || '',
          prod.longDesc || '',
          prod.isFeatured ? 1 : 0,
          prod.visible !== false ? 1 : 0,
          prod.displayOrder || 0
        ]
      );
    } catch (e: any) {
      console.warn('MySQL product save error:', e.message);
    }
  }

  const record = { ...prod, id };
  const idx = localStore.products.findIndex((p) => p.id === id);
  if (idx >= 0) localStore.products[idx] = record;
  else localStore.products.push(record);

  res.json({ success: true, product: record });
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query('DELETE FROM products WHERE id = ?', [id]);
    } catch (e: any) {
      console.warn('MySQL product delete error:', e.message);
    }
  }
  localStore.products = localStore.products.filter((p) => p.id !== id);
  res.json({ success: true, id });
});

// 5. ORDERS
app.get('/api/orders', async (_req, res) => {
  if (isMySqlConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.json(rows);
    } catch (e: any) {
      console.warn('MySQL orders query error:', e.message);
    }
  }
  res.json(localStore.orders);
});

app.post('/api/orders', async (req, res) => {
  const order = req.body;
  const orderId = order.id || `ORD-${Date.now().toString().slice(-6)}`;
  const record = {
    ...order,
    id: orderId,
    status: order.status || 'pending',
    createdAt: new Date().toISOString()
  };

  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO orders (
          id, customer_name, customer_phone, customer_email, delivery_address,
          delivery_zone, delivery_fee, subtotal, total, payment_method, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          order.customerName || '',
          order.customerPhone || '',
          order.customerEmail || '',
          order.deliveryAddress || '',
          order.deliveryZone || 'dhaka',
          Number(order.deliveryFee || 60),
          Number(order.subtotal || 0),
          Number(order.total || 0),
          order.paymentMethod || 'cash_on_delivery',
          order.notes || '',
          order.status || 'pending'
        ]
      );
    } catch (e: any) {
      console.warn('MySQL order insert error:', e.message);
    }
  }

  localStore.orders.unshift(record);
  res.json({ success: true, order: record });
});

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    } catch (e: any) {
      console.warn('MySQL order update error:', e.message);
    }
  }

  const ord = localStore.orders.find((o) => o.id === id);
  if (ord) ord.status = status;
  res.json({ success: true, id, status });
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query('DELETE FROM orders WHERE id = ?', [id]);
    } catch (e: any) {
      console.warn('MySQL order delete error:', e.message);
    }
  }
  localStore.orders = localStore.orders.filter((o) => o.id !== id);
  res.json({ success: true, id });
});

// 6. INQUIRIES
app.get('/api/inquiries', async (_req, res) => {
  if (isMySqlConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
      return res.json(rows);
    } catch (e: any) {
      console.warn('MySQL inquiries query error:', e.message);
    }
  }
  res.json(localStore.inquiries);
});

app.post('/api/inquiries', async (req, res) => {
  const inq = req.body;
  const id = inq.id || `inq-${Date.now()}`;
  const record = {
    ...inq,
    id,
    status: inq.status || 'new',
    createdAt: new Date().toISOString()
  };

  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO inquiries (customer_name, customer_phone, product_interest, message, status)
         VALUES (?, ?, ?, ?, ?)`,
        [inq.customerName || '', inq.customerPhone || '', inq.productInterest || '', inq.message || '', 'new']
      );
    } catch (e: any) {
      console.warn('MySQL inquiry insert error:', e.message);
    }
  }

  localStore.inquiries.unshift(record);
  res.json({ success: true, inquiry: record });
});

app.put('/api/inquiries/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const inq = localStore.inquiries.find((i) => i.id === id);
  if (inq) inq.status = status;
  res.json({ success: true, id, status });
});

app.delete('/api/inquiries/:id', async (req, res) => {
  const { id } = req.params;
  localStore.inquiries = localStore.inquiries.filter((i) => i.id !== id);
  res.json({ success: true, id });
});

// 7. MEDIA LIBRARY
app.get('/api/media', async (_req, res) => {
  if (isMySqlConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM media ORDER BY uploaded_at DESC');
      return res.json(rows.map((r: any) => ({
        id: String(r.id),
        url: r.url,
        fileName: r.file_name,
        size: r.size,
        width: r.width,
        height: r.height,
        alt: r.alt,
        uploadedAt: r.uploaded_at
      })));
    } catch (e: any) {
      console.warn('MySQL media query error:', e.message);
    }
  }
  res.json(localStore.media);
});

app.post('/api/media', async (req, res) => {
  const item = req.body;
  const id = item.id || `img_${Date.now()}`;
  const record = { ...item, id };

  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO media (url, file_name, file_path, size, width, height, alt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.url, item.fileName || '', item.storagePath || item.url, item.size || 0, item.width || 0, item.height || 0, item.alt || '']
      );
    } catch (e: any) {
      console.warn('MySQL media insert error:', e.message);
    }
  }

  localStore.media.unshift(record);
  res.json({ success: true, media: record });
});

app.delete('/api/media/:id', async (req, res) => {
  const { id } = req.params;
  localStore.media = localStore.media.filter((m) => m.id !== id && m.fileName !== id);
  res.json({ success: true, id });
});

// 8. ADMINS
app.get('/api/admins', async (_req, res) => {
  if (isMySqlConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query('SELECT id, email, role, display_name as displayName, created_at as createdAt FROM admins');
      return res.json(rows);
    } catch (e: any) {
      console.warn('MySQL admins query error:', e.message);
    }
  }
  res.json(localStore.admins);
});

app.post('/api/admins', async (req, res) => {
  const { email, role, displayName } = req.body;
  const newAdmin = {
    id: Date.now(),
    email: email.trim().toLowerCase(),
    role: role || 'editor',
    displayName: displayName || 'Admin'
  };

  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO admins (email, role, password_hash, display_name)
         VALUES (?, ?, ?, ?)`,
        [newAdmin.email, newAdmin.role, 'fixed_hash', newAdmin.displayName]
      );
    } catch (e: any) {
      console.warn('MySQL admin insert error:', e.message);
    }
  }

  localStore.admins.push(newAdmin);
  res.json({ success: true, admin: newAdmin });
});

app.delete('/api/admins/:id', async (req, res) => {
  const { id } = req.params;
  localStore.admins = localStore.admins.filter((a) => String(a.id) !== String(id) && a.email !== id);
  res.json({ success: true, id });
});

// 9. AUTH LOGIN (Verifies admin credentials against MySQL database)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (adminEmail && adminPassword && cleanEmail === adminEmail && password === adminPassword) {
    return res.json({
      success: true,
      user: {
        email: adminEmail,
        role: 'owner',
        displayName: 'Pulmo Care Admin (Owner)'
      }
    });
  }

  res.status(401).json({ success: false, error: 'Invalid email or password.' });
});

// 10. FILE UPLOAD HANDLER
app.post(['/api/upload', '*/api/upload'], upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file received' });
  }

  // Copy uploaded file to other upload folders so both public and dist stay synchronized
  const currentFile = req.file.path;
  possibleUploadDirs.forEach((targetFolder) => {
    const dest = path.join(targetFolder, req.file!.filename);
    if (dest !== currentFile && !fs.existsSync(dest)) {
      try { fs.copyFileSync(currentFile, dest); } catch {}
    }
  });

  const publicUrl = `/uploads/${req.file.filename}`;
  const mediaId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const mediaItem = {
    id: mediaId,
    url: publicUrl,
    fileName: req.file.filename,
    storagePath: `uploads/${req.file.filename}`,
    size: req.file.size,
    width: 800,
    height: 800,
    alt: req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, ' ')
  };

  // Auto-register in MySQL media table
  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO media (id, file_name, url, storage_path, file_path, size, width, height, alt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE url = VALUES(url)`,
        [mediaItem.id, mediaItem.fileName, mediaItem.url, mediaItem.storagePath, mediaItem.storagePath, mediaItem.size, 800, 800, mediaItem.alt]
      );
    } catch (e: any) {
      console.warn('MySQL upload media insert error:', e.message);
    }
  }
  localStore.media.unshift(mediaItem);

  res.json({
    success: true,
    id: mediaItem.id,
    url: publicUrl,
    fileName: req.file.filename,
    storagePath: mediaItem.storagePath,
    size: req.file.size,
    media: mediaItem
  });
});

// Start Server and mount Vite / Static
async function startServer() {
  await initMySQL();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use('/admin', express.static(path.join(distPath, 'admin')));
    app.get('/admin*', (_req, res) => {
      res.sendFile(path.join(distPath, 'admin', 'index.html'));
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Support both standard TCP port and cPanel Passenger Unix socket
  if (typeof PORT === 'string' && isNaN(Number(PORT))) {
    app.listen(PORT, () => {
      console.log(`[Pulmo Care] Full-Stack MySQL App server running on Passenger socket: ${PORT}`);
    });
  } else {
    const numericPort = Number(PORT);
    app.listen(numericPort, '0.0.0.0', () => {
      console.log(`[Pulmo Care] Full-Stack MySQL App server running at http://0.0.0.0:${numericPort}`);
    });
  }
}

startServer();
