/* ===================================================
   YK-Online — app.js
   - Language toggle (CS / EN)
   - Login & Register modals (simulated backend)
   - Inquiry modal → order via contact form
   - Dashboard modal → fake account / history
   - Contact form → demo submission
   - Hamburger menu
   =================================================== */

(function () {
  'use strict';

  /* ---- State ---- */
  let lang = localStorage.getItem('yk_lang') || 'cs';
  let isLoggedIn = localStorage.getItem('yk_logged_in') === '1';

  /* ---- DOM helpers ---- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

  /* ================================================
     LANGUAGE SYSTEM
     Every element with data-cs / data-en gets
     its innerHTML updated on lang change.
  ================================================ */
  function applyLang(newLang) {
    lang = newLang;
    localStorage.setItem('yk_lang', lang);
    document.documentElement.lang = lang;

    $$('[data-cs][data-en]').forEach(el => {
      const val = el.dataset[lang];
      if (val !== undefined) el.innerHTML = val;
    });

    // Handle long-form bilingual sections (legal pages)
    $$('.lang-cs').forEach(el => { el.style.display = lang === 'cs' ? '' : 'none'; });
    $$('.lang-en').forEach(el => { el.style.display = lang === 'en' ? '' : 'none'; });

    // Update toggle button label
    const toggleBtn = $('#langToggle');
    if (toggleBtn) toggleBtn.textContent = lang === 'cs' ? 'EN' : 'CS';

    // Re-bind switch links inside modals (they get re-rendered by innerHTML)
    bindModalSwitches();
  }

  function initLang() {
    applyLang(lang);
  }

  $('#langToggle')?.addEventListener('click', () => {
    applyLang(lang === 'cs' ? 'en' : 'cs');
  });

  /* ================================================
     MODALS
  ================================================ */
  function openModal(id) {
    const el = $('#' + id);
    if (!el) return;
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Focus first input
    const firstInput = el.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 60);
  }

  function closeModal(id) {
    const el = $('#' + id);
    if (!el) return;
    el.classList.add('hidden');
    document.body.style.overflow = '';
    clearModalErrors(el);
  }

  function closeAllModals() {
    ['loginModal', 'registerModal', 'inquiryModal', 'dashboardModal'].forEach(closeModal);
  }

  // Close on overlay click
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeAllModals();
    });
  });

  // Close on X button
  $$('.modal__close').forEach(btn => {
    btn.addEventListener('click', () => closeAllModals());
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });

  // Navbar buttons
  $('#loginBtn')?.addEventListener('click', () => openModal('loginModal'));
  $('#registerBtn')?.addEventListener('click', () => openModal('registerModal'));

  // Hero CTA
  $('#heroCta')?.addEventListener('click', () => {
    document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Pricing buttons
  $$('.pricing-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isLoggedIn) {
        const card = btn.closest('.pricing-card');
        const descEl = card?.querySelector('.pricing-card__desc');
        const amountEl = card?.querySelector('.amount');
        const productName = descEl ? descEl.textContent.trim() : 'Produkt';
        const price = amountEl ? amountEl.textContent.trim() : '';
        openInquiry(productName, price);
      } else {
        openModal('loginModal');
      }
    });
  });

  /* ================================================
     PRICING CAROUSEL
  ================================================ */
  const pricingTrack = $('#pricingTrack');
  const pricingPrev = $('#pricingPrev');
  const pricingNext = $('#pricingNext');
  const pricingDots = $('#pricingDots');
  let pricingIndex = 0;

  function getSlidesPerView() {
    const w = window.innerWidth;
    if (w <= 720) return 1;
    if (w <= 960) return 2;
    return 3;
  }

  function getSlideCount() {
    return pricingTrack ? pricingTrack.children.length : 0;
  }

  function getPageCount() {
    const perView = getSlidesPerView();
    return Math.max(1, Math.ceil(getSlideCount() / perView));
  }

  function renderPricingDots() {
    if (!pricingDots) return;
    const pages = getPageCount();
    pricingDots.innerHTML = '';
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'pricing-dot' + (i === pricingIndex ? ' active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        pricingIndex = i;
        updatePricingCarousel();
      });
      pricingDots.appendChild(dot);
    }
  }

  function updatePricingCarousel() {
    if (!pricingTrack) return;
    const pages = getPageCount();
    if (pricingIndex >= pages) pricingIndex = pages - 1;
    if (pricingIndex < 0) pricingIndex = 0;
    const viewport = pricingTrack.parentElement;
    const pageWidth = viewport ? viewport.clientWidth : 0;
    const maxShift = Math.max(0, pricingTrack.scrollWidth - pageWidth);
    const shiftPx = Math.min(pricingIndex * pageWidth, maxShift);
    pricingTrack.style.transform = `translateX(-${shiftPx}px)`;
    if (pricingPrev) pricingPrev.disabled = pricingIndex === 0;
    if (pricingNext) pricingNext.disabled = pricingIndex === pages - 1;
    renderPricingDots();
  }

  pricingPrev?.addEventListener('click', () => {
    pricingIndex -= 1;
    updatePricingCarousel();
  });

  pricingNext?.addEventListener('click', () => {
    pricingIndex += 1;
    updatePricingCarousel();
  });

  // Swipe support (touch + mouse drag)
  let startX = 0;
  let isDragging = false;
  let dragPointerId = null;
  const pricingViewport = pricingTrack?.parentElement;

  pricingViewport?.addEventListener('pointerdown', e => {
    // Do not hijack clicks on interactive elements (buttons, inputs, links).
    if (e.target.closest('button, a, input, textarea, label, select')) {
      isDragging = false;
      dragPointerId = null;
      return;
    }
    if (e.button !== 0) return;
    isDragging = true;
    dragPointerId = e.pointerId;
    startX = e.clientX;
    pricingViewport.setPointerCapture(e.pointerId);
  });

  pricingViewport?.addEventListener('pointerup', e => {
    if (!isDragging || dragPointerId !== e.pointerId) return;
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 40) {
      pricingIndex += diff < 0 ? 1 : -1;
      updatePricingCarousel();
    }
    isDragging = false;
    dragPointerId = null;
  });

  pricingViewport?.addEventListener('pointercancel', () => {
    isDragging = false;
    dragPointerId = null;
  });

  window.addEventListener('resize', updatePricingCarousel);

  /* ---- Switch between login / register ---- */
  function bindModalSwitches() {
    $('#switchToRegister')?.addEventListener('click', () => { closeModal('loginModal'); openModal('registerModal'); });
    $('#switchToLogin')?.addEventListener('click', () => { closeModal('registerModal'); openModal('loginModal'); });
  }

  /* ================================================
     FORM VALIDATION HELPERS
  ================================================ */
  function setError(input, msg) {
    clearError(input);
    const err = document.createElement('span');
    err.className = 'field-error';
    err.textContent = msg;
    err.style.cssText = 'color:#ef4444;font-size:.8125rem;margin-top:4px;display:block;';
    input.parentElement.appendChild(err);
    input.style.borderColor = '#ef4444';
  }

  function clearError(input) {
    const prev = input.parentElement.querySelector('.field-error');
    if (prev) prev.remove();
    input.style.borderColor = '';
  }

  function clearModalErrors(modal) {
    modal.querySelectorAll('.field-error').forEach(e => e.remove());
    modal.querySelectorAll('input').forEach(i => { i.style.borderColor = ''; });
  }

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  /* ================================================
     LOGIN FORM (UI demo — no backend)
  ================================================ */
  $('#loginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const email = form.email;
    const password = form.password;
    let valid = true;

    clearModalErrors($('#loginModal'));

    if (!validateEmail(email.value.trim())) {
      setError(email, lang === 'cs' ? 'Zadejte platný e-mail.' : 'Please enter a valid e-mail.');
      valid = false;
    }
    if (password.value.length < 1) {
      setError(password, lang === 'cs' ? 'Zadejte heslo.' : 'Please enter your password.');
      valid = false;
    }

    if (!valid) return;

    // Allowed accounts
    const email_val = email.value.trim().toLowerCase();
    const pass_val  = password.value;
    const allowed =
      (email_val === 'seyri@creatidea.cz') ||
      (email_val === 'test@test.cz' && pass_val === 'Testovaci062026');

    if (!allowed) {
      setError(password, lang === 'cs' ? 'Nesprávný e-mail nebo heslo.' : 'Incorrect e-mail or password.');
      return;
    }

    // Simulate successful login (no real auth)
    isLoggedIn = true;
    localStorage.setItem('yk_logged_in', '1');
    // Store email for pre-fill (name not available on login form)
    localStorage.setItem('yk_user_email', email.value.trim());
    closeModal('loginModal');
    updateNavForLoggedIn();
    showToast(lang === 'cs' ? 'Přihlášení proběhlo úspěšně.' : 'Logged in successfully.');
    form.reset();
  });

  /* ================================================
     REGISTER FORM (UI demo — no backend)
  ================================================ */
  $('#registerForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const name = form.name;
    const email = form.email;
    const password = form.password;
    const password2 = form.password2;
    let valid = true;

    clearModalErrors($('#registerModal'));

    if (name.value.trim().length < 2) {
      setError(name, lang === 'cs' ? 'Zadejte své jméno.' : 'Please enter your name.');
      valid = false;
    }
    if (!validateEmail(email.value.trim())) {
      setError(email, lang === 'cs' ? 'Zadejte platný e-mail.' : 'Please enter a valid e-mail.');
      valid = false;
    }
    if (password.value.length < 8) {
      setError(password, lang === 'cs' ? 'Heslo musí mít alespoň 8 znaků.' : 'Password must be at least 8 characters.');
      valid = false;
    }
    if (password2.value !== password.value) {
      setError(password2, lang === 'cs' ? 'Hesla se neshodují.' : 'Passwords do not match.');
      valid = false;
    }

    if (!valid) return;

    isLoggedIn = true;
    localStorage.setItem('yk_logged_in', '1');
    localStorage.setItem('yk_user_name', name.value.trim());
    localStorage.setItem('yk_user_email', email.value.trim());
    closeModal('registerModal');
    updateNavForLoggedIn();
    showToast(lang === 'cs' ? 'Účet byl vytvořen. Vítejte!' : 'Account created. Welcome!');
    form.reset();
  });

  /* ================================================
     UI STATE AFTER LOGIN
  ================================================ */
  function updateNavForLoggedIn() {
    const loginBtn = $('#loginBtn');
    const registerBtn = $('#registerBtn');
    const navActions = loginBtn?.parentElement;

    // Add dashboard button if not already there
    if (navActions && !$('#dashBtn')) {
      const dashBtn = document.createElement('button');
      dashBtn.id = 'dashBtn';
      dashBtn.className = 'btn btn--outline';
      dashBtn.setAttribute('data-cs', 'Můj účet');
      dashBtn.setAttribute('data-en', 'My account');
      dashBtn.textContent = lang === 'cs' ? 'Můj účet' : 'My account';
      dashBtn.addEventListener('click', openDashboard);
      navActions.insertBefore(dashBtn, loginBtn);
    }

    if (loginBtn) {
      loginBtn.textContent = lang === 'cs' ? 'Odhlásit se' : 'Log out';
      loginBtn.className = 'btn btn--ghost' in loginBtn.classList ? loginBtn.className : 'btn btn--outline';
      loginBtn.onclick = () => {
        isLoggedIn = false;
        localStorage.removeItem('yk_logged_in');
        // Remove dashboard button
        $('#dashBtn')?.remove();
        loginBtn.dataset.cs = 'Přihlásit se';
        loginBtn.dataset.en = 'Log in';
        loginBtn.textContent = lang === 'cs' ? 'Přihlásit se' : 'Log in';
        loginBtn.onclick = () => openModal('loginModal');
        registerBtn.style.display = '';
        closeAllModals();
        showToast(lang === 'cs' ? 'Byli jste odhlášeni.' : 'You have been logged out.');
      };
    }
    if (registerBtn) registerBtn.style.display = 'none';
  }

  /* ================================================
     CONTACT FORM (demo)
  ================================================ */
  $('#contactForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const success = $('#formSuccess');
    form.querySelectorAll('input, textarea').forEach(f => f.value = '');
    success?.classList.remove('hidden');
    setTimeout(() => success?.classList.add('hidden'), 5000);
  });

  /* ================================================
     INQUIRY MODAL
  ================================================ */
  function openInquiry(productName, price) {
    // Populate product strip
    const prod = $('#inquiryProduct');
    if (prod) {
      prod.innerHTML =
        `<span class="inquiry__product-name">${productName}</span>` +
        `<span class="inquiry__product-price">${price}</span>`;
    }
    // Pre-fill name & email from localStorage
    const nameEl = $('#inqName');
    const emailEl = $('#inqEmail');
    if (nameEl) nameEl.value = localStorage.getItem('yk_user_name') || '';
    if (emailEl) emailEl.value = localStorage.getItem('yk_user_email') || '';

    // Reset payment method UI
    const cardMethod = document.querySelector('input[name="paymentMethod"][value="card"]');
    if (cardMethod) cardMethod.checked = true;
    toggleBankPaymentUI();

    // Reset to form state
    $('#inquiryForm')?.classList.remove('hidden');
    $('#inquirySuccess')?.classList.add('hidden');
    clearModalErrors($('#inquiryModal'));
    openModal('inquiryModal');
  }

  function parsePrice(text) {
    if (!text) return { amount: 0, currency: 'CZK' };
    const currency = text.includes('€') || text.includes('EUR') ? 'EUR' : 'CZK';
    const amount = Number(text.replace(/[^0-9]/g, '')) || 0;
    return { amount, currency };
  }

  const BANK_ACCOUNTS = {
    CZK: 'CZ6303000000000366778458',
    EUR: 'CZ9203000000000371157680'
  };

  function createTransferQrUrl(iban, amount, currency, message) {
    // Czech QR payment format (SPD 1.0) accepted by mobile banking apps.
    const am = Number(amount || 0).toFixed(2);
    const vs = String(Date.now()).slice(-10);
    const safeMsg = String(message || 'YK-Online').replace(/[^a-zA-Z0-9 .\-]/g, ' ').trim().slice(0, 60);
    const payload = [
      'SPD*1.0',
      `ACC:${iban}`,
      `AM:${am}`,
      `CC:${currency}`,
      `X-VS:${vs}`,
      `MSG:${safeMsg}`
    ].join('*');
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`;
  }

  function toggleBankPaymentUI() {
    const bankBox = $('#bankPayBox');
    const qrImg = $('#bankQrImg');
    const qrNote = $('#bankQrNote');
    const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (!bankBox) return;

    if (selected === 'bank') {
      bankBox.classList.remove('hidden');
      const priceText = $('#inquiryProduct .inquiry__product-price')?.textContent || '';
      const productName = $('#inquiryProduct .inquiry__product-name')?.textContent || 'Objednavka';
      const parsed = parsePrice(priceText);
      const iban = parsed.currency === 'EUR' ? BANK_ACCOUNTS.EUR : BANK_ACCOUNTS.CZK;
      const qrUrl = parsed.amount > 0
        ? createTransferQrUrl(iban, parsed.amount, parsed.currency, `YK-Online ${productName}`)
        : '';

      if (qrImg) {
        qrImg.src = qrUrl;
        if (qrUrl) qrImg.classList.remove('hidden');
        else qrImg.classList.add('hidden');
      }
      if (qrNote) {
        if (qrUrl) {
          qrNote.textContent = lang === 'cs'
            ? 'QR kód je připraven pro okamžitou platbu převodem.'
            : 'QR code is ready for instant bank transfer payment.';
        } else {
          qrNote.textContent = lang === 'cs'
            ? 'U této položky není pevná částka. QR kód se vygeneruje po potvrzení ceny.'
            : 'This item has no fixed amount. QR code will be generated after price confirmation.';
        }
      }
    } else {
      bankBox.classList.add('hidden');
      if (qrImg) {
        qrImg.src = '';
        qrImg.classList.add('hidden');
      }
      if (qrNote) {
        qrNote.textContent = lang === 'cs'
          ? 'Po výběru bankovního převodu se vygeneruje QR kód pro platbu.'
          : 'After selecting bank transfer, a payment QR code will be generated.';
      }
    }
  }

  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', toggleBankPaymentUI);
  });

  $('#inquiryForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const nameEl = $('#inqName');
    const emailEl = $('#inqEmail');
    let valid = true;
    clearModalErrors($('#inquiryModal'));

    if (!nameEl || nameEl.value.trim().length < 2) {
      if (nameEl) setError(nameEl, lang === 'cs' ? 'Zadejte své jméno.' : 'Please enter your name.');
      valid = false;
    }
    if (!emailEl || !validateEmail(emailEl.value.trim())) {
      if (emailEl) setError(emailEl, lang === 'cs' ? 'Zadejte platný e-mail.' : 'Please enter a valid e-mail.');
      valid = false;
    }
    if (!valid) return;

    // Save inquiry to localStorage history
    const productName = $('#inquiryProduct .inquiry__product-name')?.textContent || '';
    const price = $('#inquiryProduct .inquiry__product-price')?.textContent || '';
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';
    const orders = JSON.parse(localStorage.getItem('yk_orders') || '[]');
    orders.unshift({
      product: productName,
      price,
      paymentMethod,
      date: new Date().toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-GB'),
      status: lang === 'cs' ? 'Vyřizuje se' : 'Processing'
    });
    localStorage.setItem('yk_orders', JSON.stringify(orders));

    // Show success
    form.classList.add('hidden');
    const succ = $('#inquirySuccess');
    if (succ) {
      succ.classList.remove('hidden');
      // re-apply lang so data-cs/en in success block render
      succ.querySelectorAll('[data-cs][data-en]').forEach(el => {
        const val = el.dataset[lang];
        if (val !== undefined) el.innerHTML = val;
      });
    }
  });

  $('#inquiryClose')?.addEventListener('click', () => closeModal('inquiryModal'));

  /* ================================================
     DASHBOARD MODAL
  ================================================ */
  function openDashboard() {
    const userName  = localStorage.getItem('yk_user_name') || (lang === 'cs' ? 'Uživatel' : 'User');
    const userEmail = localStorage.getItem('yk_user_email') || '';
    const initials  = userName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    const avatarEl = $('#dashAvatar');
    const nameEl   = $('#dashboardTitle');
    const emailEl  = $('#dashEmail');
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl)   nameEl.textContent   = lang === 'cs' ? `Dobrý den, ${userName}` : `Hello, ${userName}`;
    if (emailEl)  emailEl.textContent  = userEmail;

    // Render orders
    const ordersDiv = $('#dashOrders');
    const orders = JSON.parse(localStorage.getItem('yk_orders') || '[]');
    if (ordersDiv) {
      if (orders.length === 0) {
        ordersDiv.innerHTML =
          `<p class="dash__empty">${lang === 'cs' ? 'Zatím žádné poptávky.' : 'No inquiries yet.'}</p>`;
      } else {
        ordersDiv.innerHTML = orders.map(o =>
          `<div class="dash__order">
            <div class="dash__order-info">
              <span class="dash__order-name">${o.product}</span>
              <span class="dash__order-date">${o.date}</span>
            </div>
            <div class="dash__order-right">
              <span class="dash__order-price">${o.price}</span>
              <span class="dash__order-method">${(o.paymentMethod || 'card') === 'bank' ? (lang === 'cs' ? 'Bankovní převod' : 'Bank transfer') : (lang === 'cs' ? 'Platba kartou' : 'Card payment')}</span>
              <span class="dash__order-status">${lang === 'cs' ? 'Vyřizuje se' : 'Processing'}</span>
            </div>
          </div>`
        ).join('');
      }
    }

    openModal('dashboardModal');
  }

  $('#dashLogout')?.addEventListener('click', () => {
    $('#loginBtn')?.onclick?.();
  });

  /* ================================================
     HAMBURGER MENU
  ================================================ */
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');

  hamburger?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
  });

  // Close menu on nav link click
  $$('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });

  /* ================================================
     TOAST
  ================================================ */
  let toastTimer = null;
  function showToast(msg, duration = 3000) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), duration);
  }

  /* ================================================
     SMOOTH SCROLL for hash links in navbar
  ================================================ */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ---- Init ---- */
  initLang();
  bindModalSwitches();
  if (isLoggedIn) updateNavForLoggedIn();
  updatePricingCarousel();

})();
