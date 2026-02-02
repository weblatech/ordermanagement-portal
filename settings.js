const Settings = {
    defaults: {
        businessName: "My Store",
        logoUrl: "",
        // apiUrl: CONFIG.API_URL, // Removed to enforce hardcoded secure URL
        showLogo: true,
        showCNIC: false,
        darkMode: false,
        resellers: ["Easy Shopping Zone", "Own Store"] // Default
    },

    init: function () {
        this.render();
        this.populateUI();
    },

    get: function () {
        const saved = localStorage.getItem('oms_settings');
        const settings = saved ? JSON.parse(saved) : this.defaults;
        // Ensure structure
        if (!settings.resellers) settings.resellers = this.defaults.resellers;
        return settings;
    },

    applyTheme: function () {
        const settings = this.get();

        // Dark Mode
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
            this.updateToggleIcon(true);
        } else {
            document.body.classList.remove('dark-mode');
            this.updateToggleIcon(false);
        }

        // Branding
        this.applyBranding(settings);

        // Global Config - ENFORCE HARDCODED URL
        // CONFIG.API_URL = settings.apiUrl;
    },

    applyBranding: function (settings) {
        const brandEl = document.getElementById('sidebarBrand');
        if (!brandEl) return;

        const name = settings.businessName || "OMS Panel";

        if (settings.logoUrl && settings.logoUrl.trim() !== "") {
            // Image Logo
            brandEl.innerHTML = `
                <img src="${settings.logoUrl}" alt="Logo" style="height: 32px; margin-right: 8px; border-radius: 4px;">
                <span>${name}</span>
            `;
        } else {
            // Default Icon
            brandEl.innerHTML = `
                <i class="fas fa-box-open"></i> ${name}
            `;
        }
    },

    populateUI: function () {
        const settings = this.get();

        const elName = document.getElementById('setBusinessName');
        if (elName) elName.value = settings.businessName || "";

        const elLogoUrl = document.getElementById('setLogoUrl');
        if (elLogoUrl) elLogoUrl.value = settings.logoUrl || "";

        // API UI Removed

        const elLogo = document.getElementById('setShowLogo');
        if (elLogo) elLogo.checked = settings.showLogo;

        const elCnic = document.getElementById('setShowCNIC');
        if (elCnic) elCnic.checked = settings.showCNIC;

        this.renderResellerList(settings.resellers);
    },

    toggleDarkMode: function () {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');

        const settings = this.get();
        settings.darkMode = isDark;
        this.saveInternal(settings);

        this.updateToggleIcon(isDark);
    },

    updateToggleIcon: function (isDark) {
        const btn = document.getElementById('darkModeToggle');
        if (btn) {
            btn.innerHTML = isDark ?
                '<i class="fas fa-sun"></i> Light Mode' :
                '<i class="fas fa-moon"></i> Dark Mode';
        }
    },

    renderResellerList: function (list) {
        const container = document.getElementById('resellerList');
        if (!container) return; // Guard

        container.innerHTML = '';
        list.forEach(r => {
            const item = document.createElement('div');
            item.className = 'd-flex justify-content-between align-items-center border p-2 mb-2 rounded reseller-item';
            item.innerHTML = `
                <span>${r}</span>
                <button class="btn btn-sm btn-outline-danger" onclick="Settings.removeReseller('${r}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(item);
        });
    },

    addReseller: function () {
        const input = document.getElementById('newResellerInput');
        if (!input) return;

        const val = input.value.trim();
        if (!val) return;

        const settings = this.get();
        if (!settings.resellers.includes(val)) {
            settings.resellers.push(val);
            this.saveInternal(settings);
            input.value = '';
            this.renderResellerList(settings.resellers);
        }
    },

    removeReseller: function (name) {
        if (!confirm("Remove reseller: " + name + "?")) return;

        const settings = this.get();
        settings.resellers = settings.resellers.filter(r => r !== name);
        this.saveInternal(settings);
        this.renderResellerList(settings.resellers);
    },

    saveInternal: function (settings) {
        localStorage.setItem('oms_settings', JSON.stringify(settings));
        // Apply globals immediately
        this.applyBranding(settings);
        // CONFIG.API_URL = settings.apiUrl; // REMOVED
        Print.settings.showLogo = settings.showLogo;
        Print.settings.showCNIC = settings.showCNIC;
    },

    save: function () {
        // Main Save Button
        const settings = this.get();

        const elName = document.getElementById('setBusinessName');
        if (elName) settings.businessName = elName.value;

        const elLogoUrl = document.getElementById('setLogoUrl');
        if (elLogoUrl) settings.logoUrl = elLogoUrl.value;

        // API UI Removed

        const elLogo = document.getElementById('setShowLogo');
        if (elLogo) settings.showLogo = elLogo.checked;

        const elCnic = document.getElementById('setShowCNIC');
        if (elCnic) settings.showCNIC = elCnic.checked;

        this.saveInternal(settings);
        alert("Settings Saved & Branding Updated!");
    },

    render: function () {
        const section = document.getElementById('settings');

        section.innerHTML = `
             <h2 class="mb-4">Master Settings</h2>
             <!-- Tabs -->
             <ul class="nav nav-tabs mb-4">
                 <li class="nav-item">
                     <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#profile-settings">General</button>
                 </li>
                 <li class="nav-item">
                     <button class="nav-link" data-bs-toggle="tab" data-bs-target="#reseller-settings">Resellers</button>
                 </li>
                 <li class="nav-item">
                     <button class="nav-link" data-bs-toggle="tab" data-bs-target="#print-settings">Print</button>
                 </li>
             </ul>
             
             <div class="tab-content">
                 <!-- General -->
                 <div class="tab-pane fade show active" id="profile-settings">
                     <div class="card border-0 shadow-sm">
                         <div class="card-body">
                             <h5 class="card-title">Business Information</h5>
                             <form onsubmit="event.preventDefault(); Settings.save();">
                                 <div class="mb-3">
                                     <label>Business Name (Sidebar & Reports)</label>
                                     <input type="text" class="form-control" id="setBusinessName" placeholder="My Store">
                                 </div>
                                 <div class="mb-3">
                                     <label>Logo URL (Sidebar - Optional)</label>
                                     <input type="url" class="form-control" id="setLogoUrl" placeholder="https://example.com/logo.png">
                                     <small class="text-muted">Paste a direct link to a small image/icon.</small>
                                 </div>
                                 <button class="btn btn-primary">Save Changes</button>
                             </form>
                         </div>
                     </div>
                 </div>

                 <!-- Resellers -->
                 <div class="tab-pane fade" id="reseller-settings">
                     <div class="card border-0 shadow-sm">
                         <div class="card-body">
                             <h5 class="card-title">Manage Resellers</h5>
                             <div class="input-group mb-3">
                                <input type="text" class="form-control" id="newResellerInput" placeholder="Enter Reseller Name">
                                <button class="btn btn-success" type="button" onclick="Settings.addReseller()">Add</button>
                             </div>
                             <div id="resellerList" class="p-3 rounded border" style="max-height: 300px; overflow-y: auto;">
                                <!-- List populated by JS -->
                             </div>
                         </div>
                     </div>
                 </div>

                 <!-- Print -->
                 <div class="tab-pane fade" id="print-settings">
                     <div class="card border-0 shadow-sm">
                         <div class="card-body">
                             <h5 class="card-title">Print Settings (Invoices)</h5>
                             <form onsubmit="event.preventDefault(); Settings.save();">
                                 <div class="form-check form-switch mb-3">
                                     <input class="form-check-input" type="checkbox" id="setShowLogo" checked>
                                     <label class="form-check-label">Show Logo on Invoice</label>
                                 </div>
                                 <div class="form-check form-switch mb-3">
                                     <input class="form-check-input" type="checkbox" id="setShowCNIC">
                                     <label class="form-check-label">Show CNIC Field</label>
                                 </div>
                                 <button class="btn btn-primary">Save Changes</button>
                             </form>
                         </div>
                     </div>
                 </div>
             </div>
        `;
    }
};
