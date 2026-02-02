const Products = {
    // Data Management
    getAll: function () {
        const saved = localStorage.getItem('oms_products');
        return saved ? JSON.parse(saved) : [];
    },

    saveAll: function (products) {
        localStorage.setItem('oms_products', JSON.stringify(products));
    },

    add: function (name, size, price) {
        const products = this.getAll();
        const newProduct = {
            id: Date.now(),
            name: name,
            size: size || '-',
            price: price
        };
        products.push(newProduct);
        this.saveAll(products);
        this.render();
        App.setupBookingForm(); // Refresh dropdown
    },

    delete: function (id) {
        if (!confirm("Are you sure you want to delete this product?")) return;
        let products = this.getAll();
        products = products.filter(p => p.id !== id);
        this.saveAll(products);
        this.render();
        App.setupBookingForm(); // Refresh dropdown
    },

    // UI Rendering
    render: function () {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) {
            console.warn("Products Table Body not found");
            return;
        }

        tbody.innerHTML = '';
        const products = this.getAll();

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No products found. Add one above.</td></tr>';
            return;
        }

        products.forEach((p, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${p.size}</td>
                <td>Rs. ${p.price}</td>
                <td>
                     <button class="btn btn-sm btn-outline-danger" onclick="Products.delete(${p.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    init: function () {
        // Setup Event Listeners for the Product Form
        if (!this.initialized) {
            const form = document.getElementById('addProductForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const name = document.getElementById('newProductName').value;
                    const size = document.getElementById('newProductSize').value;
                    const price = document.getElementById('newProductPrice').value;
                    this.add(name, size, price);
                    form.reset();
                });
            }
            this.initialized = true;
        }
        this.render();
    }
};
