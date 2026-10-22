import {
  getCategories,
  saveCategory,
  deleteCategory,
  getProducts
} from '../../shared/db.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirmDialog.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

export async function renderCategoriesPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Categories Management</h1>
        <p class="page-sub">Organize respiratory & sleep care devices into searchable store categories</p>
      </div>
      <div class="action-row">
        <button class="adm-btn adm-btn--primary" id="add-cat-btn">
          + Add New Category
        </button>
      </div>
    </div>

    <!-- Category List Table -->
    <div class="adm-card">
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th style="width: 70px;">Order</th>
              <th>Category Name</th>
              <th>Slug / Key</th>
              <th>Linked Products</th>
              <th>Visibility</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="categories-table-body">
            <tr>
              <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--admin-text-muted);">
                Loading categories...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  let categories = [];
  let products = [];

  const tbody = container.querySelector('#categories-table-body');
  const addBtn = container.querySelector('#add-cat-btn');

  addBtn?.addEventListener('click', () => openCategoryEditor());

  async function loadData() {
    try {
      const [cats, prods] = await Promise.all([
        getCategories(true),
        getProducts(false, true)
      ]);
      categories = cats;
      products = prods;
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-danger); padding: 2rem;">Failed to load categories: ${err.message}</td></tr>`;
    }
  }

  function renderTable() {
    if (categories.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem; color: var(--admin-text-muted);">
            No categories created yet. Click "+ Add New Category" above.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = categories.map((cat, idx) => {
      const prodCount = products.filter((p) => p.categoryId === cat.id || p.category === cat.id).length;
      const displayName = cat.nameEn || cat.nameBn || cat.name || cat.id;

      return `
        <tr data-cat-id="${escapeHtml(cat.id)}">
          <td><span style="font-family: var(--font-mono); font-weight: 600;">#${cat.order || idx + 1}</span></td>
          <td>
            <strong>${escapeHtml(displayName)}</strong>
            ${cat.nameBn && cat.nameBn !== displayName ? `<div style="font-size: 0.8rem; color: var(--admin-text-muted);">${escapeHtml(cat.nameBn)}</div>` : ''}
          </td>
          <td><code style="font-size: 0.8rem; background: var(--admin-surface-subtle); padding: 2px 6px; border-radius: 4px;">${escapeHtml(cat.id)}</code></td>
          <td>
            <span class="status-pill status-pill--neutral" style="font-family: var(--font-mono);">
              ${prodCount} products
            </span>
          </td>
          <td>
            <span class="status-pill ${cat.visible !== false ? 'status-pill--success' : 'status-pill--neutral'}">
              ${cat.visible !== false ? 'Active' : 'Hidden'}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.35rem;">
              <button class="adm-btn adm-btn--secondary adm-btn--sm edit-cat-btn" data-id="${escapeHtml(cat.id)}">✏️ Edit</button>
              <button class="adm-btn adm-btn--danger adm-btn--sm del-cat-btn" data-id="${escapeHtml(cat.id)}" data-count="${prodCount}" title="Delete Category">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Wire Edit Buttons
    tbody.querySelectorAll('.edit-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = categories.find((c) => c.id === btn.dataset.id);
        if (cat) openCategoryEditor(cat);
      });
    });

    // Wire Delete Buttons with Safety Guard
    tbody.querySelectorAll('.del-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.id;
        const count = Number(btn.dataset.count) || 0;
        const cat = categories.find((c) => c.id === catId);
        if (!cat) return;

        if (count > 0) {
          alert(`This category has ${count} active products! Please reassign these products to another category before deleting.`);
          return;
        }

        confirmDialog({
          title: 'Delete Category',
          message: `Are you sure you want to permanently delete the category "${cat.nameEn || cat.nameBn || cat.id}"?`,
          onConfirm: async () => {
            showToast('Deleting category...', 'info');
            await deleteCategory(catId);
            showToast('✓ Category deleted successfully!', 'success');
            loadData();
          }
        });
      });
    });
  }

  function openCategoryEditor(category = null) {
    const isEdit = Boolean(category);
    const cat = category || {
      id: '',
      nameEn: '',
      nameBn: '',
      slug: '',
      order: (categories.length || 0) + 1,
      visible: true
    };

    const contentHtml = `
      <form id="category-modal-form">
        <div class="adm-form-group">
          <label class="adm-label">Category Name *</label>
          <input type="text" id="cat-name-en" class="adm-input" required value="${escapeHtml(cat.nameEn || cat.nameBn || '')}" placeholder="e.g. CPAP & BiPAP Devices" />
        </div>

        <div class="adm-form-group">
          <label class="adm-label">Category Name (Bangla label for storefront)</label>
          <input type="text" id="cat-name-bn" class="adm-input" value="${escapeHtml(cat.nameBn || '')}" placeholder="e.g. সিপ্যাপ ও বাইপ্যাপ" />
        </div>

        <div class="adm-grid-2">
          <div class="adm-form-group">
            <label class="adm-label">Unique Slug / Key *</label>
            <input type="text" id="cat-id" class="adm-input" required value="${escapeHtml(cat.id || '')}" ${isEdit ? 'readonly style="background: var(--admin-surface-subtle);"' : ''} placeholder="e.g. cpap" />
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Display Order</label>
            <input type="number" id="cat-order" class="adm-input" value="${cat.order || 1}" min="1" />
          </div>
        </div>

        <div style="padding: 0.5rem 0;">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="cat-visible" ${cat.visible !== false ? 'checked' : ''} />
            <span>Visible in storefront category tabs</span>
          </label>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; border-top: 1px solid var(--admin-border); padding-top: 1rem;">
          <button type="button" class="adm-btn adm-btn--secondary" id="modal-cancel-btn">Cancel</button>
          <button type="submit" class="adm-btn adm-btn--primary" id="modal-save-btn">${isEdit ? 'Update Category' : 'Create Category'}</button>
        </div>
      </form>
    `;

    openModal({
      title: isEdit ? `Edit Category: ${cat.nameEn || cat.nameBn || cat.id}` : 'Create New Category',
      content: contentHtml,
      width: '540px'
    });

    const form = document.getElementById('category-modal-form');
    form?.querySelector('#modal-cancel-btn')?.addEventListener('click', closeModal);

    const nameEnInput = form?.querySelector('#cat-name-en');
    const idInput = form?.querySelector('#cat-id');

    if (!isEdit) {
      nameEnInput?.addEventListener('input', () => {
        idInput.value = nameEnInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
      });
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameEn = nameEnInput.value.trim();
      const nameBn = form.querySelector('#cat-name-bn').value.trim() || nameEn;
      const id = idInput.value.trim();
      const order = Number(form.querySelector('#cat-order').value) || 1;
      const visible = form.querySelector('#cat-visible').checked;

      if (!nameEn || !id) {
        alert('Please fill out both the category name and slug.');
        return;
      }

      try {
        await saveCategory(id, { nameEn, nameBn, slug: id, order, visible });
        showToast('✓ Category saved successfully!', 'success');
        closeModal();
        loadData();
      } catch (err) {
        showToast('Save failed: ' + err.message, 'error');
      }
    });
  }

  loadData();
}
