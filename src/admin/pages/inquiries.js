import { getInquiries, updateInquiryStatus, deleteInquiry } from '../../shared/db.js';
import { formatDate } from '../../shared/utils/format.js';
import { confirmDialog } from '../components/confirmDialog.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

export async function renderInquiriesPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Customer Inquiries & Support</h1>
        <p class="page-sub">Prescription advice, product questions, and sleep-care consultation requests from the storefront</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="adm-card" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <input type="text" id="inq-search-input" class="adm-input" placeholder="🔍 Search by customer name, phone, or product..." style="flex: 1; min-width: 240px;" />
        <select id="inq-status-filter" class="adm-select" style="max-width: 180px;">
          <option value="all">All Statuses</option>
          <option value="new">New Inquiries</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
        <span id="inq-count-badge" style="font-size: 0.85rem; color: var(--admin-text-muted); font-family: var(--font-mono);">
          Total: 0
        </span>
      </div>
    </div>

    <!-- Inquiries List Table -->
    <div class="adm-card">
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Product / Service</th>
              <th>Message / Question</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="inquiries-table-body">
            <tr>
              <td colspan="7" style="text-align: center; padding: 3rem; color: var(--admin-text-muted);">
                Loading inquiries...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  let inquiries = [];

  const tbody = container.querySelector('#inquiries-table-body');
  const searchInput = container.querySelector('#inq-search-input');
  const statusFilter = container.querySelector('#inq-status-filter');
  const countBadge = container.querySelector('#inq-count-badge');

  async function loadData() {
    try {
      inquiries = await getInquiries();
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--admin-danger); padding: 2rem;">Failed to load inquiries: ${err.message}</td></tr>`;
    }
  }

  function renderTable() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const st = statusFilter?.value || 'all';

    const filtered = inquiries.filter((i) => {
      const matchQ = (i.customerName || '').toLowerCase().includes(q) ||
                     (i.customerPhone || '').toLowerCase().includes(q) ||
                     (i.productInterest || i.product || '').toLowerCase().includes(q) ||
                     (i.message || '').toLowerCase().includes(q);
      const matchSt = st === 'all' || i.status === st;
      return matchQ && matchSt;
    });

    if (countBadge) countBadge.textContent = `Total: ${filtered.length} inquiries`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem; color: var(--admin-text-muted);">
            No inquiries found matching your filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((inq) => {
      const statusClass = inq.status === 'new' ? 'status-pill--warning' :
                          inq.status === 'contacted' ? 'status-pill--primary' : 'status-pill--neutral';
      const statusLabel = inq.status ? inq.status.toUpperCase() : 'NEW';
      const cleanPhone = (inq.customerPhone || '').replace(/[^0-9]/g, '');

      return `
        <tr data-inq-id="${escapeHtml(inq.id)}">
          <td><span style="font-size: 0.8rem; color: var(--admin-text-muted);">${formatDate(inq.createdAt)}</span></td>
          <td><strong>${escapeHtml(inq.customerName || 'N/A')}</strong></td>
          <td><span style="font-family: var(--font-mono);">${escapeHtml(inq.customerPhone || 'N/A')}</span></td>
          <td><span class="status-pill status-pill--neutral">${escapeHtml(inq.productInterest || inq.product || 'General Support')}</span></td>
          <td>
            <div style="max-width: 260px; font-size: 0.825rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(inq.message || '')}">
              ${escapeHtml(inq.message || 'No additional message')}
            </div>
          </td>
          <td>
            <select class="adm-select inq-status-dropdown" data-id="${escapeHtml(inq.id)}" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; max-width: 120px;">
              <option value="new" ${inq.status === 'new' ? 'selected' : ''}>New</option>
              <option value="contacted" ${inq.status === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="closed" ${inq.status === 'closed' ? 'selected' : ''}>Closed</option>
            </select>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.35rem;">
              ${cleanPhone ? `
                <a href="https://wa.me/88${cleanPhone}" target="_blank" rel="noopener" class="adm-btn adm-btn--secondary adm-btn--sm" title="Message on WhatsApp">
                  💬 WhatsApp
                </a>
                <a href="tel:${cleanPhone}" class="adm-btn adm-btn--secondary adm-btn--sm" title="Call Customer">
                  📞 Call
                </a>
              ` : ''}
              <button class="adm-btn adm-btn--danger adm-btn--sm del-inq-btn" data-id="${escapeHtml(inq.id)}" title="Delete Inquiry">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.inq-status-dropdown').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = sel.dataset.id;
        const newStatus = sel.value;
        try {
          await updateInquiryStatus(id, newStatus);
          showToast(`✓ Inquiry status marked as ${newStatus.toUpperCase()}`, 'success');
        } catch (err) {
          showToast(`Failed to update status: ${err.message}`, 'error');
        }
      });
    });

    tbody.querySelectorAll('.del-inq-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        confirmDialog({
          title: 'Delete Inquiry',
          message: 'Are you sure you want to delete this customer inquiry?',
          onConfirm: async () => {
            showToast('Deleting inquiry...', 'info');
            await deleteInquiry(id);
            showToast('✓ Inquiry deleted successfully!', 'success');
            loadData();
          }
        });
      });
    });
  }

  searchInput?.addEventListener('input', renderTable);
  statusFilter?.addEventListener('change', renderTable);

  loadData();
}
