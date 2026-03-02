const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
  } else {
    console.log('Подключено к SQLite базе данных.');
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    // Таблица активностей
    db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    // Таблица сессий
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activityType TEXT NOT NULL,
        duration INTEGER NOT NULL,
        comment TEXT,
        timestamp TEXT NOT NULL
      )
    `);

    // Добавим начальные активности, если таблица пуста
    db.get("SELECT COUNT(*) as count FROM activities", (err, row) => {
      if (err) return;
      if (row.count === 0) {
        const defaultActivities = ['Работа', 'Учеба', 'Чтение', 'Текст', 'Физкультура', 'Отдых'];
        const stmt = db.prepare("INSERT INTO activities (name) VALUES (?)");
        defaultActivities.forEach(name => stmt.run(name));
        stmt.finalize();
      }
    });
  });
}

module.exports = db;