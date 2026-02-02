const App = {
    state: {
        orders: [],
        isLoading: false
    },

    init: async function () {
        if (this.initialized) return;
        this.initialized = true;

        // DEBUG: Signal Ready
        const stat = document.getElementById('sys-status');
        if (stat) {
            stat.style.background = 'green';
            stat.innerText = "System Status: Online & Ready";
            setTimeout(() => stat.style.display = 'none', 3000);
        }

        console.log("Auth Init...");
        // Initialize Auth Module (Login/Register)
        Auth.init();

        // Check if already logged in
        this.checkAuth();
    },

    checkAuth: function () {
        const isAuth = sessionStorage.getItem('oms_auth');
        if (isAuth) {
            this.showApp();
        } else {
            // Show Login (default state)
        }
    },

    logout: function () {
        if (confirm("Are you sure you want to logout?")) {
            sessionStorage.clear(); // Clear all session data
            localStorage.clear();   // Clear all local data (orders, products, etc)
            window.location.reload();
        }
    },

    showApp: async function () {
        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('app-container').classList.remove('d-none');

        // Load Settings (Apply Theme)
        Settings.applyTheme();

        // Setup Dark Mode Toggle
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                Settings.toggleDarkMode();
            });
        }

        // Setup Mobile Sidebar Toggle
        const toggleBtn = document.getElementById('sidebarToggle');
        const overlay = document.getElementById('sidebarOverlay');
        const sidebar = document.querySelector('.sidebar');

        if (toggleBtn && sidebar && overlay) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.add('active');
                overlay.classList.add('active');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }

        // Setup Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        this.setupNavigation();
        this.setupBookingForm();
        await this.loadData();
    },

    setupNavigation: function () {
        const links = document.querySelectorAll('.nav-link[data-target]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Active State
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Hide all sections
                document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));

                // Show Target
                const targetId = link.getAttribute('data-target');
                document.getElementById(targetId).classList.remove('d-none');

                // Render Section
                this.showSection(targetId);
            });
        });
    },

    showSection: function (targetId) {
        if (targetId === 'dashboard') {
            Dashboard.render(this.data);
        } else if (targetId === 'orders') {
            Orders.render(this.data);
        } else if (targetId === 'products') {
            Products.init();
        } else if (targetId === 'expenses') {
            Expenses.init();
        } else if (targetId === 'reports') {
            Reports.render(this.data);
        } else if (targetId === 'settings') {
            Settings.init();
        }
    },

    loadData: async function () {
        this.setLoading(true);

        let isDataLoaded = false;

        // 1. Load Cache Immediately
        const cachedData = localStorage.getItem('oms_orders_cache');
        if (cachedData) {
            try {
                const data = JSON.parse(cachedData);
                console.log("Loaded from cache");
                this.renderAll(data);
                isDataLoaded = true;
            } catch (e) {
                console.error("Cache parse error", e);
            }
        }

        try {
            const res = await API.getOrders();

            if (res.error) {
                console.error("API Returned Logical Error:", res.error);
                throw new Error(res.error);
            }

            // Normalize Data
            const rawData = res.data || [];

            console.log("Raw API Data:", rawData); // DEBUG LOG

            // TEMPORARY DIAGNOSTIC: Removed
            // if (rawData.length > 0) {
            //     alert("COLUMN NAMES FOUND:\n" + Object.keys(rawData[0]).join(", "));
            // }

            // Process Data with Robust Key Matching
            const orders = rawData.map((rawItem, index) => {
                // 1. Create a "Clean" item where all keys are lowercase & trimmed
                const item = {};
                Object.keys(rawItem).forEach(k => {
                    item[k.toString().trim().toLowerCase()] = rawItem[k];
                });

                // Helper to find value by multiple possible keys
                const val = (keys) => {
                    for (const k of keys) {
                        const cleanKey = k.toLowerCase();
                        if (item[cleanKey] !== undefined) return item[cleanKey];
                    }
                    return undefined;
                };

                return {
                    id: index + 1,
                    // Date: Handle ISO or Simple Date
                    date: val(['Date', 'date']) ? new Date(val(['Date', 'date'])).toLocaleDateString('en-GB') : '-',

                    customer: val(['Customer', 'customer', 'Name', 'name', 'Customer Name', 'customer name']),

                    // Added mostly used keys: 'mobile no', 'contact', 'contact no'
                    mobile: val(['Mobile', 'mobile', 'Mobile No', 'mobile no', 'Mobile No.', 'Phone', 'phone', 'Phone Number', 'phone number', 'Cell', 'cell', 'Contact', 'contact']),

                    address: val(['Address', 'address', 'Shipping Address', 'shipping address']),

                    product: val(['Product', 'product', 'Item', 'item', 'Article', 'article']),

                    // Qty: clean '1 pc' etc
                    qty: parseInt(val(['Qty', 'qty', 'Quantity', 'quantity'])) || 1,

                    // Price: clean 'Rs. 100' etc
                    price: parseFloat((val(['Price', 'price', 'Amount', 'amount', 'Cash', 'cash', 'COD Amount', 'cod amount']) || '0').toString().replace(/[^0-9.]/g, '')) || 0,

                    courier: val(['Courier', 'courier', 'Service', 'service', 'Courier Service', 'courier service']),

                    trackingNo: val(['Tracking No', 'Tracking No.', 'tracking_no', 'tracking', 'Tracking Number', 'tracking number']),

                    status: val(['Status', 'status', 'Order Status', 'order status']) || this.inferStatus(item),
                    rowIndex: index
                };
            });

            // DIAGNOSTIC: Check if we are still missing critical data
            if (orders.length > 0) {
                const first = orders[0];
                if (!first.customer || !first.price) {
                    console.error("Critical Data Missing. Available Keys:", Object.keys(rawData[0]));
                    alert("Data Mapping Error!\n\nThe app cannot find 'Customer' or 'Amount' columns.\n\nHere are the columns I FOUND in your sheet:\n" + Object.keys(rawData[0]).join(", ") + "\n\nPlease share this list with me.");
                }
            }

            // CACHE IT
            localStorage.setItem('oms_orders_cache', JSON.stringify(orders));
            isDataLoaded = true;

            this.renderAll(orders);
        } catch (error) {
            console.error("Failed to load data:", error);
            // Detailed Alert with Stack
            const stack = error.stack ? error.stack.split('\n')[1] : "No stack";
            alert("Data Load Error:\n" + error.message + "\n\nLocation: " + stack);
        } finally {
            if (!isDataLoaded) {
                // Only warn if we really have nothing
                console.warn("Could not load fresh data, and no cache available.");
            }
            this.setLoading(false);
        }
    },

    // Helper to process and render data (newly added for caching logic)
    renderAll: function (orders) {
        this.state.orders = orders;
        console.log("Orders processed:", this.state.orders.length);
        Dashboard.render();
        Orders.render(); // Ensure other modules also update
    },

    inferStatus: function (item) {
        // Fallback logic if 'Status' column is missing or empty
        // Check for tracking number existence
        const tracking = item["Tracking No"] || item["tracking_no"] || item["tracking"] || "";
        if (tracking && tracking.length > 3) return STATUSES.OUT_FOR_DELIVERY;
        return STATUSES.BOOKED;
    },

    setLoading: function (isLoading) {
        this.state.isLoading = isLoading;
        // Could add a global spinner here
        const btn = document.querySelector('#bookingForm button[type="submit"] span');
        if (btn) {
            if (isLoading) btn.classList.remove('d-none');
            else btn.classList.add('d-none');
        }
    },

    // New Function to handle Status Updates
    updateOrderStatus: async function (id, newStatus) {
        const order = this.state.orders.find(o => o.id === id);
        if (!order) return;

        // Optimistic Update
        order.status = newStatus;
        Dashboard.render(); // Re-calc KPIs

        try {
            // Use API helper 
            await API.updateStatus(id, newStatus);
            console.log("Status update sent to API for Order #" + id);
        } catch (e) {
            console.error("Failed to update status:", e);
            alert("Failed to save status to Google Sheet. Check internet.");
            // Revert on failure? 
            // For now, keep it optimistic to avoid UI jumping.
        }
    },

    onProductSelect: function (select) {
        // User requested manual amount. 
        // We do NOT update the price automatically anymore.
        // Just keeping the selection is enough.
        // const option = select.options[select.selectedIndex];
        // if (option && option.dataset.price) {
        //     select.dataset.currentPrice = option.dataset.price;
        //     this.calculateTotal(); 
        // }
    },

    calculateTotal: function () {
        // Auto-calculation disabled per user request.
        // const productSelect = document.getElementById('productSelect');
        // const price = parseFloat(productSelect?.dataset.currentPrice) || 0;
        // const qtyInput = document.querySelector('input[name="quantity"]');
        // const qty = parseInt(qtyInput?.value) || 1;
        // const total = price * qty;
        // const amountInput = document.querySelector('input[name="amount"]');
        // if (amountInput) amountInput.value = total;
    },

    setupBookingForm: function () {
        // Populate Courier 
        const select = document.getElementById('courierSelect');
        if (select) {
            select.innerHTML = '<option value="">Select Courier</option>';
            COURIERS.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.innerText = c;
                select.appendChild(opt);
            });
        }

        // Populate Resellers (from Settings)
        const resellerSelect = document.getElementById('resellerSelect');
        if (resellerSelect) {
            const saved = localStorage.getItem('oms_settings');
            let resellers = ["Easy Shopping Zone"]; // fallback
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.resellers && parsed.resellers.length > 0) resellers = parsed.resellers;
            }

            resellerSelect.innerHTML = '<option value="">Select Reseller</option>';
            resellers.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r;
                opt.innerText = r;
                resellerSelect.appendChild(opt);
            });
        }

        // Populate Products
        const productSelect = document.getElementById('productSelect');
        if (productSelect) {
            const products = Products.getAll();
            productSelect.innerHTML = '<option value="">Select Product</option>';
            products.forEach(p => {
                const opt = document.createElement('option');
                const displayName = p.size && p.size !== '-' ? `${p.name} (${p.size})` : p.name;
                opt.value = displayName;
                opt.dataset.price = p.price; // Store price
                opt.innerText = displayName;
                productSelect.appendChild(opt);
            });
        }

        // Qty Listener
        const qtyInput = document.querySelector('#bookingForm input[name="quantity"]');
        if (qtyInput) {
            qtyInput.addEventListener('input', () => this.calculateTotal());
            qtyInput.addEventListener('change', () => this.calculateTotal());
        }

        // Form Submit
        const form = document.getElementById('bookingForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const btn = form.querySelector('button[type="submit"]');
                const spinner = btn.querySelector('.spinner-border');

                // UI Loading State
                btn.disabled = true;
                if (spinner) spinner.classList.remove('d-none');

                // Collect Data
                const formData = new FormData(form);
                const phones = formData.getAll('phone[]').filter(p => p.trim() !== ''); // Clean phones

                const payload = {
                    date: new Date().toLocaleDateString('en-GB'),
                    reseller: formData.get('resellerName'),
                    customer: formData.get('customerName'),
                    // Swapped Address and Mobile to match Backend Column mismatch
                    mobile: formData.get('address'),
                    address: phones.join(', '),
                    product: formData.get('productName'),
                    qty: formData.get('quantity'),
                    price: formData.get('amount'),
                    courier: formData.get('courier'),
                    tracking: formData.get('trackingNumber')
                };

                try {
                    await API.request('addOrder', payload);
                    alert("Booking saved successfully!");

                    form.reset();
                    // Reset Dynamic Phones
                    const phoneParam = document.getElementById('phoneParam');
                    if (phoneParam) {
                        phoneParam.innerHTML = `
                             <div class="input-group">
                                <input type="tel" class="form-control" name="phone[]" placeholder="03001234567" required>
                                <button type="button" class="btn btn-outline-secondary" onclick="addPhoneField()">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>`;
                    }
                    App.loadData();
                } catch (error) {
                    console.error("Booking failed:", error);
                    alert("Failed to save booking: " + error.message);
                } finally {
                    btn.disabled = false;
                    if (spinner) spinner.classList.add('d-none');
                }
            });
        }
    }
};

// Global Helper for Phone Inputs
function addPhoneField() {
    const wrapper = document.getElementById('phoneParam');
    if (!wrapper) return;
    const div = document.createElement('div');
    div.className = 'input-group mt-2';
    div.innerHTML = `
        <input type="tel" class="form-control" name="phone[]" placeholder="Additional Number">
        <button type="button" class="btn btn-outline-danger btn-remove" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i>
        </button>
    `;
    wrapper.appendChild(div);
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
