const db = require('./config/database');

async function updateDatabase() {
  console.log('Đang cập nhật cấu trúc database...');
  
  // Thêm các cột mới vào bảng videos nếu chưa có
  try {
    // Kiểm tra xem các cột đã tồn tại chưa
    db.all("PRAGMA table_info(videos)", [], (err, rows) => {
      if (err) {
        console.error('Lỗi khi kiểm tra cấu trúc bảng:', err);
        return;
      }
      
      // Kiểm tra và thêm current_step
      db.run("ALTER TABLE videos ADD COLUMN current_step INTEGER DEFAULT 0", err => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Lỗi khi thêm cột current_step:', err);
        } else {
          console.log('Đã thêm cột current_step hoặc cột đã tồn tại');
        }
      });
      
      // Kiểm tra và thêm progress
      db.run("ALTER TABLE videos ADD COLUMN progress INTEGER DEFAULT 0", err => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Lỗi khi thêm cột progress:', err);
        } else {
          console.log('Đã thêm cột progress hoặc cột đã tồn tại');
        }
      });
      
      // Kiểm tra và thêm status_message
      db.run("ALTER TABLE videos ADD COLUMN status_message TEXT DEFAULT 'Đang chuẩn bị xử lý video'", err => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Lỗi khi thêm cột status_message:', err);
        } else {
          console.log('Đã thêm cột status_message hoặc cột đã tồn tại');
        }
      });
    });
    
    console.log('Cập nhật cấu trúc database hoàn tất!');
  } catch (error) {
    console.error('Lỗi khi cập nhật database:', error);
  }
}

// Chạy cập nhật
updateDatabase(); 