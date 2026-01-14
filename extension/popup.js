// Popup script - with inline PIN setup

let currentKeywords = [];
let currentTab = null;

// Load on popup open
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentTab();
    await checkPINSetup();
    await loadSettings();
    setupEventListeners();
    setupPINSetupHandlers(); // Ensure handlers are always active
});

// Check if PIN is setup
async function checkPINSetup() {
    const result = await chrome.storage.local.get(['pinHash']);
    const pinSetupSection = document.getElementById('pinSetupSection');
    const mainContent = document.querySelector('.main-content');
    const settingsSection = document.querySelector('.settings-section');

    if (!result.pinHash) {
        // Show PIN setup
        pinSetupSection.style.display = 'block';
        mainContent.style.display = 'none';
        settingsSection.style.display = 'none';
    } else {
        // Show normal UI
        pinSetupSection.style.display = 'none';
        mainContent.style.display = 'block';
        settingsSection.style.display = 'block';
    }
}

// Setup PIN creation handlers
function setupPINSetupHandlers() {
    const setupInputs = document.querySelectorAll('.pin-digit-setup');
    const createBtn = document.getElementById('createPinBtn');
    const errorDiv = document.getElementById('setupError');

    // Auto-focus logic
    setupInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;

            if (!/^\d$/.test(value)) {
                e.target.value = '';
                return;
            }

            if (value) {
                e.target.classList.add('filled');
                if (index < setupInputs.length - 1) {
                    setupInputs[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                setupInputs[index - 1].focus();
                setupInputs[index - 1].value = '';
                setupInputs[index - 1].classList.remove('filled');
            }
        });
    });

    // Create PIN button
    createBtn.addEventListener('click', async () => {
        const pin = Array.from(setupInputs).slice(0, 4).map(i => i.value).join('');
        const confirmPin = Array.from(setupInputs).slice(4, 8).map(i => i.value).join('');

        if (pin.length !== 4) {
            errorDiv.textContent = 'Please enter a 4-digit PIN';
            errorDiv.style.display = 'block';
            return;
        }

        if (confirmPin.length !== 4) {
            errorDiv.textContent = 'Please confirm your PIN';
            errorDiv.style.display = 'block';
            return;
        }

        if (pin !== confirmPin) {
            errorDiv.textContent = 'PINs do not match';
            errorDiv.style.display = 'block';
            return;
        }

        // Save PIN
        createBtn.disabled = true;
        createBtn.textContent = 'Creating...';

        const pinHash = await hashPIN(pin);
        await chrome.storage.local.set({ pinHash: pinHash });

        // Reload UI
        await checkPINSetup();
    });

    setTimeout(() => setupInputs[0].focus(), 100);
}

// Setup event listeners
function setupEventListeners() {
    // Filter toggle
    const filterToggle = document.getElementById('filterToggle');
    filterToggle.addEventListener('change', async (e) => {
        // Require PIN for settings changes
        if (e.target.checked) {
            const verified = await showPINModal('settings');
            if (!verified) {
                e.target.checked = false;
                return;
            }
        }
        await chrome.storage.local.set({ filterEnabled: e.target.checked });
    });

    // Settings toggle
    const toggleSettings = document.getElementById('toggleSettings');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettings = document.getElementById('closeSettings');

    toggleSettings.addEventListener('click', async () => {
        // Require PIN to open settings
        const verified = await showPINModal('settings');
        if (verified) {
            settingsPanel.style.display = 'block';
        }
    });

    closeSettings.addEventListener('click', () => {
        settingsPanel.style.display = 'none';
    });

    // Add keyword button
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    addKeywordBtn.addEventListener('click', addKeyword);

    // Add keyword on Enter key
    const keywordInput = document.getElementById('keywordInput');
    keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addKeyword();
        }
    });

    // View History button
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');
    viewHistoryBtn.addEventListener('click', async () => {
        const verified = await showPINModal('history');
        if (verified) {
            // Create session token
            const token = generateToken();
            const expiry = Date.now() + (30 * 60 * 1000); // 30 minutes

            await chrome.storage.local.set({
                sessionToken: token,
                sessionExpiry: expiry
            });

            // Open history page
            chrome.tabs.create({ url: 'history.html' });
        }
    });

    // PIN Modal handlers
    setupPINModal();

    // Add to Library button matching
    const addToLibraryBtn = document.getElementById('addToLibraryBtn');
    if (addToLibraryBtn) {
        addToLibraryBtn.addEventListener('click', async () => {
            const verified = await showPINModal('library');
            if (verified) {
                showLibraryModal();
            }
        });
    }

    // Change PIN button
    const changePinBtn = document.getElementById('changePinBtn');
    if (changePinBtn) {
        changePinBtn.addEventListener('click', async () => {
            const verified = await showPINModal('change_pin');
            if (verified) {
                // Show Setup UI Reuse
                const settingsPanel = document.getElementById('settingsPanel');
                const pinSetupSection = document.getElementById('pinSetupSection');

                settingsPanel.style.display = 'none';
                document.querySelector('.settings-section').style.display = 'none';
                document.querySelector('.main-content').style.display = 'none';

                pinSetupSection.style.display = 'block';

                // Update UI text
                const title = pinSetupSection.querySelector('h2');
                const sub = pinSetupSection.querySelector('.setup-subtitle');
                const btn = document.getElementById('createPinBtn');

                if (title) title.textContent = 'Change Security PIN';
                if (sub) sub.textContent = 'Enter your new 4-digit PIN below';
                if (btn) btn.textContent = 'Update PIN';

                // Reset inputs
                document.querySelectorAll('.pin-digit-setup').forEach(i => i.value = '');
                document.getElementById('setupError').style.display = 'none';

                setTimeout(() => document.getElementById('setup-pin1').focus(), 100);
            }
        });
    }
}

// Load current tab info
async function loadCurrentTab() {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
        console.warn('chrome.tabs API not available');
        return;
    }

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            currentTab = tab;
            const urlDisplay = document.getElementById('currentUrl');
            const addBtn = document.getElementById('addToLibraryBtn');

            urlDisplay.textContent = tab.url;
            urlDisplay.title = tab.url; // Tooltip for full URL

            // Disable button if invalid URL
            if (!tab.url.startsWith('http')) {
                addBtn.disabled = true;
            }
        }
    } catch (error) {
        console.error('Error loading tab:', error);
    }
}

// Show Library Modal
function showLibraryModal() {
    if (!currentTab) return;

    const modal = document.getElementById('libraryModal');
    const titleInput = document.getElementById('libTitle');
    const urlInput = document.getElementById('libUrl');
    const descInput = document.getElementById('libDesc');
    const saveBtn = document.getElementById('saveLib');
    const cancelBtn = document.getElementById('cancelLib');

    // Pre-fill data
    titleInput.value = currentTab.title;
    urlInput.value = currentTab.url;
    descInput.value = '';

    modal.style.display = 'flex';
    titleInput.focus();

    // Handlers
    const handleSave = async () => {
        const title = titleInput.value.trim() || currentTab.title;
        const desc = descInput.value.trim();
        const url = currentTab.url;
        const favicon = currentTab.favIconUrl || '';

        const newItem = {
            id: Date.now().toString(),
            url,
            title,
            description: desc,
            favicon,
            dateAdded: Date.now()
        };

        // Save to storage
        const result = await chrome.storage.local.get(['savedLibrary']);
        const library = result.savedLibrary || [];
        library.unshift(newItem); // Add to top
        await chrome.storage.local.set({ savedLibrary: library });

        cleanup();

        // Show success feedback (optional, simple for now)
        const addBtn = document.getElementById('addToLibraryBtn');
        const originalText = addBtn.innerHTML;
        addBtn.innerHTML = '<span>✅</span> Saved!';
        setTimeout(() => {
            addBtn.innerHTML = originalText;
        }, 2000);
    };

    const handleCancel = () => {
        cleanup();
    };

    const cleanup = () => {
        saveBtn.removeEventListener('click', handleSave);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.style.display = 'none';
    };

    saveBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', handleCancel);
}

// Show PIN modal
function showPINModal(context) {
    return new Promise((resolve) => {
        const modal = document.getElementById('pinModal');
        const pinInputs = document.querySelectorAll('.pin-digit-modal');
        const errorDiv = document.getElementById('pinError');
        const submitBtn = document.getElementById('submitPin');
        const cancelBtn = document.getElementById('cancelPin');

        // Clear previous inputs
        pinInputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled', 'error');
        });
        errorDiv.style.display = 'none';

        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => pinInputs[0].focus(), 100);

        // Handle submit
        const handleSubmit = async () => {
            const pin = Array.from(pinInputs).map(i => i.value).join('');

            if (pin.length !== 4) {
                return; // Don't do anything if PIN incomplete
            }

            const isValid = await verifyPIN(pin);

            if (isValid) {
                // Clean up listeners
                submitBtn.removeEventListener('click', handleSubmit);
                cancelBtn.removeEventListener('click', handleCancel);
                pinInputs.forEach(input => {
                    input.removeEventListener('keypress', handleEnter);
                });

                modal.style.display = 'none';
                resolve(true);
            } else {
                // Show error and allow retry
                errorDiv.style.display = 'block';
                pinInputs.forEach(input => {
                    input.classList.add('error');
                    input.value = '';
                    input.classList.remove('filled');
                });
                setTimeout(() => {
                    pinInputs.forEach(input => input.classList.remove('error'));
                    pinInputs[0].focus();
                }, 500);
                // Don't resolve - let user try again
            }
        };

        // Handle cancel
        const handleCancel = () => {
            // Clean up listeners
            submitBtn.removeEventListener('click', handleSubmit);
            cancelBtn.removeEventListener('click', handleCancel);
            pinInputs.forEach(input => {
                input.removeEventListener('keypress', handleEnter);
            });

            modal.style.display = 'none';
            resolve(false);
        };

        // Handle Enter key
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        };

        submitBtn.addEventListener('click', handleSubmit);
        cancelBtn.addEventListener('click', handleCancel);
        pinInputs.forEach(input => {
            input.addEventListener('keypress', handleEnter);
        });
    });
}

// Setup PIN modal inputs
function setupPINModal() {
    const pinInputs = document.querySelectorAll('.pin-digit-modal');

    pinInputs.forEach((input, index) => {
        // Auto-focus next
        input.addEventListener('input', (e) => {
            const value = e.target.value;

            if (!/^\d$/.test(value)) {
                e.target.value = '';
                return;
            }

            if (value) {
                e.target.classList.add('filled');
                if (index < pinInputs.length - 1) {
                    pinInputs[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }
        });

        // Handle backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                pinInputs[index - 1].focus();
                pinInputs[index - 1].value = '';
                pinInputs[index - 1].classList.remove('filled');
            }
        });
    });
}

// Verify PIN
async function verifyPIN(pin) {
    try {
        const result = await chrome.storage.local.get(['pinHash']);
        if (!result.pinHash) {
            return false;
        }

        const inputHash = await hashPIN(pin);
        return inputHash === result.pinHash;
    } catch (error) {
        console.error('PIN verification error:', error);
        return false;
    }
}

// Hash PIN
async function hashPIN(pin) {
    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate session token
function generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Load settings
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['filterEnabled', 'filterKeywords']);
        const enabled = result.filterEnabled || false;
        const keywords = result.filterKeywords || [];

        document.getElementById('filterToggle').checked = enabled;
        currentKeywords = keywords;
        renderKeywordTags();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Render keyword tags
function renderKeywordTags() {
    const tagsContainer = document.getElementById('keywordTags');
    tagsContainer.innerHTML = currentKeywords.map(keyword => `
    <div class="keyword-tag">
      <span>${escapeHtml(keyword)}</span>
      <button class="remove-btn" data-keyword="${escapeHtml(keyword)}">−</button>
    </div>
  `).join('');

    tagsContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeKeyword(btn.dataset.keyword));
    });
}

// Add keyword
async function addKeyword() {
    const input = document.getElementById('keywordInput');
    const keyword = input.value.trim();

    if (!keyword || currentKeywords.includes(keyword)) {
        input.value = '';
        input.focus();
        return;
    }

    currentKeywords.push(keyword);
    await chrome.storage.local.set({ filterKeywords: currentKeywords });
    renderKeywordTags();
    input.value = '';
    input.focus();
}

// Remove keyword
async function removeKeyword(keyword) {
    currentKeywords = currentKeywords.filter(k => k !== keyword);
    await chrome.storage.local.set({ filterKeywords: currentKeywords });
    renderKeywordTags();
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
