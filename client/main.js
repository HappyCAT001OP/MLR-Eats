// MLR-Eats SPA main.js
// Basic SPA router and view rendering for login, register, menu, orders, wallet, subscriptions, reviews, admin

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
    const res = await fetch('/api/auth/user', { credentials: 'include' });
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
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
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
    const res = await fetch('/api/auth/login', {
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
    const res = await fetch('/api/auth/register', {
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
    const res = await fetch('/api/food');
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
    const res = await fetch('/api/order', {
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
    const res = await fetch('/api/order', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch orders');
    state.orders = await res.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderOrders() {
  if (!state.user) return goto('login');
  if (!state.orders.length) loadOrders();
  app.innerHTML += `<div class="card"><h2>Your Orders</h2><div id="orders-list"></div></div>`;
  const ordersList = document.getElementById('orders-list');
  if (ordersList) {
    if (!state.orders.length) {
      ordersList.innerHTML = '<div>No orders yet.</div>';
      return;
    }
    state.orders.forEach(order => {
      ordersList.innerHTML += `
        <div class="order-item">
          <div><b>Order #${order.id}</b> | Status: ${order.status}</div>
          <div>Items: ${order.items?.map(i => `FoodID ${i.foodId} x${i.quantity}`).join(', ')}</div>
          <div>Total: ₹${order.total}</div>
          <div>Placed: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</div>
        </div>`;
    });
  }
}

// --- Wallet View ---
async function loadWallet() {
  setLoading(true);
  try {
    const res = await fetch('/api/wallet/balance', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch wallet balance');
    const data = await res.json();
    state.wallet = data.balance;
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderWallet() {
  if (!state.user) return goto('login');
  if (!state.wallet && state.wallet !== 0) loadWallet();
  app.innerHTML += `<div class="card"><h2>Wallet</h2>
    <div id="wallet-balance">Balance: ₹${state.wallet ?? ''}</div>
    <form id="add-wallet-form" onsubmit="event.preventDefault(); addWalletFunds();">
      <input id="wallet-amount" type="number" min="1" placeholder="Add Amount" required />
      <button type="submit">Add Funds</button>
    </form>
  </div>`;
}

window.addWalletFunds = addWalletFunds;

async function addWalletFunds() {
  const amount = parseInt(document.getElementById('wallet-amount').value, 10);
  if (!amount) return;
  setLoading(true);
  try {
    const res = await fetch('/api/wallet/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
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
    const [plansRes, myRes] = await Promise.all([
      fetch('/api/subscription/plans', { credentials: 'include' }),
      fetch('/api/subscription/my', { credentials: 'include' })
    ]);
    if (!plansRes.ok || !myRes.ok) throw new Error('Failed to fetch subscriptions');
    state.plans = await plansRes.json();
    state.subscriptions = await myRes.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderSubscriptions() {
  if (!state.user) return goto('login');
  if (!state.plans.length || !state.subscriptions.length) loadSubscriptions();
  app.innerHTML += `<div class="card"><h2>Subscriptions</h2><div id="subs-list"></div></div>`;
  const subsList = document.getElementById('subs-list');
  if (subsList) {
    subsList.innerHTML = '<h3>Available Plans</h3>';
    state.plans.forEach(plan => {
      subsList.innerHTML += `
        <div class="sub-plan">
          <b>${plan.name}</b>: ₹${plan.price} for ${plan.duration} days (${plan.mealsPerDay} meals/day)
          <button onclick="subscribePlan(${plan.id})">Subscribe</button>
        </div>`;
    });
    subsList.innerHTML += '<h3>Your Subscriptions</h3>';
    if (!state.subscriptions.length) {
      subsList.innerHTML += '<div>No active subscriptions.</div>';
    } else {
      state.subscriptions.forEach(sub => {
        subsList.innerHTML += `
          <div class="user-sub">
            <b>Plan:</b> ${sub.planId} | <b>Active:</b> ${sub.isActive ? 'Yes' : 'No'}
            <button onclick="cancelSubscription(${sub.id})">Cancel</button>
          </div>`;
      });
    }
  }
}

window.subscribePlan = subscribePlan;
window.cancelSubscription = cancelSubscription;

async function subscribePlan(planId) {
  setLoading(true);
  try {
    const res = await fetch('/api/subscription/subscribe', {
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
    const res = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subId }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Cancel failed');
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
    // Always fetch food items for the dropdown
    const foodRes = await fetch('/api/food');
    if (!foodRes.ok) throw new Error('Failed to fetch food list');
    state.foodItems = await foodRes.json();
    // Default to first food item if none selected
    if (!state.selectedFoodId && state.foodItems.length > 0) {
      state.selectedFoodId = state.foodItems[0].id;
    }
    await loadReviews(state.selectedFoodId);
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

async function loadReviews(foodId) {
  setLoading(true);
  try {
    const res = await fetch(`/api/review/food/${foodId}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    state.reviews = await res.json();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

function renderReviews() {
  if (!state.user) return goto('login');
  if (!state.foodItems.length || !state.selectedFoodId) {
    loadFoodAndReviews();
    return;
  }
  app.innerHTML += `<div class="card"><h2>Reviews</h2>
    <label for="food-select">Select Food:</label>
    <select id="food-select" onchange="selectFoodForReview()">
      ${state.foodItems.map(f => `<option value="${f.id}" ${f.id===state.selectedFoodId?'selected':''}>${f.name}</option>`).join('')}
    </select>
    <div id="reviews-list"></div>
    <form id="add-review-form" onsubmit="event.preventDefault(); addReview();">
      <input id="review-rating" type="number" min="1" max="5" placeholder="Rating (1-5)" required />
      <input id="review-comment" type="text" placeholder="Comment" required />
      <button type="submit">Add Review</button>
    </form>
  </div>`;
  const reviewsList = document.getElementById('reviews-list');
  if (reviewsList) {
    if (!state.reviews.length) {
      reviewsList.innerHTML = '<div>No reviews yet.</div>';
    } else {
      state.reviews.forEach(r => {
        reviewsList.innerHTML += `<div class="review-item"><b>${r.rating}/5</b> - ${r.comment}</div>`;
      });
    }
  }
}

window.selectFoodForReview = function() {
  const select = document.getElementById('food-select');
  state.selectedFoodId = parseInt(select.value, 10);
  loadReviews(state.selectedFoodId);
  render();
};

window.addReview = addReview;

async function addReview() {
  const rating = parseInt(document.getElementById('review-rating').value, 10);
  const comment = document.getElementById('review-comment').value;
  const foodItemId = state.selectedFoodId;
  setLoading(true);
  try {
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodItemId, rating, comment }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to add review');
    await loadReviews(foodItemId);
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
}

// --- Admin Panel: Manage Users, Food, Orders, Plans, Reviews ---
async function loadAdminData() {
  setLoading(true);
  try {
    const [usersRes, foodRes, ordersRes, plansRes, reviewsRes] = await Promise.all([
      fetch('/api/admin/users', { credentials: 'include' }),
      fetch('/api/admin/food', { credentials: 'include' }),
      fetch('/api/admin/orders', { credentials: 'include' }),
      fetch('/api/admin/subscriptions', { credentials: 'include' }),
      fetch('/api/admin/reviews', { credentials: 'include' })
    ]);
    if (![usersRes, foodRes, ordersRes, plansRes, reviewsRes].every(r => r.ok)) throw new Error('Failed to fetch admin data');
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

// --- Admin CRUD Actions ---
window.deleteFood = async function(foodId) {
  if (!confirm('Delete this food item?')) return;
  setLoading(true);
  try {
    const res = await fetch(`/api/food/${foodId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete food');
    await loadAdminData();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
};

window.deleteUser = async function(userId) {
  if (!confirm('Delete this user?')) return;
  setLoading(true);
  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete user');
    await loadAdminData();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
};

window.deleteOrder = async function(orderId) {
  if (!confirm('Delete this order?')) return;
  setLoading(true);
  try {
    const res = await fetch(`/api/order/${orderId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete order');
    await loadAdminData();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
};

window.deleteReview = async function(reviewId) {
  if (!confirm('Delete this review?')) return;
  setLoading(true);
  try {
    const res = await fetch(`/api/review/${reviewId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete review');
    await loadAdminData();
    setLoading(false);
  } catch (e) {
    setLoading(false, e.message);
  }
};

function renderAdmin() {
  if (!state.admin) return goto('menu');
  if (!state.adminUsers || !state.adminFood || !state.adminOrders || !state.adminPlans || !state.adminReviews) {
    loadAdminData();
    return;
  }
  app.innerHTML += `<div class="card"><h2>Admin Panel</h2>
    <h3>Users</h3>
    <div>${state.adminUsers.map(u => `<div>${u.name} (${u.email}) ${u.isAdmin ? '[Admin]' : ''} <button onclick="deleteUser(${u.id})">Delete</button></div>`).join('')}</div>
    <h3>Food Items</h3>
    <div>${state.adminFood.map(f => `<div>${f.name} - ₹${f.price} <button onclick="deleteFood(${f.id})">Delete</button></div>`).join('')}</div>
    <h3>Orders</h3>
    <div>${state.adminOrders.map(o => `<div>#${o.id}: ${o.status} - ₹${o.total} <button onclick="deleteOrder(${o.id})">Delete</button></div>`).join('')}</div>
    <h3>Plans</h3>
    <div>${state.adminPlans.map(p => `<div>${p.name} - ₹${p.price}</div>`).join('')}</div>
    <h3>Reviews</h3>
    <div>${state.adminReviews.map(r => `<div>${r.rating}/5 - ${r.comment} <button onclick="deleteReview(${r.id})">Delete</button></div>`).join('')}</div>
  </div>`;
}

// --- Initial load ---
fetchSession().then(() => render());

// --- Views (to be implemented below) ---
function renderLogin() {
  app.innerHTML += `<div class="card"><h2>Login</h2>
    <form onsubmit="event.preventDefault(); loginUser();">
      <input id="login-email" type="email" placeholder="Email" required />
      <input id="login-password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
      <div>or <a href="#" onclick="goto('register')">Register</a></div>
    </form></div>`;
}

function renderRegister() {
  app.innerHTML += `<div class="card"><h2>Register</h2>
    <form onsubmit="event.preventDefault(); registerUser();">
      <input id="reg-name" type="text" placeholder="Name" required />
      <input id="reg-email" type="email" placeholder="Email (@mlrit.ac.in)" required />
      <input id="reg-password" type="password" placeholder="Password" required />
      <button type="submit">Register</button>
      <div>or <a href="#" onclick="goto('login')">Login</a></div>
    </form></div>`;
}

// Fallback: Always render something even if JS fails or fetches fail
function renderFallback() {
  app.innerHTML = `<div class="card"><h2>MLR-Eats</h2><div>Welcome! If you see this, the app failed to load dynamic content.<br>Check your backend/API server and browser console for errors.<br>You can still see the static UI and CSS.</div></div>`;
}

// Patch render to always fallback if nothing is shown
const origRender = render;
render = function() {
  try {
    origRender();
    // If nothing rendered, show fallback
    if (!app.innerHTML || app.innerHTML.trim() === '') {
      renderFallback();
    }
  } catch (e) {
    renderFallback();
  }
};
