const Dashboard = {
    statusChart: null,
    courierChart: null,
    revenueChart: null,
    weeklyChart: null,
    successChart: null,

    // Filter State
    filterStart: null,
    filterEnd: null,

    setDateRange: function (range) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 00:00:00

        let start = null;
        let end = new Date(today); // Default end is today

        if (range === 'today') {
            start = new Date(today);
        } else if (range === 'yesterday') {
            start = new Date(today);
            start.setDate(today.getDate() - 1);
            end = new Date(start);
        } else if (range === 'week') {
            // Last 7 Days
            start = new Date(today);
            start.setDate(today.getDate() - 6);
        } else if (range === 'month') {
            // This Month (1st to Today)
            start = new Date(today.getFullYear(), today.getMonth(), 1);
        } else if (range === 'all') {
            start = null;
            end = null;
        }

        // Update Inputs
        this.setDatePickerValue('filter-start-date', start);
        this.setDatePickerValue('filter-end-date', end);

        // Auto Apply
        this.applyDateFilter();
    },

    setDatePickerValue: function (id, date) {
        const el = document.getElementById(id);
        if (!el) return;
        if (date) {
            // Format YYYY-MM-DD for input type="date"
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            el.value = `${year}-${month}-${day}`;
        } else {
            el.value = '';
        }
    },

    applyDateFilter: function () {
        const startInput = document.getElementById('filter-start-date').value;
        const endInput = document.getElementById('filter-end-date').value;

        if (startInput) {
            this.filterStart = new Date(startInput);
            // new Date("YYYY-MM-DD") returns UTC 00:00. This might be off by timezone.
            // Better to use explicit construction to ensure local midnight.
            const [y, m, d] = startInput.split('-').map(Number);
            this.filterStart = new Date(y, m - 1, d);
        } else {
            this.filterStart = null;
        }

        if (endInput) {
            const [y, m, d] = endInput.split('-').map(Number);
            this.filterEnd = new Date(y, m - 1, d);
        } else {
            this.filterEnd = null;
        }

        // Re-render
        this.render();

        // Highlight Active Button (Visual Feedback)
        // (Optional: clear active states)
    },

    getFilteredOrders: function (orders) {
        if (!this.filterStart || !this.filterEnd) return orders;
        return orders.filter(o => {
            const d = parseDate(o.date);
            // Compare timestamps
            return d && d.getTime() >= this.filterStart.getTime() && d.getTime() <= this.filterEnd.getTime();
        });
    },

    render: function (ordersData) {
        // Use argument or fallback to App state
        const rawOrders = ordersData || App.state.orders;
        if (!rawOrders) return;

        // Apply Filter
        const orders = this.getFilteredOrders(rawOrders);

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

        this.setSafeText('kpi-cod-amount', this.formatCurrency(codAmount));
        this.setSafeText('kpi-delivered-amount', this.formatCurrency(deliveredAmount));
        this.setSafeText('kpi-pending-amount', this.formatCurrency(pendingAmount));
        this.setSafeText('kpi-returned-amount', this.formatCurrency(returnedAmount));

        // 5. Net Profit
        const expenses = Expenses.getTotal(this.filterStart, this.filterEnd);
        const netProfit = deliveredAmount - expenses;

        this.setSafeText('kpi-expenses', this.formatCurrency(expenses));
        this.setSafeText('kpi-profit', this.formatCurrency(netProfit));

        // Color Logic for Profit
        const profitEl = document.getElementById('kpi-profit');
        if (profitEl) {
            if (netProfit >= 0) {
                profitEl.className = "stat-value text-success";
            } else {
                profitEl.className = "stat-value text-danger";
            }
        }
    },

    setSafeText: function (id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    },

    formatCurrency: function (num) {
        return "Rs. " + (num || 0).toLocaleString();
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

        // Render New Analytics
        this.renderRevenueTrend(orders);
        this.renderWeeklyTrend(orders);
        this.renderSuccessRate(orders);
        this.renderTopCities(orders);
        this.renderRecentActivity(orders);

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
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // 2. Courier Chart (Bar)
        const ctxCourier = document.getElementById('courierChart').getContext('2d');
        const courierPalette = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    },

    renderRevenueTrend: function (orders) {
        // Group by Date, Sum Delivered Amount
        const revenueMap = {};
        orders.forEach(o => {
            if (o.status === STATUSES.DELIVERED) {
                // Use o.date (DD/MM/YYYY) directly or parse?
                // Assuming o.date is comparable string or we format it.
                // Let's use the raw date string for simplified grouping if standard.
                // Or better, parse to Date object to sort correctly.
                const d = parseDate(o.date);
                if (d) {
                    const key = d.toISOString().split('T')[0]; // YYYY-MM-DD for sorting
                    revenueMap[key] = (revenueMap[key] || 0) + o.price;
                }
            }
        });

        const sortedKeys = Object.keys(revenueMap).sort();
        const labels = sortedKeys.map(k => k); // YYYY-MM-DD
        const data = sortedKeys.map(k => revenueMap[k]);

        // Limit to last 7-14 data points if too many? Let's show all for "Trend" or last 7 days?
        // User asked for "Daily Revenue Trend". Let's show last 7 active days.
        const sliceIndex = Math.max(0, labels.length - 7);
        const finalLabels = labels.slice(sliceIndex);
        const finalData = data.slice(sliceIndex);

        const ctx = document.getElementById('revenueTrendChart').getContext('2d');
        if (this.revenueChart) this.revenueChart.destroy();

        this.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: finalLabels,
                datasets: [{
                    label: 'Revenue',
                    data: finalData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    },

    renderWeeklyTrend: function (orders) {
        // Group by Day of Week (0-6)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyCounts = new Array(7).fill(0);

        orders.forEach(o => {
            const d = parseDate(o.date);
            if (d) {
                weeklyCounts[d.getDay()]++;
            }
        });

        // Rotate so Mon is first? Standard is Sun=0. Let's keep Standard.

        const ctx = document.getElementById('weeklyTrendChart').getContext('2d');
        if (this.weeklyChart) this.weeklyChart.destroy();

        this.weeklyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Orders',
                    data: weeklyCounts,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    },

    renderSuccessRate: function (orders) {
        const total = orders.length;
        if (total === 0) return;

        let delivered = 0;
        let returned = 0; // Return + Ready for Return + Failed? "Return/Failed"
        // Let's count Delivered vs (Return + ReadyReturn)

        orders.forEach(o => {
            if (o.status === STATUSES.DELIVERED) delivered++;
            if (o.status === STATUSES.RETURN || o.status === STATUSES.READY_FOR_RETURN) returned++;
        });

        // Visualization uses a Chart? Or just text? 
        // HTML has a canvas `successRateChart`.
        // Let's make a Doughnut/Pie.

        const successRate = Math.round((delivered / total) * 100);
        this.setSafeText('successRateValue', successRate + '%');
        this.setSafeText('successDeliveredCount', delivered);
        this.setSafeText('successReturnedCount', returned);

        const ctx = document.getElementById('successRateChart').getContext('2d');
        if (this.successChart) this.successChart.destroy();

        this.successChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Delivered', 'Returned', 'Other'],
                datasets: [{
                    data: [delivered, returned, total - delivered - returned],
                    backgroundColor: ['#10b981', '#ef4444', '#f1f5f9'],
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    },

    renderTopCities: function (orders) {
        // Helper to extract city from address
        const extractCity = (addr) => {
            if (!addr) return "Unknown";
            const cleanAddr = addr.toString().trim();
            if (cleanAddr.includes(',')) {
                return cleanAddr.split(',').pop().trim();
            }
            // Heuristic: If address is short, might be just city?
            // If long, take last word?
            // User examples: "Block E Johar Town Lahore" -> "Lahore" (Last word)
            const parts = cleanAddr.split(/\s+/);
            if (parts.length > 1) {
                const last = parts[parts.length - 1];
                // Filter out common non-city last words if needed (e.g. "Town", "Road")
                // For now, simpler is better.
                return last;
            }
            return cleanAddr;
        };

        const cityMap = {};
        orders.forEach(o => {
            let city = "Unknown";
            if (o.city) {
                city = o.city;
            } else if (o.address) {
                city = extractCity(o.address);
            }

            // Normalize
            city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
            if (city.length > 15) city = city.substring(0, 15) + '...';

            cityMap[city] = (cityMap[city] || 0) + 1;
        });

        const sorted = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

        const container = document.getElementById('topCitiesParam');
        if (container) {
            container.innerHTML = '';
            sorted.forEach(([city, count]) => {
                const pct = Math.min(100, (count / orders.length) * 100 * 2);
                container.innerHTML += `
                    <div class="city-item">
                        <span class="fw-bold text-secondary small" title="${city}" style="width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${city}</span>
                        <span class="fw-bold text-primary small">${count}</span>
                        <div class="city-progress">
                            <div class="city-progress-bar" style="width: ${pct}%"></div>
                        </div>
                    </div>
                `;
            });
        }
    },

    renderRecentActivity: function (orders) {
        // Sort by ID desc (newest first)
        const sorted = [...orders].sort((a, b) => b.id - a.id).slice(0, 5);

        const container = document.getElementById('recentActivityParam');
        if (container) {
            container.innerHTML = '';
            sorted.forEach(o => {
                const name = o.customer || o.customerName || 'Unknown Customer';
                container.innerHTML += `
                    <div class="activity-item d-flex align-items-center justify-content-between">
                        <div>
                            <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.9rem;">${name}</h6>
                            <small class="text-muted d-block">${o.product} - ${this.formatCurrency(o.price)}</small>
                        </div>
                        <span class="badge bg-light text-secondary border">${o.date}</span>
                    </div>
                `;
            });
        }
    }
};
