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

// Function to clean a specific tab
function cleanTabHistory(tabId) {
    if (tabSessionHistory.has(tabId)) {
        const urls = Array.from(tabSessionHistory.get(tabId));
        console.log(`[PLD] Cleaning Tab ${tabId} (${urls.length} URLs)`);

        urls.forEach(url => {
            // Delete from browser history
            chrome.history.deleteUrl({ url: url });

            try {
                const origin = new URL(url).origin;
                // Cache can be removed by origin
                chrome.browsingData.remove({ origins: [origin] }, { cache: true });
            } catch (e) {
                console.error('[PLD] Error removing cache:', e);
            }

            // formData doesn't support origin filtering, remove globally
            try {
                chrome.browsingData.remove({}, { formData: true });
            } catch (e) {
                console.error('[PLD] Error removing formData:', e);
            }
        });

        tabSessionHistory.delete(tabId);
    }
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
