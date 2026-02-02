const Expenses = {
    getAll: function () {
        const saved = localStorage.getItem('oms_expenses');
        return saved ? JSON.parse(saved) : [];
    },

    saveAll: function (expenses) {
        localStorage.setItem('oms_expenses', JSON.stringify(expenses));
    },

    add: function (desc, amount) {
        const list = this.getAll();
        const newEx = {
            id: Date.now(),
            date: new Date().toLocaleDateString('en-GB'),
            description: desc,
            amount: parseFloat(amount) || 0
        };
        list.push(newEx);
        this.saveAll(list);
        this.render();
        Dashboard.render(); // Update Profit/Loss
    },

    delete: function (id) {
        if (!confirm("Delete this expense?")) return;
        let list = this.getAll();
        list = list.filter(e => e.id !== id);
        this.saveAll(list);
        this.render();
        Dashboard.render(); // Update Profit/Loss
    },

    getTotal: function () {
        const list = this.getAll();
        return list.reduce((sum, item) => sum + item.amount, 0);
    },

    render: function () {
        const tbody = document.querySelector('#expensesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        const list = this.getAll();

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No expenses recorded.</td></tr>';
            return;
        }

        // Sort by Newest First
        list.sort((a, b) => b.id - a.id);

        list.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.date}</td>
                <td>${item.description}</td>
                <td class="text-danger fw-bold">Rs. ${item.amount.toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="Expenses.delete(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    init: function () {
        if (!this.initialized) {
            const form = document.getElementById('addExpenseForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const desc = document.getElementById('expenseDesc').value;
                    const amount = document.getElementById('expenseAmount').value;
                    this.add(desc, amount);
                    form.reset();
                });
            }
            this.initialized = true;
        }
        this.render();
    }
};
