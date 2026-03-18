document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('checkoutForm');
  const summaryEl = document.getElementById('checkoutSummary');
  const totalEl = document.getElementById('checkoutTotal');
  const payBtn = document.getElementById('payBtn');
  const errEl = document.getElementById('checkoutError');

  const cartKey = 'bagdash_cart';
  const sar = (window.__i18n && window.__i18n.sar) || 'ر.س';

  function readCart() {
    try {
      const raw = localStorage.getItem(cartKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function calcUnitPrice(item) {
    if (item && item.type === 'ice_cream' && item.iceCup) return parseFloat(item.iceCup.price) || 0;
    if (item && item.selectedVariant) return parseFloat(item.selectedVariant.price) || 0;
    if (item && item.sale_price != null && item.sale_price !== '') return parseFloat(item.sale_price) || 0;
    return parseFloat(item.price) || 0;
  }

  function itemDisplayName(item) {
    if (item && item.type === 'ice_cream' && item.iceCup) {
      const flavorsStr = item.flavors && item.flavors.length ? item.flavors.map(f => f.name_ar).join('، ') : '';
      return 'آيسكريم - كوب ' + (item.iceCup.name_ar || '') + (flavorsStr ? ': ' + flavorsStr : '');
    }
    if (item && item.selectedVariant) return `${item.name} - ${item.selectedVariant.name}`;
    return item && item.name ? item.name : 'منتج';
  }

  function renderSummary(cart) {
    if (!summaryEl || !totalEl) return;
    if (!cart || cart.length === 0) {
      summaryEl.innerHTML = '<div class="loading-cart">السلة فارغة. <a href="/products">اذهب للقائمة</a></div>';
      totalEl.textContent = '0.00 ' + sar;
      if (payBtn) payBtn.disabled = true;
      return;
    }

    let html = '';
    let total = 0;
    cart.forEach((item) => {
      const qty = parseInt(item.quantity || 1, 10);
      const unit = calcUnitPrice(item);
      const line = unit * qty;
      total += line;
      html += `
        <div class="summary-row" style="align-items:flex-start;">
          <span style="max-width: 62%;">${itemDisplayName(item)} <small style="color:#777;">(${qty}x)</small></span>
          <span>${line.toFixed(2)} ${sar}</span>
        </div>
      `;
    });
    summaryEl.innerHTML = html;
    totalEl.textContent = total.toFixed(2) + ' ' + sar;
  }

  const cart = readCart();
  renderSummary(cart);

  function showError(msg) {
    if (!errEl) return;
    errEl.textContent = msg || 'حدث خطأ غير متوقع. حاول مرة أخرى.';
    errEl.style.display = 'block';
  }

  async function createSession(payload) {
    const res = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Failed to create payment session');
    }
    return await res.json();
  }

  async function mockPay(payload) {
    const res = await fetch('/api/payments/mock-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Mock payment failed');
    }
    return await res.json();
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errEl) errEl.style.display = 'none';

      const cartNow = readCart();
      if (!cartNow.length) return showError('السلة فارغة.');

      if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تنفيذ العملية...';
      }

      const fd = new FormData(form);
      const address = {
        fullName: String(fd.get('fullName') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        city: String(fd.get('city') || '').trim(),
        district: String(fd.get('district') || '').trim(),
        street: String(fd.get('street') || '').trim(),
        notes: String(fd.get('notes') || '').trim(),
      };

      try {
        const paymentsEnabled = !!(window.__PAYMENTS__ && window.__PAYMENTS__.enabled);
        if (paymentsEnabled) {
          const data = await createSession({ cart: cartNow, address });
          if (!data || !data.url) throw new Error('Missing Stripe URL');
          window.location.href = data.url;
        } else {
          const data = await mockPay({ cart: cartNow, address });
          if (!data || !data.redirect) throw new Error('Missing redirect URL');
          window.location.href = data.redirect;
        }
      } catch (err) {
        showError(err && err.message ? err.message : 'فشل بدء عملية الدفع.');
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.innerHTML = '<i class="fa-brands fa-apple"></i> الدفع عبر Apple Pay';
        }
      }
    });
  }
});

