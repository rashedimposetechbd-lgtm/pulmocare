import { escapeHtml } from '../../shared/utils/escape.js';

let activeModalOverlay = null;

export function openModal({
  title = '',
  contentHtml,
  content,
  footerHtml = '',
  wide = false,
  width = null,
  onMount
}) {
  closeModal();

  let root = document.getElementById('admin-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'admin-modal-root';
    document.body.appendChild(root);
  }

  const html = contentHtml !== undefined ? contentHtml : (content !== undefined ? content : '');
  const widthStyle = width ? `max-width: ${width}; width: 100%;` : '';

  const overlay = document.createElement('div');
  overlay.className = 'adm-modal-overlay';
  overlay.innerHTML = `
    <div class="adm-modal-box ${wide ? 'adm-modal-box--wide' : ''}" style="${widthStyle}" role="dialog" aria-modal="true">
      <div class="adm-modal__header">
        <h3 class="adm-card__title">${escapeHtml(title)}</h3>
        <button type="button" class="adm-btn--icon close-modal-btn" aria-label="Close dialog">✕</button>
      </div>
      <div class="adm-modal__body" style="overflow-y: auto; max-height: calc(90vh - 120px);">
        ${html}
      </div>
      ${footerHtml ? `<div class="adm-modal__footer">${footerHtml}</div>` : ''}
    </div>
  `;

  root.appendChild(overlay);
  activeModalOverlay = overlay;

  requestAnimationFrame(() => {
    overlay.classList.add('is-active');
  });

  const closeBtn = overlay.querySelector('.close-modal-btn');
  closeBtn?.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  if (typeof onMount === 'function') {
    onMount(overlay);
  }

  return overlay;
}

export function closeModal() {
  if (activeModalOverlay) {
    activeModalOverlay.classList.remove('is-active');
    setTimeout(() => {
      activeModalOverlay?.remove();
      activeModalOverlay = null;
    }, 200);
  }
}
