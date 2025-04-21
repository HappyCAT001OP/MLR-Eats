
// MLR-Eats SPA main.js
// Basic SPA router and view rendering for login, register, menu, orders, wallet, subscriptions, reviews, admin

import './style.css';

const API_BASE = import.meta.env.VITE_API_URL;

const app = document.getElementById('app');

const state = {
  user: null,
  view: 'menu', // default view
  foodItems: [],
  orders: [],
  wallet: 0,
  subscriptions: [],
  reviews: [],
  admin: false,
  plans: [],
  loading: false,
  error: null,
  selectedFoodId: null, // New property to store selected food item ID for reviews
  adminUsers: [],
  adminFood: [],
  adminOrders: [],
  adminPlans: [],
  adminReviews: [],
};

async function fetchSession() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/user`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      state.user = data.user;
      state.admin = !!data.user?.isAdmin;
    } else {
      state.user = null;
      state.admin = false;
    }
  } catch {
    state.user = null;
    state.admin = false;
  }
}

function setLoading(loading, error = null) {
  state.loading = loading;
  state.error = error;
  render();
}

function render() {
  app.innerHTML = '';
  renderNav();
  if (state.loading) {
    app.innerHTML += '<div>Loading...</div>';
    return;
  }
  if (state.error) {
    app.innerHTML += `<div style="color:red;">${state.error}</div>`;
  }
  let prevLen = app.innerHTML.length;
  switch (state.view) {
    case 'login': renderLogin(); break;
    case 'register': renderRegister(); break;
    case 'menu': renderMenu(); break;
    case 'orders': renderOrders(); break;
    case 'wallet': renderWallet(); break;
    case 'subscriptions': renderSubscriptions(); break;
    case 'reviews': renderReviews(); break;
    case 'admin': renderAdmin(); break;
    default: renderMenu(); break;
  }
  if (app.innerHTML.length === prevLen) {
    renderFallback();
  }
}

function renderNav() {
  const nav = document.createElement('nav');
  nav.innerHTML = `
    <button onclick="goto('menu')">Menu</button>
    <button onclick="goto('orders')">Orders</button>
    <button onclick="goto('wallet')">Wallet</button>
    <button onclick="goto('subscriptions')">Subscriptions</button>
    <button onclick="goto('reviews')">Reviews</button>
    ${state.admin ? '<button onclick="goto(\'admin\')">Admin</button>' : ''}
    ${state.user ? '<button onclick="logout()">Logout</button>' : '<button onclick="goto(\'login\')">Login</button>'}
  `;
  app.appendChild(nav);
}

function goto(view) {
  state.view = view;
  render();
}

function logout() {
  fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    .then(() => {
      state.user = null;
      state.admin = false;
      goto('login');
    });
}

window.goto = goto;
window.logout = logout;

// --- Auth Actions ---
async function loginUser() {
  setLoading(true);
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Login failed');
    await fetchSession();
    goto('menu');
  } catch (e) {
    setLoading(false, e.message);
  }
}

async function registerUser() {
  setLoading(true);
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Registration failed');
    await fetchSession();
    goto('menu');
  } catch (e) {
    setLoading(false, e.message);
  }
}

// --- Menu View ---
async function loadMenu() {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/food`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    state.foodItems = await res.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderMenu() {
  if (!state.foodItems.length) loadMenu();
  app.innerHTML += `<div class="card"><h2>Menu</h2><div id="menu-list"></div></div>`;
  const menuList = document.getElementById('menu-list');
  if (menuList) {
    state.foodItems.forEach(item => {
      menuList.innerHTML += `
        <div class="food-item">
          <div><b>${item.name}</b> (${item.category})</div>
          <div>${item.description}</div>
          <div>₹${item.price}</div>
          <button onclick="orderFood(${item.id})">Order</button>
        </div>`;
    });
  }
}

window.orderFood = orderFood;

async function orderFood(foodId) {
  if (!state.user) return goto('login');
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ foodId, quantity: 1 }] }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Order failed');
    setLoading(false);
    alert('Order placed!');
    goto('orders');
  } catch (e) {
    setLoading(false, e.message);
  }
}

// --- Orders View ---
async function loadOrders() {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/order`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch orders');
    state.orders = await res.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderOrders() {
  if (!state.orders.length) loadOrders();
  app.innerHTML += `<div class="card"><h2>Orders</h2><div id="orders-list"></div></div>`;
  const ordersList = document.getElementById('orders-list');
  if (ordersList) {
    state.orders.forEach(order => {
      ordersList.innerHTML += `
        <div class="order-item">
          <div>Order ID: ${order.id}</div>
          <div>Status: ${order.status}</div>
          <div>Items: ${order.items.map(i => i.foodName + ' x' + i.quantity).join(', ')}</div>
        </div>`;
    });
  }
}

// --- Wallet View ---
async function loadWallet() {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/wallet`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch wallet');
    state.wallet = await res.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderWallet() {
  if (state.wallet === 0) loadWallet();
  app.innerHTML += `<div class="card"><h2>Wallet</h2><div id="wallet-balance">Balance: ₹${state.wallet}</div><button onclick="addWalletFunds()">Add Funds</button></div>`;
}

window.addWalletFunds = addWalletFunds;

async function addWalletFunds() {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100 }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to add funds');
    await loadWallet();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

// --- Subscriptions View ---
async function loadSubscriptions() {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/subscription`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    state.subscriptions = await res.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderSubscriptions() {
  if (!state.subscriptions.length) loadSubscriptions();
  app.innerHTML += `<div class="card"><h2>Subscriptions</h2><div id="subs-list"></div></div>`;
  const subsList = document.getElementById('subs-list');
  if (subsList) {
    state.subscriptions.forEach(sub => {
      subsList.innerHTML += `
        <div class="sub-item">
          <div>Plan: ${sub.planName}</div>
          <div>Status: ${sub.status}</div>
          <button onclick="cancelSubscription(${sub.id})">Cancel</button>
        </div>`;
    });
  }
}

window.subscribePlan = subscribePlan;
window.cancelSubscription = cancelSubscription;

async function subscribePlan(planId) {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Subscription failed');
    await loadSubscriptions();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

async function cancelSubscription(subId) {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/subscription/${subId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to cancel subscription');
    await loadSubscriptions();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

// --- Enhanced Reviews View: Select Food Item ---
async function loadFoodAndReviews() {
  setLoading(true);
  try {
    const foodRes = await fetch(`${API_BASE}/api/food`);
    const reviewRes = await fetch(`${API_BASE}/api/review`);
    if (!foodRes.ok || !reviewRes.ok) throw new Error('Failed to fetch reviews');
    state.foodItems = await foodRes.json();
    state.reviews = await reviewRes.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

async function loadReviews(foodId) {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/review/${foodId}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    state.reviews = await res.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderReviews() {
  if (!state.foodItems.length) loadFoodAndReviews();
  app.innerHTML += `<div class="card"><h2>Reviews</h2><div id="reviews-list"></div></div>`;
  const reviewsList = document.getElementById('reviews-list');
  if (reviewsList) {
    state.reviews.forEach(review => {
      reviewsList.innerHTML += `
        <div class="review-item">
          <div><b>${review.userName}</b> rated <b>${review.foodName}</b>: ${review.rating}/5</div>
          <div>${review.comment}</div>
        </div>`;
    });
  }
}

window.addReview = addReview;

async function addReview() {
  const foodId = state.selectedFoodId;
  const rating = parseInt(document.getElementById('review-rating').value);
  const comment = document.getElementById('review-comment').value;
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodId, rating, comment }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to add review');
    await loadReviews(foodId);
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

// --- Admin Panel: Manage Users, Food, Orders, Plans, Reviews ---
async function loadAdminData() {
  setLoading(true);
  try {
    const usersRes = await fetch(`${API_BASE}/api/admin/users`, { credentials: 'include' });
    const foodRes = await fetch(`${API_BASE}/api/admin/food`, { credentials: 'include' });
    const ordersRes = await fetch(`${API_BASE}/api/admin/orders`, { credentials: 'include' });
    const plansRes = await fetch(`${API_BASE}/api/admin/plans`, { credentials: 'include' });
    const reviewsRes = await fetch(`${API_BASE}/api/admin/reviews`, { credentials: 'include' });
    if (!usersRes.ok || !foodRes.ok || !ordersRes.ok || !plansRes.ok || !reviewsRes.ok) throw new Error('Failed to fetch admin data');
    state.adminUsers = await usersRes.json();
    state.adminFood = await foodRes.json();
    state.adminOrders = await ordersRes.json();
    state.adminPlans = await plansRes.json();
    state.adminReviews = await reviewsRes.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

async function deleteFood(foodId) {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/admin/food/${foodId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete food');
    await loadAdminData();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

async function deleteUser(userId) {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete user');
    await loadAdminData();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

async function deleteOrder(orderId) {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete order');
    await loadAdminData();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

async function deleteReview(reviewId) {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete review');
    await loadAdminData();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderAdmin() {
  if (!state.adminUsers.length) loadAdminData();
  app.innerHTML += `<div class="card"><h2>Admin Panel</h2><div id="admin-panel"></div></div>`;
  // ... rest of renderAdmin ...
}

// --- Views (implement minimal versions so something always renders) ---
function renderLogin() {
  app.innerHTML += `
    <div class="card">
      <h2>Login</h2>
      <input id="login-email" type="email" placeholder="Email" /><br/>
      <input id="login-password" type="password" placeholder="Password" /><br/>
      <button onclick="loginUser()">Login</button>
      <button onclick="goto('register')">Register</button>
    </div>
  `;
}

function renderRegister() {
  app.innerHTML += `
    <div class="card">
      <h2>Register</h2>
      <input id="reg-name" type="text" placeholder="Name" /><br/>
      <input id="reg-email" type="email" placeholder="Email" /><br/>
      <input id="reg-password" type="password" placeholder="Password" /><br/>
      <button onclick="registerUser()">Register</button>
      <button onclick="goto('login')">Login</button>
    </div>
  `;
}

function renderFallback() {
  app.innerHTML += `<div>Something went wrong. Please try again later.</div>`;
}

// --- Initial load ---
fetchSession().then(() => render());
