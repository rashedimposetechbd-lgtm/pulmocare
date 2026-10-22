import { getMediaItems, getProducts } from '../../shared/db.js';
import { uploadImageFile, removeImageFile } from '../../shared/storage.js';
import { confirmDialog } from '../components/confirmDialog.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

export async function renderMediaPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Media Library</h1>
        <p class="page-sub">Upload, browse, and manage images for products and store sections (Stored in server uploads folder)</p>
      </div>
      <div class="action-row">
        <button class="adm-btn adm-btn--primary" id="upload-media-btn">
          + Upload Images
        </button>
      </div>
    </div>

    <!-- Upload Dropzone -->
    <div class="adm-card" style="margin-bottom: 1.5rem;">
      <div class="dropzone" id="media-page-dropzone">
        <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">☁️</div>
        <strong style="font-size: 1.05rem;">Drag and drop image files here, or click to browse</strong>
        <p style="font-size: 0.85rem; color: var(--admin-text-muted); margin-top: 0.35rem;">
          Images are automatically optimized and saved to the server's <code>public/uploads/</code> folder.
        </p>
        <input type="file" id="media-page-file-input" accept="image/*" multiple style="display: none;" />
      </div>
    </div>

    <!-- Media Grid Card -->
    <div class="adm-card">
      <div class="adm-card__header">
        <div style="display: flex; gap: 1rem; align-items: center; width: 100%; max-width: 400px;">
          <input type="text" id="media-search-input" class="adm-input" placeholder="🔍 Search images by filename..." />
        </div>
        <span id="media-count-badge" style="font-size: 0.85rem; color: var(--admin-text-muted); font-family: var(--font-mono);">
          Total: 0 images
        </span>
      </div>
      <div class="adm-card__body">
        <div class="image-gallery-grid" id="media-page-gallery" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.25rem;">
          <p style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--admin-text-muted);">
            Loading media assets...
          </p>
        </div>
      </div>
    </div>
  `;

  let mediaList = [];
  let products = [];

  const gallery = container.querySelector('#media-page-gallery');
  const countBadge = container.querySelector('#media-count-badge');
  const searchInput = container.querySelector('#media-search-input');
  const dropzone = container.querySelector('#media-page-dropzone');
  const fileInput = container.querySelector('#media-page-file-input');
  const uploadBtn = container.querySelector('#upload-media-btn');

  uploadBtn?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('click', () => fileInput?.click());

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
  dropzone?.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
    if (e.dataTransfer.files.length > 0) {
      await handleBatchUpload(e.dataTransfer.files);
    }
  });

  fileInput?.addEventListener('change', async () => {
    if (fileInput.files.length > 0) {
      await handleBatchUpload(fileInput.files);
    }
  });

  async function handleBatchUpload(files) {
    showToast(`Uploading ${files.length} file(s) to server uploads folder...`, 'info');
    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadImageFile(file);
        successCount++;
      } catch (err) {
        console.error('File upload error:', err);
      }
    }
    if (fileInput) fileInput.value = '';
    showToast(`✓ Uploaded ${successCount} of ${files.length} image(s)!`, successCount > 0 ? 'success' : 'error');
    loadData();
  }

  async function loadData() {
    try {
      const [media, prods] = await Promise.all([
        getMediaItems(),
        getProducts(false, true)
      ]);
      mediaList = media;
      products = prods;
      renderGallery();
    } catch (err) {
      gallery.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--admin-danger); padding: 2rem;">Failed to load media: ${err.message}</p>`;
    }
  }

  function renderGallery() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const filtered = mediaList.filter((m) => {
      return (m.fileName || '').toLowerCase().includes(q) || (m.alt || '').toLowerCase().includes(q);
    });

    if (countBadge) countBadge.textContent = `Total: ${filtered.length} images`;

    if (filtered.length === 0) {
      gallery.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--admin-text-muted);">
          No images found. Drag & drop files into the box above to upload.
        </div>
      `;
      return;
    }

    gallery.innerHTML = filtered.map((m) => {
      const sizeKb = m.size ? `${Math.round(m.size / 1024)} KB` : '';
      const dim = m.width && m.height ? `${m.width}×${m.height}` : '';

      return `
        <div class="adm-card" style="display: flex; flex-direction: column;">
          <div style="position: relative; aspect-ratio: 4/3; background: var(--admin-surface-subtle); overflow: hidden; border-bottom: 1px solid var(--admin-border);">
            <img src="${escapeHtml(m.url)}" alt="${escapeHtml(m.alt || '')}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
          </div>
          <div style="padding: 0.75rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 0.5rem;">
            <div>
              <div style="font-weight: 600; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(m.fileName || '')}">
                ${escapeHtml(m.fileName || 'Untitled')}
              </div>
              <div style="font-size: 0.7rem; color: var(--admin-text-muted); font-family: var(--font-mono); margin-top: 2px;">
                ${sizeKb} ${dim ? `· ${dim}` : ''}
              </div>
            </div>
            <div style="display: flex; gap: 0.35rem; align-items: center; justify-content: flex-end; margin-top: 0.25rem;">
              <button class="adm-btn adm-btn--secondary adm-btn--sm copy-url-btn" data-url="${escapeHtml(m.url)}" title="Copy image URL">
                📋 URL
              </button>
              <button class="adm-btn adm-btn--danger adm-btn--sm del-media-btn" data-id="${escapeHtml(m.id)}" data-path="${escapeHtml(m.storagePath || '')}" data-url="${escapeHtml(m.url)}">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire Copy URL Buttons
    gallery.querySelectorAll('.copy-url-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.url);
          showToast('✓ Image URL copied to clipboard!', 'success');
        } catch {
          prompt('Copy image URL:', btn.dataset.url);
        }
      });
    });

    // Wire Delete Buttons with Usage Check
    gallery.querySelectorAll('.del-media-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const path = btn.dataset.path;
        const url = btn.dataset.url;

        // Check if any product is using this image
        const usingProducts = products.filter((p) => {
          return (p.images && p.images.includes(url)) || p.image === url;
        });

        let warning = '';
        if (usingProducts.length > 0) {
          warning = `\n\n⚠️ Notice: This image is currently linked to ${usingProducts.length} product(s) (${usingProducts.map((p) => p.name || p.nameEn).join(', ')})!`;
        }

        confirmDialog({
          title: 'Delete Image',
          message: `Are you sure you want to delete this image?${warning}`,
          onConfirm: async () => {
            showToast('Deleting image...', 'info');
            await removeImageFile(id, path);
            showToast('✓ Image deleted!', 'success');
            loadData();
          }
        });
      });
    });
  }

  searchInput?.addEventListener('input', renderGallery);
  loadData();
}
