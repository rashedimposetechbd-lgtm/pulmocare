import { openModal, closeModal } from './modal.js';

export function confirmDialog({
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Yes, Delete',
  isDanger = true,
  onConfirm
}) {
  const contentHtml = `
    <div style="padding: 0.5rem 0;">
      <p style="font-size: 0.95rem; color: var(--admin-text-main); line-height: 1.5;">${message}</p>
      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; border-top: 1px solid var(--admin-border); padding-top: 1rem;">
        <button type="button" class="adm-btn adm-btn--secondary" id="confirm-cancel-btn">Cancel</button>
        <button type="button" class="adm-btn ${isDanger ? 'adm-btn--danger' : 'adm-btn--primary'}" id="confirm-ok-btn">${confirmText}</button>
      </div>
    </div>
  `;

  openModal({
    title,
    content: contentHtml,
    width: '450px'
  });

  const modalEl = document.getElementById('confirm-cancel-btn')?.parentElement;
  modalEl?.querySelector('#confirm-cancel-btn')?.addEventListener('click', closeModal);
  modalEl?.querySelector('#confirm-ok-btn')?.addEventListener('click', async () => {
    closeModal();
    if (typeof onConfirm === 'function') {
      await onConfirm();
    }
  });
}
