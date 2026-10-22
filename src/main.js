import './style.css';
import Lenis from 'lenis';
import { createScene } from './scene.js';
import {
  getSiteSettings,
  getSections,
  getCategories,
  getProducts,
  createCustomerInquiry
} from './shared/db.js';
import { renderPublicSite } from './public/renderSite.js';
import { CartManager } from './public/cartManager.js';

// Setup current year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Initialize Minimal 3D WebGL Breathing Canvas
const canvas = document.getElementById('webgl');
let stage = null;
if (canvas) {
  stage = createScene(canvas);
}

// Lenis Smooth Scroll
const lenis = new Lenis({
  lerp: 0.1,
  smoothWheel: true,
});

function raf(time) {
  lenis.raf(time);
  if (stage) {
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollMax > 0 ? (window.scrollY / scrollMax) : 0;
    stage.update(time * 0.001, 0.016, ratio);
  }
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Header Scroll Effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    header?.classList.add('is-scrolled');
  } else {
    header?.classList.remove('is-scrolled');
  }
});

// Mobile Navigation Toggle
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');
if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('is-open');
  });
  document.querySelectorAll('.nav-item').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
    });
  });
}

// Custom Cursor (Desktop Only)
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursor-dot');
if (cursor && cursorDot && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  window.addEventListener('pointermove', (e) => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
  document.querySelectorAll('a, button, input, select, textarea').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
  });
}

// Toast Helper
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-active');
  setTimeout(() => {
    toast.classList.remove('is-active');
  }, 2500);
}

/* =========================================================
   BOOTSTRAP & DYNAMIC RENDERING (MYSQL STOREFRONT)
   Strictly loads from MySQL database (zero hardcoded mock JSON)
   ========================================================= */

async function initStorefront() {
  let settings = null;
  let sections = {};
  let categories = [];
  let products = [];
  let cartManager = null;

  try {
    // Pure MySQL data fetch
    const [liveSettings, liveSections, liveCats, liveProds] = await Promise.all([
      getSiteSettings().catch(() => null),
      getSections().catch(() => ({})),
      getCategories().catch(() => []),
      getProducts(true).catch(() => [])
    ]);

    settings = liveSettings || {
      brandName: 'Pulmo Care',
      tagline: 'Better Breathing · Better Living',
      taglineBn: 'শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে',
      logoUrl: '/assets/pulmo_logo.jpg',
      faviconUrl: '/assets/pulmo_logo.jpg',
      phone: '01337-708107',
      whatsappNumber: '8801337708107',
      email: 'pulmocare2@gmail.com',
      address: 'হাউজ#২৪, রোড#১১, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ',
      facebookUrl: 'https://www.facebook.com/profile.php?id=61583772040813',
      topBarText: 'ঢাকা ও সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি ও ফ্রি সেটআপ সুবিধা',
      currencySymbol: '৳',
      deliveryDhaka: 60,
      deliveryOutside: 120,
      seoTitle: 'Pulmo Care | রেসপিরেটরি ও স্লিপ কেয়ার ই-কমার্স — ঢাকা ও সারা বাংলাদেশ',
      seoDescription: 'Pulmo Care (Respira) — শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে। জেনুইন CPAP, BiPAP, কম্প্রেসার নেবুলাইজার, পালস অক্সিমিটার ও বিপি মনিটরের বিশ্বস্ত ই-কমার্স শপ।',
      themeColor: '#0284c7'
    };
    sections = liveSections || {};
    categories = Array.isArray(liveCats) ? liveCats : [];
    products = Array.isArray(liveProds) ? liveProds : [];

    cartManager = new CartManager({
      settings,
      products,
      showToast
    });

    renderPublicSite({
      settings,
      sections,
      categories,
      products,
      onAddToCart: (id, qty) => cartManager.addToCart(id, qty),
      onBuyNow: (id, qty) => cartManager.buyNow(id, qty)
    });
  } catch (err) {
    console.error('[MySQL Storefront] Error connecting to MySQL:', err);
  }

  // Quick Inquiry Form Submission Handler
  const inquiryForm = document.getElementById('quick-inquiry-form');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('q-name')?.value.trim();
      const phone = document.getElementById('q-phone')?.value.trim();
      const prod = document.getElementById('q-product')?.value || '';
      const msg = document.getElementById('q-message')?.value.trim() || '';

      if (!name || !phone) {
        showToast('অনুগ্রহ করে নাম ও ফোন নম্বর লিখুন।');
        return;
      }

      // Save Inquiry to MySQL Database
      try {
        await createCustomerInquiry({
          customerName: name,
          customerPhone: phone,
          productInterest: prod,
          message: msg
        });
      } catch (err) {
        console.warn('[Inquiry] Error saving inquiry to MySQL:', err);
      }

      // Open WhatsApp Message
      const waNum = (settings?.whatsappNumber || '8801337708107').replace(/[^0-9]/g, '');
      const text = `আসসালামু আলাইকুম Pulmo Care!\nআমার নাম: ${name} (${phone})\nআমি আগ্রহ প্রকাশ করছি: ${prod}\n${msg ? `মেসেজ: ${msg}` : ''}`;
      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

      showToast('হোয়াটসঅ্যাপে পাঠানো হচ্ছে…');
      inquiryForm.reset();
    });
  }
}

// Boot application
initStorefront();
