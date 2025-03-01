const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join('public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Đã tạo thư mục uploads');
}

// Tạo thư mục prompts nếu chưa tồn tại
const promptsDir = path.join(__dirname, 'prompts');
if (!fs.existsSync(promptsDir)) {
  fs.mkdirSync(promptsDir, { recursive: true });
  console.log('Đã tạo thư mục prompts');
}

// Cài đặt các gói cần thiết
console.log('Đang cài đặt các gói cần thiết...');
try {
  execSync('npm install ffmpeg-static@latest', { stdio: 'inherit' });
  console.log('Đã cài đặt ffmpeg-static thành công');
} catch (error) {
  console.error('Lỗi khi cài đặt ffmpeg-static:', error);
}

// Kiểm tra và tạo file .env nếu chưa tồn tại
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('Đã tạo file .env từ mẫu. Vui lòng cập nhật API keys của bạn.');
}

// Kiểm tra kết nối đến OpenAI
if (fs.existsSync(envPath)) {
  try {
    require('dotenv').config();
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ Tìm thấy OpenAI API key, đang kiểm tra kết nối...');
      
      const OpenAI = require('openai');
      const openAIConfig = {
        apiKey: process.env.OPENAI_API_KEY,
      };
      
      if (process.env.OPENAI_API_ENDPOINT) {
        openAIConfig.baseURL = process.env.OPENAI_API_ENDPOINT;
        console.log(`🔗 Sử dụng OpenAI API endpoint tùy chỉnh: ${process.env.OPENAI_API_ENDPOINT}`);
      }
      
      const openai = new OpenAI(openAIConfig);
      
      // Chỉ log thông tin, không thực hiện API call trong quá trình setup
      console.log('⚙️ Đã cấu hình OpenAI client thành công');
    }
  } catch (error) {
    console.error('❌ Lỗi khi cấu hình OpenAI:', error);
  }
}

console.log('Quá trình thiết lập hoàn tất. Hãy chạy "npm start" để khởi động ứng dụng'); 