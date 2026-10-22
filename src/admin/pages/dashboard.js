import { getProducts, getOrders, getInquiries } from '../../shared/db.js';
import { formatTaka } from '../../shared/utils/format.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

export async function renderDashboardPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard Overview</h1>
        <p class="page-sub">Pulmo Care e-commerce store metrics, revenue, and recent customer orders</p>
      </div>
      <div class="action-row">
        <a href="/pulmo_care_mysql.sql" download="pulmo_care_mysql.sql" class="adm-btn adm-btn--primary" style="text-decoration: none;">
          📥 Download MySQL (.sql)
        </a>
      </div>
    </div>

    <!-- KPI Metric Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-card__label">Total Products</div>
        <div class="kpi-card__value" id="kpi-prods-count">0</div>
        <div class="kpi-card__sub">Active medical devices in store</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__label">New Orders</div>
        <div class="kpi-card__value" id="kpi-orders-count" style="color: var(--admin-primary);">0</div>
        <div class="kpi-card__sub">Pending confirmation</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__label">Customer Inquiries</div>
        <div class="kpi-card__value" id="kpi-inquiries-count" style="color: var(--admin-teal);">0</div>
        <div class="kpi-card__sub">Prescription & consultation requests</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__label">Total Revenue</div>
        <div class="kpi-card__value" id="kpi-revenue-val" style="color: var(--admin-emerald);">৳ 0</div>
        <div class="kpi-card__sub">Cash on Delivery & online orders</div>
      </div>
    </div>

    <!-- Recent Orders Card -->
    <div class="adm-card">
      <div class="adm-card__header">
        <h3 class="adm-card__title">Recent Customer Orders</h3>
        <a href="#orders" class="adm-btn adm-btn--secondary adm-btn--sm">View All Orders →</a>
      </div>
      <div class="adm-table-wrap">
        <table class="adm-table" id="dashboard-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address / Zone</th>
              <th>Total Amount</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="dashboard-orders-body">
            <tr>
              <td colspan="8" style="text-align: center; padding: 2rem; color: var(--admin-text-muted);">
                Loading orders...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  async function loadStats() {
    try {
      const [prods, orders, inqs] = await Promise.all([
        getProducts(false, true).catch(() => []),
        getOrders().catch(() => []),
        getInquiries().catch(() => [])
      ]);

      // KPIs
      const prodsCountEl = container.querySelector('#kpi-prods-count');
      if (prodsCountEl) prodsCountEl.textContent = String(prods.length);

      const newOrders = orders.filter((o) => o.status === 'new');
      const ordersCountEl = container.querySelector('#kpi-orders-count');
      if (ordersCountEl) ordersCountEl.textContent = String(newOrders.length);

      const inqsCountEl = container.querySelector('#kpi-inquiries-count');
      if (inqsCountEl) inqsCountEl.textContent = String(inqs.length);

      const totalRevenue = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0);
      const revenueEl = container.querySelector('#kpi-revenue-val');
      if (revenueEl) revenueEl.textContent = formatTaka(totalRevenue, false);

      // Recent 5 Orders Table
      const tbody = container.querySelector('#dashboard-orders-body');
      if (tbody) {
        if (orders.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--admin-text-muted);">
                No orders yet. Orders placed on the storefront will appear here.
              </td>
            </tr>
          `;
          return;
        }

        const recent = orders.slice(0, 5);
        tbody.innerHTML = recent.map((ord) => {
          const statusClass = ord.status === 'new' ? 'status-pill--warning' :
                              ord.status === 'confirmed' ? 'status-pill--primary' :
                              ord.status === 'delivered' ? 'status-pill--success' : 'status-pill--neutral';
          const statusLabel = ord.status ? ord.status.toUpperCase() : 'NEW';
          const cleanPhone = (ord.customerPhone || '').replace(/[^0-9]/g, '');
          const zoneLabel = ord.zone === 'outside' ? 'Outside Dhaka' : 'Inside Dhaka';

          return `
            <tr>
              <td><span style="font-family: var(--font-mono); font-weight: 600; font-size: 0.8rem;">#${escapeHtml((ord.id || '').slice(0, 8))}</span></td>
              <td><strong>${escapeHtml(ord.customerName || 'N/A')}</strong></td>
              <td>${escapeHtml(ord.customerPhone || 'N/A')}</td>
              <td>${escapeHtml(ord.customerAddress || 'N/A')} <span class="status-pill status-pill--neutral" style="font-size: 0.7rem;">${zoneLabel}</span></td>
              <td><strong style="color: var(--admin-emerald);">${formatTaka(ord.total, false)}</strong></td>
              <td><span class="status-pill status-pill--primary">${escapeHtml((ord.channel || 'web').toUpperCase())}</span></td>
              <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
              <td>
                ${cleanPhone ? `
                  <a href="https://wa.me/88${cleanPhone}" target="_blank" rel="noopener" class="adm-btn adm-btn--secondary adm-btn--sm" title="Message on WhatsApp">
                    💬 WhatsApp
                  </a>
                ` : '-'}
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.warn('Dashboard stats error:', err);
    }
  }

  loadStats();
}
