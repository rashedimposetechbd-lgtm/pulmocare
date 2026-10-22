import { escapeHtml } from '../../shared/utils/escape.js';

/**
 * Dynamic Feature List Bullet Editor
 * Accepts either (container, initialFeatures) or ({ container, initialFeatures })
 */
export function createFeatureListEditor(containerOrOptions, maybeInitialFeatures = []) {
  let container;
  let features = [];

  if (containerOrOptions && (containerOrOptions instanceof Element || typeof containerOrOptions === 'string' || containerOrOptions.nodeType === 1)) {
    container = typeof containerOrOptions === 'string' ? document.querySelector(containerOrOptions) : containerOrOptions;
    features = Array.isArray(maybeInitialFeatures) ? [...maybeInitialFeatures] : [];
  } else if (containerOrOptions && typeof containerOrOptions === 'object') {
    const rawContainer = containerOrOptions.container;
    container = typeof rawContainer === 'string' ? document.querySelector(rawContainer) : rawContainer;
    features = Array.isArray(containerOrOptions.initialFeatures)
      ? [...containerOrOptions.initialFeatures]
      : (Array.isArray(maybeInitialFeatures) ? [...maybeInitialFeatures] : []);
  }

  if (!container || typeof container.querySelectorAll !== 'function') {
    console.warn('createFeatureListEditor: valid container element is missing or not in DOM', containerOrOptions);
    return {
      getFeatures: () => features.map((f) => (typeof f === 'string' ? f.trim() : String(f || ''))).filter(Boolean),
      setFeatures: (newFeats) => {
        features = Array.isArray(newFeats) ? [...newFeats] : [];
      }
    };
  }

  function render() {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${features.map((feat, index) => `
          <div style="display: flex; gap: 0.5rem; align-items: center;" data-index="${index}">
            <span style="font-size: 0.8rem; color: var(--admin-text-muted); width: 16px;">${index + 1}.</span>
            <input type="text" class="adm-input feat-input" value="${escapeHtml(feat)}" placeholder="Enter feature bullet point..." style="padding: 0.45rem 0.75rem;" />
            <button type="button" class="adm-btn--icon remove-feat-btn" title="Remove" style="color: var(--admin-danger);">✕</button>
          </div>
        `).join('')}
        <button type="button" class="adm-btn adm-btn--secondary adm-btn--sm add-feat-btn" style="align-self: flex-start; margin-top: 0.35rem;">
          + Add New Feature Bullet
        </button>
      </div>
    `;

    // Wire input changes
    container.querySelectorAll('.feat-input').forEach((input, idx) => {
      input.addEventListener('input', () => {
        features[idx] = input.value;
      });
    });

    // Wire remove buttons
    container.querySelectorAll('.remove-feat-btn').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        features.splice(idx, 1);
        render();
      });
    });

    // Wire add button
    container.querySelector('.add-feat-btn')?.addEventListener('click', () => {
      features.push('');
      render();
    });
  }

  render();

  return {
    getFeatures: () => features.map((f) => (typeof f === 'string' ? f.trim() : String(f || ''))).filter(Boolean),
    setFeatures: (newFeats) => {
      features = Array.isArray(newFeats) ? [...newFeats] : [];
      render();
    }
  };
}
