const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const AudioService = require('../services/audioService');
const transcriptionService = require('../services/transcriptionService');
const summaryService = require('../services/summaryService');
const detailService = require('../services/detailService');
const marked = require('marked');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join('public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer để upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: function (req, file, cb) {
    // Kiểm tra định dạng file
    if (!file.originalname.match(/\.(mp4|avi|mov|flv|wmv)$/)) {
      return cb(new Error('Chỉ cho phép tải lên file video!'), false);
    }
    cb(null, true);
  }
});

// Trang chủ
router.get('/', (req, res) => {
  res.render('index');
});

// Upload video
router.post('/upload', upload.single('video'), async (req, res) => {
  console.log('=== BẮT ĐẦU UPLOAD VIDEO ===');
  try {
    if (!req.file) {
      console.log('❌ UPLOAD THẤT BẠI: Không có file nào được upload');
      return res.status(400).json({ error: 'Không có file nào được upload' });
    }

    console.log(`📁 File đã upload: ${req.file.originalname}`);
    console.log(`📂 Đường dẫn lưu trữ: ${req.file.path}`);
    console.log(`📊 Kích thước: ${(req.file.size / (1024 * 1024)).toFixed(2)} MB`);

    // Lưu thông tin video vào database - đảm bảo đường dẫn được chuẩn hóa
    const videoData = {
      originalFilename: req.file.originalname,
      videoPath: req.file.path.replace(/\\/g, '/') // Chuẩn hóa đường dẫn
    };
    
    console.log('💾 Đang lưu thông tin video vào database...');
    const video = await Video.create(videoData);
    console.log(`✅ Lưu thông tin video thành công. ID: ${video.id}`);
    
    // Chuyển hướng đến trang xử lý
    res.json({ 
      success: true, 
      message: 'Upload thành công', 
      videoId: video.id 
    });
    console.log('=== KẾT THÚC UPLOAD VIDEO ===');
  } catch (error) {
    console.error('❌ LỖI KHI UPLOAD:', error);
    res.status(500).json({ error: 'Lỗi khi upload file' });
  }
});

// Xử lý video (convert, transcribe, summary)
router.post('/process/:videoId', async (req, res) => {
  const { videoId } = req.params;
  console.log(`\n=== BẮT ĐẦU XỬ LÝ VIDEO (ID: ${videoId}) ===`);
  
  try {
    // Chuyển video sang audio
    console.log('🎬 BƯỚC 1: Đang chuyển đổi video sang audio...');
    const audioPath = await AudioService.convertVideoToAudio(videoId);
    console.log(`✅ Chuyển đổi audio thành công: ${audioPath}`);
    
    // Transcribe audio
    console.log('\n🎙️ BƯỚC 2: Đang transcribe audio...');
    const transcript = await transcriptionService.transcribeAudio(videoId);
    console.log(`✅ Transcribe thành công (${transcript.length} ký tự)`);
    console.log(`📝 Đoạn đầu transcript: "${transcript.substring(0, 100)}..."`);
    
    // Summary transcript
    console.log('\n📊 BƯỚC 3: Đang tạo summary từ transcript...');
    const summary = await summaryService.summarizeTranscript(videoId);
    console.log(`✅ Summary thành công (${summary.length} ký tự)`);
    
    res.json({ 
      success: true, 
      message: 'Xử lý thành công',
      redirect: `/result/${videoId}`
    });
    console.log('=== KẾT THÚC XỬ LÝ VIDEO ===\n');
  } catch (error) {
    console.error('❌ LỖI KHI XỬ LÝ VIDEO:', error);
    res.status(500).json({ error: 'Lỗi khi xử lý video' });
  }
});

// Hiển thị kết quả
router.get('/result/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).render('error', { message: 'Không tìm thấy video' });
    }
    
    res.render('result', { 
      video: video,
      marked: marked
    });
  } catch (error) {
    console.error('❌ LỖI KHI HIỂN THỊ TRANG KẾT QUẢ:', error);
    res.status(500).render('error', { message: 'Lỗi khi hiển thị kết quả' });
  }
});

// API để lấy chi tiết transcript từ một ý chính
router.get('/api/detail/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Thiếu từ khóa tìm kiếm' });
    }

    console.log(`\n🔍 Xử lý yêu cầu chi tiết ý chính: "${keyword}" cho video ID: ${videoId}`);
    
    // Gọi service mới để triển khai ý chính
    const detail = await detailService.expandKeyPoint(videoId, keyword);
    
    res.json({ 
      success: true, 
      detail: detail
    });
  } catch (error) {
    console.error('❌ LỖI KHI LẤY CHI TIẾT:', error);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết ý chính' });
  }
});

// API để lấy tất cả prompts
router.get('/api/prompts', (req, res) => {
  try {
    const promptService = require('../services/promptService');
    res.json({
      success: true,
      prompts: promptService.templates
    });
  } catch (error) {
    console.error('❌ LỖI KHI LẤY PROMPTS:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách prompts' });
  }
});

// API để tải lại prompts từ file
router.post('/api/prompts/reload', (req, res) => {
  try {
    const promptService = require('../services/promptService');
    const count = promptService.reloadPrompts();
    res.json({
      success: true,
      message: `Đã tải lại ${count} prompts thành công`
    });
  } catch (error) {
    console.error('❌ LỖI KHI TẢI LẠI PROMPTS:', error);
    res.status(500).json({ error: 'Lỗi khi tải lại prompts' });
  }
});

// API để hỏi đáp về nội dung video
router.get('/api/ask/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { question } = req.query;
    
    if (!question) {
      return res.status(400).json({ error: 'Thiếu câu hỏi' });
    }

    // Lấy thông tin video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Không tìm thấy video' });
    }
    
    // Đảm bảo video có transcript
    if (!video.transcript) {
      return res.status(400).json({ error: 'Video không có transcript để phân tích' });
    }
    
    // Gọi service để xử lý câu hỏi
    const answer = await detailService.answerQuestion(videoId, question);
    
    res.json({ 
      success: true, 
      answer: answer
    });
  } catch (error) {
    console.error('❌ LỖI KHI XỬ LÝ CÂU HỎI:', error);
    res.status(500).json({ error: 'Lỗi khi xử lý câu hỏi' });
  }
});

// Route để hiển thị trang xử lý video
router.get('/processing/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).render('error', { message: 'Không tìm thấy video' });
    }
    
    res.render('processing', { videoId });
  } catch (error) {
    console.error('❌ LỖI KHI HIỂN THỊ TRANG XỬ LÝ:', error);
    res.status(500).render('error', { message: 'Lỗi khi hiển thị trang xử lý' });
  }
});

// API để kiểm tra trạng thái xử lý video
router.get('/api/processing-status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Không tìm thấy video' });
    }
    
    // Xác định trạng thái xử lý dựa trên dữ liệu
    let status = 'processing';
    let currentStep = 1;
    let error = null;
    
    // Kiểm tra trạng thái dựa trên dữ liệu
    if (video.audio_path) {
      currentStep = 2; // Đã chuyển video sang audio
      
      if (video.transcript) {
        currentStep = 3; // Đã transcribe
        
        if (video.summary) {
          status = 'completed'; // Tất cả các bước đã hoàn thành
        }
      }
    }
    
    res.json({
      videoId,
      status,
      currentStep,
      error
    });
  } catch (error) {
    console.error('❌ LỖI KHI KIỂM TRA TRẠNG THÁI XỬ LÝ:', error);
    res.status(500).json({ 
      status: 'error', 
      error: 'Lỗi khi kiểm tra trạng thái xử lý' 
    });
  }
});

module.exports = router; 