# Video AI Assistant

Ứng dụng phân tích video bằng AI, tự động tạo transcript và tóm tắt nội dung.

## Cài đặt

1. **Cài đặt Node.js** (v14 trở lên)

2. **Cài đặt các gói phụ thuộc**:
   npm install

3. **Cấu hình file .env**:
   - Copy file .env.example thành .env
   - Cập nhật các API key:
     - OPENAI_API_KEY: Key của OpenAI
     - GOOGLE_API_KEY: Key của Google
     - PORT: 30212

## Sử dụng

1. **Khởi động**:
   npm start

2. **Truy cập**:
   http://localhost:30212

3. **Các bước sử dụng**:
   - Upload video (.mp4, .avi, .mov)
   - Chờ hệ thống xử lý
   - Xem kết quả: transcript, tóm tắt, phân tích

## Tính năng

- Tạo transcript tự động từ video
- Tóm tắt nội dung chính
- Phân tích chi tiết từng ý
- Hỏi đáp về nội dung video
- Tải xuống transcript và tóm tắt

## Lưu ý

- Cần có API key hợp lệ
- Thời gian xử lý phụ thuộc độ dài video
- Đảm bảo thư mục uploads có quyền ghi

---
© 2025 Video AI Assistant 