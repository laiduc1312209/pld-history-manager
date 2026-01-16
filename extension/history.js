// Secure History Manager
// This page can only be accessed with valid session token

let allHistory = [];
let allLibrary = [];

// Check authentication on load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('History Manager Loaded');

    // Initialize language
    await LanguageManager.init();
    LanguageManager.applyTranslations();

    // Setup UI listeners immediately
    setupEventListeners();

    if (!await checkAuth()) {
        console.warn('Authentication failed, closing window');
        window.close();
        return;
    }

    // Delete this page's history
    deleteOwnHistory();

    await loadHistory();
    await loadLibrary();
});

// Check if user has valid session token
async function checkAuth() {
    try {
        // Check if PIN is enabled
        const pinStatus = await chrome.storage.local.get(['pinEnabled']);
        if (pinStatus.pinEnabled === false) {
            // PIN is disabled, allow access without session token
            return true;
        }

        const result = await chrome.storage.local.get(['sessionToken', 'sessionExpiry']);

        if (!result.sessionToken || !result.sessionExpiry) {
            return false;
        }

        // Check if session expired
        if (Date.now() > result.sessionExpiry) {
            await chrome.storage.local.remove(['sessionToken', 'sessionExpiry']);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

// Delete this page's own history from browser
function deleteOwnHistory() {
    const currentUrl = window.location.href;

    setTimeout(async () => {
        try {
            await chrome.history.deleteUrl({ url: currentUrl });
            console.log('Own history deleted');
        } catch (error) {
            console.error('Failed to delete own history:', error);
        }
    }, 500);
}

// Load history
async function loadHistory() {
    try {
        const result = await chrome.storage.local.get(['customHistory']);
        allHistory = result.customHistory || [];
        displayHistory(allHistory);
        updateStats();
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Load library
async function loadLibrary() {
    try {
        const result = await chrome.storage.local.get(['savedLibrary']);
        allLibrary = result.savedLibrary || [];
        displayLibrary(allLibrary);
    } catch (error) {
        console.error('Error loading library:', error);
    }
}

// Display history
function displayHistory(history) {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');

    if (!historyList || !emptyState) return;

    if (history.length === 0) {
        historyList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    historyList.style.display = 'grid';
    emptyState.style.display = 'none';

    historyList.innerHTML = history.map(item => `
    <div class="history-item" data-url="${escapeHtml(item.url)}">
      <div class="item-icon">🕒</div>
      <div class="history-content">
        <div class="history-title">${escapeHtml(item.title || item.url)}</div>
        <div class="history-url">${escapeHtml(item.url)}</div>
        <div class="history-time">${formatTime(item.timestamp)}</div>
      </div>
      <button class="delete-item-btn" data-id="${escapeHtml(item.id)}" title="Delete">×</button>
    </div>
  `).join('');

    // Add click handlers
    document.querySelectorAll('#historyList .history-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-item-btn')) {
                chrome.tabs.create({ url: item.dataset.url });
            }
        });
    });

    document.querySelectorAll('#historyList .delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteItem(btn.dataset.id);
        });
    });
}

// Display library
function displayLibrary(library) {
    const libraryList = document.getElementById('libraryList');
    const emptyState = document.getElementById('libEmptyState');

    if (!libraryList || !emptyState) return;

    if (library.length === 0) {
        libraryList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    libraryList.style.display = 'grid';
    emptyState.style.display = 'none';

    libraryList.innerHTML = library.map(item => `
    <div class="history-item" data-url="${escapeHtml(item.url)}">
      <img src="${item.favicon || 'chrome://favicon/size/32@1x/' + escapeHtml(item.url)}" class="item-icon" alt="">
      <div class="history-content">
        <div class="history-title">${escapeHtml(item.title)}</div>
        <div class="history-url">${escapeHtml(item.url)}</div>
        ${item.description ? `<div class="library-desc">${escapeHtml(item.description)}</div>` : ''}
        <div class="library-date">${formatTime(item.dateAdded || item.timestamp)}</div>
      </div>
      <button class="delete-lib-btn" data-id="${escapeHtml(item.id)}" title="Remove">×</button>
    </div>
  `).join('');

    // Add click handlers
    document.querySelectorAll('#libraryList .history-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-lib-btn')) {
                chrome.tabs.create({ url: item.dataset.url });
            }
        });
    });

    document.querySelectorAll('#libraryList .delete-lib-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteLibraryItem(btn.dataset.id);
        });
    });
}

// Search history
function searchHistory(query) {
    if (!query.trim()) {
        displayHistory(allHistory);
        return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allHistory.filter(item =>
        item.url.toLowerCase().includes(lowerQuery) ||
        item.title.toLowerCase().includes(lowerQuery)
    );

    displayHistory(filtered);
}

// Search library
function searchLibrary(query) {
    if (!query.trim()) {
        displayLibrary(allLibrary);
        return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allLibrary.filter(item =>
        item.url.toLowerCase().includes(lowerQuery) ||
        item.title.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery))
    );

    displayLibrary(filtered);
}

// Delete single item
async function deleteItem(id) {
    try {
        await chrome.runtime.sendMessage({
            action: 'deleteHistoryItem',
            itemId: id
        });

        allHistory = allHistory.filter(item => item.id !== id);
        displayHistory(allHistory);
        updateStats();
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

// Delete library item
async function deleteLibraryItem(id) {
    try {
        allLibrary = allLibrary.filter(item => item.id !== id);
        await chrome.storage.local.set({ savedLibrary: allLibrary });
        displayLibrary(allLibrary);
    } catch (error) {
        console.error('Error deleting library item:', error);
    }
}

// Clear all history
async function clearAll() {
    if (!confirm(LanguageManager.t('confirmClearAll'))) {
        return;
    }

    try {
        await chrome.runtime.sendMessage({ action: 'clearHistory' });
        allHistory = [];
        displayHistory(allHistory);
        updateStats();
    } catch (error) {
        console.error('Error clearing history:', error);
    }
}

// Lock and close
async function lock() {
    // Clear session
    await chrome.storage.local.remove(['sessionToken', 'sessionExpiry']);
    window.close();
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setup Event Listeners started');

    // Search inputs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchHistory(e.target.value);
        });
    }

    const libSearchInput = document.getElementById('libSearchInput');
    if (libSearchInput) {
        libSearchInput.addEventListener('input', (e) => {
            searchLibrary(e.target.value);
        });
    }

    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearAll);

    const lockBtn = document.getElementById('lockBtn');
    if (lockBtn) lockBtn.addEventListener('click', lock);

    // Tab switching
    const tabs = document.querySelectorAll('.nav-tab');
    const views = document.querySelectorAll('.tab-view');

    console.log(`Found ${tabs.length} tabs`);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            console.log('Tab clicked:', target);

            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update views
            views.forEach(view => {
                view.style.display = 'none';
                view.classList.remove('active');
            });

            const activeView = document.getElementById(`${target}View`);
            if (activeView) {
                console.log('Switching to view:', activeView.id);
                activeView.style.display = 'block';
                activeView.classList.add('active');
            } else {
                console.error('View not found:', target);
            }
        });
    });

    // Export/Import History
    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', exportHistoryToCSV);
    }

    const importHistoryBtn = document.getElementById('importHistoryBtn');
    const importHistoryFile = document.getElementById('importHistoryFile');
    if (importHistoryBtn && importHistoryFile) {
        importHistoryBtn.addEventListener('click', () => importHistoryFile.click());
        importHistoryFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importHistoryFromCSV(file);
                e.target.value = ''; // Reset file input
            }
        });
    }

    // Export/Import Library
    const exportLibraryBtn = document.getElementById('exportLibraryBtn');
    if (exportLibraryBtn) {
        exportLibraryBtn.addEventListener('click', exportLibraryToCSV);
    }

    const importLibraryBtn = document.getElementById('importLibraryBtn');
    const importLibraryFile = document.getElementById('importLibraryFile');
    if (importLibraryBtn && importLibraryFile) {
        importLibraryBtn.addEventListener('click', () => importLibraryFile.click());
        importLibraryFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importLibraryFromCSV(file);
                e.target.value = ''; // Reset file input
            }
        });
    }

    // Delete own history periodically
    setInterval(deleteOwnHistory, 2000);
}

// Update stats
function updateStats() {
    const count = allHistory.length;
    const historyCount = document.getElementById('historyCount');
    if (historyCount) {
        const itemText = LanguageManager.t('items');
        historyCount.textContent = `${count} ${itemText}`;
    }
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// CSV EXPORT/IMPORT FUNCTIONS
// ============================================================================

// Convert array to CSV string
function arrayToCSV(data, headers) {
    if (!data || data.length === 0) return '';

    const rows = [headers.join(',')];

    data.forEach(item => {
        const row = headers.map(header => {
            let value = item[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            return value;
        });
        rows.push(row.join(','));
    });

    return rows.join('\n');
}

// Parse CSV string to array
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
            const obj = {};
            headers.forEach((header, index) => {
                let value = values[index].trim();
                // Remove surrounding quotes
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1).replace(/""/g, '"');
                }
                obj[header] = value;
            });
            result.push(obj);
        }
    }

    return result;
}

// Download CSV file
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Export History to CSV
function exportHistoryToCSV() {
    if (allHistory.length === 0) {
        alert(LanguageManager.t('noHistoryYet'));
        return;
    }

    const headers = ['id', 'url', 'title', 'timestamp'];
    const csvContent = arrayToCSV(allHistory, headers);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `history_${date}.csv`);
}

// Export Library to CSV
function exportLibraryToCSV() {
    if (allLibrary.length === 0) {
        alert(LanguageManager.t('libraryEmpty'));
        return;
    }

    const headers = ['id', 'url', 'title', 'description', 'favicon', 'dateAdded'];
    const csvContent = arrayToCSV(allLibrary, headers);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `library_${date}.csv`);
}

// Import History from CSV
async function importHistoryFromCSV(file) {
    try {
        const text = await file.text();
        const imported = parseCSV(text);

        if (imported.length === 0) {
            alert(LanguageManager.t('importError'));
            return;
        }

        // Merge with existing history (avoid duplicates by URL+timestamp)
        const existingKeys = new Set(allHistory.map(h => `${h.url}_${h.timestamp}`));
        const newItems = imported.filter(item => {
            const key = `${item.url}_${item.timestamp}`;
            return !existingKeys.has(key);
        });

        if (newItems.length > 0) {
            allHistory = [...newItems, ...allHistory];
            await chrome.storage.local.set({ customHistory: allHistory });
            displayHistory(allHistory);
            updateStats();
            alert(`${LanguageManager.t('importSuccess')} (${newItems.length} items)`);
        } else {
            alert(LanguageManager.t('importSuccess') + ' (0 new items)');
        }
    } catch (error) {
        console.error('Import error:', error);
        alert(LanguageManager.t('importError'));
    }
}

// Import Library from CSV
async function importLibraryFromCSV(file) {
    try {
        const text = await file.text();
        const imported = parseCSV(text);

        if (imported.length === 0) {
            alert(LanguageManager.t('importError'));
            return;
        }

        // Merge with existing library (avoid duplicates by URL)
        const existingUrls = new Set(allLibrary.map(l => l.url));
        const newItems = imported.filter(item => !existingUrls.has(item.url));

        if (newItems.length > 0) {
            allLibrary = [...newItems, ...allLibrary];
            await chrome.storage.local.set({ savedLibrary: allLibrary });
            displayLibrary(allLibrary);
            alert(`${LanguageManager.t('importSuccess')} (${newItems.length} items)`);
        } else {
            alert(LanguageManager.t('importSuccess') + ' (0 new items)');
        }
    } catch (error) {
        console.error('Import error:', error);
        alert(LanguageManager.t('importError'));
    }
}
