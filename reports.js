const Reports = {
    render: function () {
        const section = document.getElementById('reports');
        section.innerHTML = `
            <h2 class="mb-4">Reports</h2>
            
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <h5 class="card-title mb-3">Filter Data</h5>
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Start Date</label>
                            <input type="date" class="form-control" id="reportStart">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">End Date</label>
                            <input type="date" class="form-control" id="reportEnd">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Courier</label>
                            <select class="form-select" id="reportCourier">
                                <option value="">All Couriers</option>
                            </select>
                        </div>
                        <div class="col-md-3 d-flex align-items-end gap-2">
                            <button class="btn btn-primary w-100" onclick="Reports.generate()">
                                <i class="fas fa-search"></i> Generate
                            </button>
                            <button class="btn btn-success w-100" onclick="Reports.exportCSV()">
                                <i class="fas fa-file-csv"></i> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <h5 class="mb-3">Results</h5>
                <table class="table table-hover" id="reportsTable">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Courier</th>
                            <th>Status</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="6" class="text-center text-muted">Select filters and click Generate</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        // Populate Couriers
        const select = document.getElementById('reportCourier');
        COURIERS.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.innerText = c;
            select.appendChild(opt);
        });
    },

    getFilteredData: function () {
        const start = document.getElementById('reportStart').value;
        const end = document.getElementById('reportEnd').value;
        const courier = document.getElementById('reportCourier').value;

        // Helper to parse DD/MM/YYYY
        const parseDate = (dateStr) => {
            const [d, m, y] = dateStr.split('/');
            return new Date(`${y}-${m}-${d}`);
        }

        return App.state.orders.filter(o => {
            // Check Courier
            if (courier && o.courier !== courier) return false;

            // Check Date Range (if dates are present)
            // Note: API Date is DD/MM/YYYY or similar string
            if (start || end) {
                if (!o.date) return false;
                const orderDate = parseDate(o.date);

                if (start && orderDate < new Date(start)) return false;
                if (end && orderDate > new Date(end)) return false;
            }

            return true;
        });
    },

    generate: function () {
        const data = this.getFilteredData();
        const tbody = document.querySelector('#reportsTable tbody');
        tbody.innerHTML = '';

        let total = 0;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No records found matching criteria.</td></tr>';
            return;
        }

        data.forEach(o => {
            total += o.price;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${o.date}</td>
                <td>#${o.id}</td>
                <td>${o.customer}</td>
                <td>${o.courier}</td>
                <td>${o.status}</td>
                <td>Rs. ${o.price}</td>
            `;
            tbody.appendChild(tr);
        });

        // Add Summary Row
        const summaryTr = document.createElement('tr');
        summaryTr.className = 'table-light fw-bold';
        summaryTr.innerHTML = `
            <td colspan="5" class="text-end">Total Amount:</td>
            <td>Rs. ${total.toLocaleString()}</td>
        `;
        tbody.appendChild(summaryTr);
    },

    exportCSV: function () {
        const data = this.getFilteredData();
        if (data.length === 0) {
            alert("No data to export.");
            return;
        }

        const headers = ["Order ID", "Date", "Customer", "Mobile", "Address", "Product", "Qty", "Price", "Courier", "Status"];
        const rows = data.map(o => [
            o.id,
            o.date,
            `"${o.customer}"`, // Escape quotes
            `"${o.mobile}"`,
            `"${o.address.replace(/\n/g, ' ')}"`,
            o.product,
            o.qty,
            o.price,
            o.courier,
            o.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "report_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
