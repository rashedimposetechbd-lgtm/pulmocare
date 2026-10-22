import { escapeHtml, sanitizeUrl } from '../shared/utils/escape.js';
import { formatTaka, toBanglaNumber } from '../shared/utils/format.js';

/**
 * Hydrates all public storefront sections dynamically from database state.
 * Preserves 100% of DOM IDs, classes, and styles.
 */
export function renderPublicSite({ settings, sections, categories, products, onAddToCart, onBuyNow }) {
  // 1. Update Document Title & SEO Meta Tags
  if (settings.seoTitle) {
    document.title = settings.seoTitle;
  }
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && settings.seoDescription) metaDesc.setAttribute('content', settings.seoDescription);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', settings.seoTitle || settings.brandName);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && settings.seoDescription) ogDesc.setAttribute('content', settings.seoDescription);

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta && settings.themeColor) themeColorMeta.setAttribute('content', settings.themeColor);

  // 2. Top Announcement Bar
  const topTextEl = document.getElementById('top-bar-announcement');
  if (topTextEl && settings.topBarText) {
    topTextEl.textContent = settings.topBarText;
  }
  const topPhoneLink = document.getElementById('top-phone-link');
  if (topPhoneLink && settings.phone) {
    topPhoneLink.href = `tel:${settings.phone.replace(/[^0-9+]/g, '')}`;
    topPhoneLink.innerHTML = `📞 হটলাইন: <strong>${escapeHtml(settings.phone)}</strong>`;
  }
  const topWaLink = document.getElementById('top-wa-link');
  if (topWaLink && settings.whatsappNumber) {
    topWaLink.href = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;
  }

  // 3. Navigation Header Branding
  const brandNameEls = document.querySelectorAll('.brand-name');
  brandNameEls.forEach((el) => {
    el.textContent = settings.brandName || 'Pulmo Care';
  });
  const brandTaglineEls = document.querySelectorAll('.brand-tagline');
  brandTaglineEls.forEach((el) => {
    el.textContent = settings.tagline || 'Better Breathing · Better Living';
  });
  const logoImgs = document.querySelectorAll('.brand-logo__img');
  logoImgs.forEach((img) => {
    if (settings.logoUrl) img.src = settings.logoUrl;
  });
  const headerCta = document.querySelector('.header-cta');
  if (headerCta && settings.whatsappNumber) {
    headerCta.href = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;
  }

  // 4. Hero Section
  const heroSec = sections?.hero || {};
  if (heroSec.visible === false) {
    const secEl = document.getElementById('hero');
    if (secEl) secEl.style.display = 'none';
  } else {
    const secEl = document.getElementById('hero');
    if (secEl) secEl.style.display = '';

    const heroEyebrow = document.getElementById('hero-eyebrow-text');
    if (heroEyebrow && heroSec.eyebrow) heroEyebrow.textContent = heroSec.eyebrow;

    const heroTitle = document.getElementById('hero-title-text');
    if (heroTitle && heroSec.title) {
      heroTitle.innerHTML = `${escapeHtml(heroSec.title)}<br /><span class="gradient-text">${escapeHtml(heroSec.titleHighlight || 'যত্ন হোক সহজে')}</span>`;
    }

    const heroDesc = document.getElementById('hero-desc-text');
    if (heroDesc && heroSec.description) heroDesc.textContent = heroSec.description;

    const heroWaBtn = document.getElementById('hero-wa-btn');
    if (heroWaBtn && settings.whatsappNumber) {
      heroWaBtn.href = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;
      if (heroSec.ctaWhatsappText) {
        heroWaBtn.querySelector('span').textContent = heroSec.ctaWhatsappText;
      }
    }

    // Hero Trust Badges (3 items)
    const trustFeaturesBox = document.getElementById('hero-trust-features');
    if (trustFeaturesBox && Array.isArray(heroSec.trustItems)) {
      trustFeaturesBox.innerHTML = heroSec.trustItems.map((item) => `
        <div class="tf-item">
          <span class="tf-icon">${escapeHtml(item.icon || '🛡️')}</span>
          <span class="tf-text">${escapeHtml(item.text || '')}</span>
        </div>
      `).join('');
    }

    // Hero Right Showcase Product Card
    const showcaseCard = document.getElementById('hero-showcase-card');
    if (showcaseCard) {
      const featProd = products.find((p) => p.isFeatured) ||
                       products.find((p) => p.id === heroSec.featuredProductId) ||
                       products[0];
      if (featProd) {
        const primaryImg = (featProd.images && featProd.images[0]) || featProd.image || '/assets/reshope_cpap.jpg';
        showcaseCard.innerHTML = `
          <div class="showcase-badge">${escapeHtml(featProd.badge || 'টপ রেটেড পণ্য')}</div>
          <img src="${primaryImg}" alt="${escapeHtml(featProd.nameEn || featProd.name)}" class="showcase-img" loading="lazy" />
          <div class="showcase-info">
            <div class="showcase-rating">★★★★★ <span>(${featProd.rating || 4.9}/5 রেটিং)</span></div>
            <h3 class="showcase-title">${escapeHtml(featProd.nameEn || featProd.name)}</h3>
            <p class="showcase-sub">${escapeHtml(featProd.shortDesc || '')}</p>
            <div class="showcase-price-row">
              <span class="showcase-price">${formatTaka(featProd.price, true)}</span>
              ${featProd.oldPrice ? `<span class="showcase-old">${formatTaka(featProd.oldPrice, true)}</span>` : ''}
              <button class="btn btn--primary btn--sm direct-add-btn" data-product-id="${featProd.id}">
                + কার্টে যোগ করুন
              </button>
            </div>
          </div>
        `;
        showcaseCard.querySelector('.direct-add-btn')?.addEventListener('click', () => {
          onAddToCart(featProd.id, 1);
        });
      }
    }
  }

  // 5. Trust Strip Section
  const trustSec = sections?.trustStrip || {};
  const trustStripSec = document.querySelector('.trust-strip');
  if (trustSec.visible === false) {
    if (trustStripSec) trustStripSec.style.display = 'none';
  } else if (trustStripSec && Array.isArray(trustSec.items)) {
    trustStripSec.style.display = '';
    const inner = trustStripSec.querySelector('.trust-strip__inner');
    if (inner) {
      inner.innerHTML = trustSec.items.map((item) => `
        <div class="trust-item">
          <div class="t-icon">${escapeHtml(item.icon || '🏪')}</div>
          <div class="t-text">
            <strong>${escapeHtml(item.title || '')}</strong>
            <small>${escapeHtml(item.sub || '')}</small>
          </div>
        </div>
      `).join('');
    }
  }

  // 6. Category Tabs & Product Grid
  renderCategoryTabsAndProducts({ categories, products, onAddToCart, onBuyNow });

  // 7. Featured Banner Section
  const featSec = sections?.featured || {};
  const featSecEl = document.getElementById('featured');
  if (featSec.visible === false) {
    if (featSecEl) featSecEl.style.display = 'none';
  } else if (featSecEl) {
    featSecEl.style.display = '';
    const badgeEl = featSecEl.querySelector('.fb-content .badge-pill');
    if (badgeEl && featSec.badge) badgeEl.textContent = featSec.badge;

    const titleEl = featSecEl.querySelector('.fb-title');
    if (titleEl && featSec.title) titleEl.textContent = featSec.title;

    const descEl = featSecEl.querySelector('.fb-desc');
    if (descEl && featSec.description) descEl.textContent = featSec.description;

    const devList = featSecEl.querySelector('.fb-devices-list');
    if (devList && Array.isArray(featSec.devices)) {
      devList.innerHTML = featSec.devices.map((d) => `
        <div class="fb-device-item">
          <span class="check">✓</span>
          <div>
            <strong>${escapeHtml(d.title || '')}</strong>
            <small>${escapeHtml(d.sub || '')}</small>
          </div>
        </div>
      `).join('');
    }

    const imgEl = featSecEl.querySelector('.fb-img');
    if (imgEl && featSec.imageUrl) imgEl.src = featSec.imageUrl;

    const callBtn = featSecEl.querySelector('.fb-actions a[href^="tel:"]');
    if (callBtn && settings.phone) {
      callBtn.href = `tel:${settings.phone.replace(/[^0-9+]/g, '')}`;
      callBtn.querySelector('span').textContent = `কল করুন: ${settings.phone}`;
    }
  }

  // 8. Symptoms Section
  const symSec = sections?.symptoms || {};
  const symSecEl = document.getElementById('symptoms');
  if (symSec.visible === false) {
    if (symSecEl) symSecEl.style.display = 'none';
  } else if (symSecEl) {
    symSecEl.style.display = '';
    const headingEl = symSecEl.querySelector('.main-heading');
    if (headingEl && symSec.title) headingEl.textContent = symSec.title;

    const descEl = symSecEl.querySelector('.section-desc');
    if (descEl && symSec.description) descEl.textContent = symSec.description;

    const grid = symSecEl.querySelector('.symptoms-grid');
    if (grid && Array.isArray(symSec.cards)) {
      grid.innerHTML = symSec.cards.map((c) => `
        <div class="symptom-card">
          <span class="s-icon">${escapeHtml(c.icon || '😴')}</span>
          <h4>${escapeHtml(c.title || '')}</h4>
          <p>${escapeHtml(c.text || '')}</p>
        </div>
      `).join('');
    }

    const cbWa = symSecEl.querySelector('.consultation-banner a');
    if (cbWa && settings.whatsappNumber) {
      cbWa.href = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('আমি স্লিপ অ্যাপনিয়া ও সিপ্যাপ পরামর্শ নিতে চাই')}`;
    }
  }

  // 9. About Section & Contact Info
  const abSec = sections?.about || {};
  const abSecEl = document.getElementById('about');
  if (abSec.visible === false) {
    if (abSecEl) abSecEl.style.display = 'none';
  } else if (abSecEl) {
    abSecEl.style.display = '';
    const abTitle = abSecEl.querySelector('.main-heading');
    if (abTitle && abSec.title) abTitle.textContent = abSec.title;

    const abDesc = abSecEl.querySelector('.about-info > p');
    if (abDesc && abSec.description) abDesc.textContent = abSec.description;

    // Contact details list in About
    const contactList = abSecEl.querySelector('.contact-details-list');
    if (contactList) {
      contactList.innerHTML = `
        <div class="cd-item">
          <span class="cd-icon">📍</span>
          <div>
            <strong>শোরুম ও সার্ভিস সেন্টার:</strong>
            <span>${escapeHtml(settings.address || 'হাউজ#২৪, রোড#১১, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ')}</span>
          </div>
        </div>
        <div class="cd-item">
          <span class="cd-icon">📞</span>
          <div>
            <strong>হটলাইন ও হোয়াটসঅ্যাপ:</strong>
            <a href="tel:${escapeHtml(settings.phone || '01337708107')}">${escapeHtml(settings.phone || '01337-708107')}</a> / 
            <a href="https://wa.me/${escapeHtml(settings.whatsappNumber || '8801337708107')}" target="_blank" rel="noopener">+${escapeHtml(settings.whatsappNumber || '880 1337-708107')}</a>
          </div>
        </div>
        <div class="cd-item">
          <span class="cd-icon">✉️</span>
          <div>
            <strong>অফিসিয়াল ইমেইল:</strong>
            <a href="mailto:${escapeHtml(settings.email || 'pulmocare2@gmail.com')}">${escapeHtml(settings.email || 'pulmocare2@gmail.com')}</a>
          </div>
        </div>
      `;
    }
  }

  // 10. Quick Inquiry Product <select> options
  const qSelect = document.getElementById('q-product');
  if (qSelect) {
    qSelect.innerHTML = products.map((p) => {
      const pName = p.name || p.nameEn || p.nameBn || 'Medical Device';
      return `<option value="${escapeHtml(pName)}">${escapeHtml(pName)}</option>`;
    }).join('');
  }

  // 11. COD Delivery Zone Options and Charges (Dhaka based)
  const codZoneSelect = document.getElementById('cod-zone');
  if (codZoneSelect) {
    const dhakaFee = settings.deliveryDhaka ?? (settings.deliverySylhet ?? 60);
    const outsideFee = settings.deliveryOutside ?? 120;
    codZoneSelect.innerHTML = `
      <option value="dhaka" data-fee="${dhakaFee}">ঢাকা সিটি এলাকা (${dhakaFee === 0 ? 'ফ্রি ডেলিভারি' : formatTaka(dhakaFee)})</option>
      <option value="outside" data-fee="${outsideFee}">ঢাকার বাইরে সারা বাংলাদেশ (${formatTaka(outsideFee)})</option>
    `;
  }

  // 12. Footer
  const footerDesc = document.querySelector('.footer-desc');
  if (footerDesc && settings.taglineBn) {
    footerDesc.textContent = `${settings.taglineBn} — স্লিপ ও রেসপিরেটরি চিকিৎসার বিশ্বস্ত মেডিকেল ডিভাইস শপ।`;
  }
  const footerLoc = document.querySelector('.footer-location');
  if (footerLoc) {
    footerLoc.innerHTML = `
      📍 ${escapeHtml(settings.address || 'হাউজ#২৪, রোড#১১, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ')}<br />
      📞 হটলাইন: ${escapeHtml(settings.phone || '01337-708107')}<br />
      ✉️ ইমেইল: ${escapeHtml(settings.email || 'pulmocare2@gmail.com')}
    `;
  }
  const fbLink = document.querySelector('.footer-links-col a[href*="facebook.com"]');
  if (fbLink && settings.facebookUrl) {
    fbLink.href = settings.facebookUrl;
  }
  const footerYear = document.getElementById('year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // 13. Floating WhatsApp Link
  const floatingWa = document.querySelector('.floating-wa');
  if (floatingWa && settings.whatsappNumber) {
    floatingWa.href = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;
  }
}

/**
 * Renders the Category Tabs with dynamic product counts, and wires filter clicks.
 */
let activeCategory = 'all';

export function renderCategoryTabsAndProducts({ categories, products, onAddToCart, onBuyNow }) {
  const tabsContainer = document.getElementById('category-tabs');
  const gridContainer = document.getElementById('product-grid');
  if (!tabsContainer || !gridContainer) return;

  // Filter products by visible
  const visibleProducts = products.filter((p) => p.visible !== false);

  // Build dynamic category tab list with counts
  const totalCount = toBanglaNumber(visibleProducts.length);
  let tabsHtml = `<button class="tab-btn ${activeCategory === 'all' ? 'is-active' : ''}" data-cat="all">সব পণ্য (${totalCount})</button>`;

  categories.filter((c) => c.visible !== false).forEach((cat) => {
    const count = visibleProducts.filter((p) => p.categoryId === cat.id || p.category === cat.id).length;
    tabsHtml += `
      <button class="tab-btn ${activeCategory === cat.id ? 'is-active' : ''}" data-cat="${escapeHtml(cat.id)}">
        ${escapeHtml(cat.nameBn || cat.nameEn || cat.name)} (${toBanglaNumber(count)})
      </button>
    `;
  });
  tabsContainer.innerHTML = tabsHtml;

  // Wire Tab Clicks
  tabsContainer.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeCategory = btn.getAttribute('data-cat');
      renderProductCards({ category: activeCategory, products: visibleProducts, gridContainer, onAddToCart, onBuyNow });
    });
  });

  // Initial Product Cards Render
  renderProductCards({ category: activeCategory, products: visibleProducts, gridContainer, onAddToCart, onBuyNow });
}

function renderProductCards({ category, products, gridContainer, onAddToCart, onBuyNow }) {
  const filtered = category === 'all'
    ? products
    : products.filter((p) => p.categoryId === category || p.category === category);

  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem;">এই ক্যাটাগরিতে বর্তমানে কোনো পণ্য পাওয়া যায়নি।</p>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = filtered.map((prod) => {
    const primaryImg = (prod.images && prod.images[0]) || prod.image || '/assets/device.jpg';
    const name = prod.nameEn || prod.name || '';
    const priceFormatted = formatTaka(prod.price, true);
    const oldPriceFormatted = prod.oldPrice ? formatTaka(prod.oldPrice, true) : '';

    return `
      <article class="product-card" data-id="${escapeHtml(prod.id)}">
        <div class="product-card__img-box">
          <span class="product-badge">${escapeHtml(prod.badge || 'ইন স্টক')}</span>
          <img src="${primaryImg}" alt="${escapeHtml(name)}" class="product-card__img" loading="lazy" />
        </div>
        <div class="product-card__body">
          <div class="product-rating-row">
            <span>★ ${prod.rating || 4.8} (${toBanglaNumber(prod.reviewCount || prod.reviews || 20)})</span>
            <small>ইন স্টক · ঢাকা</small>
          </div>
          <h3 class="product-title">${escapeHtml(name)}</h3>
          <p class="product-short-desc">${escapeHtml(prod.shortDesc || '')}</p>
          <div class="product-price-row">
            <span class="price-current">${priceFormatted}</span>
            ${oldPriceFormatted ? `<span class="price-old">${oldPriceFormatted}</span>` : ''}
          </div>
          <div class="product-actions">
            <button class="btn-add-cart" data-cart-id="${escapeHtml(prod.id)}">
              + কার্ট
            </button>
            <button class="btn-buy-now" data-buy-id="${escapeHtml(prod.id)}">
              অর্ডার করুন
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Wire event handlers
  gridContainer.querySelectorAll('[data-cart-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cart-id');
      onAddToCart(id, 1);
    });
  });

  gridContainer.querySelectorAll('[data-buy-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-buy-id');
      onBuyNow(id, 1);
    });
  });
}
