// Language System for PLD History Manager
const translations = {
  vi: {
    // Header
    appName: 'PLD History Manager',
    tagline: 'Xóa lịch sử, giúp bạn trở nên trong sáng hơn',

    // Update Banner
    newVersionAvailable: 'Phiên bản mới đã có!',
    getIt: 'Tải ngay',

    // Language Selection (First Install)
    selectLanguage: 'Chọn ngôn ngữ',
    selectLanguageSubtitle: 'Chọn ngôn ngữ ưa thích của bạn',

    // Toggle
    urlFilterProtection: 'Bảo vệ lọc URL',

    // Current URL Section
    currentPage: 'Trang hiện tại',
    loading: 'Đang tải...',
    addToLibrary: 'Thêm vào Thư viện',


    // PIN Choice (First Install)
    usePinProtection: 'Sử dụng bảo vệ PIN?',
    pinChoiceSubtitle: 'Mã PIN bảo vệ lịch sử và cài đặt của bạn khỏi truy cập trái phép',
    yesUsePin: 'Có, sử dụng PIN',
    noSkipPin: 'Không, bỏ qua',

    // PIN Setup
    setupSecurityPin: 'Thiết lập mã PIN bảo mật',
    createPinSubtitle: 'Tạo mã PIN 4 chữ số để bảo vệ lịch sử của bạn',
    enterPin: 'Nhập mã PIN',
    confirmPin: 'Xác nhận mã PIN',
    createPin: 'Tạo mã PIN',
    pinMismatch: 'Mã PIN không khớp',
    pinTooShort: 'Mã PIN phải có 4 chữ số',

    // Main Buttons
    viewHistory: 'Xem lịch sử',
    settings: 'Cài đặt',

    // Settings Panel
    urlFilterSettings: 'Cài đặt lọc URL',
    close: 'Đóng',
    settingsHint: 'Chỉ xóa lịch sử trình duyệt của URL chứa từ khóa bên dưới',
    keywords: 'Từ khóa:',
    enterKeyword: 'Nhập từ khóa...',
    deleteInfo: 'Xóa: lịch sử + dữ liệu form + gợi ý',
    security: 'Bảo mật:',
    setPin: 'Đặt mã PIN',
    changePin: 'Đổi mã PIN',
    removePin: 'Xóa mã PIN',
    confirmRemovePin: 'Bạn có chắc muốn xóa mã PIN? Extension sẽ không còn được bảo vệ.',
    pinRemoved: 'Đã xóa mã PIN',
    language: 'Ngôn ngữ:',
    importantNote: 'Lưu ý quan trọng:',
    warningTitle: 'Để tránh tạo gợi ý trong thanh địa chỉ:',
    warningText1: 'Tốt hơn là tìm kiếm bằng Google hoặc các công cụ tìm kiếm khác thay vì thanh tìm kiếm mặc định của trình duyệt để tránh lưu gợi ý tìm kiếm từ lịch sử của bạn, vì extension có thể không có quyền cần thiết để xóa chúng.',
    warningText2: 'Bạn nên sử dụng extension duyệt web ẩn danh để có kết quả tốt nhất.',

    // PIN Modal
    enterPinTitle: 'Nhập mã PIN',
    incorrectPin: 'Mã PIN không đúng',
    cancel: 'Hủy',
    open: 'Mở',

    // Library Modal
    addToLibraryTitle: 'Thêm vào Thư viện',
    title: 'Tiêu đề',
    titlePlaceholder: 'Tiêu đề...',
    description: 'Mô tả',
    descriptionPlaceholder: 'Mô tả (tùy chọn)...',
    url: 'URL',
    save: 'Lưu',

    // History Page
    historyManager: 'Quản lý Lịch sử',
    lock: 'Khóa',
    history: 'Lịch sử',
    library: 'Thư viện',
    searchPlaceholder: 'Tìm URL hoặc tiêu đề...',
    items: 'mục',
    clearAll: 'Xóa tất cả',
    noHistoryYet: 'Chưa có lịch sử',
    visitWebsite: 'Truy cập trang web để bắt đầu ghi lại',
    libraryEmpty: 'Thư viện trống',
    addFromPopup: 'Thêm trang từ popup của extension',
    searchLibrary: 'Tìm trong thư viện...',
    delete: 'Xóa',
    visit: 'Truy cập',
    confirmDelete: 'Bạn có chắc muốn xóa mục này?',
    confirmClearAll: 'Bạn có chắc muốn xóa toàn bộ lịch sử?',

    // Export/Import
    exportHistory: 'Xuất lịch sử',
    exportLibrary: 'Xuất thư viện',
    importHistory: 'Nhập lịch sử',
    importLibrary: 'Nhập thư viện',
    importSuccess: 'Đã nhập thành công!',
    importError: 'Lỗi khi nhập file. Vui lòng kiểm tra định dạng CSV.',
  },

  en: {
    // Header
    appName: 'PLD History Manager',
    tagline: 'Clean history, clear conscience',

    // Update Banner
    newVersionAvailable: 'New version available!',
    getIt: 'Get it',

    // Language Selection (First Install)
    selectLanguage: 'Select Language',
    selectLanguageSubtitle: 'Choose your preferred language',

    // Toggle
    urlFilterProtection: 'URL Filter Protection',

    // Current URL Section
    currentPage: 'Current Page',
    loading: 'Loading...',
    addToLibrary: 'Add to Library',

    // PIN Choice (First Install)
    usePinProtection: 'Use PIN Protection?',
    pinChoiceSubtitle: 'PIN protects your history and settings from unauthorized access',
    yesUsePin: 'Yes, Use PIN',
    noSkipPin: 'No, Skip',

    // PIN Setup
    setupSecurityPin: 'Setup Security PIN',
    createPinSubtitle: 'Create a 4-digit PIN to protect your history',
    enterPin: 'Enter PIN',
    confirmPin: 'Confirm PIN',
    createPin: 'Create PIN',
    pinMismatch: 'PINs do not match',
    pinTooShort: 'PIN must be 4 digits',

    // Main Buttons
    viewHistory: 'View History',
    settings: 'Settings',

    // Settings Panel
    urlFilterSettings: 'URL Filter Settings',
    close: 'Close',
    settingsHint: 'Only delete browser history of URLs containing keywords below',
    keywords: 'Keywords:',
    enterKeyword: 'Enter keyword...',
    deleteInfo: 'Deletes: history + form data + suggestions',
    security: 'Security:',
    setPin: 'Set PIN',
    changePin: 'Change PIN',
    removePin: 'Remove PIN',
    confirmRemovePin: 'Are you sure you want to remove PIN? The extension will no longer be protected.',
    pinRemoved: 'PIN Removed',
    language: 'Language:',
    importantNote: 'Important Note:',
    warningTitle: 'To avoid creating suggestions in address bar:',
    warningText1: 'It\'s better to search using Google or other search engines instead of the browser\'s default search bar to avoid saving search suggestions from your history, as extensions may not have the necessary permissions to delete them.',
    warningText2: 'You should use an incognito browsing extension for best results.',

    // PIN Modal
    enterPinTitle: 'Enter PIN',
    incorrectPin: 'Incorrect PIN',
    cancel: 'Cancel',
    open: 'Open',

    // Library Modal
    addToLibraryTitle: 'Add to Library',
    title: 'Title',
    titlePlaceholder: 'Title...',
    description: 'Description',
    descriptionPlaceholder: 'Description (optional)...',
    url: 'URL',
    save: 'Save',

    // History Page
    historyManager: 'History Manager',
    lock: 'Lock',
    history: 'History',
    library: 'Library',
    searchPlaceholder: 'Search URL or title...',
    items: 'items',
    clearAll: 'Clear All',
    noHistoryYet: 'No history yet',
    visitWebsite: 'Visit a website to start recording',
    libraryEmpty: 'Library is empty',
    addFromPopup: 'Add pages from the extension popup',
    searchLibrary: 'Search library...',
    delete: 'Delete',
    visit: 'Visit',
    confirmDelete: 'Are you sure you want to delete this item?',
    confirmClearAll: 'Are you sure you want to clear all history?',

    // Export/Import
    exportHistory: 'Export History',
    exportLibrary: 'Export Library',
    importHistory: 'Import History',
    importLibrary: 'Import Library',
    importSuccess: 'Import successful!',
    importError: 'Error importing file. Please check CSV format.',
  }
};

// Language utilities
const LanguageManager = {
  currentLanguage: 'en',

  // Initialize language system
  async init() {
    const stored = await chrome.storage.local.get(['language']);
    if (stored.language) {
      this.currentLanguage = stored.language;
    }
    return this.currentLanguage;
  },

  // Set language
  async setLanguage(lang) {
    if (translations[lang]) {
      this.currentLanguage = lang;
      await chrome.storage.local.set({ language: lang });
      return true;
    }
    return false;
  },

  // Get translation
  t(key) {
    return translations[this.currentLanguage][key] || translations['en'][key] || key;
  },

  // Apply translations to DOM
  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        if (element.hasAttribute('placeholder')) {
          element.placeholder = translation;
        } else {
          element.value = translation;
        }
      } else {
        element.textContent = translation;
      }
    });

    // Apply to placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });
  },

  // Check if language has been set
  async hasLanguageSet() {
    const stored = await chrome.storage.local.get(['language']);
    return !!stored.language;
  }
};
