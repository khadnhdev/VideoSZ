const { GoogleGenerativeAI } = require('@google/generative-ai');
const Video = require('../models/Video');

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

      // Tạo prompt cho Gemini
      console.log('🔍 Đang tạo prompt cho Gemini...');
      const prompt = `
        Dưới đây là bản transcription của một đoạn video/audio. Hãy tóm tắt lại nội dung chính theo các mục:
        1. Ý chính (5-7 điểm quan trọng nhất)
        2. Danh sách các hành động cần thực hiện (Action Items)
        3. Kết luận

        Format kết quả như sau:
        # Tóm tắt nội dung
        
        ## Ý chính
        - Ý chính 1: <mô tả ngắn gọn>
        - Ý chính 2: <mô tả ngắn gọn>
        ...
        
        ## Action Items
        - [ ] Action item 1
        - [ ] Action item 2
        ...
        
        ## Kết luận
        <tóm tắt kết luận>

        Transcription:
        ${video.transcript}
      `;
      
      console.log(`📐 Độ dài prompt: ${prompt.length} ký tự`);

      // Gọi API Gemini để summary
      console.log('🌐 Đang gọi API Gemini...');
      console.log('⚙️ Sử dụng model: gemini-2.0-flash');
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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