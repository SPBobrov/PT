const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const net = require('net');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Подключаем API роутер
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Простой тестовый маршрут
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running' });
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

// Запуск сервера с проверкой порта
async function startServer() {
  const portAvailable = await isPortAvailable(PORT);
  
  if (!portAvailable) {
    console.log(`Порт ${PORT} занят. Попытка освободить...`);
    
    // Для Linux/Mac можно попробовать найти и завершить процесс
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
      console.log('Для Windows выполните: netstat -ano | findstr :3000');
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

// Запускаем сервер
startServer();