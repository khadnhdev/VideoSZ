const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Kết nối đến file database
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Không thể kết nối đến SQLite database.', err);
  } else {
    console.log('Đã kết nối đến SQLite database.');
    createTables();
  }
});

// Tạo bảng cần thiết
function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    original_filename TEXT NOT NULL,
    video_path TEXT NOT NULL,
    audio_path TEXT,
    transcript TEXT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Lỗi khi tạo bảng videos:', err);
    } else {
      console.log('Bảng videos đã được tạo hoặc đã tồn tại.');
    }
  });
}

module.exports = db; 