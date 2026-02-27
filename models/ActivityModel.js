const db = require('../db');

class ActivityModel {
  getAll() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM activities ORDER BY id", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  create(name) {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO activities (name) VALUES (?)", [name], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name });
      });
    });
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM activities WHERE id = ?", [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }
}

module.exports = ActivityModel;