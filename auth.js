const Auth = {
    init: function () {
        console.log("Auth Init...");
        this.setupListeners();
    },

    setupListeners: function () {
        console.log("Setting up listeners...");
        // Toggle between Login and Register
        const loginTab = document.getElementById('tab-login');
        const regTab = document.getElementById('tab-register');
        const loginForm = document.getElementById('loginCustomForm');
        const regForm = document.getElementById('registerCustomForm');

        if (loginTab && regTab) {
            loginTab.addEventListener('click', () => {
                loginTab.classList.add('active', 'border-primary');
                regTab.classList.remove('active', 'border-primary');
                loginForm.classList.remove('d-none');
                regForm.classList.add('d-none');
            });

            regTab.addEventListener('click', () => {
                regTab.classList.add('active', 'border-primary');
                loginTab.classList.remove('active', 'border-primary');
                regForm.classList.remove('d-none');
                loginForm.classList.add('d-none');
            });
        }


        // Handle Register Submit
        const regFormEl = document.getElementById('registerForm');
        if (regFormEl) {
            console.log("Register Form Found");
            regFormEl.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log("Register Submit Triggered");
                await this.handleRegister();
            });
        } else {
            console.error("Register Form NOT Found");
        }

        // Handle Login Submit
        const loginFormEl = document.getElementById('loginForm');
        if (loginFormEl) {
            loginFormEl.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }
    },

    handleRegister: async function () {
        console.log("Handle Register Called");
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const pass = document.getElementById('regPass').value;
        const btn = document.getElementById('btnRegister');

        if (!name || !email || !pass) return alert("Please fill all fields");

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating Company...';

        try {
            const result = await API.registerCompany(name, email, pass);
            if (result.success) {
                alert("Registration Successful! Please Login.");
                document.getElementById('tab-login').click(); // Switch to login
            } else {
                alert("Registration Failed: " + (result.error || "Unknown Error"));
            }
        } catch (e) {
            console.error(e);
            alert("Connection Error. Please try again.");
        } finally {
            btn.disabled = false;
            btn.innerText = "Register Company";
        }
    },

    handleLogin: async function () {
        const email = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        const btn = document.getElementById('btnLogin');

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Logging in...';

        try {
            const result = await API.loginCompany(email, pass);
            if (result.success) {
                // Save Session
                sessionStorage.setItem('oms_auth', 'true');
                sessionStorage.setItem('oms_token', result.token || 'demo-token');
                sessionStorage.setItem('oms_sheet_id', result.spreadsheetId);
                sessionStorage.setItem('oms_company_name', result.companyName);

                // Redirect/Show App
                // App.showApp() will be called on reload or manually
                window.location.reload();
            } else {
                document.getElementById('loginError').innerText = result.error || "Invalid Credentials";
                document.getElementById('loginError').classList.remove('d-none');
            }
        } catch (e) {
            console.error(e);
            document.getElementById('loginError').innerText = "Connection Failed";
            document.getElementById('loginError').classList.remove('d-none');
        } finally {
            btn.disabled = false;
            btn.innerText = "Login";
        }
    }
};
