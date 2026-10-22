/**
 * Pulmo Care — Unified MySQL Database Client
 * Directly talks to MySQL REST API endpoints (/api/*)
 * Compatible with Node.js Express MySQL backend & cPanel PHP MySQL PDO backend.
 * Zero Firebase dependencies. No default/mock JSON data loaded without MySQL.
 */

// In-memory & localStorage Cache Helper with 2-minute TTL
const CACHE_TTL_MS = 2 * 60 * 1000;

function getCached(key) {
  try {
    const raw = localStorage.getItem(`pulmo_mysql_${key}`);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() - item.ts > CACHE_TTL_MS) {
      localStorage.removeItem(`pulmo_mysql_${key}`);
      return null;
    }
    return item.data;
  } catch {
    return null;
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(`pulmo_mysql_${key}`, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('pulmo_mysql_'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function resolveApiUrl(url) {
  if (typeof window === 'undefined') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const path = window.location.pathname;
  const adminIdx = path.indexOf('/admin');
  const base = adminIdx > 0 ? path.substring(0, adminIdx) : '';

  if (base && url.startsWith('/api/')) {
    return `${base}${url}`;
  }
  return url;
}

async function apiFetch(url, options = {}) {
  const resolvedUrl = resolveApiUrl(url);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(resolvedUrl, { ...options, headers });
  if (!res.ok) {
    let errMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson && (errJson.error || errJson.message)) {
        errMessage = errJson.error || errJson.message;
      }
    } catch {}
    throw new Error(errMessage);
  }
  return res.json();
}

/* =========================================================
   1. SITE SETTINGS (/api/settings)
   ========================================================= */

export async function getSiteSettings(bypassCache = false) {
  if (!bypassCache) {
    const cached = getCached('settings');
    if (cached) return cached;
  }
  try {
    const data = await apiFetch('/api/settings');
    if (data) {
      setCache('settings', data);
      return data;
    }
    return null;
  } catch (error) {
    console.warn('[MySQL DB] getSiteSettings failed:', error.message);
    throw error;
  }
}

export async function updateSiteSettings(settingsData) {
  try {
    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
    setCache('settings', settingsData);
    return res;
  } catch (error) {
    console.error('[MySQL DB] updateSiteSettings error:', error.message);
    throw error;
  }
}

/* =========================================================
   2. PAGE SECTIONS (/api/sections)
   ========================================================= */

export async function getSections(bypassCache = false) {
  if (!bypassCache) {
    const cached = getCached('sections');
    if (cached) return cached;
  }
  try {
    const data = await apiFetch('/api/sections');
    if (data && typeof data === 'object') {
      setCache('sections', data);
      return data;
    }
    return {};
  } catch (error) {
    console.warn('[MySQL DB] getSections failed:', error.message);
    throw error;
  }
}

export async function updateSection(sectionKey, sectionData) {
  try {
    const res = await apiFetch(`/api/sections/${encodeURIComponent(sectionKey)}`, {
      method: 'PUT',
      body: JSON.stringify(sectionData)
    });
    // Invalidate sections cache
    localStorage.removeItem('pulmo_mysql_sections');
    return res;
  } catch (error) {
    console.error(`[MySQL DB] updateSection ${sectionKey} error:`, error.message);
    throw error;
  }
}

/* =========================================================
   3. CATEGORIES (/api/categories)
   ========================================================= */

export async function getCategories(bypassCache = false) {
  if (!bypassCache) {
    const cached = getCached('categories');
    if (cached) return cached;
  }
  try {
    const data = await apiFetch('/api/categories');
    const cats = Array.isArray(data) ? data : [];
    setCache('categories', cats);
    return cats;
  } catch (error) {
    console.warn('[MySQL DB] getCategories failed:', error.message);
    throw error;
  }
}

export async function saveCategory(catId, catData) {
  try {
    const res = await apiFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ ...catData, id: catId })
    });
    localStorage.removeItem('pulmo_mysql_categories');
    return res;
  } catch (error) {
    console.error('[MySQL DB] saveCategory error:', error.message);
    throw error;
  }
}

export async function deleteCategory(catId) {
  try {
    const res = await apiFetch(`/api/categories/${encodeURIComponent(catId)}`, {
      method: 'DELETE'
    });
    localStorage.removeItem('pulmo_mysql_categories');
    return res;
  } catch (error) {
    console.error('[MySQL DB] deleteCategory error:', error.message);
    throw error;
  }
}

/* =========================================================
   4. PRODUCTS (/api/products)
   ========================================================= */

export async function getProducts(onlyVisible = false, bypassCache = false) {
  const cacheKey = `products_${onlyVisible ? 'visible' : 'all'}`;
  if (!bypassCache) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }
  try {
    const url = `/api/products${onlyVisible ? '?visible=true' : ''}`;
    const data = await apiFetch(url);
    const prods = Array.isArray(data) ? data : [];
    setCache(cacheKey, prods);
    return prods;
  } catch (error) {
    console.warn('[MySQL DB] getProducts failed:', error.message);
    throw error;
  }
}

export async function getProductById(productId) {
  try {
    return await apiFetch(`/api/products/${encodeURIComponent(productId)}`);
  } catch {
    const all = await getProducts(false);
    return all.find((p) => p.id === productId) || null;
  }
}

export async function saveProduct(productId, productData) {
  try {
    const res = await apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({ ...productData, id: productId })
    });
    localStorage.removeItem('pulmo_mysql_products_all');
    localStorage.removeItem('pulmo_mysql_products_visible');
    return res;
  } catch (error) {
    console.error('[MySQL DB] saveProduct error:', error.message);
    throw error;
  }
}

export async function deleteProduct(productId) {
  try {
    const res = await apiFetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE'
    });
    localStorage.removeItem('pulmo_mysql_products_all');
    localStorage.removeItem('pulmo_mysql_products_visible');
    return res;
  } catch (error) {
    console.error('[MySQL DB] deleteProduct error:', error.message);
    throw error;
  }
}

/* =========================================================
   5. ORDERS (/api/orders)
   ========================================================= */

export async function getOrders(bypassCache = false) {
  if (!bypassCache) {
    const cached = getCached('orders');
    if (cached) return cached;
  }
  try {
    const data = await apiFetch('/api/orders');
    const orders = Array.isArray(data) ? data : [];
    setCache('orders', orders);
    return orders;
  } catch (error) {
    console.warn('[MySQL DB] getOrders failed:', error.message);
    throw error;
  }
}

export async function createCustomerOrder(orderData) {
  try {
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    localStorage.removeItem('pulmo_mysql_orders');
    return res.order || res;
  } catch (error) {
    console.error('[MySQL DB] createCustomerOrder error:', error.message);
    throw error;
  }
}

export async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    localStorage.removeItem('pulmo_mysql_orders');
    return res;
  } catch (error) {
    console.error('[MySQL DB] updateOrderStatus error:', error.message);
    throw error;
  }
}

export async function deleteOrder(orderId) {
  try {
    const res = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE'
    });
    localStorage.removeItem('pulmo_mysql_orders');
    return res;
  } catch (error) {
    console.error('[MySQL DB] deleteOrder error:', error.message);
    throw error;
  }
}

/* =========================================================
   6. CUSTOMER INQUIRIES (/api/inquiries)
   ========================================================= */

export async function getInquiries(bypassCache = false) {
  if (!bypassCache) {
    const cached = getCached('inquiries');
    if (cached) return cached;
  }
  try {
    const data = await apiFetch('/api/inquiries');
    const inqs = Array.isArray(data) ? data : [];
    setCache('inquiries', inqs);
    return inqs;
  } catch (error) {
    console.warn('[MySQL DB] getInquiries failed:', error.message);
    throw error;
  }
}

export async function createCustomerInquiry(inquiryData) {
  try {
    const res = await apiFetch('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiryData)
    });
    localStorage.removeItem('pulmo_mysql_inquiries');
    return res;
  } catch (error) {
    console.error('[MySQL DB] createCustomerInquiry error:', error.message);
    throw error;
  }
}

export async function updateInquiryStatus(inquiryId, newStatus) {
  try {
    const res = await apiFetch(`/api/inquiries/${encodeURIComponent(inquiryId)}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    localStorage.removeItem('pulmo_mysql_inquiries');
    return res;
  } catch (error) {
    console.error('[MySQL DB] updateInquiryStatus error:', error.message);
    throw error;
  }
}

export async function deleteInquiry(inquiryId) {
  try {
    const res = await apiFetch(`/api/inquiries/${encodeURIComponent(inquiryId)}`, {
      method: 'DELETE'
    });
    localStorage.removeItem('pulmo_mysql_inquiries');
    return res;
  } catch (error) {
    console.error('[MySQL DB] deleteInquiry error:', error.message);
    throw error;
  }
}

/* =========================================================
   7. MEDIA LIBRARY (/api/media)
   ========================================================= */

export async function getMediaItems(bypassCache = false) {
  if (!bypassCache) {
    const cached = getCached('media');
    if (cached) return cached;
  }
  try {
    const data = await apiFetch('/api/media');
    const items = Array.isArray(data) ? data : [];
    setCache('media', items);
    return items;
  } catch (error) {
    console.warn('[MySQL DB] getMediaItems failed:', error.message);
    throw error;
  }
}

export async function saveMediaItem(mediaId, mediaData) {
  try {
    const res = await apiFetch('/api/media', {
      method: 'POST',
      body: JSON.stringify({ ...mediaData, id: mediaId })
    });
    localStorage.removeItem('pulmo_mysql_media');
    return res;
  } catch (error) {
    console.error('[MySQL DB] saveMediaItem error:', error.message);
    throw error;
  }
}

export async function deleteMediaItem(mediaId) {
  try {
    const res = await apiFetch(`/api/media/${encodeURIComponent(mediaId)}`, {
      method: 'DELETE'
    });
    localStorage.removeItem('pulmo_mysql_media');
    return res;
  } catch (error) {
    console.error('[MySQL DB] deleteMediaItem error:', error.message);
    throw error;
  }
}

/* =========================================================
   8. ADMIN USERS (/api/admins)
   ========================================================= */

export async function getAdmins(bypassCache = false) {
  if (!bypassCache) {
    const cached = getCached('admins');
    if (cached) return cached;
  }
  try {
    const data = await apiFetch('/api/admins');
    const admins = Array.isArray(data) ? data : [];
    setCache('admins', admins);
    return admins;
  } catch (error) {
    console.warn('[MySQL DB] getAdmins failed:', error.message);
    throw error;
  }
}

export async function saveAdmin(email, role = 'editor', displayName = 'Admin') {
  try {
    const res = await apiFetch('/api/admins', {
      method: 'POST',
      body: JSON.stringify({ email, role, displayName })
    });
    localStorage.removeItem('pulmo_mysql_admins');
    return res;
  } catch (error) {
    console.error('[MySQL DB] saveAdmin error:', error.message);
    throw error;
  }
}

export async function deleteAdmin(adminId) {
  try {
    const res = await apiFetch(`/api/admins/${encodeURIComponent(adminId)}`, {
      method: 'DELETE'
    });
    localStorage.removeItem('pulmo_mysql_admins');
    return res;
  } catch (error) {
    console.error('[MySQL DB] deleteAdmin error:', error.message);
    throw error;
  }
}

export async function checkIsAdmin(email) {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const admins = await getAdmins();
    return admins.some((a) => (a.email || '').toLowerCase() === cleanEmail);
  } catch {
    return false;
  }
}

/* =========================================================
   9. ADMIN AUTHENTICATION (/api/auth/login)
   ========================================================= */

export async function loginAdminWithCredentials(email, password) {
  return await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}
