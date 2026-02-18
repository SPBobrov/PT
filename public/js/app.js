// public/js/app.js

const Timer = {
  // Константы длительности режимов (в секундах)
  WORK_TIME: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,

  // Текущий режим
  currentMode: 'work',

  // Текущая активность (значение из select)
  currentActivity: 'work',

  duration: 25 * 60,
  totalDuration: 25 * 60,
  startTime: null,
  timerInterval: null,
  isRunning: false,

  // Возвращает длительность для указанного режима
  getDurationByMode(mode) {
    switch (mode) {
      case 'work': return this.WORK_TIME;
      case 'shortBreak': return this.SHORT_BREAK;
      case 'longBreak': return this.LONG_BREAK;
      default: return this.WORK_TIME;
    }
  },

  // Форматирование времени
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Обновление отображения таймера
  updateDisplay() {
    const timerElement = document.getElementById('timer-display');
    if (timerElement) {
      timerElement.textContent = this.formatTime(this.duration);
    }
  },

  // Обновление индикатора режима
  updateModeIndicator() {
    const indicator = document.getElementById('mode-indicator');
    if (!indicator) return;

    const modeNames = {
      work: 'Работа',
      shortBreak: 'Короткий перерыв',
      longBreak: 'Длинный перерыв'
    };
    indicator.textContent = modeNames[this.currentMode] || 'Работа';
  },

  // Основная функция тика
  tick() {
    if (!this.isRunning || !this.startTime) return;

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
    const remaining = this.totalDuration - elapsedSeconds;

    if (remaining <= 0) {
      // Таймер завершился
      this.duration = 0;
      this.updateDisplay();
      this.pause();

      // Звуковой сигнал
      const sound = document.getElementById('timer-end-sound');
      if (sound) {
        sound.play().catch(e => console.log('Не удалось воспроизвести звук', e));
      }

      // Если завершился рабочий интервал – сохраняем сессию активности
      if (this.currentMode === 'work') {
        this.saveSession();
      }

      // Автоматическое переключение режима (опционально)
      // if (this.currentMode === 'work') this.switchMode('shortBreak');
      // else if (this.currentMode === 'shortBreak') this.switchMode('work');
      return;
    }

    this.duration = remaining;
    this.updateDisplay();
  },

  // Сохранение сессии активности на сервере
  saveSession() {
    const activityType = this.currentActivity;
    const duration = this.WORK_TIME; // сохраняем полную длительность рабочего периода

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityType, duration }),
    })
      .then(response => {
        if (!response.ok) {
          console.error('Ошибка сохранения сессии:', response.statusText);
        }
      })
      .catch(err => console.error('Ошибка сети при сохранении сессии:', err));
  },

  // Запуск таймера
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.totalDuration = this.duration;

    this.timerInterval = setInterval(() => this.tick(), 1000);
    this.tick();
  },

  // Пауза
  pause() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;
    this.startTime = null;
  },

  // Сброс
  reset() {
    this.pause();
    this.duration = this.getDurationByMode(this.currentMode);
    this.updateDisplay();
  },

  // Переключение режима
  switchMode(mode) {
    this.pause();
    this.currentMode = mode;
    this.duration = this.getDurationByMode(mode);
    this.updateDisplay();
    this.updateModeIndicator();
  },

  // Установка активности (вызывается при изменении select)
  setActivity(activity) {
    this.currentActivity = activity;
  }
};

// Обработчик видимости страницы
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Timer.isRunning) {
    Timer.tick();
  }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  Timer.switchMode('work');

  // Кнопки управления таймером
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');

  if (startBtn) startBtn.addEventListener('click', () => Timer.start());
  if (pauseBtn) pauseBtn.addEventListener('click', () => Timer.pause());
  if (resetBtn) resetBtn.addEventListener('click', () => Timer.reset());

  // Выбор активности
  const activitySelect = document.getElementById('activity-select');
  if (activitySelect) {
    activitySelect.addEventListener('change', (e) => {
      Timer.setActivity(e.target.value);
    });
    // Устанавливаем начальное значение
    Timer.setActivity(activitySelect.value);
  }

  // Здесь будет код для работы с задачами (TaskManager) – его нужно добавить позже
  // Пока оставляем заглушку
});