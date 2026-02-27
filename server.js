const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const net = require('net');
const db = require('./db'); // подключение к БД
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Настройка сессий
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: './' }),
  secret: 'pomodoro-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // неделя
}));

// Инициализация таблицы пользователей при старте
(async () => {
  try {
    // Создаём таблицу users, если её нет
    await new Promise((resolve, reject) => {
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        )`,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Проверяем, есть ли пользователь admin
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE username = ?", ['admin'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      // Хешируем пароль и создаём пользователя
      const hashedPassword = await bcrypt.hash('admin', 10);
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO users (username, password) VALUES (?, ?)",
          ['admin', hashedPassword],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log('Создан пользователь admin с паролем admin');
    }
  } catch (err) {
    console.error('Ошибка инициализации пользователей:', err);
  }
})();

// Middleware для проверки авторизации
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  // Если запрос к API – возвращаем 401, иначе редирект на логин
  if (req.path.startsWith('/api/') && req.path !== '/api/login') {
    return res.status(401).json({ error: 'Неавторизован' });
  }
  res.redirect('/login.html');
}

// Публичные маршруты (не требуют авторизации)
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Статические файлы (CSS, JS, звуки) доступны без авторизации
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/sounds', express.static(path.join(__dirname, 'public', 'sounds')));

// Защищённые страницы
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/history.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

// API маршруты (кроме /api/login) защищены
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Введите имя и пароль' });
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ error: 'Неверное имя или пароль' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Неверное имя или пароль' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true, redirect: '/' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Подключаем остальные API роуты (защищённые)
const apiRoutes = require('./routes/api');
app.use('/api', requireAuth, apiRoutes);

// Простой тестовый маршрут (защищён)
app.get('/api/status', requireAuth, (req, res) => {
  res.json({ status: 'Server is running', user: req.session.username });
});

// Функция для проверки доступности порта
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Запуск сервера
async function startServer() {
  const portAvailable = await isPortAvailable(PORT);
  
  if (!portAvailable) {
    console.log(`Порт ${PORT} занят. Попытка освободить...`);
    
    if (process.platform !== 'win32') {
      const { exec } = require('child_process');
      exec(`lsof -ti:${PORT} | xargs kill -9`, (error) => {
        if (error) {
          console.log(`Не удалось освободить порт ${PORT}. Используйте другой порт.`);
          process.exit(1);
        } else {
          console.log(`Порт ${PORT} освобожден. Запускаем сервер...`);
          startListening();
        }
      });
    } else {
      console.log(`Порт ${PORT} занят. Попробуйте использовать другой порт.`);
      console.log('Для Windows выполните: netstat -ano | findstr :8080');
      process.exit(1);
    }
  } else {
    startListening();
  }
}

function startListening() {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Порт ${PORT} всё ещё занят. Попробуйте использовать другой порт.`);
      process.exit(1);
    } else {
      console.error('Ошибка при запуске сервера:', err);
      process.exit(1);
    }
  });
}

startServer();