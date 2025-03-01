const OpenAI = require('openai');
const fs = require('fs');
const Video = require('../models/Video');

class TranscriptionService {
  constructor() {
    // Cấu hình OpenAI với khả năng tùy chỉnh endpoint
    const openAIConfig = {
      apiKey: process.env.OPENAI_API_KEY,
    };
    
    // Thêm baseURL nếu được chỉ định trong biến môi trường
    if (process.env.OPENAI_API_ENDPOINT) {
      openAIConfig.baseURL = process.env.OPENAI_API_ENDPOINT;
      console.log(`🔗 Sử dụng OpenAI API endpoint tùy chỉnh: ${process.env.OPENAI_API_ENDPOINT}`);
    }
    
    this.openai = new OpenAI(openAIConfig);
  }

  async transcribeAudio(videoId) {
    const startTime = new Date();
    console.log(`\n🎙️ BẮT ĐẦU TRANSCRIBE AUDIO (${startTime.toISOString()})`);
    
    try {
      const video = await Video.findById(videoId);
      if (!video || !video.audio_path) {
        console.error('❌ VIDEO HOẶC AUDIO KHÔNG TỒN TẠI:', videoId);
        throw new Error('Video hoặc audio không tồn tại');
      }
      console.log(`📁 Thông tin audio: ID=${videoId}, Path=${video.audio_path}`);

      // Kiểm tra file audio tồn tại
      if (!fs.existsSync(video.audio_path)) {
        console.error(`❌ FILE AUDIO KHÔNG TỒN TẠI: ${video.audio_path}`);
        throw new Error(`File audio không tồn tại: ${video.audio_path}`);
      }
      
      const stats = fs.statSync(video.audio_path);
      console.log(`📊 Kích thước file audio: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

      // Đọc file audio
      console.log('📂 Đang đọc file audio...');
      const audioFile = fs.createReadStream(video.audio_path);

      // Gọi API OpenAI để transcribe
      console.log('🌐 Đang gọi API OpenAI Whisper...');
      console.log(`⚙️ Sử dụng model: ${process.env.OPENAI_WHISPER_MODEL || "whisper-1"}, ngôn ngữ: vi`);
      
      const response = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: process.env.OPENAI_WHISPER_MODEL || "whisper-1",
        language: "vi",
        response_format: "json",
      });

      // Lưu transcript vào database
      const transcript = response.text;
      console.log(`✅ Transcribe thành công: ${transcript.length} ký tự`);
      console.log(`📝 Đoạn đầu transcript: "${transcript.substring(0, 100)}..."`);
      
      console.log('💾 Đang lưu transcript vào database...');
      await Video.updateTranscript(videoId, transcript);
      console.log('✅ Đã lưu transcript vào database');

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      console.log(`⏱️ Thời gian transcribe: ${duration.toFixed(2)} giây`);
      console.log('🎙️ KẾT THÚC TRANSCRIBE AUDIO');

      return transcript;
    } catch (error) {
      console.error('❌ LỖI TRONG TRANSCRIBE_AUDIO:', error);
      throw error;
    }
  }
}

module.exports = new TranscriptionService(); 