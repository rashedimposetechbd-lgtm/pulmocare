import { getAdmins, saveAdmin, deleteAdmin } from '../../shared/db.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirmDialog.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

export async function renderAdminsPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Admin Users & Permissions</h1>
        <p class="page-sub">Manage authorized administrator accounts, email whitelist, and role access levels (Owner / Editor)</p>
      </div>
      <div class="action-row">
        <button class="adm-btn adm-btn--primary" id="add-admin-btn">
          + Add New Admin
        </button>
      </div>
    </div>

    <!-- Admins Table -->
    <div class="adm-card" style="max-width: 900px;">
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Email Address</th>
              <th>Role</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="admins-table-body">
            <tr>
              <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--admin-text-muted);">
                Loading administrator list...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  let admins = [];
  const tbody = container.querySelector('#admins-table-body');
  const addBtn = container.querySelector('#add-admin-btn');

  addBtn?.addEventListener('click', () => openAdminEditor());

  async function loadData() {
    try {
      admins = await getAdmins();
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--admin-danger); padding: 2rem;">Failed to load admins: ${err.message}</td></tr>`;
    }
  }

  function renderTable() {
    tbody.innerHTML = admins.map((adm) => {
      return `
        <tr>
          <td>
            <strong>${escapeHtml(adm.email || 'N/A')}</strong>
          </td>
          <td>
            <span class="status-pill ${adm.role === 'owner' ? 'status-pill--primary' : 'status-pill--neutral'}" style="text-transform: capitalize;">
              ${escapeHtml(adm.role || 'editor')}
            </span>
          </td>
          <td><span class="status-pill status-pill--success">Active</span></td>
          <td style="text-align: right;">
            <button class="adm-btn adm-btn--danger adm-btn--sm del-admin-btn" data-uid="${escapeHtml(adm.uid)}" data-email="${escapeHtml(adm.email)}">
              🗑️ Remove
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.del-admin-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.uid;
        const email = btn.dataset.email;
        confirmDialog({
          title: 'Revoke Admin Access',
          message: `Are you sure you want to remove admin access for "${email}"?`,
          onConfirm: async () => {
            showToast('Removing administrator...', 'info');
            await deleteAdmin(uid);
            showToast('✓ Admin access revoked successfully!', 'success');
            loadData();
          }
        });
      });
    });
  }

  function openAdminEditor() {
    const contentHtml = `
      <form id="admin-user-form">
        <div class="adm-form-group">
          <label class="adm-label">Admin Email Address *</label>
          <input type="email" id="new-adm-email" class="adm-input" required placeholder="manager@pulmocare.com" />
        </div>

        <div class="adm-form-group">
          <label class="adm-label">Permission Role *</label>
          <select id="new-adm-role" class="adm-select" required>
            <option value="editor">Editor (Can manage products, categories, orders, and inquiries)</option>
            <option value="owner">Owner (Full system access, settings, and admin management)</option>
          </select>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; border-top: 1px solid var(--admin-border); padding-top: 1rem;">
          <button type="button" class="adm-btn adm-btn--secondary" id="modal-cancel-btn">Cancel</button>
          <button type="submit" class="adm-btn adm-btn--primary" id="modal-add-adm-btn">Grant Access</button>
        </div>
      </form>
    `;

    openModal({
      title: 'Add New Administrator',
      content: contentHtml,
      width: '500px'
    });

    const form = document.getElementById('admin-user-form');
    form?.querySelector('#modal-cancel-btn')?.addEventListener('click', closeModal);

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('#new-adm-email').value.trim();
      const role = form.querySelector('#new-adm-role').value;

      if (!email) {
        alert('Email address is required.');
        return;
      }

      const uid = `admin_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      try {
        await saveAdmin(uid, { email, role });
        showToast('✓ New admin granted access successfully!', 'success');
        closeModal();
        loadData();
      } catch (err) {
        showToast('Failed to add admin: ' + err.message, 'error');
      }
    });
  }

  loadData();
}
