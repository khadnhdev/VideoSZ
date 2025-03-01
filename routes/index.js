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
  
  // Trả về phản hồi ngay lập tức để trang front-end không bị block
  res.json({ 
    success: true, 
    message: 'Đang xử lý video, kiểm tra trạng thái để biết tiến độ'
  });
  
  // Khởi tạo trạng thái ban đầu
  await Video.updateStatus(videoId, {
    currentStep: 1,
    progress: 0,
    message: 'Đang chuẩn bị xử lý video'
  });
  
  // Tiếp tục xử lý trong background
  try {
    // Hàm tiện ích để delay
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Hàm cập nhật trạng thái
    async function updateProgress(step, progress, message) {
      console.log(`📊 Tiến độ: Bước ${step} - ${progress}% - ${message}`);
      await Video.updateStatus(videoId, { currentStep: step, progress, message });
    }
    
    // Bước 1: Chuyển video sang audio
    console.log('🎬 BƯỚC 1: Đang chuyển đổi video sang audio...');
    await updateProgress(1, 10, 'Bắt đầu chuyển đổi video sang audio');
    await delay(500); // Thêm delay để người dùng thấy tiến trình
    
    await updateProgress(1, 30, 'Đang xử lý video...');
    await delay(500);
    
    await updateProgress(1, 50, 'Đang trích xuất âm thanh...');
    const audioPath = await AudioService.convertVideoToAudio(videoId);
    console.log(`✅ Chuyển đổi audio thành công: ${audioPath}`);
    
    await updateProgress(1, 100, 'Đã chuyển đổi video sang audio');
    await delay(500);
    
    // Bước 2: Transcribe audio
    console.log('\n🎙️ BƯỚC 2: Đang transcribe audio...');
    await updateProgress(2, 10, 'Bắt đầu phân tích audio');
    await delay(500);
    
    await updateProgress(2, 40, 'Đang nhận dạng giọng nói...');
    await delay(1000);
    
    await updateProgress(2, 70, 'Đang chuyển đổi thành văn bản...');
    const transcript = await transcriptionService.transcribeAudio(videoId);
    console.log(`✅ Transcribe thành công (${transcript.length} ký tự)`);
    
    await updateProgress(2, 100, 'Đã hoàn thành transcribe');
    await delay(500);
    
    // Bước 3: Summary transcript
    console.log('\n📊 BƯỚC 3: Đang tạo summary từ transcript...');
    await updateProgress(3, 20, 'Đang phân tích nội dung transcript');
    await delay(500);
    
    await updateProgress(3, 60, 'Đang tạo tóm tắt thông minh...');
    await delay(1000);
    
    const summary = await summaryService.summarizeTranscript(videoId);
    console.log(`✅ Summary thành công (${summary.length} ký tự)`);
    
    await updateProgress(4, 100, 'Đã hoàn thành xử lý video');
    console.log('=== KẾT THÚC XỬ LÝ VIDEO ===\n');
  } catch (error) {
    console.error('❌ LỖI KHI XỬ LÝ VIDEO:', error);
    // Cập nhật trạng thái lỗi
    try {
      await Video.updateStatus(videoId, {
        error: error.message
      });
    } catch (dbError) {
      console.error('❌ LỖI KHI CẬP NHẬT TRẠNG THÁI LỖI:', dbError);
    }
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
    
    // Chuyển đổi đường dẫn để đảm bảo định dạng đúng
    if (video.video_path) {
      // Đảm bảo đường dẫn file có định dạng phù hợp với web server
      video.video_path = video.video_path.replace(/\\/g, '/');
      // Đảm bảo đường dẫn URL sẽ không có 'public/' ở đầu vì đó là thư mục tĩnh
      if (video.video_path.startsWith('public/')) {
        console.log('Original video path:', video.video_path);
        video.display_path = video.video_path.replace(/^public\//, '');
        console.log('Converted video path for display:', video.display_path);
      } else {
        video.display_path = video.video_path;
      }
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
    
    // Xác định trạng thái xử lý dựa trên dữ liệu hiện có
    let status = 'processing';
    let currentStep = 1;
    let progress = 0;
    let message = 'Đang xử lý video...';
    let error = video.processing_error || null;
    
    // Dùng phương pháp cũ để xác định trạng thái
    if (video.audio_path) {
      currentStep = 2;
      progress = 100;
      message = 'Đã chuyển đổi video sang audio';
      
      if (video.transcript) {
        currentStep = 3;
        message = 'Đã tạo transcript từ audio';
        
        if (video.summary) {
          status = 'completed';
          currentStep = 4;
          progress = 100;
          message = 'Đã hoàn thành xử lý video';
        }
      }
    }
    
    if (error) {
      status = 'error';
    }
    
    // Thử sử dụng thông tin từ các cột mới nếu có
    try {
      if (video.current_step) {
        currentStep = video.current_step;
      }
      
      if (video.progress !== undefined) {
        progress = video.progress;
      }
      
      if (video.status_message) {
        message = video.status_message;
      }
    } catch (e) {
      // Bỏ qua lỗi nếu các cột không tồn tại
      console.log('Các cột mới chưa được thêm vào database');
    }
    
    res.json({
      videoId,
      status,
      currentStep,
      progress,
      message,
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

// Thêm route để kiểm tra video
router.get('/check-video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Không tìm thấy video' });
    }
    
    // Kiểm tra file tồn tại
    const videoPath = path.join(__dirname, '..', video.video_path);
    fs.access(videoPath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ 
          error: 'File video không tồn tại trên server',
          path: videoPath,
          origPath: video.video_path
        });
      }
      
      res.json({
        success: true,
        message: 'File video tồn tại',
        path: videoPath,
        url: '/' + video.video_path.replace(/^public\//, '')
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi kiểm tra video', details: error.message });
  }
});

module.exports = router; 