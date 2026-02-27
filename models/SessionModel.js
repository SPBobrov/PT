const db = require('../db');

class SessionModel {
  create(data) {
    return new Promise((resolve, reject) => {
      const { activityType, duration, comment } = data;
      const timestamp = new Date().toISOString();
      db.run(
        "INSERT INTO sessions (activityType, duration, comment, timestamp) VALUES (?, ?, ?, ?)",
        [activityType, duration, comment || '', timestamp],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, activityType, duration, comment, timestamp });
        }
      );
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM sessions ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getByActivity(activityType) {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM sessions WHERE activityType = ? ORDER BY timestamp DESC", [activityType], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = SessionModel;