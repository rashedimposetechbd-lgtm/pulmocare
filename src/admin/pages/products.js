import {
  getProducts,
  saveProduct,
  deleteProduct,
  getCategories
} from '../../shared/db.js';
import { formatTaka } from '../../shared/utils/format.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirmDialog.js';
import { openMediaPicker } from '../components/mediaPicker.js';
import { createFeatureListEditor } from '../components/featureListEditor.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

export async function renderProductsPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Products Inventory</h1>
        <p class="page-sub">Manage respiratory & sleep-care medical devices, pricing, stock, and descriptions</p>
      </div>
      <div class="action-row">
        <button class="adm-btn adm-btn--primary" id="add-product-btn">
          + Add New Product
        </button>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="adm-card" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <input type="text" id="prod-search-input" class="adm-input" placeholder="🔍 Search products by name..." style="flex: 1; min-width: 220px;" />
        <select id="prod-cat-filter" class="adm-select" style="max-width: 200px;">
          <option value="all">All Categories</option>
        </select>
        <span id="prod-total-count" style="font-size: 0.85rem; color: var(--admin-text-muted); font-family: var(--font-mono);">
          Total: 0
        </span>
      </div>
    </div>

    <!-- Products Table -->
    <div class="adm-card">
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th style="width: 60px;">Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price (Sale / Regular)</th>
              <th>Stock</th>
              <th>Hero Showcase</th>
              <th>Visible</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="products-table-body">
            <tr>
              <td colspan="8" style="text-align: center; padding: 3rem; color: var(--admin-text-muted);">
                Loading products...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  let allProducts = [];
  let allCategories = [];

  const tableBody = container.querySelector('#products-table-body');
  const searchInput = container.querySelector('#prod-search-input');
  const catFilter = container.querySelector('#prod-cat-filter');
  const totalCountEl = container.querySelector('#prod-total-count');
  const addBtn = container.querySelector('#add-product-btn');

  addBtn?.addEventListener('click', () => openProductEditor());

  async function loadData() {
    try {
      const [prods, cats] = await Promise.all([
        getProducts(false, true),
        getCategories(true)
      ]);
      allProducts = prods;
      allCategories = cats;

      // Populate category filter dropdown
      catFilter.innerHTML = '<option value="all">All Categories</option>' + cats.map((c) => `
        <option value="${escapeHtml(c.id)}">${escapeHtml(c.nameEn || c.nameBn || c.id)}</option>
      `).join('');

      renderTable();
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--admin-danger);">Failed to load products: ${err.message}</td></tr>`;
    }
  }

  function renderTable() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const cat = catFilter?.value || 'all';

    const filtered = allProducts.filter((p) => {
      const name = p.name || p.nameEn || p.nameBn || '';
      const matchQuery = name.toLowerCase().includes(q) ||
                         (p.badge || '').toLowerCase().includes(q) ||
                         (p.id || '').toLowerCase().includes(q);
      const matchCat = cat === 'all' || p.categoryId === cat || p.category === cat;
      return matchQuery && matchCat;
    });

    if (totalCountEl) totalCountEl.textContent = `Total: ${filtered.length} products`;

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: var(--admin-text-muted);">
            No products found. Adjust filters or click "+ Add New Product" above.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map((prod) => {
      const primaryImg = (prod.images && prod.images[0]) || prod.image || '/assets/device.jpg';
      const categoryObj = allCategories.find((c) => c.id === prod.categoryId || c.id === prod.category);
      const catLabel = categoryObj ? (categoryObj.nameEn || categoryObj.nameBn) : (prod.categoryId || 'N/A');
      const displayName = prod.name || prod.nameEn || prod.nameBn || 'Unnamed Product';

      return `
        <tr data-prod-id="${escapeHtml(prod.id)}">
          <td>
            <img src="${primaryImg}" alt="" class="thumb-preview" />
          </td>
          <td>
            <div style="font-weight: 600; color: var(--admin-text-main); font-size: 0.95rem;">${escapeHtml(displayName)}</div>
            ${prod.badge ? `<span class="status-pill status-pill--primary" style="font-size: 0.65rem; margin-top: 3px;">${escapeHtml(prod.badge)}</span>` : ''}
          </td>
          <td>
            <span class="status-pill status-pill--neutral">${escapeHtml(catLabel)}</span>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--admin-text-main); font-family: var(--font-mono);">${formatTaka(prod.price, false)}</div>
            ${prod.oldPrice ? `<div style="font-size: 0.75rem; text-decoration: line-through; color: var(--admin-text-light); font-family: var(--font-mono);">${formatTaka(prod.oldPrice, false)}</div>` : ''}
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 600; color: ${(prod.stock ?? 1) > 0 ? 'var(--admin-emerald)' : 'var(--admin-danger)'};">
              ${prod.stock ?? 0}
            </span>
          </td>
          <td>
            <button class="adm-btn--icon toggle-featured-btn" data-id="${escapeHtml(prod.id)}" title="Toggle Featured in Hero Section">${prod.isFeatured ? '⭐' : '☆'}</button>
          </td>
          <td>
            <button class="adm-btn--icon toggle-visible-btn" data-id="${escapeHtml(prod.id)}" title="Toggle Storefront Visibility">${prod.visible !== false ? '👁️' : '🙈'}</button>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.35rem;">
              <button class="adm-btn adm-btn--secondary adm-btn--sm edit-prod-btn" data-id="${escapeHtml(prod.id)}">✏️ Edit</button>
              <button class="adm-btn adm-btn--secondary adm-btn--sm dup-prod-btn" data-id="${escapeHtml(prod.id)}" title="Duplicate Product">📋 Copy</button>
              <button class="adm-btn adm-btn--danger adm-btn--sm del-prod-btn" data-id="${escapeHtml(prod.id)}" title="Delete Product">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Wire table row events
    tableBody.querySelectorAll('.edit-prod-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prod = allProducts.find((p) => p.id === btn.dataset.id);
        if (prod) openProductEditor(prod);
      });
    });

    tableBody.querySelectorAll('.dup-prod-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const prod = allProducts.find((p) => p.id === btn.dataset.id);
        if (!prod) return;
        const newId = `${prod.id}-copy-${Date.now().toString().slice(-4)}`;
        const displayName = prod.name || prod.nameEn || prod.nameBn || 'Product';
        const copyData = {
          ...prod,
          name: `${displayName} (Copy)`,
          nameEn: `${displayName} (Copy)`,
          nameBn: `${displayName} (কপি)`,
          id: newId
        };
        showToast('Duplicating product...', 'info');
        await saveProduct(newId, copyData);
        showToast('✓ Product duplicated successfully!', 'success');
        loadData();
      });
    });

    tableBody.querySelectorAll('.del-prod-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prod = allProducts.find((p) => p.id === btn.dataset.id);
        if (!prod) return;
        const displayName = prod.name || prod.nameEn || prod.nameBn || 'Product';
        confirmDialog({
          title: 'Delete Product',
          message: `Are you sure you want to permanently delete "${displayName}"?`,
          onConfirm: async () => {
            showToast('Deleting product...', 'info');
            await deleteProduct(prod.id);
            showToast('✓ Product deleted successfully!', 'success');
            loadData();
          }
        });
      });
    });

    tableBody.querySelectorAll('.toggle-featured-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const prod = allProducts.find((p) => p.id === btn.dataset.id);
        if (!prod) return;
        const newFeatured = !prod.isFeatured;
        await saveProduct(prod.id, { ...prod, isFeatured: newFeatured });
        showToast(`✓ "${prod.name || prod.nameEn}" hero showcase set to ${newFeatured ? 'ACTIVE' : 'INACTIVE'}`, 'success');
        loadData();
      });
    });

    tableBody.querySelectorAll('.toggle-visible-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const prod = allProducts.find((p) => p.id === btn.dataset.id);
        if (!prod) return;
        const newVisible = prod.visible === false ? true : false;
        await saveProduct(prod.id, { ...prod, visible: newVisible });
        showToast(`✓ "${prod.name || prod.nameEn}" is now ${newVisible ? 'Visible' : 'Hidden'} on storefront`, 'success');
        loadData();
      });
    });
  }

  searchInput?.addEventListener('input', renderTable);
  catFilter?.addEventListener('change', renderTable);

  /**
   * Add / Edit Product Modal Form (Single Product Name field)
   */
  function openProductEditor(product = null) {
    const isEdit = Boolean(product);
    const prod = product || {
      id: `prod_${Date.now()}`,
      name: '',
      nameEn: '',
      nameBn: '',
      categoryId: allCategories[0]?.id || 'cpap',
      price: 0,
      oldPrice: 0,
      badge: 'In Stock',
      stock: 10,
      rating: 4.9,
      reviewCount: 20,
      images: [],
      features: ['1 Year Official Replacement Warranty'],
      shortDesc: '',
      longDesc: '',
      isFeatured: false,
      visible: true
    };

    let currentImages = Array.isArray(prod.images) ? [...prod.images] : (prod.image ? [prod.image] : []);
    const initialName = prod.name || prod.nameEn || prod.nameBn || '';

    const contentHtml = `
      <form id="product-modal-form">
        <!-- Single Product Name Field -->
        <div class="adm-form-group">
          <label class="adm-label">Product Name *</label>
          <input type="text" id="f-name" class="adm-input" required value="${escapeHtml(initialName)}" placeholder="e.g. ResHope Auto CPAP Machine" />
        </div>

        <!-- Category & Badge -->
        <div class="adm-grid-2">
          <div class="adm-form-group">
            <label class="adm-label">Category *</label>
            <select id="f-cat" class="adm-select" required>
              ${allCategories.map((c) => `
                <option value="${escapeHtml(c.id)}" ${(prod.categoryId === c.id || prod.category === c.id) ? 'selected' : ''}>
                  ${escapeHtml(c.nameEn || c.nameBn || c.id)}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Highlight Badge / Tag</label>
            <input type="text" id="f-badge" class="adm-input" value="${escapeHtml(prod.badge || '')}" placeholder="e.g. 1 Year Warranty / Best Seller / FDA Approved" />
          </div>
        </div>

        <!-- Pricing with Live Discount Calculator -->
        <div class="adm-grid-2">
          <div class="adm-form-group">
            <label class="adm-label">Sale Price (৳) *</label>
            <input type="number" id="f-price" class="adm-input" required value="${prod.price || 0}" min="0" />
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Regular / Old Price (৳) (Optional)</label>
            <input type="number" id="f-old-price" class="adm-input" value="${prod.oldPrice || 0}" min="0" />
            <div id="live-discount-preview" style="font-size: 0.75rem; color: var(--admin-emerald); margin-top: 0.25rem; font-weight: 600;"></div>
          </div>
        </div>

        <!-- Stock, Rating & ID -->
        <div class="adm-grid-2">
          <div class="adm-form-group">
            <label class="adm-label">In-Stock Quantity</label>
            <input type="number" id="f-stock" class="adm-input" value="${prod.stock ?? 10}" min="0" />
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Product ID (Slug / Key)</label>
            <input type="text" id="f-id" class="adm-input" value="${escapeHtml(prod.id)}" ${isEdit ? 'readonly style="background: var(--admin-surface-subtle);"' : ''} />
          </div>
        </div>

        <!-- Images Manager -->
        <div class="adm-form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <label class="adm-label" style="margin-bottom: 0;">Product Images (First image is primary)</label>
            <button type="button" class="adm-btn adm-btn--secondary adm-btn--sm" id="pick-image-btn">
              + Pick / Upload Image
            </button>
          </div>
          <div class="image-gallery-grid" id="modal-img-preview-grid"></div>
        </div>

        <!-- Short Description -->
        <div class="adm-form-group">
          <label class="adm-label">Short Description</label>
          <textarea id="f-short-desc" class="adm-textarea" rows="2" placeholder="Brief 1-2 sentence overview for cards...">${escapeHtml(prod.shortDesc || '')}</textarea>
        </div>

        <!-- Dynamic Features Bullet List -->
        <div class="adm-form-group">
          <label class="adm-label">Key Features (Bullet Points)</label>
          <div id="modal-features-container"></div>
        </div>

        <!-- Long Description -->
        <div class="adm-form-group">
          <label class="adm-label">Detailed Description</label>
          <textarea id="f-long-desc" class="adm-textarea" rows="4" placeholder="Full product specifications, medical benefits, and usage instructions...">${escapeHtml(prod.longDesc || '')}</textarea>
        </div>

        <!-- Toggles -->
        <div style="display: flex; gap: 2rem; align-items: center; padding: 0.75rem 0; border-top: 1px solid var(--admin-border);">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="f-visible" ${prod.visible !== false ? 'checked' : ''} />
            <span>Visible in Storefront</span>
          </label>
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="f-featured" ${prod.isFeatured ? 'checked' : ''} />
            <span>⭐ Feature in Hero Section Showcase</span>
          </label>
        </div>

        <!-- Modal Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; border-top: 1px solid var(--admin-border); padding-top: 1rem;">
          <button type="button" class="adm-btn adm-btn--secondary" id="modal-cancel-btn">Cancel</button>
          <button type="submit" class="adm-btn adm-btn--primary" id="modal-save-btn">
            ${isEdit ? '✓ Update Product' : '+ Create Product'}
          </button>
        </div>
      </form>
    `;

    openModal({
      title: isEdit ? `Edit Product: ${prod.name || prod.nameEn || prod.id}` : 'Create New Product',
      content: contentHtml,
      contentHtml: contentHtml,
      width: '780px'
    });

    const form = document.getElementById('product-modal-form');
    const priceInput = form?.querySelector('#f-price');
    const oldPriceInput = form?.querySelector('#f-old-price');
    const discountPreview = form?.querySelector('#live-discount-preview');
    const imgGrid = form?.querySelector('#modal-img-preview-grid');
    const featuresBox = form?.querySelector('#modal-features-container');

    // Live Discount Calculator
    function updateDiscount() {
      if (!priceInput || !oldPriceInput || !discountPreview) return;
      const p = parseFloat(priceInput.value) || 0;
      const op = parseFloat(oldPriceInput.value) || 0;
      if (op > p && p > 0) {
        const pct = Math.round(((op - p) / op) * 100);
        discountPreview.textContent = `✓ Customer saves ${pct}% off regular price (৳${(op - p).toLocaleString()})`;
      } else {
        discountPreview.textContent = '';
      }
    }
    priceInput?.addEventListener('input', updateDiscount);
    oldPriceInput?.addEventListener('input', updateDiscount);
    updateDiscount();

    // Render Images Grid in Modal
    function renderModalImages() {
      if (!imgGrid) return;
      if (currentImages.length === 0) {
        imgGrid.innerHTML = `
          <div style="grid-column: 1/-1; padding: 1.5rem; text-align: center; color: var(--admin-text-muted); border: 2px dashed var(--admin-border); border-radius: var(--radius-md);">
            No images selected yet. Click "+ Pick / Upload Image" above.
          </div>
        `;
        return;
      }

      imgGrid.innerHTML = currentImages.map((imgUrl, idx) => `
        <div class="gallery-item-card ${idx === 0 ? 'is-primary' : ''}">
          <img src="${escapeHtml(imgUrl)}" alt="" />
          ${idx === 0 ? '<span class="primary-tag">Primary</span>' : ''}
          <div class="overlay-actions">
            ${idx > 0 ? `<button type="button" class="btn-make-primary" data-idx="${idx}" title="Set as primary image">⭐ Primary</button>` : ''}
            <button type="button" class="btn-remove-img" data-idx="${idx}" title="Remove image">✕</button>
          </div>
        </div>
      `).join('');

      imgGrid.querySelectorAll('.btn-make-primary').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          const [moved] = currentImages.splice(idx, 1);
          currentImages.unshift(moved);
          renderModalImages();
        });
      });

      imgGrid.querySelectorAll('.btn-remove-img').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          currentImages.splice(idx, 1);
          renderModalImages();
        });
      });
    }

    renderModalImages();

    // Wire Image Picker
    form?.querySelector('#pick-image-btn')?.addEventListener('click', () => {
      openMediaPicker((pickedUrl) => {
        if (!currentImages.includes(pickedUrl)) {
          currentImages.push(pickedUrl);
          renderModalImages();
        }
      });
    });

    // Wire Feature List Editor
    const featureEditor = createFeatureListEditor({
      initialFeatures: prod.features || [],
      container: featuresBox
    });

    // Wire Cancel
    form?.querySelector('#modal-cancel-btn')?.addEventListener('click', closeModal);

    // Wire Submit
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = form.querySelector('#modal-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const productName = form.querySelector('#f-name').value.trim();
      const categoryId = form.querySelector('#f-cat').value;
      const price = parseFloat(form.querySelector('#f-price').value) || 0;
      const oldPrice = parseFloat(form.querySelector('#f-old-price').value) || 0;
      const badge = form.querySelector('#f-badge').value.trim();
      const stock = parseInt(form.querySelector('#f-stock').value, 10) || 0;
      const shortDesc = form.querySelector('#f-short-desc').value.trim();
      const longDesc = form.querySelector('#f-long-desc').value.trim();
      const visible = form.querySelector('#f-visible').checked;
      const isFeatured = form.querySelector('#f-featured').checked;
      const features = featureEditor.getFeatures();

      let prodId = form.querySelector('#f-id').value.trim();
      if (!prodId) {
        prodId = productName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') || `prod-${Date.now()}`;
      }

      const updatedDoc = {
        ...prod,
        id: prodId,
        name: productName,
        nameEn: productName, // keep for backward compatibility
        nameBn: productName, // keep for backward compatibility
        categoryId,
        price,
        oldPrice: oldPrice > 0 ? oldPrice : null,
        badge,
        stock,
        shortDesc,
        longDesc,
        images: currentImages.length > 0 ? currentImages : ['/assets/device.jpg'],
        image: currentImages[0] || '/assets/device.jpg',
        features,
        visible,
        isFeatured
      };

      try {
        await saveProduct(prodId, updatedDoc);
        showToast('✓ Product saved successfully!', 'success');
        closeModal();
        loadData();
      } catch (err) {
        console.error(err);
        showToast(`Error: ${err.message}`, 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? '✓ Update Product' : '+ Create Product';
      }
    });
  }

  loadData();
}
