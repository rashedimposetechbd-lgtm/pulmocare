import { openModal, closeModal } from './modal.js';
import { getMediaItems } from '../../shared/db.js';
import { uploadImageFile } from '../../shared/storage.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

/**
 * Reusable Media Picker Modal
 * @param {Function} onSelect - Callback when an image is selected with url
 */
export async function openMediaPicker(onSelect) {
  let mediaList = [];
  try {
    mediaList = await getMediaItems();
  } catch (err) {
    console.warn('[MediaPicker] Could not load media items:', err);
  }

  const contentHtml = `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div class="dropzone" id="picker-dropzone">
        <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">📁</div>
        <strong style="font-size: 0.95rem;">Click to browse or drop an image file here</strong>
        <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-top: 0.25rem;">Saved to server uploads folder and converted to WebP</p>
        <input type="file" id="picker-file-input" accept="image/*" style="display: none;" />
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 0.5rem;">
        <h4 style="font-size: 0.9rem; font-weight: 600;">Choose from Library (${mediaList.length} images)</h4>
        <input type="text" id="picker-search-input" class="adm-input" placeholder="Search by name..." style="max-width: 200px; padding: 0.35rem 0.65rem; font-size: 0.8rem;" />
      </div>

      <div class="image-gallery-grid" id="picker-gallery-grid" style="max-height: 320px; overflow-y: auto; padding-right: 4px;">
        ${mediaList.length === 0 ? '<p style="grid-column: 1/-1; text-align: center; color: var(--admin-text-muted); padding: 2rem;">No images found. Upload a file above.</p>' : ''}
        ${mediaList.map((m) => `
          <div class="gallery-item" data-url="${escapeHtml(m.url)}" title="${escapeHtml(m.fileName || '')}">
            <img src="${escapeHtml(m.url)}" alt="${escapeHtml(m.alt || '')}" loading="lazy" />
          </div>
        `).join('')}
      </div>
    </div>
  `;

  openModal({
    title: 'Select or Upload Image',
    content: contentHtml,
    width: '720px'
  });

  const pickerModalEl = document.getElementById('picker-gallery-grid')?.parentElement;
  if (!pickerModalEl) return;

  const dropzone = pickerModalEl.querySelector('#picker-dropzone');
  const fileInput = pickerModalEl.querySelector('#picker-file-input');
  const gallery = pickerModalEl.querySelector('#picker-gallery-grid');
  const searchInput = pickerModalEl.querySelector('#picker-search-input');

  // Wire file input
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
      await handleUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', async () => {
    if (fileInput.files.length > 0) {
      await handleUpload(fileInput.files[0]);
    }
  });

  async function handleUpload(file) {
    showToast('Uploading image to server uploads folder...', 'info');
    try {
      const uploaded = await uploadImageFile(file);
      showToast('✓ Image uploaded successfully!', 'success');
      closeModal();
      onSelect(uploaded.url);
    } catch (err) {
      console.error(err);
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      if (fileInput) fileInput.value = '';
    }
  }

  // Wire search filter
  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const items = gallery.querySelectorAll('.gallery-item');
    items.forEach((item) => {
      const match = (item.getAttribute('title') || '').toLowerCase().includes(query);
      item.style.display = match ? '' : 'none';
    });
  });

  // Wire select click on existing items
  gallery?.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      closeModal();
      onSelect(url);
    });
  });
}
