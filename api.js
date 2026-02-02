const API = {
    // Generic Helper
    request: async function (action, payload = {}) {
        if (!CONFIG.API_URL) throw new Error("API URL is not configured");

        // Add action to payload
        const body = { action, ...payload };

        // For 'data' actions, attach the spreadsheetId if logged in
        if (action !== 'register' && action !== 'login') {
            const sid = sessionStorage.getItem('oms_sheet_id');
            if (sid) body.spreadsheetId = sid;
        }

        console.log(`API Request [${action}]`, body);

        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                redirect: 'follow', // Important for GAS
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8' // Avoid CORS Preflight
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`API Error [${action}]:`, error);
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                alert("API Connection Blocked (CORS Error).\n\nPossible Cause: Identify Deployment Settings.\n\nPLEASE CHECK:\nIn Google Script > Deploy > New Deployment:\nSet 'Who has access' to 'Anyone'.\n(Currently it might be 'Only myself').");
            }
            throw error;
        }
    },

    registerCompany: async function (name, email, password) {
        return await this.request('register', { name, email, password });
    },

    loginCompany: async function (email, password) {
        return await this.request('login', { email, password });
    },

    getOrders: async function () {
        return await this.request('getOrders');
    },

    fetchOrders: async function () {
        // Now uses generic request
        // Expects backend to return { data: [...] } or [...]
        const result = await this.request('getOrders');

        if (result.data) {
            return result.data;
        } else if (Array.isArray(result)) {
            return result;
        } else {
            return [];
        }
    }
};
