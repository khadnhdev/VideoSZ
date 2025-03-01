require('dotenv').config();
const express = require('express');
const path = require('path');
const routes = require('./routes');
const db = require('./config/database');
const promptService = require('./services/promptService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware riêng cho video để đảm bảo MIME type đúng
app.use('/public/uploads', (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  if (ext === '.mp4') {
    res.setHeader('Content-Type', 'video/mp4');
  } else if (ext === '.avi') {
    res.setHeader('Content-Type', 'video/x-msvideo');
  } else if (ext === '.mov') {
    res.setHeader('Content-Type', 'video/quicktime');
  } else if (ext === '.wmv') {
    res.setHeader('Content-Type', 'video/x-ms-wmv');
  }
  next();
});

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
📋 Prompts templates: ${Object.keys(promptService.templates).length} templates đã tải
🤖 Models: Whisper (${process.env.OPENAI_WHISPER_MODEL || 'whisper-1'}), Summary (${process.env.GOOGLE_SUMMARY_MODEL || 'gemini-2.0-flash'}), Detail (${process.env.GOOGLE_DETAIL_MODEL || 'gemini-2.0-flash'})
🔗 OpenAI API Endpoint: ${process.env.OPENAI_API_ENDPOINT || 'Mặc định (api.openai.com)'}
====================================================
  `);
}); 