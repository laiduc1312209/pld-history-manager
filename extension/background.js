// Service worker for real-time history monitoring and cleaning
// Optimized for strict privacy: deletes blacklisted URLs immediately upon visit

let filterEnabled = false;
let filterKeywords = [];
let pinHash = null;

// Initialize cache on load
chrome.storage.local.get(['filterEnabled', 'filterKeywords', 'pinHash'], (result) => {
    filterEnabled = result.filterEnabled || false;
    filterKeywords = result.filterKeywords || [];
    pinHash = result.pinHash || null;
    console.log('Background worker initialized. Filter:', filterEnabled ? 'ON' : 'OFF');
});

// Update cache on storage change
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.filterEnabled) {
            filterEnabled = changes.filterEnabled.newValue;
            console.log('Filter status updated:', filterEnabled);
        }
        if (changes.filterKeywords) {
            filterKeywords = changes.filterKeywords.newValue || [];
            console.log('Keywords updated:', filterKeywords);
        }
        if (changes.pinHash) {
            pinHash = changes.pinHash.newValue;
        }
    }
});

// INSTALL EVENT
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        const result = await chrome.storage.local.get(['pinHash']);
        if (!result.pinHash) {
            console.log('First install - Setup required');
        }
    }
});

// PRIMARY LISTENER: Monitors History immediately when added
chrome.history.onVisited.addListener(async (historyItem) => {
    // 1. Check if filtering is active
    if (!filterEnabled || !filterKeywords.length) return;

    const url = historyItem.url;

    // Ignore internal pages
    if (url.startsWith('chrome') || url.startsWith('about:') || url.startsWith('edge:')) return;

    // 2. Check blacklist (using cached variables for speed)
    const urlLower = url.toLowerCase();
    const hasKeyword = filterKeywords.some(k => urlLower.includes(k.toLowerCase()));

    if (hasKeyword) {
        console.log(`🚫 DETECTED BLACKLISTED URL: ${url}`);

        // 3. IMMEDIATE DELETION (The "Nuclear" Option)
        try {
            // Delete from Chrome History ASAP
            await chrome.history.deleteUrl({ url: url });
            console.log(`✅ Deleted from Chrome History: ${url}`);

            // 4. Save to our "Safe" Library/Log (Custom History)
            // We save it so YOU know you visited it, but Chrome doesn't
            const historyEntry = {
                url: url,
                title: historyItem.title || url,
                timestamp: Date.now(),
                id: `${url}_${Date.now()}`
            };
            await saveToCustomHistory(historyEntry);

            // 5. Clean up collateral data (Form data, etc)
            // This is slower, so we do it after history deletion
            chrome.browsingData.remove(
                { origins: [new URL(url).origin] },
                { formData: true, cache: false } // We don't clear cache to keep browsing fast, just sensitive data
            ).catch(err => console.log('Browsing data cleanup error (minor):', err));

        } catch (error) {
            console.error('CRITICAL: Failed to delete URL:', error);
        }
    }
});

// Save to custom internal storage
async function saveToCustomHistory(entry) {
    try {
        const result = await chrome.storage.local.get(['customHistory']);
        let history = result.customHistory || [];

        // Add to top
        history.unshift(entry);

        // Limits
        if (history.length > 2000) {
            history = history.slice(0, 2000);
        }

        await chrome.storage.local.set({ customHistory: history });
    } catch (error) {
        console.error('Error saving custom history:', error);
    }
}

// MESSAGE HANDLER
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'clearHistory') {
        chrome.storage.local.set({ customHistory: [] }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === 'deleteHistoryItem') {
        deleteHistoryItem(request.itemId).then(() => {
            sendResponse({ success: true });
        });
        return true;
    }
});

async function deleteHistoryItem(itemId) {
    const result = await chrome.storage.local.get(['customHistory']);
    let history = result.customHistory || [];
    history = history.filter(item => item.id !== itemId);
    await chrome.storage.local.set({ customHistory: history });
}
