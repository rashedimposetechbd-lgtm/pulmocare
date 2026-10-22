import { getSections, updateSection, getProducts } from '../../shared/db.js';
import { openMediaPicker } from '../components/mediaPicker.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

export async function renderSectionsPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Page Sections Content Editor</h1>
        <p class="page-sub">Edit storefront texts, banners, icons, showcase products, and toggle section visibility</p>
      </div>
    </div>

    <!-- Section Navigation Tabs -->
    <div style="display: flex; gap: 0.5rem; overflow-x: auto; margin-bottom: 1.5rem; padding-bottom: 4px;" id="sec-tabs-bar">
      <button class="adm-btn adm-btn--primary adm-btn--sm sec-tab-btn" data-sec="hero">🎯 Hero Banner</button>
      <button class="adm-btn adm-btn--secondary adm-btn--sm sec-tab-btn" data-sec="trustStrip">🏪 Trust Badges</button>
      <button class="adm-btn adm-btn--secondary adm-btn--sm sec-tab-btn" data-sec="featured">⭐ Featured Bundle</button>
      <button class="adm-btn adm-btn--secondary adm-btn--sm sec-tab-btn" data-sec="symptoms">🩺 Sleep Care Guide</button>
      <button class="adm-btn adm-btn--secondary adm-btn--sm sec-tab-btn" data-sec="about">🏢 About Company</button>
    </div>

    <!-- Active Section Editor Container -->
    <div id="section-editor-viewport">
      <div class="adm-card" style="padding: 3rem; text-align: center; color: var(--admin-text-muted);">
        Loading section content...
      </div>
    </div>
  `;

  let sections = {};
  let products = [];
  let currentSec = 'hero';

  const viewport = container.querySelector('#section-editor-viewport');
  const tabsBar = container.querySelector('#sec-tabs-bar');

  async function loadData() {
    try {
      const [liveSecs, prods] = await Promise.all([
        getSections(true).catch(() => ({})),
        getProducts(false, true).catch(() => [])
      ]);
      sections = liveSecs || {};
      products = prods;
      renderCurrentSection();
    } catch (err) {
      viewport.innerHTML = `<div class="adm-card" style="padding: 2rem; color: var(--admin-danger); text-align: center;">Failed to load sections: ${err.message}</div>`;
    }
  }

  tabsBar.querySelectorAll('.sec-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      tabsBar.querySelectorAll('.sec-tab-btn').forEach((b) => {
        b.className = 'adm-btn adm-btn--secondary adm-btn--sm sec-tab-btn';
      });
      btn.className = 'adm-btn adm-btn--primary adm-btn--sm sec-tab-btn';
      currentSec = btn.dataset.sec;
      renderCurrentSection();
    });
  });

  function renderCurrentSection() {
    const secData = sections[currentSec] || {};

    if (currentSec === 'hero') {
      renderHeroEditor(secData);
    } else if (currentSec === 'trustStrip') {
      renderTrustStripEditor(secData);
    } else if (currentSec === 'featured') {
      renderFeaturedEditor(secData);
    } else if (currentSec === 'symptoms') {
      renderSymptomsEditor(secData);
    } else if (currentSec === 'about') {
      renderAboutEditor(secData);
    }
  }

  /* --- 1. HERO EDITOR --- */
  function renderHeroEditor(data) {
    viewport.innerHTML = `
      <div class="adm-card">
        <div class="adm-card__header">
          <h3 class="adm-card__title">Hero Banner Section</h3>
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="h-visible" ${data.visible !== false ? 'checked' : ''} />
            <span>Section Visible</span>
          </label>
        </div>
        <div class="adm-card__body">
          <form id="hero-form">
            <div class="adm-form-group">
              <label class="adm-label">Eyebrow Headline</label>
              <input type="text" id="h-eyebrow" class="adm-input" value="${escapeHtml(data.eyebrow || '')}" />
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-label">Main Heading (Part 1) *</label>
                <input type="text" id="h-title" class="adm-input" required value="${escapeHtml(data.title || '')}" />
              </div>
              <div class="adm-form-group">
                <label class="adm-label">Gradient Highlight (Part 2) *</label>
                <input type="text" id="h-title-hl" class="adm-input" required value="${escapeHtml(data.titleHighlight || '')}" />
              </div>
            </div>

            <div class="adm-form-group">
              <label class="adm-label">Hero Description *</label>
              <textarea id="h-desc" class="adm-textarea" rows="3" required>${escapeHtml(data.description || '')}</textarea>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-label">Showcase Product (Right Banner Card) *</label>
                <select id="h-feat-prod" class="adm-select">
                  ${products.map((p) => `
                    <option value="${escapeHtml(p.id)}" ${(data.featuredProductId === p.id || p.isFeatured) ? 'selected' : ''}>
                      ${escapeHtml(p.name || p.nameEn)} (৳ ${p.price})
                    </option>
                  `).join('')}
                </select>
              </div>
              <div class="adm-form-group">
                <label class="adm-label">WhatsApp Order Button Text</label>
                <input type="text" id="h-wa-text" class="adm-input" value="${escapeHtml(data.ctaWhatsappText || 'Order via WhatsApp')}" />
              </div>
            </div>

            <div style="margin-top: 1.5rem; text-align: right;">
              <button type="submit" class="adm-btn adm-btn--primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    viewport.querySelector('#hero-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updated = {
        ...data,
        visible: viewport.querySelector('#h-visible').checked,
        eyebrow: viewport.querySelector('#h-eyebrow').value.trim(),
        title: viewport.querySelector('#h-title').value.trim(),
        titleHighlight: viewport.querySelector('#h-title-hl').value.trim(),
        description: viewport.querySelector('#h-desc').value.trim(),
        featuredProductId: viewport.querySelector('#h-feat-prod').value,
        ctaWhatsappText: viewport.querySelector('#h-wa-text').value.trim()
      };
      await saveSectionData('hero', updated);
    });
  }

  /* --- 2. TRUST STRIP EDITOR --- */
  function renderTrustStripEditor(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    viewport.innerHTML = `
      <div class="adm-card">
        <div class="adm-card__header">
          <h3 class="adm-card__title">Trust Badges Strip (4 Items)</h3>
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="ts-visible" ${data.visible !== false ? 'checked' : ''} />
            <span>Section Visible</span>
          </label>
        </div>
        <div class="adm-card__body">
          <form id="trust-form">
            <div style="display: flex; flex-direction: column; gap: 1rem;" id="ts-items-container">
              ${items.map((it, idx) => `
                <div style="display: flex; gap: 0.75rem; align-items: center; background: var(--admin-surface-subtle); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--admin-border);" data-ts-idx="${idx}">
                  <input type="text" class="adm-input ts-icon" value="${escapeHtml(it.icon || '🏪')}" style="width: 50px; text-align: center; font-size: 1.2rem;" />
                  <input type="text" class="adm-input ts-title" value="${escapeHtml(it.title || '')}" placeholder="Title" style="flex: 1;" />
                  <input type="text" class="adm-input ts-sub" value="${escapeHtml(it.sub || '')}" placeholder="Subtitle / Details" style="flex: 1.5;" />
                </div>
              `).join('')}
            </div>
            <div style="margin-top: 1.5rem; text-align: right;">
              <button type="submit" class="adm-btn adm-btn--primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    viewport.querySelector('#trust-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = viewport.querySelectorAll('#ts-items-container > div');
      const updatedItems = Array.from(rows).map((row) => ({
        icon: row.querySelector('.ts-icon').value.trim(),
        title: row.querySelector('.ts-title').value.trim(),
        sub: row.querySelector('.ts-sub').value.trim()
      }));

      const updated = {
        ...data,
        visible: viewport.querySelector('#ts-visible').checked,
        items: updatedItems
      };
      await saveSectionData('trustStrip', updated);
    });
  }

  /* --- 3. FEATURED BUNDLE EDITOR --- */
  function renderFeaturedEditor(data) {
    viewport.innerHTML = `
      <div class="adm-card">
        <div class="adm-card__header">
          <h3 class="adm-card__title">Featured Bundle Banner</h3>
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="fb-visible" ${data.visible !== false ? 'checked' : ''} />
            <span>Section Visible</span>
          </label>
        </div>
        <div class="adm-card__body">
          <form id="fb-form">
            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-label">Badge Tag</label>
                <input type="text" id="fb-badge" class="adm-input" value="${escapeHtml(data.badge || '')}" />
              </div>
              <div class="adm-form-group">
                <label class="adm-label">Banner Image URL</label>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="text" id="fb-img-url" class="adm-input" value="${escapeHtml(data.imageUrl || '')}" />
                  <button type="button" class="adm-btn adm-btn--secondary" id="fb-pick-img-btn">Pick Image</button>
                </div>
              </div>
            </div>

            <div class="adm-form-group">
              <label class="adm-label">Banner Title</label>
              <input type="text" id="fb-title" class="adm-input" value="${escapeHtml(data.title || '')}" />
            </div>

            <div class="adm-form-group">
              <label class="adm-label">Description</label>
              <textarea id="fb-desc" class="adm-textarea" rows="2">${escapeHtml(data.description || '')}</textarea>
            </div>

            <div style="margin-top: 1.5rem; text-align: right;">
              <button type="submit" class="adm-btn adm-btn--primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    viewport.querySelector('#fb-pick-img-btn')?.addEventListener('click', () => {
      openMediaPicker((url) => {
        const input = viewport.querySelector('#fb-img-url');
        if (input) input.value = url;
      });
    });

    viewport.querySelector('#fb-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updated = {
        ...data,
        visible: viewport.querySelector('#fb-visible').checked,
        badge: viewport.querySelector('#fb-badge').value.trim(),
        imageUrl: viewport.querySelector('#fb-img-url').value.trim(),
        title: viewport.querySelector('#fb-title').value.trim(),
        description: viewport.querySelector('#fb-desc').value.trim()
      };
      await saveSectionData('featured', updated);
    });
  }

  /* --- 4. SYMPTOMS EDITOR --- */
  function renderSymptomsEditor(data) {
    const cards = Array.isArray(data.cards) ? data.cards : [];
    viewport.innerHTML = `
      <div class="adm-card">
        <div class="adm-card__header">
          <h3 class="adm-card__title">Sleep Care Symptoms & Guide</h3>
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="sym-visible" ${data.visible !== false ? 'checked' : ''} />
            <span>Section Visible</span>
          </label>
        </div>
        <div class="adm-card__body">
          <form id="sym-form">
            <div class="adm-form-group">
              <label class="adm-label">Section Heading</label>
              <input type="text" id="sym-title" class="adm-input" value="${escapeHtml(data.title || '')}" />
            </div>

            <h4 style="font-size: 0.9rem; font-weight: 600; margin: 1.5rem 0 0.75rem;">Symptom Cards</h4>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;" id="sym-cards-container">
              ${cards.map((c, idx) => `
                <div style="display: flex; gap: 0.75rem; align-items: center; background: var(--admin-surface-subtle); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--admin-border);" data-sym-idx="${idx}">
                  <input type="text" class="adm-input sc-icon" value="${escapeHtml(c.icon || '😴')}" style="width: 50px; text-align: center; font-size: 1.2rem;" />
                  <input type="text" class="adm-input sc-title" value="${escapeHtml(c.title || '')}" placeholder="Symptom Title" style="flex: 1;" />
                  <input type="text" class="adm-input sc-text" value="${escapeHtml(c.text || '')}" placeholder="Symptom Description" style="flex: 2;" />
                </div>
              `).join('')}
            </div>

            <div style="margin-top: 1.5rem; text-align: right;">
              <button type="submit" class="adm-btn adm-btn--primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    viewport.querySelector('#sym-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = viewport.querySelectorAll('#sym-cards-container > div');
      const updatedCards = Array.from(rows).map((row) => ({
        icon: row.querySelector('.sc-icon').value.trim(),
        title: row.querySelector('.sc-title').value.trim(),
        text: row.querySelector('.sc-text').value.trim()
      }));

      const updated = {
        ...data,
        visible: viewport.querySelector('#sym-visible').checked,
        title: viewport.querySelector('#sym-title').value.trim(),
        cards: updatedCards
      };
      await saveSectionData('symptoms', updated);
    });
  }

  /* --- 5. ABOUT EDITOR --- */
  function renderAboutEditor(data) {
    viewport.innerHTML = `
      <div class="adm-card">
        <div class="adm-card__header">
          <h3 class="adm-card__title">About Pulmo Care Section</h3>
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="ab-visible" ${data.visible !== false ? 'checked' : ''} />
            <span>Section Visible</span>
          </label>
        </div>
        <div class="adm-card__body">
          <form id="about-form">
            <div class="adm-form-group">
              <label class="adm-label">Section Title</label>
              <input type="text" id="ab-title" class="adm-input" value="${escapeHtml(data.title || '')}" />
            </div>

            <div class="adm-form-group">
              <label class="adm-label">Company Description</label>
              <textarea id="ab-desc" class="adm-textarea" rows="4">${escapeHtml(data.description || '')}</textarea>
            </div>

            <div class="adm-form-group">
              <label class="adm-label">Showroom Image URL</label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="ab-img-url" class="adm-input" value="${escapeHtml(data.imageUrl || '')}" />
                <button type="button" class="adm-btn adm-btn--secondary" id="ab-pick-img-btn">Pick Image</button>
              </div>
            </div>

            <div style="margin-top: 1.5rem; text-align: right;">
              <button type="submit" class="adm-btn adm-btn--primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    viewport.querySelector('#ab-pick-img-btn')?.addEventListener('click', () => {
      openMediaPicker((url) => {
        const input = viewport.querySelector('#ab-img-url');
        if (input) input.value = url;
      });
    });

    viewport.querySelector('#about-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updated = {
        ...data,
        visible: viewport.querySelector('#ab-visible').checked,
        title: viewport.querySelector('#ab-title').value.trim(),
        description: viewport.querySelector('#ab-desc').value.trim(),
        imageUrl: viewport.querySelector('#ab-img-url').value.trim()
      };
      await saveSectionData('about', updated);
    });
  }

  async function saveSectionData(secKey, updatedData) {
    showToast('Saving section content...', 'info');
    try {
      await updateSection(secKey, updatedData);
      sections[secKey] = updatedData;
      showToast('✓ Section content saved successfully!', 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  }

  loadData();
}
