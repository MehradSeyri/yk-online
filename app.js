/* ===================================================
   YK-Online — app.js
   - Language toggle (CS / EN)
   - Login & Register modals (UI only, no backend)
   - Pricing buttons → require auth
   - Contact form → demo submission
   - Hamburger menu
   =================================================== */

(function () {
  'use strict';

  /* ---- State ---- */
  let lang = localStorage.getItem('yk_lang') || 'cs';
  let isLoggedIn = false; // no backend yet

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
    ['loginModal', 'registerModal'].forEach(closeModal);
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
    if (isLoggedIn) {
      document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      openModal('registerModal');
    }
  });

  // Pricing buttons
  $$('.pricing-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isLoggedIn) {
        showToast(lang === 'cs' ? 'Platební brána bude brzy k dispozici.' : 'Payment gateway coming soon.');
      } else {
        openModal('loginModal');
      }
    });
  });

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

    // Simulate successful login (no real auth)
    isLoggedIn = true;
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

    if (loginBtn) {
      loginBtn.textContent = lang === 'cs' ? 'Odhlásit se' : 'Log out';
      loginBtn.onclick = () => {
        isLoggedIn = false;
        loginBtn.dataset.cs = 'Přihlásit se';
        loginBtn.dataset.en = 'Log in';
        loginBtn.textContent = lang === 'cs' ? 'Přihlásit se' : 'Log in';
        loginBtn.onclick = () => openModal('loginModal');
        registerBtn.style.display = '';
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

})();
