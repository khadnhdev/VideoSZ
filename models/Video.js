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
}

module.exports = Video; 