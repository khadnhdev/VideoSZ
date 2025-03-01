const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join('public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Đã tạo thư mục uploads');
}

// Cài đặt các gói cần thiết
console.log('Đang cài đặt các gói cần thiết...');
try {
  execSync('npm install ffmpeg-static@latest', { stdio: 'inherit' });
  console.log('Đã cài đặt ffmpeg-static thành công');
} catch (error) {
  console.error('Lỗi khi cài đặt ffmpeg-static:', error);
}

console.log('Quá trình thiết lập hoàn tất. Hãy chạy "npm start" để khởi động ứng dụng'); 