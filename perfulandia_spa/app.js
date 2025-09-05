const LS_KEYS = {
  USERS: 'pf_users',
  SESSION: 'pf_session',
  CART: 'pf_cart',
  CONTACTS: 'pf_contacts',
  ORDERS: 'pf_orders'
};

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const money = n => n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
const getLS = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function updateCartBadge(){
  const count = getLS(LS_KEYS.CART, []).reduce((acc, it)=> acc + it.qty, 0);
  $$('#cart-count').forEach(el => el.textContent = count);
}
function setYear(){ const y = new Date().getFullYear(); $$('#year').forEach(el => el.textContent = y); }

function validateField(input, msg){
  const err = document.querySelector(`[data-error-for="${input.id}"]`);
  let text = '';
  if(input.validity.valueMissing) text = 'Este campo es obligatorio.';
  else if(input.type === 'email' && input.validity.typeMismatch) text = 'Ingresa un correo valido.';
  else if(input.minLength && input.value.length < input.minLength) text = `Minimo ${input.minLength} caracteres.`;
  if(msg) text = msg;
  if(err) err.textContent = text;
  input.classList.toggle('invalid', !!text);
  return !text;
}
function attachLiveValidation(form){
  form && form.addEventListener('input', e => {
    if(e.target.matches('input,textarea,select')) validateField(e.target);
  });
}

function handleAuth(){
  const login = $('#form-login');
  const register = $('#form-register');
  const tabs = $$('.tab');

  function switchTab(name){
    tabs.forEach(t=> t.classList.toggle('active', t.dataset.tab===name));
    login?.classList.toggle('hidden', name!=='login');
    register?.classList.toggle('hidden', name!=='register');
  }
  tabs.forEach(btn=> btn.addEventListener('click', ()=> switchTab(btn.dataset.tab)));
  $$('.link[data-switch]').forEach(btn=> btn.addEventListener('click', ()=> switchTab(btn.dataset.switch)));
  $('#open-login')?.addEventListener('click', ()=> {

    switchTab('login');
    const rect = document.querySelector('#form-login').getBoundingClientRect();
    if(rect.top < 0 || rect.top > window.innerHeight) document.querySelector('#form-login').scrollIntoView({behavior:'smooth'});
  });

  attachLiveValidation(login);
  attachLiveValidation(register);

  login?.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const pass = $('#login-password').value;
    validateField($('#login-email'));
    validateField($('#login-password'));
    const users = getLS(LS_KEYS.USERS, []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const msg = $('#login-msg');
    if(!user || user.password !== pass){
      msg.textContent = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      return;
    }
    setLS(LS_KEYS.SESSION, { email: user.email, name: user.name });
    msg.textContent = `¡Hola, ${user.name}! Sesion iniciada. Ya puedes obtener descuentos.`;
  });

  register?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#reg-name').value.trim();
    const email = $('#reg-email').value.trim();
    const pass = $('#reg-password').value;
    const pass2 = $('#reg-password2').value;
    validateField($('#reg-name'));
    validateField($('#reg-email'));
    validateField($('#reg-password'));
    validateField($('#reg-password2'));
    if(pass !== pass2){ validateField($('#reg-password2'), 'Las contraseñas no coinciden.'); return; }
    const users = getLS(LS_KEYS.USERS, []);
    if(users.some(u => u.email.toLowerCase() === email.toLowerCase())){
      $('#register-msg').textContent = 'Ya existe una cuenta con este correo.';
      return;
    }
    users.push({ name, email, password: pass });
    setLS(LS_KEYS.USERS, users);
    setLS(LS_KEYS.SESSION, { name, email });
    $('#register-msg').textContent = 'Registro exitoso. Sesion iniciada.';
    ['reg-name','reg-email','reg-password','reg-password2'].forEach(id => $('#'+id).value = '');
  });
}

function handleContact(){
  const form = $('#form-contact');
  attachLiveValidation(form);
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#c-name');
    const email = $('#c-email');
    const subject = $('#c-subject');
    const message = $('#c-message');
    const allOk = [name,email,subject,message].every(i => validateField(i));
    if(!allOk) return;
    const list = getLS(LS_KEYS.CONTACTS, []);
    list.push({ name: name.value.trim(), email: email.value.trim(), subject: subject.value.trim(), message: message.value.trim(), date: new Date().toISOString() });
    setLS(LS_KEYS.CONTACTS, list);
    $('#contact-msg').textContent = 'Mensaje enviado correctamente al administrador (simulado).';
    form.reset();
  });
}

function handleCatalog(){
  const data = window.PERFULANDIA_DATA?.products || [];
  const grid = $('#product-grid');
  if(!grid) return;

  const search = $('#search');
  const brandSel = $('#brand');
  const price = $('#price');
  const priceOut = $('#price-out');
  const brands = Array.from(new Set(data.map(p => p.brand))).sort();
  brands.forEach(b => brandSel.append(new Option(b, b)));

  function buildImgTag(src, alt){
    const fallback = window.PERFULANDIA_DATA.fallback;
    return `<img src="${src}" alt="${alt}" onerror="this.onerror=null;this.src='${fallback}';">`;
  }

  function render(list){
    grid.innerHTML = '';
    if(!list.length){ grid.innerHTML = '<p class="muted">No hay resultados.</p>'; return; }
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
            <div>
              <button class="btn btn-ghost" data-detail="${p.id}">Detalle</button>
              <button class="btn" data-add="${p.id}">Agregar</button>
            </div>
          </div>
        </div>`;
      grid.append(card);
    });
  }

  function applyFilters(){
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
  $('#modal-close')?.addEventListener('click', ()=> modal.close());
  grid.addEventListener('click', e => {
    const d = e.target.closest('[data-detail]');
    const a = e.target.closest('[data-add]');
    if(d){
      const p = data.find(x => x.id === Number(d.dataset.detail));
      if(!p) return;
      $('#m-img').src = p.img; $('#m-img').alt = p.name;
      $('#m-name').textContent = p.name;
      $('#m-desc').textContent = p.desc;
      $('#m-price').textContent = money(p.price);
      $('#m-add').dataset.id = p.id;
      modal.showModal();
    }
    if(a){ addToCart(Number(a.dataset.add)); }
  });
  $('#m-add')?.addEventListener('click', e => { addToCart(Number(e.target.dataset.id)); $('#product-modal').close(); });
}

function getCart(){ return getLS(LS_KEYS.CART, []); }
function saveCart(items){ setLS(LS_KEYS.CART, items); updateCartBadge(); }
function addToCart(id){
  const data = window.PERFULANDIA_DATA.products;
  const p = data.find(x => x.id === id); if(!p) return;
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if(item) item.qty += 1;
  else cart.push({ id, name: p.name, price: p.price, img: p.img, qty: 1 });
  saveCart(cart);
}

function handleCartPage(){
  const list = $('#cart-list');
  if(!list) return;

  function render(){
    const cart = getCart();
    const empty = $('#cart-empty');
    const totalEl = $('#cart-total');
    list.innerHTML = '';
    if(cart.length === 0){
      empty.style.display = 'block';
      totalEl.textContent = money(0);
      return;
    }
    empty.style.display = 'none';
    let total = 0;
    cart.forEach((it, idx) => {
      total += it.price * it.qty;
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <img src="${it.img}" alt="${it.name}" onerror="this.onerror=null;this.src='${window.PERFULANDIA_DATA.fallback}';">
        <div>
          <strong>${it.name}</strong>
          <div class="muted">${money(it.price)} c/u</div>
        </div>
        <div class="qty"><input type="number" min="1" value="${it.qty}" data-qty="${idx}"></div>
        <div>${money(it.price * it.qty)}</div>
        <button class="btn btn-ghost" data-remove="${idx}">Eliminar</button>
      `;
      list.append(li);
    });
    totalEl.textContent = money(total);
  }

  list.addEventListener('input', e => {
    const q = e.target.closest('[data-qty]');
    if(q){
      const idx = Number(q.dataset.qty);
      const cart = getCart();
      const val = Math.max(1, Number(e.target.value||1));
      cart[idx].qty = val;
      saveCart(cart);
      render();
    }
  });
  list.addEventListener('click', e => {
    const r = e.target.closest('[data-remove]');
    if(r){
      const idx = Number(r.dataset.remove);
      const cart = getCart();
      cart.splice(idx,1);
      saveCart(cart);
      render();
    }
  });

  $('#checkout')?.addEventListener('click', () => {
    const cart = getCart();
    if(cart.length === 0){ $('#checkout-msg').textContent = 'Tu carrito esta vacio.'; return; }
    $('#checkout-form-section').classList.remove('hidden');
    $('#checkout-form-section').setAttribute('aria-hidden','false');
    document.getElementById('checkout-form-section').scrollIntoView({behavior:'smooth'});
  });

  const ck = $('#checkout-form');
  attachLiveValidation(ck);
  ck?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#ship-name'), address = $('#ship-address'), city = $('#ship-city'), phone = $('#ship-phone'), email = $('#ship-email');
    const card = $('#card-number'), exp = $('#card-exp'), cvv = $('#card-cvv'), cardname = $('#card-name');
    const all = [name,address,city,phone,email,card,exp,cvv,cardname];
    const ok = all.every(i => validateField(i));
    if(!ok) return;
    const cardNum = card.value.replace(/\s+/g,'');
    if(!/^[0-9]{13,19}$/.test(cardNum)){ validateField(card, 'Numero de tarjeta invalido.'); return; }
    if(!/^[0-9]{2}\/[0-9]{2}$/.test(exp)){ validateField(exp, 'Formato MM/AA.'); return; }
    if(!/^[0-9]{3,4}$/.test(cvv.value)){ validateField(cvv, 'CVV invalido.'); return; }

    const cart = getCart();
    const total = cart.reduce((s,i)=> s + i.price*i.qty, 0);
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
    $('#checkout-msg').textContent = 'Pago procesado. Pedido confirmado. Numero de orden: ' + order.id;
    ck.reset();
    document.getElementById('checkout-form-section').classList.add('hidden');
    document.getElementById('checkout-form-section').setAttribute('aria-hidden','true');
    render();
  });

  render();
}

document.addEventListener('DOMContentLoaded', () => {
  setYear();
  updateCartBadge();
  handleAuth();
  handleContact();
  handleCatalog();
  handleCartPage();
});
