# PLD History Manager

**Tiện ích mở rộng bảo vệ quyền riêng tư & Quản lý thư viện web chuyên nghiệp**

> "Clean history, clear conscience"

## Tính năng nổi bật

### Bảo vệ quyền riêng tư tuyệt đối
- **Real-time Cleaning**: Tự động xóa URL khỏi lịch sử trình duyệt **ngay lập tức** khi truy cập. Ngăn chặn tuyệt đối việc Chrome Omnibox gợi ý lại các trang web nhạy cảm.
- **Blacklist Filter**: Chỉ xóa history của các trang chứa từ khóa bạn cài đặt (VD: "facebook", "youtube").
- **Ẩn danh hoàn hảo**: Dữ liệu web form và search suggestions cũng được dọn dẹp sạch sẽ.

### Thư viện cá nhân (Library)
- **Lưu trữ thông minh**: Gặp trang hay? Lưu ngay vào Library thay vì Bookmark lộn xộn.
- **Ghi chú**: Thêm tiêu đề và mô tả tùy ý cho từng trang.
- **Tách biệt**: Library được lưu riêng biệt, không liên quan đến History của trình duyệt.

### Bảo mật 2 lớp (PIN Protection)
Extension được bảo vệ bằng mã PIN 4 số. Bạn phải nhập PIN khi:
- Truy cập **Settings**.
- Xem **History** đã lưu trong extension.
- Thêm trang mới vào **Library**.
- Đổi mã PIN.

## Cài đặt

1. **Tải về**: Clone hoặc tải source code về máy.
2. **Cài vào Chrome/Edge**:
   - Mở `chrome://extensions`
   - Bật **Developer mode**
   - Chọn **Load unpacked** -> Chọn thư mục extension.
3. **Thiết lập lần đầu**:
   - Mở extension.
   - Tạo mã PIN bảo vệ (4 số).
   - Vào Settings để cấu hình từ khóa chặn (nếu muốn dùng chế độ Filter).

## Hướng dẫn sử dụng

### 1. Quản lý History (Chế độ Filter)
- Mở **Settings** -> Bật **URL Filter Protection**.
- Thêm từ khóa (VD: `i210`, `hỏn pub`).- Từ giờ, bất kỳ trang nào chứa từ khóa này sẽ bị xóa khỏi Chrome History ngay tức khắc!

### 2. Thêm vào Library
- Đang ở trang web muốn lưu -> Mở extension.
- Bấm nút **"Add to Library"**.
- Nhập PIN xác thực.
- Điền tiêu đề/mô tả -> **Save**.

### 3. Xem lại & Quản lý
- Bấm **"View History"** -> Nhập PIN.
- Tab **History**: Xem các trang đã duyệt (được extension lưu riêng).
- Tab **Library**: Xem kho tàng trang web đã lưu.
- Bấm vào item để mở, hoặc bấm `×` để xóa.

### 4. Đổi mã PIN
- Vào **Settings** -> Bấm **"Change PIN"**.
- Nhập PIN cũ -> Tạo PIN mới -> **Update**.

## Cơ chế hoạt động

Extension sử dụng các API mạnh mẽ nhất của Chrome:
- `chrome.history.onVisited`: Bắt dính sự kiện duyệt web theo thời gian thực.
- `chrome.browsingData`: Xóa sạch dấu vết.
- `chrome.storage.local`: Lưu trữ dữ liệu an toàn ngay trên máy tính (không gửi đi đâu).

## Cam kết riêng tư
- **Offline 100%**: Không kết nối internet, không gửi dữ liệu về server.
- **Transparent**: Mã nguồn mở, bạn kiểm soát những gì đang chạy.

---
**Phát triển bởi laiduc1312209**
