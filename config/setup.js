// Thêm vào trong hàm createTables hoặc giữ làm tham khảo nếu bảng đã tồn tại
db.run(`
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    original_filename TEXT NOT NULL,
    video_path TEXT NOT NULL,
    audio_path TEXT,
    transcript TEXT,
    summary TEXT,
    processing_error TEXT,
    current_step INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    status_message TEXT DEFAULT 'Đang chuẩn bị xử lý video',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`); 