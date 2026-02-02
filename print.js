const Print = {
    settings: {
        showLogo: true,
        showCNIC: false
    },

    printInvoice: function (orderId) {
        const order = App.state.orders.find(o => o.id === orderId);
        if (!order) {
            alert("Order not found!");
            return;
        }

        const printArea = document.getElementById('print-area');
        printArea.innerHTML = ''; // Clear previous

        // Create Grid Container
        const grid = document.createElement('div');
        grid.className = 'invoice-grid';

        // Generate 4 Copies (e.g., Office, Customer, Courier, Return or just 4 copies)
        const labels = ['Office Copy', 'Customer Copy', 'Courier Copy', 'Accounts Copy'];

        for (let i = 0; i < 4; i++) {
            const slip = document.createElement('div');
            slip.className = 'invoice-slip';
            slip.innerHTML = this.generateSlipHTML(order, labels[i]);
            grid.appendChild(slip);
        }

        printArea.appendChild(grid);

        // Trigger Print
        setTimeout(() => {
            window.print();
        }, 500); // Small delay to ensure rendering
    },

    generateSlipHTML: function (order, label) {
        const logoHtml = this.settings.showLogo ?
            `<div class="mb-2 fw-bold text-primary"><i class="fas fa-box"></i> OMS Delivery</div>` : '';

        return `
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
                ${logoHtml}
                <div class="fw-bold small">${label}</div>
            </div>
            
            <div class="row g-1 mb-2">
                <div class="col-6">
                    <span class="text-muted small">Order ID:</span>
                    <div class="fw-bold">#${order.id}</div> 
                </div>
                <div class="col-6 text-end">
                    <span class="text-muted small">Date:</span>
                    <div class="fw-bold">${order.date}</div>
                </div>
            </div>

            <div class="mb-2">
                <span class="text-muted small">Customer:</span>
                <div class="fw-bold">${order.customer}</div>
                <div>${order.mobile}</div>
                <div class="small">${order.address}</div>
            </div>

            <div class="mb-2 border-top border-bottom py-2">
                <div class="d-flex justify-content-between">
                    <span>${order.product}</span>
                    <span class="fw-bold">x${order.qty}</span>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-auto">
                <div>
                     <span class="badge bg-light text-dark border">COD</span>
                </div>
                <div class="text-end">
                    <span class="text-muted small">Total Amount:</span>
                    <div class="fs-5 fw-bold">Rs. ${order.price}</div>
                </div>
            </div>
            
            <div class="text-center mt-2 small text-muted">
                ${order.courier} | Thanks for shopping!
            </div>
        `;
    }
};

// Global hook
function printInvoice(id) {
    Print.printInvoice(id);
}
