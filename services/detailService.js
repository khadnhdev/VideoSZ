const { GoogleGenerativeAI } = require('@google/generative-ai');
const Video = require('../models/Video');
const promptService = require('./promptService');

class DetailService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  async expandKeyPoint(videoId, keyPoint) {
    const startTime = new Date();
    console.log(`\n🔍 BẮT ĐẦU TRIỂN KHAI Ý CHÍNH: "${keyPoint}" (${startTime.toISOString()})`);
    
    try {
      const video = await Video.findById(videoId);
      if (!video || !video.transcript) {
        console.error('❌ VIDEO HOẶC TRANSCRIPT KHÔNG TỒN TẠI:', videoId);
        throw new Error('Video hoặc transcript không tồn tại');
      }
      console.log(`📝 Thông tin transcript: ID=${videoId}, Độ dài=${video.transcript.length} ký tự`);

      // Tạo prompt cho Gemini sử dụng promptService
      console.log('🔍 Đang tạo prompt cho Gemini từ template...');
      const prompt = promptService.getPrompt('detail', {
        keyPoint: keyPoint,
        transcript: video.transcript
      });
      
      console.log(`📐 Độ dài prompt: ${prompt.length} ký tự`);

      // Gọi API Gemini để phân tích
      console.log('🌐 Đang gọi API Gemini...');
      console.log(`⚙️ Sử dụng model: ${process.env.GOOGLE_DETAIL_MODEL || "gemini-2.0-flash"}`);
      
      const model = this.genAI.getGenerativeModel({ 
        model: process.env.GOOGLE_DETAIL_MODEL || "gemini-2.0-flash" 
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const detail = response.text();

      console.log(`✅ Triển khai ý chính thành công: ${detail.length} ký tự`);
      console.log(`📝 Đoạn đầu phân tích: "${detail.substring(0, 100).replace(/\n/g, ' ')}..."`);

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      console.log(`⏱️ Thời gian triển khai ý chính: ${duration.toFixed(2)} giây`);
      console.log('🔍 KẾT THÚC TRIỂN KHAI Ý CHÍNH');

      return detail;
    } catch (error) {
      console.error('❌ LỖI KHI TRIỂN KHAI Ý CHÍNH:', error);
      console.error('Chi tiết lỗi:', error.stack);
      throw error;
    }
  }
}

module.exports = new DetailService(); 