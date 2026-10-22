import './admin.css';
import { checkIsAdmin } from '../shared/db.js';
import { renderLoginPage } from './pages/login.js';
import { renderDashboardPage } from './pages/dashboard.js';
import { renderProductsPage } from './pages/products.js';
import { renderCategoriesPage } from './pages/categories.js';
import { renderMediaPage } from './pages/media.js';
import { renderOrdersPage } from './pages/orders.js';
import { renderInquiriesPage } from './pages/inquiries.js';
import { renderSectionsPage } from './pages/sections.js';
import { renderSettingsPage } from './pages/settings.js';
import { renderAdminsPage } from './pages/admins.js';
import { showToast } from './components/toast.js';
import { escapeHtml } from '../shared/utils/escape.js';

const appRoot = document.getElementById('admin-app');
let currentUser = null;
let currentRole = 'editor';

/**
 * Checks for stored MySQL admin session
 */
function getActiveAdminSession() {
  try {
    const raw = localStorage.getItem('pulmo_admin_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !session.email) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Bootstraps Admin CMS Application
 */
function initAdmin() {
  const localSession = getActiveAdminSession();

  if (localSession) {
    currentUser = {
      email: localSession.email,
      uid: 'mysql_admin_session',
      displayName: localSession.displayName || 'Pulmo Care Admin (Owner)'
    };
    currentRole = localSession.role || 'owner';
    renderAdminShell();
    handleRoute();
  } else {
    currentUser = null;
    renderLoginPage(appRoot);
  }

  window.addEventListener('hashchange', handleRoute);
}

function renderUnauthorized(user) {
  appRoot.innerHTML = `
    <div class="login-wrap">
      <div class="login-card" style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
        <h2 class="login-title">Access Restricted</h2>
        <p class="login-sub" style="margin-bottom: 1.5rem;">
          The account <strong>${escapeHtml(user.email || 'Anonymous')}</strong> is not registered as an administrator in the MySQL database.
        </p>
        <button class="adm-btn adm-btn--primary" id="unauth-logout-btn" style="width: 100%;">
          Sign In with Admin Account
        </button>
      </div>
    </div>
  `;

  document.getElementById('unauth-logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('pulmo_admin_session');
    window.location.reload();
  });
}

/**
 * Renders Admin Dashboard Shell
 */
function renderAdminShell() {
  appRoot.innerHTML = `
    <div class="admin-layout">
      <!-- Sidebar Navigation -->
      <aside class="admin-sidebar" id="admin-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <img src="/assets/pulmo_logo.jpg" alt="Logo" class="sidebar-logo" />
            <div class="sidebar-brand-text">
              <span class="brand-title">Pulmo Care</span>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-title">Overview</div>
          <a href="#dashboard" class="admin-nav-item is-active" data-route="dashboard">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>

          <div class="nav-section-title">Catalog Management</div>
          <a href="#products" class="admin-nav-item" data-route="products">
            <span class="nav-icon">📦</span>
            <span>Products</span>
          </a>
          <a href="#categories" class="admin-nav-item" data-route="categories">
            <span class="nav-icon">🏷️</span>
            <span>Categories</span>
          </a>
          <a href="#media" class="admin-nav-item" data-route="media">
            <span class="nav-icon">🖼️</span>
            <span>Media Library</span>
          </a>

          <div class="nav-section-title">Sales & Support</div>
          <a href="#orders" class="admin-nav-item" data-route="orders">
            <span class="nav-icon">🛍️</span>
            <span>Orders</span>
          </a>
          <a href="#inquiries" class="admin-nav-item" data-route="inquiries">
            <span class="nav-icon">💬</span>
            <span>Inquiries</span>
          </a>

          <div class="nav-section-title">Store Customization</div>
          <a href="#sections" class="admin-nav-item" data-route="sections">
            <span class="nav-icon">🎨</span>
            <span>Page Sections</span>
          </a>
          <a href="#settings" class="admin-nav-item" data-route="settings">
            <span class="nav-icon">⚙️</span>
            <span>Site Settings</span>
          </a>

          ${currentRole === 'owner' ? `
            <div class="nav-section-title">Administration</div>
            <a href="#admins" class="admin-nav-item" data-route="admins">
              <span class="nav-icon">👥</span>
              <span>Admin Users</span>
            </a>
          ` : ''}
        </nav>

        <div class="sidebar-footer">
          <div style="font-size: 0.75rem; color: var(--admin-text-muted); margin-bottom: 0.5rem;">
            Role: <strong>${currentRole === 'owner' ? '👑 Owner' : '✏️ Editor'}</strong>
          </div>
          <a href="/" target="_blank" class="adm-btn adm-btn--secondary adm-btn--sm" style="width: 100%; text-decoration: none; justify-content: center;">
            🌐 View Public Store
          </a>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="admin-main admin-main-wrap">
        <!-- Topbar -->
        <header class="admin-topbar">
          <div class="topbar-left">
            <button class="adm-btn--icon mobile-menu-btn" id="mobile-menu-toggle" aria-label="Toggle menu">☰</button>
            <h2 class="topbar-title" id="topbar-page-name">Dashboard Overview</h2>
          </div>

          <div class="topbar-right">
            <!-- Theme Toggle -->
            <button class="adm-btn--icon" id="theme-toggle-btn" title="Toggle Dark/Light Mode">🌓</button>

            <!-- User Info -->
            <div class="user-profile-badge">
              <div class="user-avatar">${(currentUser.email || 'A')[0].toUpperCase()}</div>
              <span style="font-weight: 500;">${escapeHtml(currentUser.email || '')}</span>
            </div>

            <!-- Logout -->
            <button class="adm-btn adm-btn--secondary adm-btn--sm" id="logout-btn" title="Log Out">
              Log Out
            </button>
          </div>
        </header>

        <!-- Dynamic Main Viewport -->
        <main class="admin-viewport" id="admin-page-container"></main>
      </div>
    </div>
  `;

  // Wire Topbar Actions
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('pulmo_admin_session');
    showToast('Successfully logged out.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 200);
  });

  // Mobile Menu Toggle
  const sidebar = document.getElementById('admin-sidebar');
  document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
    sidebar?.classList.toggle('is-open');
  });

  // Dark Mode Toggle
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('pulmo_admin_theme', isDark ? 'dark' : 'light');
  });

  if (localStorage.getItem('pulmo_admin_theme') === 'dark') {
    document.body.classList.add('dark');
  }
}

/**
 * Client-Side Hash Router
 */
async function handleRoute() {
  if (!currentUser) return;

  const rawHash = window.location.hash.slice(1) || 'dashboard';
  const route = rawHash.split('?')[0];

  // Update Active Nav Link
  document.querySelectorAll('.admin-nav-item').forEach((item) => {
    if (item.dataset.route === route) {
      item.classList.add('is-active');
    } else {
      item.classList.remove('is-active');
    }
  });

  // Close mobile sidebar on route change
  document.getElementById('admin-sidebar')?.classList.remove('is-open');

  const container = document.getElementById('admin-page-container');
  const pageNameEl = document.getElementById('topbar-page-name');
  if (!container) return;

  container.innerHTML = '<div style="text-align: center; padding: 4rem; color: var(--admin-text-muted);"><div class="spinner" style="margin: 0 auto 1rem;"></div>Loading content...</div>';

  switch (route) {
    case 'dashboard':
      if (pageNameEl) pageNameEl.textContent = 'Dashboard Overview';
      await renderDashboardPage(container);
      break;

    case 'products':
      if (pageNameEl) pageNameEl.textContent = 'Products Inventory';
      await renderProductsPage(container);
      break;

    case 'categories':
      if (pageNameEl) pageNameEl.textContent = 'Categories';
      await renderCategoriesPage(container);
      break;

    case 'media':
      if (pageNameEl) pageNameEl.textContent = 'Media Library';
      await renderMediaPage(container);
      break;

    case 'orders':
      if (pageNameEl) pageNameEl.textContent = 'Orders & Sales Desk';
      await renderOrdersPage(container);
      break;

    case 'inquiries':
      if (pageNameEl) pageNameEl.textContent = 'Customer Inquiries & Support';
      await renderInquiriesPage(container);
      break;

    case 'sections':
      if (pageNameEl) pageNameEl.textContent = 'Page Sections Editor';
      await renderSectionsPage(container);
      break;

    case 'settings':
      if (pageNameEl) pageNameEl.textContent = 'Site Settings & Database Tools';
      await renderSettingsPage(container);
      break;

    case 'admins':
      if (pageNameEl) pageNameEl.textContent = 'Admin Users & Permissions';
      if (currentRole === 'owner') {
        await renderAdminsPage(container);
      } else {
        container.innerHTML = '<div class="adm-card" style="padding: 3rem; text-align: center; color: var(--admin-danger);">This section is restricted to Owner administrators.</div>';
      }
      break;

    default:
      window.location.hash = '#dashboard';
      break;
  }
}

// Start
initAdmin();
