const LS_KEYS = {
  USERS: 'pf_users',
  SESSION: 'pf_session',
  CART: 'pf_cart',
  CONTACTS: 'pf_contacts',
  ORDERS: 'pf_orders'
};

const ROOT_INDEX = location.pathname.includes('/assets/pages/') ? '../../index.html' : 'index.html';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const money = n => n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
const getLS = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function updateCartBadge() {
  const count = getLS(LS_KEYS.CART, []).reduce((acc, it) => acc + it.qty, 0);
  $$('#cart-count').forEach(el => el.textContent = count);
}
function setYear() { const y = new Date().getFullYear(); $$('#year').forEach(el => el.textContent = y); }

function validateField(input, msg) {
  const err = document.querySelector(`[data-error-for="${input.id}"]`);
  let text = '';
  if (input.validity.valueMissing) text = 'Este campo es obligatorio.';
  else if (input.type === 'email' && input.validity.typeMismatch) text = 'Ingresa un correo valido.';
  else if (input.minLength && input.value.length < input.minLength) text = `Minimo ${input.minLength} caracteres.`;
  if (msg) text = msg;
  if (err) err.textContent = text;
  input.classList.toggle('invalid', !!text);
  return !text;
}
function attachLiveValidation(form) {
  form && form.addEventListener('input', e => {
    if (e.target.matches('input,textarea,select')) validateField(e.target);
  });
}

const PROTECTED_PAGES = ['productos.html', 'carrito.html'];
function getSession() { return getLS(LS_KEYS.SESSION, null); }
function enforceProtectedPages() {
  const path = location.pathname.split('/').pop();
  if (PROTECTED_PAGES.includes(path)) {
    const session = getSession();
    if (!session) {
      try { localStorage.setItem('pf_redirect_after_login', path); } catch (e) { }
      if (window.Swal?.fire) {
        Swal.fire({
          title: 'Acceso restringido',
          text: 'Por favor inicia sesión para ver esta página.',
          icon: 'warning',
          confirmButtonText: 'Iniciar sesión',
          background: '#14141c',
          color: '#f5f5f8',
          confirmButtonColor: '#7d46ff'
        }).then(() => { location.replace('login.html'); });
      } else {
        location.replace('login.html');
      }
    }
  }
}

function interceptProtectedLinks() {
  const session = getSession();
  if (session) return;
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    const page = href.split('/').pop();
    if (PROTECTED_PAGES.includes(page)) {
      e.preventDefault();
      try { localStorage.setItem('pf_redirect_after_login', page); } catch (err) { }
      const loginPath = location.pathname.includes('/assets/pages/') ? 'login.html' : 'assets/pages/login.html';
      if (window.Swal?.fire) {
        Swal.fire({
          title: 'Necesitas iniciar sesión',
          text: 'Inicia sesión o regístrate para acceder a esa sección.',
          icon: 'info',
          confirmButtonText: 'Ir a iniciar sesión',
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          background: '#14141c',
          color: '#f5f5f8',
          confirmButtonColor: '#7d46ff'
        }).then(r => { if (r.isConfirmed) location.href = loginPath; });
      } else {
        location.href = loginPath;
      }
    }
  });
}

function handleAuth() {
  const login = $('#form-login');
  const register = $('#form-register');

  attachLiveValidation(login);
  attachLiveValidation(register);

  login?.addEventListener('submit', e => {
    e.preventDefault();
    const sanitize = str => str.replace(/[\u0000-\u001F]+/g,'').replace(/<[^>]*>/g,'').replace(/["'`]/g,'').trim();
    const emailRaw = $('#login-email').value;
    const pass = $('#login-password').value;
    const email = sanitize(emailRaw.toLowerCase());
    const emailValid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
    if (!emailValid) { validateField($('#login-email'), 'Correo inválido.'); return; }
    validateField($('#login-email'));
    validateField($('#login-password'));
    const users = getLS(LS_KEYS.USERS, []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const msg = $('#login-msg');
    if (!user || user.password !== pass) {
      if (window.Swal?.fire) {
        Swal.fire({
          title: 'Credenciales incorrectas',
          text: 'Verifica tu correo y contraseña.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          background: '#14141c',
          color: '#f5f5f8',
          confirmButtonColor: '#7d46ff'
        });
      } else {
        msg.textContent = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      }
      return;
    }
    setLS(LS_KEYS.SESSION, { email: user.email, name: user.name });
    refreshAuthMenu();
    const target = localStorage.getItem('pf_redirect_after_login');
    if (window.Swal?.fire) {
      Swal.fire({
        title: `Bienvenido, ${user.name.split(' ')[0]}!`,
        text: 'Inicio de sesión exitoso',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
        background: '#14141c',
        color: '#f5f5f8'
      }).then(() => {
        if (target) { localStorage.removeItem('pf_redirect_after_login'); location.replace(target); }
        else location.replace(ROOT_INDEX);
      });
    } else {
      if (target) { localStorage.removeItem('pf_redirect_after_login'); location.replace(target); }
      else location.replace(ROOT_INDEX);
    }
    return;
  });

  register?.addEventListener('submit', e => {
    e.preventDefault();
    const rawName = $('#reg-name').value;
    const rawEmail = $('#reg-email').value;
    const pass = $('#reg-password').value;
    const pass2 = $('#reg-password2').value;

    // Sanitización básica (remueve scripts, etiquetas y normaliza espacios)
    const sanitize = str => str.replace(/[\u0000-\u001F]+/g,'')
                               .replace(/<[^>]*>/g,'')
                               .replace(/["'`]/g,'')
                               .replace(/\s+/g,' ') // colapsa espacios
                               .trim();
    const name = sanitize(rawName);
    const email = sanitize(rawEmail.toLowerCase());

    // Validaciones estrictas
    const nameValid = /^[a-záéíóúäëïöüñ\s]{3,60}$/i.test(name);
    const emailValid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
  // Reglas contraseña:
  // - 6 a 64 caracteres
  // - Sin espacios
  // - Solo letras, números y símbolos permitidos
  // - Debe contener al menos una letra y un número
  // - Rechaza cualquier '<', '>', comillas o la palabra "script"
  const disallowed = /[<>"'`]/;
  const basicSet = /^[A-Za-z0-9!@#$%^&*()_+\-={}[\]:;,.?~]{6,64}$/; // limitar set
  const hasLetter = /[A-Za-z]/.test(pass);
  const hasDigit = /\d/.test(pass);
  const passwordValid = !/\s/.test(pass) && basicSet.test(pass) && hasLetter && hasDigit && !disallowed.test(pass) && !/script/i.test(pass);

    if (!nameValid) {
      validateField($('#reg-name'), 'Nombre inválido (solo letras y espacios, mínimo 3).');
      return;
    }
    if (!emailValid) {
      validateField($('#reg-email'), 'Correo inválido.');
      return;
    }
    if (!passwordValid) {
      validateField($('#reg-password'), 'Contraseña inválida. Debe tener 6-64 caracteres, al menos 1 letra y 1 número, sin espacios ni caracteres especiales.');
      return;
    }
    validateField($('#reg-name'));
    validateField($('#reg-email'));
    validateField($('#reg-password'));
    validateField($('#reg-password2'));
    if (pass !== pass2) { validateField($('#reg-password2'), 'Las contraseñas no coinciden.'); return; }
    const users = getLS(LS_KEYS.USERS, []);
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      $('#register-msg').textContent = 'Ya existe una cuenta con este correo.';
      return;
    }
    users.push({ name, email, password: pass });
    setLS(LS_KEYS.USERS, users);
    setLS(LS_KEYS.SESSION, { name, email });
    refreshAuthMenu();
    const target = localStorage.getItem('pf_redirect_after_login');
    if (window.Swal?.fire) {
      Swal.fire({
        title: 'Cuenta creada',
        text: 'Sesión iniciada correctamente',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#14141c',
        color: '#f5f5f8'
      }).then(() => {
        if (target) { localStorage.removeItem('pf_redirect_after_login'); location.replace(target); }
        else location.replace(ROOT_INDEX);
      });
    } else {
      if (target) { localStorage.removeItem('pf_redirect_after_login'); location.replace(target); }
      else location.replace(ROOT_INDEX);
    }
    return;
  });
}

function handleContact() {
  const form = $('#form-contact');
  attachLiveValidation(form);
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#c-name');
    const email = $('#c-email');
    const subject = $('#c-subject');
    const message = $('#c-message');
    const allOk = [name, email, subject, message].every(i => validateField(i));
    if (!allOk) { alertQuick('Completa los campos requeridos', '', 'warning', 1700); return; }
    const list = getLS(LS_KEYS.CONTACTS, []);
    list.push({ name: name.value.trim(), email: email.value.trim(), subject: subject.value.trim(), message: message.value.trim(), date: new Date().toISOString() });
    setLS(LS_KEYS.CONTACTS, list);
    $('#contact-msg').textContent = '';
    form.reset();
    alertQuick('Mensaje enviado', 'Nos comunicaremos contigo pronto!', 'success', 1900);
  });
}

function handleCatalog() {
  const data = window.PERFULANDIA_DATA?.products || [];
  const grid = $('#product-grid');
  if (!grid) return;

  const search = $('#search');
  const brandSel = $('#brand');
  const price = $('#price');
  const priceOut = $('#price-out');
  const brands = Array.from(new Set(data.map(p => p.brand))).sort();
  brands.forEach(b => brandSel.append(new Option(b, b)));

  function buildImgTag(src, alt) {
    const fallback = window.PERFULANDIA_DATA.fallback;
    return `<div class="product-media"><img src="${src}" alt="${alt}" onerror="this.onerror=null;this.src='${fallback}';"></div>`;
  }

  function render(list) {
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<p class="muted">No hay resultados.</p>'; return; }
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        ${buildImgTag(p.img, p.name)}
        <div class="pad">
          <h3>${p.name}</h3>
          <p class="muted">${p.brand} · ${p.category}</p>
          <div class="product-meta">
            <span class="price">${money(p.price)}</span>
            <div class="product-actions">
              <button class="btn btn-ghost" data-detail="${p.id}" data-tip="Ver detalle">
                <span class="icon" aria-hidden="true"><i class="fa-solid fa-eye"></i></span>
                <span class="label">Detalle</span>
              </button>
              <button class="btn btn-add" data-add="${p.id}" data-tip="Agregar al carrito">
                <span class="icon" aria-hidden="true"><i class="fa-solid fa-cart-plus"></i></span>
                <span class="label">Agregar</span>
              </button>
            </div>
          </div>
        </div>`;
      grid.append(card);
    });
  }

  function applyFilters() {
    const q = (search.value || '').toLowerCase();
    const b = brandSel.value;
    const max = Number(price.value);
    const list = data.filter(p =>
      (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
      (!b || p.brand === b) &&
      (p.price <= max)
    );
    render(list);
  }

  search?.addEventListener('input', applyFilters);
  brandSel?.addEventListener('change', applyFilters);
  price?.addEventListener('input', () => { priceOut.textContent = money(Number(price.value)); applyFilters(); });
  priceOut.textContent = money(Number(price.value));
  render(data);

  const modal = $('#product-modal');
  $('#modal-close')?.addEventListener('click', () => modal.close());
  grid.addEventListener('click', e => {
    const d = e.target.closest('[data-detail]');
    const a = e.target.closest('[data-add]');
    if (d) {
      const p = data.find(x => x.id === Number(d.dataset.detail));
      if (!p) return;
      $('#m-img').src = p.img; $('#m-img').alt = p.name;
      $('#m-name').textContent = p.name;
      $('#m-desc').textContent = p.desc;
      $('#m-price').textContent = money(p.price);
      $('#m-add').dataset.id = p.id;
      modal.showModal();
    }
    if (a) { addToCart(Number(a.dataset.add), a); }
  });
  $('#m-add')?.addEventListener('click', e => { addToCart(Number(e.target.dataset.id), e.target); $('#product-modal').close(); });
}

function getCart() { return getLS(LS_KEYS.CART, []); }
function saveCart(items) { setLS(LS_KEYS.CART, items); updateCartBadge(); }
function addToCart(id, triggerBtn) {
  const data = window.PERFULANDIA_DATA.products;
  const p = data.find(x => x.id === id); if (!p) return;
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty += 1; else cart.push({ id, name: p.name, price: p.price, img: p.img, qty: 1 });
  saveCart(cart);
  if (triggerBtn) { alertQuick('Agregado', p.name, 'success', 1500); }
  const badge = document.querySelector('#cart-count');
  if (badge) {
    badge.classList.add('pulse');
    setTimeout(() => badge.classList.remove('pulse'), 500);
  }
  if (triggerBtn) {
    const original = triggerBtn.querySelector('.label')?.textContent || triggerBtn.textContent;
    const labelEl = triggerBtn.querySelector('.label');
    if (labelEl) labelEl.textContent = 'Agregado';
    triggerBtn.classList.add('added');
    setTimeout(() => {
      if (labelEl) labelEl.textContent = original;
      triggerBtn.classList.remove('added');
    }, 1100);
  }
}

function handleCartPage() {
  const list = $('#cart-list');
  if (!list) return;

  function render() {
    const cart = getCart();
    const empty = $('#cart-empty');
    const totalEl = $('#cart-total');
    const subEl = $('#cart-subtotal');
    const shipEl = null;
    list.innerHTML = '';
    if (cart.length === 0) {
      empty.style.display = 'block';
      if (totalEl) totalEl.textContent = money(0);
      if (subEl) subEl.textContent = money(0);
      if (shipEl) shipEl.textContent = money(0);
      return;
    }
    empty.style.display = 'none';
    let subtotal = 0;
    cart.forEach((it, idx) => {
      subtotal += it.price * it.qty;
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.dataset.index = idx;
      li.innerHTML = `
        <img src="${it.img}" alt="${it.name}" onerror="this.onerror=null;this.src='${window.PERFULANDIA_DATA.fallback}';">
        <div>
          <strong>${it.name}</strong>
          <div class="muted">${money(it.price)} c/u</div>
        </div>
        <div class="qty"><input type="number" min="1" value="${it.qty}" data-qty="${idx}"></div>
        <div class="price-wrap">
          <span class="line-price">${money(it.price * it.qty)}</span>
          <button class="cart-remove" data-remove="${idx}" aria-label="Eliminar ${it.name}">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      `;
      list.append(li);
    });
    const total = subtotal;
    if (subEl) subEl.textContent = money(subtotal);
    if (totalEl) totalEl.textContent = money(total);
  }

  list.addEventListener('input', e => {
    const q = e.target.closest('[data-qty]');
    if (q) {
      const idx = Number(q.dataset.qty);
      const cart = getCart();
      const val = Math.max(1, Number(e.target.value || 1));
      cart[idx].qty = val;
      saveCart(cart);
      render();
    }
  });
  list.addEventListener('click', e => {
    const r = e.target.closest('[data-remove]');
    if (r) {
      const idx = Number(r.dataset.remove);
      const li = list.querySelector(`li.cart-item[data-index="${idx}"]`);
      if (!li) return;
      li.classList.add('removing');
      setTimeout(() => {
        const cart = getCart();
        const removed = cart.splice(idx, 1)[0];
        saveCart(cart);
        render();
        if (removed) alertQuick('Producto eliminado', removed.name, 'info', 1600);
      }, 300);
    }
  });

  $('#checkout')?.addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) { $('#checkout-msg').textContent = 'Tu carrito esta vacio.'; return; }
    $('#checkout-form-section').classList.remove('hidden');
    $('#checkout-form-section').setAttribute('aria-hidden', 'false');
    document.getElementById('checkout-form-section').scrollIntoView({ behavior: 'smooth' });
  });

  const cardNumInput = $('#card-number');
  cardNumInput?.addEventListener('input', e => {
    let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 19);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = val;
  });
  const expInput = $('#card-exp');
  expInput?.addEventListener('input', e => {
    let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    else if (v.length >= 1 && Number(v[0]) > 1) v = '0' + v[0];
    e.target.value = v;
  });

  const ck = $('#checkout-form');
  attachLiveValidation(ck);
  ck?.addEventListener('submit', e => {
    e.preventDefault();
    const submitBtn = $('#order-submit');
    const setLoading = (on) => { if (!submitBtn) return; submitBtn.classList.toggle('loading', on); submitBtn.disabled = on; };
    if (submitBtn?.classList.contains('loading')) return;
    const name = $('#ship-name'), address = $('#ship-address'), city = $('#ship-city'), phone = $('#ship-phone'), email = $('#ship-email');
    const card = $('#card-number'), exp = $('#card-exp'), cvv = $('#card-cvv'), cardname = $('#card-name');
    const all = [name, address, city, phone, email, card, exp, cvv, cardname];
    const ok = all.every(i => validateField(i));
    if (!ok) { setLoading(false); alertQuick('Revisa el formulario', 'Hay campos inválidos', 'warning', 1600); return; }
    setLoading(true);
    const cardNum = card.value.replace(/\s+/g, '');
    if (!/^[0-9]{13,19}$/.test(cardNum)) { validateField(card, 'Numero de tarjeta invalido.'); setLoading(false); alertQuick('Tarjeta inválida', 'Revisa número ingresado', 'error', 1800); return; }
    const expVal = exp.value.trim();
    if (!/^\d{2}\/\d{2}$/.test(expVal)) { validateField(exp, 'Formato MM/AA.'); setLoading(false); alertQuick('Fecha inválida', 'Usa formato MM/AA', 'error', 1800); return; }
    const [mm, yy] = expVal.split('/').map(n => parseInt(n, 10));
    if (mm < 1 || mm > 12) { validateField(exp, 'Mes invalido.'); setLoading(false); alertQuick('Mes inválido', 'Debe ser 01-12', 'error', 1800); return; }
    const fullYear = 2000 + yy;
    const now = new Date();
    const expDate = new Date(fullYear, mm);
    if (expDate <= now) { validateField(exp, 'Tarjeta expirada.'); setLoading(false); alertQuick('Tarjeta expirada', 'Intenta con otra tarjeta', 'error', 2000); return; }
    if (!/^[0-9]{3,4}$/.test(cvv.value)) { validateField(cvv, 'CVV invalido.'); setLoading(false); alertQuick('CVV inválido', 'Revisa el código', 'error', 1800); return; }

    const cart = getCart();
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const orders = getLS(LS_KEYS.ORDERS, []);
    const masked = '**** **** **** ' + cardNum.slice(-4);
    const order = {
      id: Date.now(),
      items: cart,
      total,
      date: new Date().toISOString(),
      customer: {
        name: name.value.trim(),
        address: address.value.trim(),
        city: city.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim()
      },
      payment: {
        method: 'card',
        card_masked: masked,
        card_name: cardname.value.trim()
      }
    };
    orders.push(order);
    setLS(LS_KEYS.ORDERS, orders);
    setLS(LS_KEYS.CART, []);
    updateCartBadge();
    setTimeout(() => {
      setLoading(false);
      if (window.Swal?.fire) {
        const main = document.querySelector('main');
        let prevMinHeight = '';
        if (main) {
          prevMinHeight = main.style.minHeight;
          const h = main.getBoundingClientRect().height;
          if (h) main.style.minHeight = h + 'px';
        }
        Swal.fire({
          title: 'Pedido confirmado',
          html: '<p style="margin:.4rem 0 0;font-size:.9rem;line-height:1.4">Numero de orden:<br><strong>' + order.id + '</strong></p>',
          icon: 'success',
          confirmButtonText: 'Cerrar',
          background: '#14141c',
          color: '#f5f5f8',
          confirmButtonColor: '#7d46ff',
          showClass: { popup: 'swal2-show' },
          hideClass: { popup: 'swal2-hide' },
          heightAuto: false,
          scrollbarPadding: false,
          willClose: () => { if (main) main.style.minHeight = prevMinHeight; }
        });
      }
    }, 600);
    ck.reset();
    document.getElementById('checkout-form-section').classList.add('hidden');
    document.getElementById('checkout-form-section').setAttribute('aria-hidden', 'true');
    render();
  });

  render();
}

function initAuthDropdown() {
  const menu = document.getElementById('auth-menu');
  if (!menu) return;
  const toggle = document.getElementById('auth-toggle');
  const dropdown = menu.querySelector('.auth-dropdown');
  const close = () => { menu.classList.remove('open'); toggle?.setAttribute('aria-expanded', 'false'); };
  toggle?.addEventListener('click', e => {
    e.preventDefault();
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', e => { if (!menu.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  toggle?.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); menu.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); dropdown?.querySelector('a')?.focus(); } });
}

function refreshAuthMenu() {
  const menu = document.getElementById('auth-menu');
  if (!menu) return;
  const toggle = document.getElementById('auth-toggle');
  const session = getSession();
  const dropdown = menu.querySelector('.auth-dropdown');
  if (!dropdown || !toggle) return;
  if (session) {
    const first = (session.name || session.email || 'Cuenta').split(' ')[0];
    toggle.innerHTML = `<i class="fa-solid fa-user"></i><span>${first}</span><i class="fa-solid fa-chevron-down" style="font-size:.6rem; opacity:.6;"></i>`;
    dropdown.innerHTML = `
      <div class="user-row"><i class="fa-solid fa-circle-user"></i><span>${session.name || session.email}</span></div>
      <a href="#" class="logout" data-logout role="menuitem"><i class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesión</span></a>`;
  } else {
  // If we are already inside /assets/pages/ use relative links without prefix; otherwise point into assets/pages/
  const rootPrefix = location.pathname.includes('/assets/pages/') ? '' : 'assets/pages/';
    toggle.innerHTML = `<i class="fa-solid fa-user"></i><span>Acceder</span><i class=\"fa-solid fa-chevron-down\" style=\"font-size:.6rem; opacity:.6;\"></i>`;
    dropdown.innerHTML = `
      <a href="${rootPrefix}login.html" role="menuitem"><i class="fa-solid fa-user"></i><span>Iniciar sesión</span></a>
      <a href="${rootPrefix}register.html" role="menuitem"><i class="fa-regular fa-id-card"></i><span>Crear cuenta</span></a>`;
  }
}

function attachLogoutHandler() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-logout]');
    if (!btn) return;
    e.preventDefault();
    localStorage.removeItem(LS_KEYS.SESSION);
    refreshAuthMenu();
    const current = location.pathname.split('/').pop();
    const doRedirect = () => { if (PROTECTED_PAGES.includes(current)) location.replace('login.html'); };
    if (window.Swal?.fire) {
      Swal.fire({
        title: 'Sesión cerrada',
        icon: 'success',
        timer: 1300,
        showConfirmButton: false,
        background: '#14141c',
        color: '#f5f5f8'
      }).then(doRedirect);
    } else { doRedirect(); }
  });
}

function swalAvailable() { return !!window.Swal?.fire; }
function notify(opts) {
  if (!swalAvailable()) return;
  Swal.fire(Object.assign({
    background: '#14141c', color: '#f5f5f8', confirmButtonColor: '#7d46ff'
  }, opts));
}
function alertQuick(title, text = '', icon = 'info', timer = 1700) {
  if (!swalAvailable()) return;
  Swal.fire({
    title,
    text,
    icon,
    timer,
    showConfirmButton: false,
    background: '#14141c',
    color: '#f5f5f8',
    didOpen: popup => {
      popup.addEventListener('mouseenter', () => Swal.stopTimer());
      popup.addEventListener('mouseleave', () => Swal.resumeTimer());
    }
  });
}

function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;
  const close = () => { document.body.classList.remove('nav-open'); toggle.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = !document.body.classList.contains('nav-open');
    if (open) { document.body.classList.add('nav-open'); toggle.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); }
    else { close(); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) close(); });
  document.addEventListener('click', e => { if (window.innerWidth <= 900) { if (!nav.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) close(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

document.addEventListener('DOMContentLoaded', () => {
  setYear();
  updateCartBadge();
  handleAuth();
  handleContact();
  handleCatalog();
  handleCartPage();
  initAuthDropdown();
  enforceProtectedPages();
  interceptProtectedLinks();
  refreshAuthMenu();
  attachLogoutHandler();
  initMobileNav();
});
