import { getSiteSettings, updateSiteSettings } from '../../shared/db.js';
import { openMediaPicker } from '../components/mediaPicker.js';
import { uploadImageFile } from '../../shared/storage.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';

export async function renderSettingsPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Site Settings & Configuration</h1>
        <p class="page-sub">Manage brand identity, logo, Dhaka contact details, delivery charges, SEO, and MySQL database</p>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 960px;">


      <!-- Main Settings Form -->
      <div class="adm-card">
        <div class="adm-card__body">
          <form id="site-settings-form">

            <!-- 1. Brand Logo & Visual Assets -->
            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--admin-primary);">
              Brand Logo & Identity
            </h3>

            <div style="display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 1.5rem; padding: 1.25rem; background: var(--admin-surface-subtle); border-radius: var(--radius-md); border: 1px solid var(--admin-border); flex-wrap: wrap;">
              <!-- Logo Thumbnail Preview -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                <div style="width: 120px; height: 120px; border-radius: var(--radius-md); border: 2px dashed var(--admin-border); display: flex; align-items: center; justify-content: center; background: #fff; overflow: hidden; box-shadow: var(--shadow-sm);">
                  <img id="logo-preview-img" src="/assets/pulmo_logo.jpg" alt="Logo preview" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                </div>
                <span style="font-size: 0.75rem; color: var(--admin-text-muted);">Current Logo</span>
              </div>

              <!-- Logo Upload & URL Options -->
              <div style="flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 0.75rem;">
                <div>
                  <label class="adm-label">Upload New Logo (Saved to cPanel uploads folder)</label>
                  <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" id="s-upload-logo-btn">
                      📤 Upload Logo File
                    </button>
                    <button type="button" class="adm-btn adm-btn--secondary adm-btn--sm" id="s-pick-logo-btn">
                      🖼️ Choose from Media Library
                    </button>
                    <input type="file" id="logo-file-hidden-input" accept="image/*" style="display: none;" />
                  </div>
                </div>

                <div class="adm-form-group" style="margin-bottom: 0;">
                  <label class="adm-label" style="font-size: 0.8rem;">Or Enter Logo URL directly</label>
                  <input type="text" id="s-logo" class="adm-input" value="" placeholder="/assets/pulmo_logo.jpg" />
                </div>
              </div>
            </div>

            <!-- Brand Names & Taglines -->
            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-label">Brand Name *</label>
                <input type="text" id="s-brand" class="adm-input" required value="" placeholder="Pulmo Care" />
              </div>
              <div class="adm-form-group">
                <label class="adm-label">Tagline (English)</label>
                <input type="text" id="s-tagline" class="adm-input" value="" placeholder="Better Breathing · Better Living" />
              </div>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-label">Tagline (Bangla)</label>
                <input type="text" id="s-tagline-bn" class="adm-input" value="" placeholder="শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে" />
              </div>
              <div class="adm-form-group">
                <label class="adm-label">Favicon URL</label>
                <input type="text" id="s-favicon" class="adm-input" value="" placeholder="/assets/pulmo_logo.jpg" />
              </div>
            </div>

            <!-- 2. Contact Details & Dhaka Location -->
            <h3 style="font-size: 1rem; font-weight: 700; margin: 1.5rem 0 1rem; color: var(--admin-primary); border-top: 1px solid var(--admin-border); padding-top: 1.25rem;">
              Dhaka Business Contact & Hotline
            </h3>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-label">Hotline Phone Number *</label>
                <input type="text" id="s-phone" class="adm-input" required value="" placeholder="01337-708107" />
              </div>
              <div class="adm-form-group">
                <label class="adm-label">WhatsApp Number (with Country Code) *</label>
                <input type="text" id="s-wa" class="adm-input" required value="" placeholder="8801337708107" />
              </div>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-label">Official Email Address</label>
                <input type="email" id="s-email" class="adm-input" value="" placeholder="pulmocare2@gmail.com" />
              </div>
              <div class="adm-form-group">
                <label class="adm-label">Official Facebook Page URL</label>
                <input type="url" id="s-fb" class="adm-input" value="" placeholder="https://www.facebook.com/profile.php?id=61583772040813" />
              </div>
            </div>

            <div class="adm-form-group">
              <label class="adm-label">Showroom & Office Address (Dhaka, Bangladesh)</label>
              <input type="text" id="s-address" class="adm-input" value="" placeholder="হাউজ#২৪, রোড#১১, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ" />
            </div>

            <div class="adm-form-group">
              <label class="adm-label">Top Announcement Bar Text</label>
              <input type="text" id="s-top-bar" class="adm-input" value="" placeholder="ঢাকা ও সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি ও ফ্রি সেটআপ সুবিধা" />
            </div>

            <!-- 3. Delivery Charges (Dhaka-based) -->
            <h3 style="font-size: 1rem; font-weight: 700; margin: 1.5rem 0 1rem; color: var(--admin-primary); border-top: 1px solid var(--admin-border); padding-top: 1.25rem;">
              Delivery Charges Configuration (Dhaka Based)
            </h3>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-label">Inside Dhaka Delivery Fee (৳)</label>
                <input type="number" id="s-del-dhaka" class="adm-input" value="60" min="0" />
                <span style="font-size: 0.75rem; color: var(--admin-text-muted);">Set to 0 if you want free delivery inside Dhaka.</span>
              </div>
              <div class="adm-form-group">
                <label class="adm-label">Outside Dhaka (All Bangladesh) Delivery Fee (৳)</label>
                <input type="number" id="s-del-outside" class="adm-input" value="120" min="0" />
              </div>
            </div>

            <!-- 4. SEO & Meta Information -->
            <h3 style="font-size: 1rem; font-weight: 700; margin: 1.5rem 0 1rem; color: var(--admin-primary); border-top: 1px solid var(--admin-border); padding-top: 1.25rem;">
              Search Engine Optimization (SEO) & Theme
            </h3>

            <div class="adm-form-group">
              <label class="adm-label">Website Meta Title (Browser Tab Title)</label>
              <input type="text" id="s-seo-title" class="adm-input" value="" placeholder="Pulmo Care | রেসপিরেটরি ও স্লিপ কেয়ার ই-কমার্স — ঢাকা ও সারা বাংলাদেশ" />
            </div>

            <div class="adm-form-group">
              <label class="adm-label">Meta Description (Google Search Snippet)</label>
              <textarea id="s-seo-desc" class="adm-textarea" rows="3" placeholder="Pulmo Care — শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে। জেনুইন CPAP, BiPAP, কম্প্রেসার নেবুলাইজার, পালস অক্সিমিটার ও বিপি মনিটরের বিশ্বস্ত শপ।"></textarea>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-label">SEO Keywords</label>
                <input type="text" id="s-seo-keywords" class="adm-input" value="" placeholder="Pulmo Care, CPAP machine Dhaka, Nebulizer, BiPAP, Pulse Oximeter" />
              </div>
              <div class="adm-form-group">
                <label class="adm-label">Brand Primary Theme Color</label>
                <input type="text" id="s-theme-color" class="adm-input" value="#0284c7" />
              </div>
            </div>

            <div style="margin-top: 2rem; text-align: right; border-top: 1px solid var(--admin-border); padding-top: 1.25rem;">
              <button type="submit" class="adm-btn adm-btn--primary adm-btn--lg" id="save-settings-btn">
                ✓ Save All Settings
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  `;

  let currentSettings = defaultSettings;

  const logoInput = container.querySelector('#s-logo');
  const logoPreview = container.querySelector('#logo-preview-img');
  const uploadLogoBtn = container.querySelector('#s-upload-logo-btn');
  const pickLogoBtn = container.querySelector('#s-pick-logo-btn');
  const hiddenFileInput = container.querySelector('#logo-file-hidden-input');

  function updateLogoPreview(url) {
    if (logoPreview && url) {
      logoPreview.src = url;
    }
  }

  logoInput?.addEventListener('input', () => {
    updateLogoPreview(logoInput.value.trim());
  });

  // Direct Logo Upload Handler
  uploadLogoBtn?.addEventListener('click', () => {
    hiddenFileInput?.click();
  });
  if (logoPreview?.parentElement) {
    logoPreview.parentElement.style.cursor = 'pointer';
    logoPreview.parentElement.title = 'Click to upload new logo';
    logoPreview.parentElement.addEventListener('click', () => {
      hiddenFileInput?.click();
    });
  }

  hiddenFileInput?.addEventListener('change', async () => {
    if (hiddenFileInput.files && hiddenFileInput.files[0]) {
      const file = hiddenFileInput.files[0];
      const prevBtnText = uploadLogoBtn ? uploadLogoBtn.innerHTML : '';
      if (uploadLogoBtn) {
        uploadLogoBtn.disabled = true;
        uploadLogoBtn.innerHTML = '⏳ Uploading...';
      }
      showToast('Uploading new logo...', 'info');

      try {
        const media = await uploadImageFile(file, 'Pulmo Care Brand Logo');
        if (media && media.url) {
          logoInput.value = media.url;
          updateLogoPreview(media.url);

          // Update visible sidebar logo immediately
          document.querySelectorAll('.sidebar-logo').forEach((el) => {
            el.src = media.url;
          });

          // Auto-save to site settings in MySQL/backend immediately
          currentSettings.logoUrl = media.url;
          try {
            await updateSiteSettings(currentSettings);
            showToast('✓ Logo uploaded & saved successfully!', 'success');
          } catch (saveErr) {
            console.warn('Auto-save notice:', saveErr);
            showToast('✓ Logo uploaded! Click "Save All Settings" below to finalize.', 'success');
          }
        } else {
          throw new Error('Server returned empty file URL');
        }
      } catch (err) {
        console.error('Logo upload error:', err);
        showToast(`Logo upload failed: ${err.message}`, 'error');
      } finally {
        if (uploadLogoBtn) {
          uploadLogoBtn.disabled = false;
          uploadLogoBtn.innerHTML = prevBtnText;
        }
        hiddenFileInput.value = '';
      }
    }
  });

  // Pick Logo from Media Library
  pickLogoBtn?.addEventListener('click', () => {
    openMediaPicker(async (url) => {
      logoInput.value = url;
      updateLogoPreview(url);
      document.querySelectorAll('.sidebar-logo').forEach((el) => {
        el.src = url;
      });
      currentSettings.logoUrl = url;
      try {
        await updateSiteSettings(currentSettings);
        showToast('✓ Logo updated & saved from library!', 'success');
      } catch (e) {
        showToast('✓ Logo selected from media library', 'info');
      }
    });
  });

  async function loadData() {
    try {
      const live = await getSiteSettings(true);
      if (live) currentSettings = { ...live };

      // Fill form values
      container.querySelector('#s-brand').value = currentSettings.brandName || '';
      container.querySelector('#s-tagline').value = currentSettings.tagline || '';
      container.querySelector('#s-tagline-bn').value = currentSettings.taglineBn || '';
      container.querySelector('#s-logo').value = currentSettings.logoUrl || '/assets/pulmo_logo.jpg';
      container.querySelector('#s-favicon').value = currentSettings.faviconUrl || '/assets/pulmo_logo.jpg';
      container.querySelector('#s-phone').value = currentSettings.phone || '';
      container.querySelector('#s-wa').value = currentSettings.whatsappNumber || '';
      container.querySelector('#s-email').value = currentSettings.email || '';
      container.querySelector('#s-fb').value = currentSettings.facebookUrl || '';
      container.querySelector('#s-address').value = currentSettings.address || 'হাউজ#২৪, রোড#১১, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ';
      container.querySelector('#s-top-bar').value = currentSettings.topBarText || 'ঢাকা ও সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি ও ফ্রি সেটআপ সুবিধা';
      container.querySelector('#s-del-dhaka').value = currentSettings.deliveryDhaka ?? (currentSettings.deliverySylhet ?? 60);
      container.querySelector('#s-del-outside').value = currentSettings.deliveryOutside ?? 120;
      container.querySelector('#s-seo-title').value = currentSettings.seoTitle || '';
      container.querySelector('#s-seo-desc').value = currentSettings.seoDescription || '';
      container.querySelector('#s-seo-keywords').value = currentSettings.seoKeywords || '';
      container.querySelector('#s-theme-color').value = currentSettings.themeColor || '#0284c7';

      updateLogoPreview(currentSettings.logoUrl || '/assets/pulmo_logo.jpg');
    } catch (err) {
      console.warn('Could not load site settings:', err);
    }
  }

  // Submit Handler
  container.querySelector('#site-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = container.querySelector('#save-settings-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving settings...';

    const dhakaFee = parseFloat(container.querySelector('#s-del-dhaka').value) || 0;
    const outsideFee = parseFloat(container.querySelector('#s-del-outside').value) || 0;

    const payload = {
      brandName: container.querySelector('#s-brand').value.trim(),
      tagline: container.querySelector('#s-tagline').value.trim(),
      taglineBn: container.querySelector('#s-tagline-bn').value.trim(),
      logoUrl: container.querySelector('#s-logo').value.trim() || '/assets/pulmo_logo.jpg',
      faviconUrl: container.querySelector('#s-favicon').value.trim() || '/assets/pulmo_logo.jpg',
      phone: container.querySelector('#s-phone').value.trim(),
      whatsappNumber: container.querySelector('#s-wa').value.trim(),
      email: container.querySelector('#s-email').value.trim(),
      facebookUrl: container.querySelector('#s-fb').value.trim(),
      address: container.querySelector('#s-address').value.trim(),
      topBarText: container.querySelector('#s-top-bar').value.trim(),
      deliveryDhaka: dhakaFee,
      deliverySylhet: dhakaFee, // backward compatibility
      deliveryOutside: outsideFee,
      seoTitle: container.querySelector('#s-seo-title').value.trim(),
      seoDescription: container.querySelector('#s-seo-desc').value.trim(),
      seoKeywords: container.querySelector('#s-seo-keywords').value.trim(),
      themeColor: container.querySelector('#s-theme-color').value.trim()
    };

    try {
      await updateSiteSettings(payload);
      showToast('✓ All settings updated successfully!', 'success');
      // Also cache in local storage
      localStorage.setItem('pulmo_cache_settings', JSON.stringify({ ts: Date.now(), data: payload }));
    } catch (err) {
      console.error(err);
      showToast(`Error saving settings: ${err.message}`, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '✓ Save All Settings';
    }
  });

  loadData();
}
