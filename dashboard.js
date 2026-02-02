const Dashboard = {
    statusChart: null,
    courierChart: null,

    render: function (ordersData) {
        // Use argument or fallback to App state
        const orders = ordersData || App.state.orders;
        if (!orders || orders.length === 0) return;

        this.updateKPIs(orders);
        this.renderCharts(orders);
    },

    updateKPIs: function (orders) {
        const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

        let todayCount = 0;
        let pendingCount = 0; // Calculated but not used in display logic below? Used via 'statusCounts'?
        // Wait, the original code used 'statusCounts' array/object? 
        // Line 61: statusCounts[STATUSES.BOOKED]...
        // 'statusCounts' is NOT defined here either! It's defined in renderCharts.
        // The logic for counts is mixed up.

        let deliveredCount = 0;
        let returnedCount = 0;

        let codAmount = 0;
        let deliveredAmount = 0;
        let pendingAmount = 0;
        let returnedAmount = 0;

        // Re-calculate Status Counts properly for KPI
        // We can't rely on 'statusCounts' variable from 'renderCharts' scope.
        // We need local counters.
        let countBooked = 0;
        let countOut = 0;
        let countOffice = 0;
        let countDelivered = 0;
        let countReturn = 0;
        let countReadyReturn = 0;

        orders.forEach(order => {
            // Check Date
            if (order.date === today || order.date.startsWith(today)) {
                todayCount++;
            }

            // Financials
            const amt = order.price;
            codAmount += amt;

            // Status Logic & Amounts
            if (order.status === STATUSES.BOOKED) countBooked++;
            if (order.status === STATUSES.OUT_FOR_DELIVERY) countOut++;
            if (order.status === STATUSES.DELIVERY_OFFICE) countOffice++;
            if (order.status === STATUSES.DELIVERED) countDelivered++;
            if (order.status === STATUSES.RETURN) countReturn++;
            if (order.status === STATUSES.READY_FOR_RETURN) countReadyReturn++;

            // Amount Aggregation
            if (order.status === STATUSES.DELIVERED) {
                deliveredAmount += amt;
            } else if (order.status === STATUSES.BOOKED ||
                order.status === STATUSES.OUT_FOR_DELIVERY ||
                order.status === STATUSES.DELIVERY_OFFICE) {
                pendingAmount += amt;
            } else if (order.status === STATUSES.RETURN ||
                order.status === STATUSES.READY_FOR_RETURN) {
                returnedAmount += amt;
            }
        });

        // Update DOM
        this.setSafeText('kpi-today', todayCount);

        // Pending = Booked + Out + Office
        const totalPending = countBooked + countOut + countOffice;
        this.setSafeText('kpi-pending', totalPending);

        this.setSafeText('kpi-delivered', countDelivered);

        // Returned = Return + Ready
        const totalReturned = countReturn + countReadyReturn;
        this.setSafeText('kpi-returned', totalReturned);

        this.setSafeText('kpi-cod-amount', codAmount.toLocaleString());
        this.setSafeText('kpi-delivered-amount', deliveredAmount.toLocaleString());
        this.setSafeText('kpi-pending-amount', pendingAmount.toLocaleString());
        this.setSafeText('kpi-returned-amount', returnedAmount.toLocaleString());

        // Expense & Profit
        const totalExpenses = Expenses.getTotal();
        const netProfit = deliveredAmount - totalExpenses;

        this.setSafeText('kpi-expenses', totalExpenses.toLocaleString());
        this.setSafeText('kpi-profit', netProfit.toLocaleString());

        // Color Logic for Profit
        const profitContainer = document.getElementById('kpi-profit-container');
        if (profitContainer) {
            if (netProfit >= 0) {
                profitContainer.className = "stat-value text-success";
            } else {
                profitContainer.className = "stat-value text-danger";
            }
        }
    },

    setSafeText: function (id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    },

    renderCharts: function (orders) {
        // Prepare Data for Status Chart
        const statusCounts = {};
        orders.forEach(o => {
            statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });

        const statusLabels = Object.keys(statusCounts);
        const statusValues = Object.values(statusCounts);
        // Map colors based on label
        const statusColors = statusLabels.map(label => STATUS_COLORS[label] || '#cbd5e1');

        // Prepare Data for Courier Chart
        const courierCounts = {};
        orders.forEach(o => {
            const c = o.courier || "Unknown";
            courierCounts[c] = (courierCounts[c] || 0) + 1;
        });

        // Destroy old charts if exist
        if (this.statusChart) this.statusChart.destroy();
        if (this.courierChart) this.courierChart.destroy();

        // 1. Status Chart (Doughnut)
        // Resize container for "Small Circle" effect
        const ctxStatusContainer = document.getElementById('statusChart').parentElement;
        if (ctxStatusContainer) {
            ctxStatusContainer.style.height = '250px';
            ctxStatusContainer.style.display = 'flex';
            ctxStatusContainer.style.justifyContent = 'center';
        }

        const ctxStatus = document.getElementById('statusChart').getContext('2d');
        this.statusChart = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusValues,
                    backgroundColor: statusColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%', // Thinner ring
                plugins: {
                    legend: {
                        position: 'right',
                        align: 'center', // Center vertically
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });

        // 2. Courier Chart (Bar)
        const ctxCourier = document.getElementById('courierChart').getContext('2d');

        // Define a vibrant palette for bars
        const courierPalette = [
            '#4f46e5', // Indigo
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#8b5cf6', // Violet
            '#ec4899', // Pink
            '#06b6d4', // Cyan
            '#f97316'  // Orange
        ];

        this.courierChart = new Chart(ctxCourier, {
            type: 'bar',
            data: {
                labels: Object.keys(courierCounts),
                datasets: [{
                    label: 'Orders',
                    data: Object.values(courierCounts),
                    backgroundColor: Object.keys(courierCounts).map((_, i) => courierPalette[i % courierPalette.length]),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: {
                        display: false // Hide legend as colors vary
                    }
                }
            }
        });
    }
};
