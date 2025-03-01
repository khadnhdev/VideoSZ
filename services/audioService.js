const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');

// Thiết lập đường dẫn đến ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

class AudioService {
  static async convertVideoToAudio(videoId) {
    const startTime = new Date();
    console.log(`\n🔄 BẮT ĐẦU CHUYỂN ĐỔI AUDIO (${startTime.toISOString()})`);
    
    try {
      const video = await Video.findById(videoId);
      if (!video) {
        console.error('❌ VIDEO KHÔNG TỒN TẠI:', videoId);
        throw new Error('Video không tồn tại');
      }
      console.log(`📁 Thông tin video: ID=${videoId}, Path=${video.video_path}`);

      const videoPath = video.video_path;
      const audioFilename = `${path.basename(videoPath, path.extname(videoPath))}.mp3`;
      const audioDir = path.join('public', 'uploads');
      const audioPath = path.join(audioDir, audioFilename);

      // Đảm bảo thư mục tồn tại
      if (!fs.existsSync(audioDir)) {
        console.log(`📂 Tạo thư mục: ${audioDir}`);
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      console.log(`🔄 Đang chuyển đổi: ${videoPath} -> ${audioPath}`);
      console.log(`🛠️ Sử dụng FFmpeg path: ${ffmpegPath}`);

      return new Promise((resolve, reject) => {
        let ffmpegCommand = ffmpeg(videoPath)
          .output(audioPath)
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .on('start', (commandLine) => {
            console.log(`🚀 FFmpeg đang chạy lệnh: ${commandLine}`);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`⏳ Tiến độ chuyển đổi: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', async () => {
            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;
            console.log(`✅ Chuyển đổi audio hoàn tất: ${audioPath}`);
            console.log(`⏱️ Thời gian xử lý: ${duration.toFixed(2)} giây`);
            
            try {
              await Video.updateAudioPath(videoId, audioPath);
              console.log(`📝 Đã cập nhật đường dẫn audio trong database`);
              resolve(audioPath);
            } catch (error) {
              console.error('❌ LỖI KHI CẬP NHẬT DATABASE:', error);
              reject(error);
            }
          })
          .on('error', (err) => {
            console.error('❌ LỖI KHI CHUYỂN ĐỔI VIDEO SANG AUDIO:', err);
            console.log(`🔍 Thông tin thêm: videoPath=${videoPath}, audioPath=${audioPath}`);
            reject(err);
          });
          
        ffmpegCommand.run();
      });
    } catch (error) {
      console.error('❌ LỖI TRONG CONVERT_VIDEO_TO_AUDIO:', error);
      throw error;
    }
  }
}

module.exports = AudioService; 