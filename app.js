require('dotenv').config();
const express = require('express');
const path = require('path');
const routes = require('./routes');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Thiết lập view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Đã xảy ra lỗi!' });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`
====================================================
🚀 Server đang chạy tại http://localhost:${PORT}
====================================================
📁 Thư mục uploads: ${path.join(__dirname, 'public', 'uploads')}
🔑 API keys được cấu hình: ${process.env.OPENAI_API_KEY ? '✅ OpenAI' : '❌ OpenAI'}, ${process.env.GOOGLE_API_KEY ? '✅ Google' : '❌ Google'}
⚙️ FFmpeg path: ${require('ffmpeg-static')}
====================================================
  `);
}); 