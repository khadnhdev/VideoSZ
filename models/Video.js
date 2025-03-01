const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Video {
  static create(videoData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { originalFilename, videoPath } = videoData;
      
      db.run(
        'INSERT INTO videos (id, original_filename, video_path) VALUES (?, ?, ?)',
        [id, originalFilename, videoPath],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id, ...videoData });
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM videos WHERE id = ?', [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  static updateAudioPath(id, audioPath) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE videos SET audio_path = ? WHERE id = ?',
        [audioPath, id],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ changes: this.changes });
        }
      );
    });
  }

  static updateTranscript(id, transcript) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE videos SET transcript = ? WHERE id = ?',
        [transcript, id],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ changes: this.changes });
        }
      );
    });
  }

  static updateSummary(id, summary) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE videos SET summary = ? WHERE id = ?',
        [summary, id],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ changes: this.changes });
        }
      );
    });
  }

  static updateStatus(id, data) {
    return new Promise((resolve, reject) => {
      const { currentStep, progress, message, error } = data;
      
      let query = 'UPDATE videos SET ';
      const params = [];
      const updates = [];
      
      // Luôn cập nhật processing_error nếu có
      if (error) {
        updates.push('processing_error = ?');
        params.push(error);
      }
      
      // Thử cập nhật các cột mới, bỏ qua nếu có lỗi
      try {
        if (currentStep !== undefined) {
          updates.push('current_step = ?');
          params.push(currentStep);
        }
        
        if (progress !== undefined) {
          updates.push('progress = ?');
          params.push(progress);
        }
        
        if (message) {
          updates.push('status_message = ?');
          params.push(message);
        }
      } catch (e) {
        console.log('Bỏ qua cập nhật các cột không có sẵn');
      }
      
      if (updates.length === 0) {
        return resolve({ changes: 0 });
      }
      
      query += updates.join(', ') + ' WHERE id = ?';
      params.push(id);
      
      db.run(query, params, function(err) {
        if (err) {
          console.log('Lỗi SQL khi cập nhật (có thể do thiếu cột):', err.message);
          return resolve({ changes: 0 });
        }
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Video; 