const { GoogleGenerativeAI } = require('@google/generative-ai');
const Video = require('../models/Video');

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

      // Tạo prompt cho Gemini
      console.log('🔍 Đang tạo prompt cho Gemini...');
      const prompt = `
        Đây là một ý chính từ bản tóm tắt của transcript: "${keyPoint}"
        
        Hãy triển khai thêm về ý chính này dựa trên transcript gốc dưới đây. 
        Cần chỉ ra những đoạn trong transcript nhắc đến ý chính này, trích dẫn chính xác,
        và giải thích chi tiết hơn.
        
        Lưu ý quan trọng:
        1. KHÔNG tự bịa thông tin không có trong transcript
        2. Nếu không có đủ thông tin trong transcript, hãy nói rõ điều đó
        3. Trích dẫn chính xác nội dung từ transcript và đặt trong dấu ngoặc kép
        4. Chỉ sử dụng thông tin từ transcript dưới đây
        
        Format kết quả:
        ## Chi tiết về: ${keyPoint}
        
        ### Trích dẫn liên quan
        - "Trích dẫn 1 từ transcript"
        - "Trích dẫn 2 từ transcript"
        
        ### Phân tích
        <Phân tích chi tiết về ý chính dựa trên các trích dẫn>
        
        Transcript gốc:
        ${video.transcript}
      `;
      
      console.log(`📐 Độ dài prompt: ${prompt.length} ký tự`);

      // Gọi API Gemini để phân tích
      console.log('🌐 Đang gọi API Gemini...');
      console.log('⚙️ Sử dụng model: gemini-2.0-flash');
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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