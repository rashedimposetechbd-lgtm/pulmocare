import { formatTaka, toBanglaNumber } from '../shared/utils/format.js';
import { createCustomerOrder } from '../shared/db.js';
import { escapeHtml } from '../shared/utils/escape.js';

export class CartManager {
  constructor({ settings, products, showToast }) {
    this.settings = settings;
    this.products = products;
    this.showToast = showToast;
    this.cart = this.loadCart();

    // DOM Elements
    this.badgeEl = document.getElementById('cart-badge');
    this.drawerEl = document.getElementById('cart-drawer');
    this.overlayEl = document.getElementById('cart-overlay');
    this.itemsContainer = document.getElementById('cart-items-container');
    this.emptyView = document.getElementById('cart-empty-view');
    this.itemCountEl = document.getElementById('drawer-item-count');
    this.subtotalEl = document.getElementById('cart-subtotal-val');
    this.deliveryEl = document.getElementById('cart-delivery-val');
    this.totalEl = document.getElementById('cart-total-val');
    this.openBtn = document.getElementById('open-cart-btn');
    this.closeBtn = document.getElementById('close-cart-btn');
    this.waCheckoutBtn = document.getElementById('whatsapp-checkout-btn');
    this.codCheckoutBtn = document.getElementById('cod-checkout-btn');

    // COD Modal Elements
    this.checkoutModal = document.getElementById('checkout-modal');
    this.closeModalBtn = document.getElementById('close-modal-btn');
    this.codForm = document.getElementById('cod-form');
    this.codZone = document.getElementById('cod-zone');
    this.modalTotalDisplay = document.getElementById('modal-total-display');

    this.initEvents();
    this.updateUI();
  }

  loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem('pulmo_cart') || '[]');
      return Array.isArray(raw)
        ? raw.filter((item) => item && item.id && typeof item.price === 'number')
        : [];
    } catch {
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('pulmo_cart', JSON.stringify(this.cart));
    } catch {}
    this.updateUI();
  }

  initEvents() {
    this.openBtn?.addEventListener('click', () => this.openCart());
    this.closeBtn?.addEventListener('click', () => this.closeCart());
    this.overlayEl?.addEventListener('click', () => this.closeCart());

    document.getElementById('empty-shop-now-btn')?.addEventListener('click', () => {
      this.closeCart();
    });

    this.waCheckoutBtn?.addEventListener('click', () => this.handleWhatsAppCheckout());
    this.codCheckoutBtn?.addEventListener('click', () => this.openCodModal());

    this.closeModalBtn?.addEventListener('click', () => this.closeCodModal());
    this.checkoutModal?.addEventListener('click', (e) => {
      if (e.target === this.checkoutModal) this.closeCodModal();
    });

    this.codZone?.addEventListener('change', () => this.updateCodTotal());
    this.codForm?.addEventListener('submit', (e) => this.handleCodSubmit(e));
  }

  openCart() {
    this.drawerEl?.classList.add('is-open');
    this.overlayEl?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  closeCart() {
    this.drawerEl?.classList.remove('is-open');
    this.overlayEl?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  addToCart(productId, quantity = 1) {
    const prod = this.products.find((p) => p.id === productId);
    if (!prod) return;

    const existing = this.cart.find((i) => i.id === productId);
    if (existing) {
      existing.qty += quantity;
    } else {
      const primaryImg = (prod.images && prod.images[0]) || prod.image || '/assets/device.jpg';
      const displayName = prod.name || prod.nameEn || prod.nameBn || 'Medical Device';
      this.cart.push({
        id: prod.id,
        name: displayName,
        bnName: prod.nameBn || displayName,
        price: prod.price,
        image: primaryImg,
        qty: quantity
      });
    }

    this.saveCart();
    this.showToast(`✓ "${prod.nameEn || prod.name}" কার্টে যোগ করা হয়েছে!`);
  }

  buyNow(productId, quantity = 1) {
    this.addToCart(productId, quantity);
    this.openCart();
  }

  updateQuantity(productId, delta) {
    const item = this.cart.find((i) => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      this.cart = this.cart.filter((i) => i.id !== productId);
    }
    this.saveCart();
  }

  removeItem(productId) {
    this.cart = this.cart.filter((i) => i.id !== productId);
    this.saveCart();
  }

  getSubtotal() {
    return this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  updateUI() {
    const totalQty = this.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = this.getSubtotal();

    // Badge
    if (this.badgeEl) this.badgeEl.textContent = String(totalQty);
    if (this.itemCountEl) {
      this.itemCountEl.textContent = `(${toBanglaNumber(totalQty)}টি পণ্য)`;
    }

    if (this.cart.length === 0) {
      if (this.emptyView) this.emptyView.style.display = 'block';
      if (this.itemsContainer) {
        // Keep empty view inside
        this.itemsContainer.innerHTML = '';
        if (this.emptyView) this.itemsContainer.appendChild(this.emptyView);
      }
      if (this.subtotalEl) this.subtotalEl.textContent = formatTaka(0, true);
      if (this.totalEl) this.totalEl.textContent = formatTaka(0, true);
      return;
    }

    if (this.emptyView) this.emptyView.style.display = 'none';

    // Render items
    if (this.itemsContainer) {
      this.itemsContainer.innerHTML = this.cart.map((item) => `
        <div class="cart-item" data-item-id="${escapeHtml(item.id)}">
          <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item__img" />
          <div class="cart-item__info">
            <h4 class="cart-item__title">${escapeHtml(item.name)}</h4>
            <div class="cart-item__price">${formatTaka(item.price, true)}</div>
            <div class="cart-item__controls">
              <div class="qty-btn-group">
                <button class="qty-btn" data-action="dec" data-id="${escapeHtml(item.id)}">−</button>
                <span class="qty-val">${toBanglaNumber(item.qty)}</span>
                <button class="qty-btn" data-action="inc" data-id="${escapeHtml(item.id)}">+</button>
              </div>
              <button class="cart-item__remove" data-action="remove" data-id="${escapeHtml(item.id)}">মুছে ফেলুন</button>
            </div>
          </div>
        </div>
      `).join('');

      // Wire item events
      this.itemsContainer.querySelectorAll('[data-action="inc"]').forEach((btn) => {
        btn.addEventListener('click', () => this.updateQuantity(btn.dataset.id, 1));
      });
      this.itemsContainer.querySelectorAll('[data-action="dec"]').forEach((btn) => {
        btn.addEventListener('click', () => this.updateQuantity(btn.dataset.id, -1));
      });
      this.itemsContainer.querySelectorAll('[data-action="remove"]').forEach((btn) => {
        btn.addEventListener('click', () => this.removeItem(btn.dataset.id));
      });
    }

    if (this.subtotalEl) this.subtotalEl.textContent = formatTaka(subtotal, true);
    if (this.totalEl) this.totalEl.textContent = formatTaka(subtotal, true);
  }

  async handleWhatsAppCheckout() {
    if (this.cart.length === 0) {
      alert('আপনার কার্ট খালি! অনুগ্রহ করে পণ্য যোগ করুন।');
      return;
    }

    const subtotal = this.getSubtotal();
    const itemsSummary = this.cart
      .map((i, idx) => `${idx + 1}. ${i.name} (${toBanglaNumber(i.qty)}x) = ${formatTaka(i.price * i.qty, true)}`)
      .join('\n');

    // Save order to Firestore as 'whatsapp' channel
    try {
      await createCustomerOrder({
        customerName: 'WhatsApp Order',
        customerPhone: 'Direct WhatsApp',
        customerAddress: 'To be confirmed in chat',
        zone: 'dhaka',
        items: this.cart.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty
        })),
        subtotal,
        deliveryCharge: 0,
        total: subtotal,
        channel: 'whatsapp'
      });
    } catch (err) {
      console.warn('[Cart] Firestore order logging error:', err);
    }

    const waNum = (this.settings.whatsappNumber || '8801337708107').replace(/[^0-9]/g, '');
    const message = `আসসালামু আলাইকুম Pulmo Care,\nআমি ওয়েবসাইট থেকে নিচের পণ্যগুলো অর্ডার করতে চাই:\n\n${itemsSummary}\n\nসর্বমোট মূল্য: ${formatTaka(subtotal, true)}\nডেলিভারি ঠিকানা: ঢাকা / সারা বাংলাদেশ\nদয়া করে অর্ডারটি কনফার্ম করুন।`;

    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  openCodModal() {
    if (this.cart.length === 0) {
      alert('আপনার কার্ট খালি! অনুগ্রহ করে পণ্য যোগ করুন।');
      return;
    }
    this.closeCart();
    this.updateCodTotal();
    this.checkoutModal?.classList.add('is-open');
  }

  closeCodModal() {
    this.checkoutModal?.classList.remove('is-open');
  }

  updateCodTotal() {
    const subtotal = this.getSubtotal();
    const zone = this.codZone?.value || 'dhaka';
    const delivery = zone === 'outside'
      ? (this.settings.deliveryOutside ?? 120)
      : (this.settings.deliveryDhaka ?? (this.settings.deliverySylhet ?? 60));
    const total = subtotal + delivery;

    if (this.modalTotalDisplay) {
      this.modalTotalDisplay.textContent = formatTaka(total, true);
    }
  }

  async handleCodSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('cod-name')?.value.trim();
    const phone = document.getElementById('cod-phone')?.value.trim();
    const address = document.getElementById('cod-address')?.value.trim();
    const zone = this.codZone?.value || 'dhaka';
    const zoneText = this.codZone?.options[this.codZone.selectedIndex]?.text || '';

    if (!name || !phone || !address) {
      alert('অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।');
      return;
    }

    const subtotal = this.getSubtotal();
    const delivery = zone === 'outside'
      ? (this.settings.deliveryOutside ?? 120)
      : (this.settings.deliveryDhaka ?? (this.settings.deliverySylhet ?? 60));
    const finalTotal = subtotal + delivery;

    const itemsSummary = this.cart
      .map((i, idx) => `${idx + 1}. ${i.name} (${toBanglaNumber(i.qty)}টি) = ${formatTaka(i.price * i.qty, true)}`)
      .join('\n');

    // 1. Record order in Firestore!
    try {
      await createCustomerOrder({
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        zone,
        items: this.cart.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty
        })),
        subtotal,
        deliveryCharge: delivery,
        total: finalTotal,
        channel: 'cod'
      });
    } catch (err) {
      console.warn('[Cart] Error saving COD order to Firestore:', err);
    }

    // 2. Clear cart and show toast
    this.cart = [];
    this.saveCart();
    this.closeCodModal();
    this.codForm?.reset();
    this.showToast('✓ আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে!');

    // 3. Dispatch to WhatsApp
    const waNum = (this.settings.whatsappNumber || '8801337708107').replace(/[^0-9]/g, '');
    const message = `*নতুন ক্যাশ অন ডেলিভারি অর্ডার (Pulmo Care)*\n\n*গ্রাহকের তথ্য:*\nনাম: ${name}\nফোন: ${phone}\nঠিকানা: ${address}\nএলাকা: ${zoneText}\n\n*অর্ডারকৃত পণ্যসমূহ:*\n${itemsSummary}\n\nডেলিভারি চার্জ: ${formatTaka(delivery, true)}\n*সর্বমোট পরিশোধযোগ্য: ${formatTaka(finalTotal, true)}*`;

    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }
}
