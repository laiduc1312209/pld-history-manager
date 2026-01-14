# Hướng dẫn sử dụng tính năng Lọc URL theo từ khóa

## 🎯 Tính năng mới

Extension giờ đây cho phép bạn **tùy chỉnh việc xóa browser history** theo từ khóa!

## 📖 Cách sử dụng

### Bước 1: Mở Cài đặt

1. Click vào icon extension trên toolbar
2. Click nút **"⚙️ Cài đặt"** trong popup

### Bước 2: Bật Lọc URL

1. Tick vào checkbox **"Bật lọc URL"**
2. Chọn **Chế độ**:
   - **"Chỉ xóa URLs có từ khóa"** (Whitelist mode):
     - Extension CHỈ xóa browser history của những URL có chứa từ khóa bạn chỉ định
     - Các URL khác sẽ KHÔNG bị xóa khỏi browser history
     - **Ví dụ**: Nếu bạn nhập "hentai, adult", chỉ có URLs chứa "hentai" hoặc "adult" mới bị xóa
   
   - **"Xóa tất cả TRỪ URLs có từ khóa"** (Blacklist mode):
     - Extension xóa browser history của TẤT CẢ URLs
     - TRỪ những URL có chứa từ khóa bạn chỉ định
     - **Ví dụ**: Nếu bạn nhập "work, important", URLs chứa "work" hoặc "important" sẽ KHÔNG bị xóa, còn lại tất cả đều xóa

### Bước 3: Nhập Từ khóa

1. Trong ô **"Từ khóa"**, nhập các từ khóa cách nhau bằng dấu phẩy
2. **Ví dụ**: `xec`
3. Từ khóa KHÔNG phân biệt chữ hoa/thường

### Bước 4: Lưu Cài đặt

1. Click nút **"💾 Lưu cài đặt"**
2. Thông báo "✓ Đã lưu!" sẽ hiển thị
3. Extension sẽ áp dụng ngay lập tức!

## 💡 Các trường hợp sử dụng

### Trường hợp 1: Chỉ muốn ẩn một số trang web nhạy cảm

**Cài đặt:**
- Chế độ: **"Chỉ xóa URLs có từ khóa"**
- Từ khóa: `hentai, adult, nsfw, porn, xxx`

**Kết quả:**
- ✅ URL `https://example.com/hentai-manga` → Bị xóa khỏi browser history
- ❌ URL `https://facebook.com` → KHÔNG bị xóa, vẫn ở trong browser history
- ❌ URL `https://youtube.com` → KHÔNG bị xóa

### Trường hợp 2: Xóa tất cả trừ trang công việc

**Cài đặt:**
- Chế độ: **"Xóa tất cả TRỪ URLs có từ khóa"**
- Từ khóa: `work, office, company, important`

**Kết quả:**
- ❌ URL `https://company.work.com` → KHÔNG bị xóa (có "work")
- ❌ URL `https://office365.com` → KHÔNG bị xóa (có "office")
- ✅ URL `https://facebook.com` → Bị xóa
- ✅ URL `https://youtube.com` → Bị xóa

### Trường hợp 3: Tắt filter - Xóa tất cả như cũ

**Cài đặt:**
- Bỏ tick **"Bật lọc URL"**

**Kết quả:**
- ✅ MỌI URL đều bị xóa khỏi browser history (như phiên bản cũ)

## 🔍 Cách kiểm tra Filter hoạt động

1. Lưu settings với từ khóa `test`
2. Chế độ: "Chỉ xóa URLs có từ khóa"
3. Truy cập `https://www.test.com`
4. Mở browser history (`Ctrl+H`)
5. **Verify**: URL `test.com` ĐÃ BỊ XÓA
6. Truy cập `https://www.google.com`
7. Mở browser history
8. **Verify**: URL `google.com` VẪN CÒN (không bị xóa vì không chứa "test")

## ⚙️ Technical Details

- Từ khóa được lưu trong `chrome.storage.local`
- Filter check case-insensitive (không phân biệt hoa/thường)
- Filter áp dụng cho cả URL và hostname
- Settings tự động load khi mở popup

## 📝 Lưu ý

- Extension vẫn lưu TẤT CẢ URLs vào custom storage (không bị ảnh hưởng bởi filter)
- Filter chỉ ảnh hưởng đến việc XÓA browser history
- Nếu bạn muốn extension storage cũng chỉ lưu URLs có từ khóa, hãy cho tôi biết!
