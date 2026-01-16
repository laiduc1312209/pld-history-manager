// ============================================================================
// PLD History Manager - Background Service Worker
// ============================================================================
// STRATEGY: "Smart Session Cleaning" + "Periodic Garbage Collection"
// 1. Browsing: Track sensitive URLs in memory.
// 2. Tab Close: DELETE tracked URLs.
// 3. FAIL-SAFE: Every 1 min, check for "Zombie Tabs" (tracked but closed) and clean them.
//    (Fixes issue where Service Worker sleeps and misses the close event)
// ============================================================================

let filterEnabled = false;
let filterKeywords = [];
let pinHash = null;

// Map: tabId -> Set(urls)
const tabSessionHistory = new Map();

// Initialize
chrome.storage.local.get(['filterEnabled', 'filterKeywords', 'pinHash'], (result) => {
    filterEnabled = result.filterEnabled || false;
    filterKeywords = result.filterKeywords || [];
    pinHash = result.pinHash || null;
    console.log('[PLD] Service Ready. Mode: Smart Session + GC');

    // Create alarm for periodic cleanup (every 1 minute)
    chrome.alarms.create('garbageCollect', { periodInMinutes: 1 });
});

// Settings Watcher
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.filterEnabled) filterEnabled = changes.filterEnabled.newValue;
        if (changes.filterKeywords) filterKeywords = changes.filterKeywords.newValue || [];
        if (changes.pinHash) pinHash = changes.pinHash.newValue;
    }
});

// ============================================================================
// 1. FILTER CHECK
// ============================================================================
function isSensitive(url, title) {
    if (!filterEnabled || !filterKeywords.length) return false;
    if (!url || url.startsWith('chrome') || url.startsWith('about:') || url.startsWith('edge:')) return false;

    const urlLower = url.toLowerCase();
    const titleLower = (title || '').toLowerCase();

    // Check if any keyword exists in URL or title
    return filterKeywords.some(k => {
        const keyword = k.toLowerCase();
        return urlLower.includes(keyword) || titleLower.includes(keyword);
    });
}

// ============================================================================
// 2. TRACKING
// ============================================================================
function trackUrlForTab(tabId, url, title) {
    if (!tabSessionHistory.has(tabId)) {
        tabSessionHistory.set(tabId, new Set());
    }

    const cleanUrl = url.split('#')[0];
    if (isSensitive(cleanUrl, title)) {
        const tabSet = tabSessionHistory.get(tabId);
        if (!tabSet.has(cleanUrl)) {
            tabSet.add(cleanUrl);
            console.log(`[PLD] Tracking (Tab ${tabId}): ${cleanUrl} - "${title}"`);

            saveToCustomHistory({
                url: cleanUrl,
                title: title || cleanUrl,
                timestamp: Date.now(),
                id: `${cleanUrl}_${Date.now()}`
            });
            updateBadge(tabId, tabSet.size);
        }
    }
}

function updateBadge(tabId, count) {
    chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '', tabId: tabId });
    if (count > 0) chrome.action.setBadgeBackgroundColor({ color: '#666', tabId: tabId });
}

// ============================================================================
// 3. LISTENERS
// ============================================================================
chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return;
    let title = details.url;
    try {
        const tab = await chrome.tabs.get(details.tabId);
        title = tab.title;
    } catch (e) { }
    trackUrlForTab(details.tabId, details.url, title);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        trackUrlForTab(tabId, changeInfo.url, tab.title);
    }
});

// ============================================================================
// 4. CLEANUP (The important part)
// ============================================================================

// A. Event-based (Immediate)
chrome.tabs.onRemoved.addListener((tabId) => {
    cleanTabHistory(tabId);
});

// B. Alarm-based (Fail-safe)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'garbageCollect') {
        performGarbageCollection();
    }
});

// Function to clean a specific tab - AGGRESSIVE DELETION
async function cleanTabHistory(tabId) {
    if (tabSessionHistory.has(tabId)) {
        const urls = Array.from(tabSessionHistory.get(tabId));
        console.log(`[PLD] ⚡ AGGRESSIVE CLEAN Tab ${tabId} (${urls.length} URLs)`);

        // ========================================================================
        // STRATEGY: Delete URL + All Variations + Time-based Fallback
        // ========================================================================
        for (const url of urls) {
            await deleteUrlCompletely(url);
        }

        tabSessionHistory.delete(tabId);
        console.log(`[PLD] ✅ Tab ${tabId} cleaned completely`);
    }
}

// Delete URL with all variations and fallbacks
async function deleteUrlCompletely(url) {
    console.log(`[PLD] 🗑️  Deleting: ${url}`);

    // Step 1: Generate all URL variations
    const variations = generateUrlVariations(url);

    // Step 2: Delete each variation from history
    for (const variant of variations) {
        try {
            await chrome.history.deleteUrl({ url: variant });
            console.log(`[PLD]   ├─ Deleted: ${variant}`);
        } catch (e) {
            // Ignore errors - URL might not exist
        }
    }

    // Step 3: TIME-BASED FALLBACK (Nuclear option)
    // Search history for this URL and delete by time range
    try {
        const results = await chrome.history.search({
            text: url,
            maxResults: 1000,
            startTime: 0
        });

        for (const item of results) {
            // Check if URL matches (case-insensitive)
            if (item.url && item.url.toLowerCase().includes(url.toLowerCase())) {
                try {
                    await chrome.history.deleteUrl({ url: item.url });
                    console.log(`[PLD]   ├─ Time-based delete: ${item.url}`);
                } catch (e) {
                    // Ignore
                }
            }
        }
    } catch (e) {
        console.error('[PLD] Error in time-based deletion:', e);
    }

    // Step 4: Clear all browsing data for this origin
    try {
        const origin = new URL(url).origin;

        // Remove cache, cookies, localStorage, etc.
        await chrome.browsingData.remove(
            { origins: [origin] },
            {
                cache: true,
                cacheStorage: true,
                cookies: true,
                localStorage: true,
                serviceWorkers: true
            }
        );

        console.log(`[PLD]   └─ Cleared browsing data for: ${origin}`);
    } catch (e) {
        console.error('[PLD] Error removing browsing data:', e);
    }

    // Step 5: Clear form data globally (can't be scoped to origin)
    try {
        await chrome.browsingData.remove({}, { formData: true });
    } catch (e) {
        // Ignore
    }
}

// Generate URL variations (http/https, www/non-www, trailing slash, etc.)
function generateUrlVariations(url) {
    const variations = new Set();
    variations.add(url);

    try {
        const urlObj = new URL(url);
        const protocols = ['http:', 'https:'];
        const hosts = [urlObj.hostname];

        // Add www variations
        if (urlObj.hostname.startsWith('www.')) {
            hosts.push(urlObj.hostname.substring(4));
        } else {
            hosts.push('www.' + urlObj.hostname);
        }

        // Generate all combinations
        protocols.forEach(protocol => {
            hosts.forEach(host => {
                const pathWithSlash = urlObj.pathname.endsWith('/')
                    ? urlObj.pathname
                    : urlObj.pathname + '/';
                const pathWithoutSlash = urlObj.pathname.endsWith('/')
                    ? urlObj.pathname.slice(0, -1)
                    : urlObj.pathname;

                // With and without trailing slash
                [pathWithSlash, pathWithoutSlash].forEach(path => {
                    const variant = `${protocol}//${host}${path}${urlObj.search}${urlObj.hash}`;
                    variations.add(variant);

                    // Also add without hash
                    if (urlObj.hash) {
                        const noHash = `${protocol}//${host}${path}${urlObj.search}`;
                        variations.add(noHash);
                    }

                    // Also add without search
                    if (urlObj.search) {
                        const noSearch = `${protocol}//${host}${path}${urlObj.hash}`;
                        variations.add(noSearch);
                    }

                    // Also add without both
                    if (urlObj.search || urlObj.hash) {
                        const clean = `${protocol}//${host}${path}`;
                        variations.add(clean);
                    }
                });
            });
        });
    } catch (e) {
        console.error('[PLD] Error generating URL variations:', e);
    }

    return Array.from(variations);
}

// Function to find closed tabs that we're still tracking
async function performGarbageCollection() {
    console.log('[PLD] Running Garbage Collection...');
    const trackedTabIds = Array.from(tabSessionHistory.keys());

    if (trackedTabIds.length === 0) return;

    // Get all currently open tabs
    const openTabs = await chrome.tabs.query({});
    const openTabIds = new Set(openTabs.map(t => t.id));

    // Find tracked IDs that are NOT in openTabIds
    trackedTabIds.forEach(tabId => {
        if (!openTabIds.has(tabId)) {
            console.log(`[PLD] Found Zombie Tab ${tabId} (Closed but missed). Force cleaning.`);
            cleanTabHistory(tabId);
        }
    });
}

// ============================================================================
// HELPERS
// ============================================================================
async function saveToCustomHistory(entry) {
    try {
        const result = await chrome.storage.local.get(['customHistory']);
        let history = result.customHistory || [];
        history.unshift(entry);
        if (history.length > 2000) history = history.slice(0, 2000);
        await chrome.storage.local.set({ customHistory: history });
    } catch (error) { console.error(error); }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'clearHistory') {
        chrome.storage.local.set({ customHistory: [] }, () => sendResponse({ success: true }));
        return true;
    }
    if (request.action === 'deleteHistoryItem') {
        chrome.storage.local.get(['customHistory'], (result) => {
            let h = result.customHistory || [];
            h = h.filter(item => item.id !== request.itemId);
            chrome.storage.local.set({ customHistory: h }, () => sendResponse({ success: true }));
        });
        return true;
    }
});
