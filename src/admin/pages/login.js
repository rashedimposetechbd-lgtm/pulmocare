import { loginAdminWithCredentials } from '../../shared/db.js';
import { showToast } from '../components/toast.js';

export function renderLoginPage(container) {
  container.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-header">
          <img src="/assets/pulmo_logo.jpg" alt="Pulmo Care" class="login-logo" />
          <h2 class="login-title">Pulmo Care Admin Panel</h2>
          <p class="login-sub">Sign in to manage products, categories, orders, media, and site settings</p>
        </div>

        <form id="admin-login-form">
          <div class="adm-form-group">
            <label class="adm-label">Admin Email Address</label>
            <input type="email" id="login-email" class="adm-input" required placeholder="Admin email" />
          </div>

          <div class="adm-form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label class="adm-label" style="margin-bottom: 0;">Password</label>
            </div>
            <input type="password" id="login-password" class="adm-input" required placeholder="Password" />
          </div>

          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; align-items: center; justify-content: space-between; background: var(--admin-surface-subtle); padding: 0.6rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--admin-border); font-size: 0.8rem;">
            <span>Sign in with the credentials configured on the server.</span>
          </div>

          <div id="login-error-alert" style="display: none; padding: 0.75rem; border-radius: var(--radius-sm); background: #fee2e2; color: #991b1b; font-size: 0.85rem; margin-bottom: 1.25rem; line-height: 1.4;"></div>

          <button type="submit" class="adm-btn adm-btn--primary" id="login-submit-btn" style="width: 100%; padding: 0.75rem; font-weight: 600;">
            <span id="login-btn-text">Sign In as Admin</span>
          </button>
        </form>

        <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid var(--admin-border); padding-top: 1.25rem;">
          <a href="/" style="font-size: 0.85rem; color: var(--admin-text-muted); text-decoration: none;">← Visit Public Storefront</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#admin-login-form');
  const emailInput = container.querySelector('#login-email');
  const passwordInput = container.querySelector('#login-password');
  const submitBtn = container.querySelector('#login-submit-btn');
  const btnText = container.querySelector('#login-btn-text');
  const errorAlert = container.querySelector('#login-error-alert');

  // Email/Password Login Handler using MySQL API
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    errorAlert.style.display = 'none';
    submitBtn.disabled = true;
    btnText.textContent = 'Verifying credentials...';

    try {
      const res = await loginAdminWithCredentials(email, password);
      if (res && res.success) {
        localStorage.setItem('pulmo_admin_session', JSON.stringify({
          email: res.user?.email || email,
          role: res.user?.role || 'editor',
          displayName: res.user?.displayName || 'Admin',
          loginTime: Date.now()
        }));
        showToast('✓ Welcome! Signed in successfully.', 'success');
        window.location.hash = '#dashboard';
        window.location.reload();
      } else {
        throw new Error(res.error || 'Invalid credentials');
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Invalid email or password.';
      errorAlert.style.display = 'block';
      submitBtn.disabled = false;
      btnText.textContent = 'Sign In as Admin';
    }
  });
}
