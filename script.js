document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const companyNameInput = document.getElementById('company-name');
    const companyAddressInput = document.getElementById('company-address');
    const logoUrlInput = document.getElementById('logo-url');
    const logoUploadInput = document.getElementById('logo-upload');
    const logoPreview = document.getElementById('logo-preview');
    const accentColorInput = document.getElementById('accent-color');
    const saveBrandSettingsBtn = document.getElementById('save-brand-settings');
    const headerLogo = document.getElementById('header-logo');
    const headerTitle = document.getElementById('header-title');

    const invoiceNumberInput = document.getElementById('invoice-number');
    const invoiceDateInput = document.getElementById('invoice-date');
    const clientNameInput = document.getElementById('client-name');
    const clientAddressInput = document.getElementById('client-address');
    const invoiceItemsContainer = document.getElementById('invoice-items');
    const addItemBtn = document.getElementById('add-item');
    const subtotalAmountSpan = document.getElementById('subtotal-amount');
    const taxRateInput = document.getElementById('tax-rate');
    const taxAmountSpan = document.getElementById('tax-amount');
    const discountRateInput = document.getElementById('discount-rate');
    const discountAmountSpan = document.getElementById('discount-amount');
    const totalAmountSpan = document.getElementById('total-amount');
    const invoiceNotesInput = document.getElementById('invoice-notes');

    const saveDraftBtn = document.getElementById('save-draft');
    const loadDraftBtn = document.getElementById('load-draft');
    const clearInvoiceBtn = document.getElementById('clear-invoice');
    const downloadPdfBtn = document.getElementById('download-pdf');
    const printInvoiceBtn = document.getElementById('print-invoice');
    const confirmationMessage = document.getElementById('confirmation-message');
    const modeToggleBtn = document.getElementById('mode-toggle');

    // --- Utility Functions ---

    /**
     * Displays a temporary confirmation message.
     * @param {string} message - The message to display.
     * @param {string} type - 'success' or 'error'.
     */
    function showConfirmation(message, type) {
        confirmationMessage.textContent = message;
        confirmationMessage.className = `confirmation-message ${type} show`;
        setTimeout(() => {
            confirmationMessage.classList.remove('show');
        }, 3000);
    }

    /**
     * Safely parses JSON from localStorage.
     * @param {string} key - The localStorage key.
     * @param {*} defaultValue - Value to return if parsing fails or item is not found.
     * @returns {*} - Parsed JSON or default value.
     */
    function getLocalStorageItem(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Error parsing localStorage item "${key}":`, e);
            return defaultValue;
        }
    }

    /**
     * Sets a localStorage item safely.
     * @param {string} key - The localStorage key.
     * @param {*} value - The value to store.
     */
    function setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error setting localStorage item "${key}":`, e);
        }
    }

    // --- Brand Settings ---

    let currentLogoBase64 = ''; // To store base64 for logo upload

    /**
     * Loads brand settings from localStorage.
     */
    function loadBrandSettings() {
        const brandSettings = getLocalStorageItem('invoiceBrandSettings', {});
        companyNameInput.value = brandSettings.companyName || '';
        companyAddressInput.value = brandSettings.companyAddress || '';
        logoUrlInput.value = brandSettings.logoUrl || '';
        accentColorInput.value = brandSettings.accentColor || '#007bff';
        currentLogoBase64 = brandSettings.logoBase64 || ''; // Load base64 if present

        applyBrandSettings();
    }

    /**
     * Applies brand settings to the UI.
     */
    function applyBrandSettings() {
        const logoSrc = currentLogoBase64 || logoUrlInput.value;
        if (logoSrc) {
            logoPreview.src = logoSrc;
            headerLogo.src = logoSrc;
            logoPreview.style.display = 'block';
            headerLogo.style.display = 'block';
        } else {
            logoPreview.style.display = 'none';
            headerLogo.style.display = 'none';
        }

        headerTitle.textContent = companyNameInput.value || 'Invoice Generator';
        document.documentElement.style.setProperty('--primary-color', accentColorInput.value);
    }

    /**
     * Saves brand settings to localStorage.
     */
    function saveBrandSettings() {
        const brandSettings = {
            companyName: companyNameInput.value,
            companyAddress: companyAddressInput.value,
            logoUrl: logoUrlInput.value,
            logoBase64: currentLogoBase64, // Store base64 if available
            accentColor: accentColorInput.value
        };
        setLocalStorageItem('invoiceBrandSettings', brandSettings);
        applyBrandSettings();
        showConfirmation('Brand settings saved!', 'success');
    }

    // Logo upload handler
    logoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentLogoBase64 = e.target.result; // Store base64
                logoUrlInput.value = ''; // Clear URL if a file is uploaded
                logoPreview.src = currentLogoBase64;
                headerLogo.src = currentLogoBase64;
                logoPreview.style.display = 'block';
                headerLogo.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            currentLogoBase64 = '';
            // If logo-url has a value, it will be used by applyBrandSettings
        }
    });

    // Handle logo URL changes directly
    logoUrlInput.addEventListener('input', () => {
        currentLogoBase64 = ''; // Clear base64 if URL is being used
        applyBrandSettings();
    });

    saveBrandSettingsBtn.addEventListener('click', saveBrandSettings);
    companyNameInput.addEventListener('input', applyBrandSettings);
    accentColorInput.addEventListener('input', applyBrandSettings);

    // --- Invoice Item Management ---

    /**
     * Creates a new invoice item row.
     * @param {object} itemData - Optional initial data for the item.
     * @returns {HTMLElement} - The created item row.
     */
    function createInvoiceItemRow(itemData = {}) {
        const row = document.createElement('div');
        row.className = 'invoice-item-row grid-item-row';
        row.innerHTML = `
            <input type="text" class="item-name" placeholder="Item Name" value="${itemData.name || ''}">
            <input type="text" class="item-description" placeholder="Description" value="${itemData.description || ''}">
            <input type="number" class="item-qty" value="${itemData.qty || 1}" min="1">
            <input type="number" class="item-price" value="${(itemData.price || 0).toFixed(2)}" min="0" step="0.01">
            <span class="item-total">${(itemData.total || 0).toFixed(2)}</span>
            <button class="remove-item-btn danger-btn small-btn">X</button>
        `;

        const qtyInput = row.querySelector('.item-qty');
        const priceInput = row.querySelector('.item-price');
        const itemTotalSpan = row.querySelector('.item-total');
        const removeItemBtn = row.querySelector('.remove-item-btn');

        const updateItemTotal = () => {
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            itemTotalSpan.textContent = (qty * price).toFixed(2);
            calculateTotals();
        };

        qtyInput.addEventListener('input', updateItemTotal);
        priceInput.addEventListener('input', updateItemTotal);
        removeItemBtn.addEventListener('click', () => {
            row.remove();
            calculateTotals();
        });

        updateItemTotal(); // Calculate initial total for new row
        return row;
    }

    addItemBtn.addEventListener('click', () => {
        invoiceItemsContainer.appendChild(createInvoiceItemRow());
    });

    // --- Invoice Total Calculations ---

    /**
     * Calculates and updates subtotal, tax, discount, and grand total.
     */
    function calculateTotals() {
        let subtotal = 0;
        document.querySelectorAll('.invoice-item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            subtotal += qty * price;
        });
        subtotalAmountSpan.textContent = subtotal.toFixed(2);

        const taxRate = parseFloat(taxRateInput.value) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        taxAmountSpan.textContent = taxAmount.toFixed(2);

        const discountRate = parseFloat(discountRateInput.value) || 0;
        const discountAmount = subtotal * (discountRate / 100);
        discountAmountSpan.textContent = discountAmount.toFixed(2);

        const total = subtotal + taxAmount - discountAmount;
        totalAmountSpan.textContent = total.toFixed(2);
    }

    // Event listeners for recalculation
    taxRateInput.addEventListener('input', calculateTotals);
    discountRateInput.addEventListener('input', calculateTotals);
    invoiceItemsContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-qty') || e.target.classList.contains('item-price')) {
            // Already handled by individual item row listeners, but good to have a catch-all
            calculateTotals();
        }
    });

    // --- Save/Load/Clear Drafts ---

    /**
     * Gathers all current invoice data into an object.
     * @returns {object} - The invoice data.
     */
    function getInvoiceData() {
        const items = [];
        document.querySelectorAll('.invoice-item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            items.push({
                name: row.querySelector('.item-name').value,
                description: row.querySelector('.item-description').value,
                qty: qty,
                price: price,
                total: qty * price
            });
        });

        return {
            invoiceNumber: invoiceNumberInput.value,
            invoiceDate: invoiceDateInput.value,
            clientName: clientNameInput.value,
            clientAddress: clientAddressInput.value,
            items: items,
            taxRate: taxRateInput.value,
            discountRate: discountRateInput.value,
            notes: invoiceNotesInput.value,
            subtotal: parseFloat(subtotalAmountSpan.textContent),
            taxAmount: parseFloat(taxAmountSpan.textContent),
            discountAmount: parseFloat(discountAmountSpan.textContent),
            total: parseFloat(totalAmountSpan.textContent)
        };
    }

    /**
     * Populates the form with invoice data.
     * @param {object} data - The invoice data.
     */
    function setInvoiceData(data) {
        invoiceNumberInput.value = data.invoiceNumber || '';
        invoiceDateInput.value = data.invoiceDate || '';
        clientNameInput.value = data.clientName || '';
        clientAddressInput.value = data.clientAddress || '';
        taxRateInput.value = data.taxRate || 0;
        discountRateInput.value = data.discountRate || 0;
        invoiceNotesInput.value = data.notes || '';

        // Clear existing items and add new ones
        invoiceItemsContainer.innerHTML = '';
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                invoiceItemsContainer.appendChild(createInvoiceItemRow(item));
            });
        } else {
            invoiceItemsContainer.appendChild(createInvoiceItemRow()); // Add at least one empty row
        }
        calculateTotals();
    }

    saveDraftBtn.addEventListener('click', () => {
        setLocalStorageItem('invoiceDraft', getInvoiceData());
        showConfirmation('Invoice draft saved!', 'success');
    });

    loadDraftBtn.addEventListener('click', () => {
        const draft = getLocalStorageItem('invoiceDraft', null);
        if (draft) {
            setInvoiceData(draft);
            showConfirmation('Invoice draft loaded!', 'success');
        } else {
            showConfirmation('No saved draft found.', 'error');
        }
    });

    clearInvoiceBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the current invoice? This cannot be undone (unless you load a draft).')) {
            setInvoiceData({}); // Clear all fields
            invoiceItemsContainer.innerHTML = ''; // Ensure all items are gone
            invoiceItemsContainer.appendChild(createInvoiceItemRow()); // Add one fresh item row
            calculateTotals();
            showConfirmation('Invoice cleared!', 'success');
        }
    });

    // --- PDF Generation ---

    downloadPdfBtn.addEventListener('click', async () => {
        showConfirmation('Generating PDF...', 'info');
        const invoice = getInvoiceData();
        const brand = getLocalStorageItem('invoiceBrandSettings', {});

        try {
            // Include CSRF token (simple example, enhance for production)
            const csrfToken = 'my_secret_csrf_token_123'; // Replace with a dynamically generated token in a real app

            const response = await fetch('generate_pdf.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken // Send token in header
                },
                body: JSON.stringify({ invoice, brand })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with status ${response.status}: ${errorText}`);
            }

            // The PHP script sends a file, so we get it as a blob
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `invoice_${invoice.invoiceNumber || 'draft'}_${new Date().toISOString().slice(0,10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            showConfirmation('PDF downloaded successfully!', 'success');

        } catch (error) {
            console.error('Error generating PDF:', error);
            showConfirmation(`Failed to generate PDF: ${error.message || 'Unknown error'}`, 'error');
        }
    });

    // --- Print Functionality ---

    printInvoiceBtn.addEventListener('click', () => {
        // Collect current company info to display at the top of the printout
        const companyName = companyNameInput.value;
        const companyAddress = companyAddressInput.value.replace(/\n/g, '<br>');
        const companyInfo = `${companyName}\n${companyAddress}`;
        document.body.setAttribute('data-company-info', companyInfo);

        window.print();

        // Clean up attribute after print dialog is closed
        setTimeout(() => {
            document.body.removeAttribute('data-company-info');
        }, 100);
    });


    // --- Dark Mode Toggle ---
    modeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        setLocalStorageItem('darkMode', isDarkMode);
        modeToggleBtn.textContent = isDarkMode ? '🌙' : '☀️';
    });

    /**
     * Initializes the dark mode state from localStorage.
     */
    function initializeDarkMode() {
        const isDarkMode = getLocalStorageItem('darkMode', false); // Default to light mode
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            modeToggleBtn.textContent = '🌙';
        } else {
            modeToggleBtn.textContent = '☀️';
        }
    }


    // --- Initial Load ---
    function initialize() {
        // Set current date
        invoiceDateInput.value = new Date().toISOString().slice(0, 10);

        loadBrandSettings();
        initializeDarkMode();
        // Add one initial item row if none exist (e.g., on first load or after clear)
        if (invoiceItemsContainer.children.length === 0) {
            invoiceItemsContainer.appendChild(createInvoiceItemRow());
        }
        calculateTotals(); // Initial calculation
    }

    initialize();
});
