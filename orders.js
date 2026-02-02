const Orders = {
    render: function () {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) {
            console.error("Critical Error: 'ordersTableBody' element not found in DOM.");
            return;
        }
        tbody.innerHTML = '';

        const orders = App.state.orders;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');

            // Build Status Options
            let statusOptions = '';
            for (const key in STATUSES) {
                const statusValue = STATUSES[key];
                const selected = order.status === statusValue ? 'selected' : '';
                statusOptions += `<option value="${statusValue}" ${selected}>${statusValue}</option>`;
            }

            tr.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.date}</td>
                <td>
                    <div class="fw-bold">${order.customer || '-'}</div>
                    <small class="text-muted">${order.mobile || '-'}</small>
                </td>
                <td>${CONFIG.CURRENCY} ${order.price}</td>
                <td>${order.courier}</td>
                <td>
                    <select class="form-select form-select-sm" onchange="Orders.updateStatus(${order.id}, this.value)">
                        ${statusOptions}
                    </select>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="Orders.editOrder(${order.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="printInvoice(${order.id})" title="Print">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    updateStatus: function (id, newStatus) {
        // Delegate to App controller to handle API sync
        App.updateOrderStatus(id, newStatus);
    },

    editOrder: function (id) {
        alert("Edit functionality for Order #" + id + " would open a modal here.");
    }
};
