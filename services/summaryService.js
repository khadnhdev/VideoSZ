const { GoogleGenerativeAI } = require('@google/generative-ai');
const Video = require('../models/Video');
const promptService = require('./promptService');

class SummaryService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  async summarizeTranscript(videoId) {
    const startTime = new Date();
    console.log(`\n📊 BẮT ĐẦU TẠO SUMMARY (${startTime.toISOString()})`);
    
    try {
      const video = await Video.findById(videoId);
      if (!video || !video.transcript) {
        console.error('❌ VIDEO HOẶC TRANSCRIPT KHÔNG TỒN TẠI:', videoId);
        throw new Error('Video hoặc transcript không tồn tại');
      }
      console.log(`📝 Thông tin transcript: ID=${videoId}, Độ dài=${video.transcript.length} ký tự`);

      // Tạo prompt cho Gemini sử dụng promptService
      console.log('🔍 Đang tạo prompt cho Gemini từ template...');
      const prompt = promptService.getPrompt('summary', { 
        transcript: video.transcript 
      });
      
      console.log(`📐 Độ dài prompt: ${prompt.length} ký tự`);

      // Gọi API Gemini để summary
      console.log('🌐 Đang gọi API Gemini...');
      console.log(`⚙️ Sử dụng model: ${process.env.GOOGLE_SUMMARY_MODEL || "gemini-2.0-flash"}`);
      
      const model = this.genAI.getGenerativeModel({ 
        model: process.env.GOOGLE_SUMMARY_MODEL || "gemini-2.0-flash" 
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      console.log(`✅ Summary thành công: ${summary.length} ký tự`);
      console.log(`📝 Đoạn đầu summary: "${summary.substring(0, 100).replace(/\n/g, ' ')}..."`);

      // Lưu summary vào database
      console.log('💾 Đang lưu summary vào database...');
      await Video.updateSummary(videoId, summary);
      console.log('✅ Đã lưu summary vào database');

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      console.log(`⏱️ Thời gian tạo summary: ${duration.toFixed(2)} giây`);
      console.log('📊 KẾT THÚC TẠO SUMMARY');

      return summary;
    } catch (error) {
      console.error('❌ LỖI TRONG SUMMARIZE_TRANSCRIPT:', error);
      console.error('Chi tiết lỗi:', error.stack);
      throw error;
    }
  }
}

module.exports = new SummaryService(); 