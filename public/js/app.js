// public/js/app.js

const Timer = {
  // Константы длительности режимов (в секундах)
  WORK_TIME: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,

  // Текущий режим (по умолчанию работа)
  currentMode: 'work',

  duration: 25 * 60,        // оставшееся время в секундах (актуальное)
  totalDuration: 25 * 60,    // полная длительность текущего сеанса (нужна для расчёта)
  startTime: null,           // время старта (timestamp) в миллисекундах
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

  // Форматирование времени (MM:SS)
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Обновление отображения таймера в DOM
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

  // Основная функция, вызываемая каждую секунду (или при возобновлении вкладки)
  tick() {
    if (!this.isRunning || !this.startTime) return;

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
    const remaining = this.totalDuration - elapsedSeconds;

    if (remaining <= 0) {
      // Таймер завершился
      this.pause();
      // Здесь можно добавить автоматическое переключение режима, звук и т.д.
      // Например: this.switchMode('shortBreak');
      return;
    }

    // Обновляем duration и отображение
    this.duration = remaining;
    this.updateDisplay();
  },

  // Запуск таймера
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.totalDuration = this.duration; // запоминаем, сколько должны отсчитать

    // Запускаем интервал
    this.timerInterval = setInterval(() => this.tick(), 1000);

    // Сразу вызываем tick, чтобы не ждать первую секунду
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
    // duration уже актуально после последнего tick
  },

  // Сброс к начальному времени текущего режима
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
  }
};

// Обработчик видимости страницы
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Timer.isRunning) {
    // Вкладка стала активной – принудительно обновляем таймер,
    // чтобы учесть время, прошедшее в фоне
    Timer.tick();
  }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  Timer.switchMode('work');

  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');

  if (startBtn) startBtn.addEventListener('click', () => Timer.start());
  if (pauseBtn) pauseBtn.addEventListener('click', () => Timer.pause());
  if (resetBtn) resetBtn.addEventListener('click', () => Timer.reset());
});