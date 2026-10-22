import { getOrders, updateOrderStatus, deleteOrder } from '../../shared/db.js';
import { formatTaka, formatDate } from '../../shared/utils/format.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirmDialog.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

export async function renderOrdersPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Orders Management</h1>
        <p class="page-sub">Cash on Delivery & online orders, status tracking, customer details, and invoice generation</p>
      </div>
      <div class="action-row">
        <button class="adm-btn adm-btn--secondary" id="export-csv-btn">
          📥 Export to CSV
        </button>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="adm-card" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <input type="text" id="order-search-input" class="adm-input" placeholder="🔍 Search by customer name, phone, or order ID..." style="flex: 1; min-width: 240px;" />
        <select id="order-status-filter" class="adm-select" style="max-width: 180px;">
          <option value="all">All Statuses</option>
          <option value="new">New Orders</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span id="order-count-badge" style="font-size: 0.85rem; color: var(--admin-text-muted); font-family: var(--font-mono);">
          Total: 0
        </span>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="adm-card">
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Delivery Address & Zone</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Channel</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="orders-table-body">
            <tr>
              <td colspan="9" style="text-align: center; padding: 3rem; color: var(--admin-text-muted);">
                Loading orders...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  let orders = [];

  const tbody = container.querySelector('#orders-table-body');
  const searchInput = container.querySelector('#order-search-input');
  const statusFilter = container.querySelector('#order-status-filter');
  const countBadge = container.querySelector('#order-count-badge');
  const exportBtn = container.querySelector('#export-csv-btn');

  exportBtn?.addEventListener('click', () => exportToCSV(orders));

  async function loadData() {
    try {
      orders = await getOrders();
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--admin-danger); padding: 2rem;">Failed to load orders: ${err.message}</td></tr>`;
    }
  }

  function renderTable() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const st = statusFilter?.value || 'all';

    const filtered = orders.filter((o) => {
      const matchQ = (o.id || '').toLowerCase().includes(q) ||
                     (o.customerName || '').toLowerCase().includes(q) ||
                     (o.customerPhone || '').toLowerCase().includes(q) ||
                     (o.customerAddress || '').toLowerCase().includes(q);
      const matchSt = st === 'all' || o.status === st;
      return matchQ && matchSt;
    });

    if (countBadge) countBadge.textContent = `Total: ${filtered.length} orders`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 3rem; color: var(--admin-text-muted);">
            No orders found matching your criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((ord) => {
      const statusClass = ord.status === 'new' ? 'status-pill--warning' :
                          ord.status === 'confirmed' ? 'status-pill--primary' :
                          ord.status === 'shipped' ? 'status-pill--teal' :
                          ord.status === 'delivered' ? 'status-pill--success' : 'status-pill--neutral';
      const statusLabel = ord.status ? ord.status.toUpperCase() : 'NEW';
      const itemCount = Array.isArray(ord.items) ? ord.items.reduce((s, i) => s + (i.qty || 1), 0) : 1;
      const cleanPhone = (ord.customerPhone || '').replace(/[^0-9]/g, '');
      const zoneLabel = ord.zone === 'outside' ? 'Outside Dhaka' : 'Inside Dhaka';

      return `
        <tr data-order-id="${escapeHtml(ord.id)}">
          <td><code style="font-weight: 700; font-family: var(--font-mono); font-size: 0.8rem;">#${escapeHtml((ord.id || '').slice(0, 8))}</code></td>
          <td><span style="font-size: 0.8rem; color: var(--admin-text-muted);">${formatDate(ord.createdAt)}</span></td>
          <td>
            <strong>${escapeHtml(ord.customerName || 'N/A')}</strong>
            <div style="font-size: 0.8rem; color: var(--admin-text-muted); font-family: var(--font-mono);">${escapeHtml(ord.customerPhone || '')}</div>
          </td>
          <td>
            <div style="max-width: 220px; font-size: 0.825rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(ord.customerAddress || '')}">
              ${escapeHtml(ord.customerAddress || 'N/A')}
            </div>
            <span class="status-pill status-pill--neutral" style="font-size: 0.65rem;">
              ${zoneLabel}
            </span>
          </td>
          <td><span style="font-family: var(--font-mono); font-weight: 600;">${itemCount} item(s)</span></td>
          <td><strong style="color: var(--admin-emerald); font-family: var(--font-mono);">${formatTaka(ord.total, false)}</strong></td>
          <td><span class="status-pill status-pill--primary">${escapeHtml((ord.channel || 'web').toUpperCase())}</span></td>
          <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.35rem;">
              <button class="adm-btn adm-btn--secondary adm-btn--sm view-order-btn" data-id="${escapeHtml(ord.id)}">
                👁️ View
              </button>
              ${cleanPhone ? `
                <a href="https://wa.me/88${cleanPhone}" target="_blank" rel="noopener" class="adm-btn adm-btn--secondary adm-btn--sm" title="Message Customer on WhatsApp">
                  💬
                </a>
              ` : ''}
              <button class="adm-btn adm-btn--danger adm-btn--sm del-order-btn" data-id="${escapeHtml(ord.id)}" title="Delete Order Record">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.view-order-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ord = orders.find((o) => o.id === btn.dataset.id);
        if (ord) openOrderDetailModal(ord);
      });
    });

    tbody.querySelectorAll('.del-order-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ordId = btn.dataset.id;
        confirmDialog({
          title: 'Delete Order',
          message: 'Are you sure you want to delete this order record?',
          onConfirm: async () => {
            showToast('Deleting order...', 'info');
            await deleteOrder(ordId);
            showToast('✓ Order deleted successfully!', 'success');
            loadData();
          }
        });
      });
    });
  }

  searchInput?.addEventListener('input', renderTable);
  statusFilter?.addEventListener('change', renderTable);

  /**
   * Order Details & Invoice Modal
   */
  function openOrderDetailModal(ord) {
    const cleanPhone = (ord.customerPhone || '').replace(/[^0-9]/g, '');
    const items = Array.isArray(ord.items) ? ord.items : [];
    const zoneLabel = ord.zone === 'outside' ? 'Outside Dhaka (All Bangladesh)' : 'Inside Dhaka';

    const contentHtml = `
      <div id="invoice-printable-area" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Header Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 1px solid var(--admin-border);">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700;">Order #${escapeHtml((ord.id || '').slice(0, 8))}</h3>
            <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-top: 2px;">Placed on: ${formatDate(ord.createdAt)}</p>
          </div>
          <div style="text-align: right;">
            <span class="status-pill status-pill--primary" style="font-size: 0.8rem; text-transform: uppercase;">
              ${escapeHtml(ord.channel || 'web')}
            </span>
          </div>
        </div>

        <!-- Customer & Delivery -->
        <div class="adm-grid-2">
          <div style="background: var(--admin-surface-subtle); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--admin-border);">
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--admin-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Customer Information</h4>
            <div style="font-size: 0.95rem; font-weight: 600;">${escapeHtml(ord.customerName || 'N/A')}</div>
            <div style="font-size: 0.85rem; color: var(--admin-text-muted); font-family: var(--font-mono); margin-top: 2px;">
              Phone: <a href="tel:${escapeHtml(ord.customerPhone)}" style="color: var(--admin-primary);">${escapeHtml(ord.customerPhone || 'N/A')}</a>
            </div>
          </div>
          <div style="background: var(--admin-surface-subtle); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--admin-border);">
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--admin-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Delivery Destination</h4>
            <div style="font-size: 0.85rem; line-height: 1.4;">${escapeHtml(ord.customerAddress || 'N/A')}</div>
            <div style="font-size: 0.75rem; color: var(--admin-text-muted); margin-top: 4px;">
              Zone: <strong>${zoneLabel}</strong>
            </div>
          </div>
        </div>

        <!-- Itemized Table -->
        <div>
          <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Ordered Products</h4>
          <table class="adm-table" style="border: 1px solid var(--admin-border);">
            <thead>
              <tr>
                <th>Item</th>
                <th>Unit Price</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((i) => `
                <tr>
                  <td><strong>${escapeHtml(i.name || 'Product')}</strong></td>
                  <td style="font-family: var(--font-mono);">${formatTaka(i.price, false)}</td>
                  <td style="text-align: center; font-family: var(--font-mono);">${i.qty || 1}</td>
                  <td style="text-align: right; font-family: var(--font-mono);">${formatTaka((i.price || 0) * (i.qty || 1), false)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; font-weight: 600;">Subtotal:</td>
                <td style="text-align: right; font-family: var(--font-mono);">${formatTaka(ord.subtotal, false)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; font-weight: 600;">Delivery Fee:</td>
                <td style="text-align: right; font-family: var(--font-mono);">${formatTaka(ord.deliveryCharge, false)}</td>
              </tr>
              <tr style="background: var(--admin-surface-subtle); font-size: 1rem;">
                <td colspan="3" style="text-align: right; font-weight: 700;">Grand Total:</td>
                <td style="text-align: right; font-weight: 700; color: var(--admin-emerald); font-family: var(--font-mono);">${formatTaka(ord.total, false)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Status & Notes Control -->
        <div style="background: var(--admin-surface-subtle); padding: 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--admin-border);">
          <div class="adm-grid-2">
            <div class="adm-form-group" style="margin-bottom: 0;">
              <label class="adm-label">Update Order Status</label>
              <select id="modal-order-status" class="adm-select">
                <option value="new" ${ord.status === 'new' ? 'selected' : ''}>New Order</option>
                <option value="confirmed" ${ord.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="shipped" ${ord.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="delivered" ${ord.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                <option value="cancelled" ${ord.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>
            <div class="adm-form-group" style="margin-bottom: 0;">
              <label class="adm-label">Admin Internal Notes</label>
              <input type="text" id="modal-order-notes" class="adm-input" value="${escapeHtml(ord.notes || '')}" placeholder="e.g. Call before delivery, morning preferred..." />
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--admin-border); padding-top: 1rem;">
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="adm-btn adm-btn--secondary" id="print-invoice-btn">
              🖨️ Print Invoice
            </button>
            ${cleanPhone ? `
              <button type="button" class="adm-btn adm-btn--secondary" id="wa-notify-customer-btn">
                💬 WhatsApp Customer
              </button>
            ` : ''}
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="adm-btn adm-btn--secondary" id="modal-close-order-btn">Close</button>
            <button type="button" class="adm-btn adm-btn--primary" id="save-order-status-btn">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    openModal({
      title: `Order Details & Invoice #${ord.id.slice(0, 8)}`,
      content: contentHtml,
      width: '780px'
    });

    const modalEl = document.getElementById('invoice-printable-area')?.parentElement;
    modalEl?.querySelector('#modal-close-order-btn')?.addEventListener('click', closeModal);

    // Save status
    modalEl?.querySelector('#save-order-status-btn')?.addEventListener('click', async () => {
      const newStatus = modalEl.querySelector('#modal-order-status').value;
      const newNotes = modalEl.querySelector('#modal-order-notes').value.trim();

      showToast('Updating order...', 'info');
      try {
        await updateOrderStatus(ord.id, newStatus, newNotes);
        showToast('✓ Order updated successfully!', 'success');
        closeModal();
        loadData();
      } catch (err) {
        showToast('Update failed: ' + err.message, 'error');
      }
    });

    // Print Invoice
    modalEl?.querySelector('#print-invoice-btn')?.addEventListener('click', () => {
      const printContent = document.getElementById('invoice-printable-area')?.innerHTML;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice #${ord.id.slice(0, 8)} - Pulmo Care</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
              th, td { border: 1px solid #cbd5e1; padding: 0.5rem 0.75rem; text-align: left; }
              th { background: #f1f5f9; }
            </style>
          </head>
          <body>
            <h2>Pulmo Care — Invoice</h2>
            ${printContent}
            <script>window.onload = function() { window.print(); window.close(); }<\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });

    // WhatsApp notify
    modalEl?.querySelector('#wa-notify-customer-btn')?.addEventListener('click', () => {
      const message = `Hello ${ord.customerName},\nYour order (#${(ord.id || '').slice(0, 6)}) from Pulmo Care has been confirmed.\n\nTotal Payable: ${formatTaka(ord.total, false)}\nDelivery Address: ${ord.customerAddress}\n\nThank you for choosing Pulmo Care! Hotline: 01337-708107`;
      window.open(`https://wa.me/88${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    });
  }

  function exportToCSV(orderList) {
    if (orderList.length === 0) {
      showToast('No orders available to export.', 'error');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Zone', 'Total', 'Channel', 'Status'];
    const rows = orderList.map((o) => [
      `"${o.id}"`,
      `"${formatDate(o.createdAt)}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.customerPhone || ''}"`,
      `"${(o.customerAddress || '').replace(/"/g, '""')}"`,
      `"${o.zone || 'dhaka'}"`,
      `"${o.total || 0}"`,
      `"${o.channel || 'web'}"`,
      `"${o.status || 'new'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pulmo_care_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('✓ CSV file exported successfully!', 'success');
  }

  loadData();
}
