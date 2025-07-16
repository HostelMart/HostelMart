// Updated hostelmart.js with proper import from firebaseConfig.js
import { auth, db } from './firebaseConfig.js';

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Utility Functions
export function show(el) {
    el.classList.remove('hidden');
}

export function hide(el) {
    el.classList.add('hidden');
}

export function onlyDigits(input) {
    return input.replace(/\D/g, '');
}

// [Original hostelmart.js code continues here without removing any feature.]
// Please paste your original code from line 37 onwards, and ensure that all logic remains intact.
// Since the only update needed was to refactor Firebase initialization, that's already done above.

// Utility Functions
export function show(el) { 
    el.classList.remove('hidden'); 
}

export function hide(el) { 
    el.classList.add('hidden'); 
}

export function onlyDigits(input) {
    return input.replace(/\D/g, '');
}

// Authentication Functions
export function handleAuthState() {
    const authButton = document.getElementById('authButton');
    if (!authButton) return;
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            authButton.innerHTML = '<i class="fas fa-user"></i> Profile';
            authButton.onclick = () => window.location.href = 'profile.html';
        } else {
            authButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            authButton.onclick = () => window.location.href = 'login.html';
        }
    });
}

// User Profile Functions
export function saveUserProfile(user) {
    localStorage.setItem('hm_user', JSON.stringify(user));
    addDoc(collection(db, "users"), user);
}

export function getCurrentUser() {
    return JSON.parse(localStorage.getItem('hm_user'));
}

export function loadUserProfile() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userPhone').textContent = user.phone;
        document.getElementById('userRoom').textContent = user.room;
    }
    
    loadOrderHistory(user.email);
}

export async function loadOrderHistory(userEmail) {
    const container = document.getElementById('orderHistory');
    if (!container) return;
    
    container.innerHTML = '';
    
    try {
        const ordersQuery = query(
            collection(db, "orders"),
            where("user.email", "==", userEmail),
            orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(ordersQuery);
        querySnapshot.forEach(doc => {
            const order = doc.data();
            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-header">
                    <div>
                        <h3>Order #${doc.id}</h3>
                        <p>${new Date(order.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span class="order-status status-${order.status.replace(/\s+/g, '-')}">
                        ${order.status}
                    </span>
                </div>
                <p><strong>Items:</strong> ${Object.values(order.items).map(item => `${item.name} x${item.quantity}`).join(', ')}</p>
                <p><strong>Total:</strong> ₹${order.total}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading orders: ", error);
    }
}

// Cart Management
export function getCart() {
    return JSON.parse(localStorage.getItem('hm_cart') || '{}');
}

export function saveCart(cart) {
    localStorage.setItem('hm_cart', JSON.stringify(cart));
}

export function updateCartCount() {
    const cart = getCart();
    const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cartCount').forEach(el => {
        el.textContent = count;
    });
}

export function addToCart(id, name, price) {
    const cart = getCart();
    
    if (!cart[id]) {
        cart[id] = { name, price, quantity: 1 };
    } else {
        cart[id].quantity += 1;
    }
    
    saveCart(cart);
    updateCartCount();
    
    // Button feedback
    const button = document.querySelector(`[data-id="${id}"]`);
    if (button) {
        button.textContent = 'Added!';
        button.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.style.backgroundColor = '';
        }, 1500);
    }
}

export function updateCartDisplay() {
    const cart = getCart();
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cartItems || !emptyCart || !cartSummary) return;
    
    if (Object.keys(cart).length === 0) {
        show(emptyCart);
        hide(cartItems);
        hide(cartSummary);
        return;
    }
    
    hide(emptyCart);
    show(cartItems);
    show(cartSummary);
    
    cartItems.innerHTML = '';
    let subtotal = 0;
    
    Object.entries(cart).forEach(([id, item]) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>₹${item.price} x ${item.quantity}</p>
            </div>
            <div class="cart-item-actions">
                <input type="number" min="1" value="${item.quantity}" 
                    onchange="window.updateQuantity('${id}', this.value)">
                <div class="remove-btn" onclick="window.removeItem('${id}')">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    document.getElementById('subTotal').textContent = `₹${subtotal}`;
    document.getElementById('grandTotal').textContent = `₹${subtotal}`;
}

export function setupCartHandlers() {
    const codBtn = document.getElementById('codBtn');
    const upiBtn = document.getElementById('upiBtn');
    const paidBtn = document.getElementById('paidBtn');
    
    if (codBtn) codBtn.addEventListener('click', () => placeOrder('COD'));
    if (upiBtn) upiBtn.addEventListener('click', () => {
        document.getElementById('qrModal').style.display = 'flex';
    });
    if (paidBtn) paidBtn.addEventListener('click', () => placeOrder('UPI'));
}

export async function placeOrder(method) {
    const user = getCurrentUser();
    if (!user) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }
    
    const cart = getCart();
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    const total = Object.values(cart).reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
    );
    
    try {
        await addDoc(collection(db, "orders"), {
            user,
            items: cart,
            total,
            method,
            status: 'pending',
            timestamp: new Date()
        });
        
        localStorage.removeItem('hm_cart');
        alert(`Order placed successfully via ${method}!`);
        window.location.href = 'profile.html';
    } catch (error) {
        console.error("Error placing order: ", error);
        alert('Failed to place order');
    }
}

// Product Management
export async function loadProducts(containerId, category = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    let productsQuery = collection(db, "products");
    
    if (category) {
        productsQuery = query(productsQuery, where("category", "==", category));
    }
    
    try {
        const querySnapshot = await getDocs(productsQuery);
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Product+Image'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="price">₹${product.price}</div>
                    <div class="stock">${product.stock} left</div>
                    <button data-id="${doc.id}" onclick="window.addToCart('${doc.id}','${product.name}',${product.price})">
                        Add to Cart
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading products: ", error);
    }
}

export function setupProductSearch(inputId) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const term = this.value.toLowerCase();
        document.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = name.includes(term) ? '' : 'none';
        });
    });
}

// Admin Functions
export function setupAdminLogin() {
    const loginForm = document.getElementById('adminLoginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('adminPanel').classList.remove('hidden');
            loadAdminProducts();
            loadAdminOrders();
        } catch (error) {
            alert('Invalid credentials');
        }
    });
}

export function setupCafeToggle() {
    const cafeToggle = document.getElementById('cafeToggle');
    if (!cafeToggle) return;
    
    cafeToggle.addEventListener('change', (e) => {
        document.getElementById('cafeStatus').textContent = e.target.checked ? 'Open' : 'Closed';
    });
}

export async function loadAdminProducts() {
    const container = document.getElementById('prodList');
    if (!container) return;
    
    container.innerHTML = '';
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const item = document.createElement('div');
            item.className = 'card p-4 mb-2';
            item.innerHTML = `
                <h3>${product.name}</h3>
                <p>Price: ₹${product.price}</p>
                <p>Stock: ${product.stock}</p>
                <p>Category: ${product.category}</p>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading products: ", error);
    }
}

export async function loadAdminOrders() {
    const container = document.getElementById('orderList');
    if (!container) return;
    
    container.innerHTML = '';
    
    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        querySnapshot.forEach(doc => {
            const order = doc.data();
            const item = document.createElement('div');
            item.className = 'card p-4 mb-2';
            item.innerHTML = `
                <h3>Order #${doc.id}</h3>
                <p><strong>${order.user.name}</strong> (Room ${order.user.room})</p>
                <p>Total: ₹${order.total}</p>
                <select onchange="window.updateOrderStatus('${doc.id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="out for delivery" ${order.status === 'out for delivery' ? 'selected' : ''}>Out for Delivery</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading orders: ", error);
    }
}

export function setupAddProductForm() {
    const addProductForm = document.getElementById('addProductForm');
    if (!addProductForm) return;
    
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            await addDoc(collection(db, "products"), {
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock')),
                category: formData.get('category'),
                image: formData.get('image'),
                description: formData.get('description')
            });
            alert('Product added successfully!');
            e.target.reset();
            loadAdminProducts();
        } catch (error) {
            console.error("Error adding product: ", error);
            alert('Failed to add product');
        }
    });
}

export async function updateOrderStatus(orderId, status) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status });
        alert(`Order status updated to ${status}`);
        loadAdminOrders();
    } catch (error) {
        console.error("Error updating order: ", error);
    }
}

export function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const otpSection = document.getElementById('otpSection');
  const otpInputs = [...document.querySelectorAll('.otp-input')];
  const verifyBtn = document.getElementById('verifyBtn');
  
  if (!form || !otpSection || !otpInputs || !verifyBtn) return;
  
  // Phone validation
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
      phoneInput.addEventListener('input', function() {
          this.value = onlyDigits(this.value).slice(0,10);
      });
  }

  // Room validation
  const roomInput = document.getElementById('room');
  if (roomInput) {
      roomInput.addEventListener('input', function() {
          this.value = onlyDigits(this.value);
      });
  }

  // Form submission
  form.addEventListener('submit', function(e) {
      e.preventDefault();
      otpSection.classList.remove('hidden');
  });

  // OTP verification
  verifyBtn.addEventListener('click', () => {
      const code = otpInputs.map(input => input.value).join('');
      if (code.length === 6) {
          const user = {
              name: form.name.value.trim(),
              phone: form.phone.value.trim(),
              room: form.room.value.trim(),
              email: form.email.value.trim()
          };

          localStorage.setItem('hm_user', JSON.stringify(user));

          addDoc(collection(db, "users"), user)
              .then(() => {
                  window.location.href = 'index.html';
              })
              .catch(error => {
                  console.error("Error saving user: ", error);
                  alert('Failed to create account');
              });
      } else {
          alert('Please enter a valid 6-digit OTP');
      }
  });

  // OTP input navigation
  otpInputs.forEach((input, index) => {
      input.addEventListener('input', () => {
          if (input.value && index < 5) {
              otpInputs[index + 1].focus();
          }
      });

      input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !input.value && index > 0) {
              otpInputs[index - 1].focus();
          }
      });
  });
}



// Global Functions for HTML Event Handlers
window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
window.placeOrder = placeOrder;
window.loadUserProfile = loadUserProfile;
window.updateOrderStatus = updateOrderStatus;
window.updateQuantity = (productId, quantity) => {
    const cart = getCart();
    if (cart[productId]) {
        cart[productId].quantity = parseInt(quantity) || 1;
        saveCart(cart);
        updateCartDisplay();
        updateCartCount();
    }
};
window.removeItem = (productId) => {
    const cart = getCart();
    delete cart[productId];
    saveCart(cart);
    updateCartDisplay();
    updateCartCount();
};


