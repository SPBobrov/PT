// public/js/app.js

const Timer = {
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,

  workDuration: 25 * 60,
  currentMode: 'work',
  currentActivity: 'work',
  duration: 25 * 60,
  totalDuration: 25 * 60,
  startTime: null,
  timerInterval: null,
  isRunning: false,

  getDurationByMode(mode) {
    switch (mode) {
      case 'work': return this.workDuration;
      case 'shortBreak': return this.SHORT_BREAK;
      case 'longBreak': return this.LONG_BREAK;
      default: return this.workDuration;
    }
  },

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  updateDisplay() {
    const timerElement = document.getElementById('timer-display');
    if (timerElement) timerElement.textContent = this.formatTime(this.duration);
  },

  updateModeIndicator() {
    const indicator = document.getElementById('mode-indicator');
    if (!indicator) return;

    if (this.currentMode === 'work') {
      // Показываем название выбранной активности из селекта
      const select = document.getElementById('activity-select');
      if (select && select.selectedIndex >= 0) {
        indicator.textContent = select.options[select.selectedIndex].text;
      } else {
        indicator.textContent = 'Работа';
      }
    } else {
      const modeNames = {
        shortBreak: 'Короткий перерыв',
        longBreak: 'Длинный перерыв'
      };
      indicator.textContent = modeNames[this.currentMode] || 'Перерыв';
    }
  },

  tick() {
    if (!this.isRunning || !this.startTime) return;

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
    const remaining = this.totalDuration - elapsedSeconds;

    if (remaining <= 0) {
      this.pause();

      const sound = document.getElementById('timer-end-sound');
      if (sound) sound.play().catch(e => console.log('Не удалось воспроизвести звук', e));

      if (this.currentMode === 'work') this.saveSession();

      this.duration = this.getDurationByMode(this.currentMode);
      this.updateDisplay();
      return;
    }

    this.duration = remaining;
    this.updateDisplay();
  },

  saveSession() {
    const activityType = this.currentActivity;
    const duration = this.totalDuration;
    const commentInput = document.getElementById('session-comment');
    const comment = commentInput ? commentInput.value : '';

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityType, duration, comment }),
    })
      .then(response => {
        if (!response.ok) console.error('Ошибка сохранения сессии:', response.statusText);
        else if (commentInput) commentInput.value = '';
      })
      .catch(err => console.error('Ошибка сети при сохранении сессии:', err));
  },

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();
    this.totalDuration = this.duration;
    this.timerInterval = setInterval(() => this.tick(), 1000);
    this.tick();
  },

  pause() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;
    this.startTime = null;
  },

  reset() {
    this.pause();
    this.duration = this.getDurationByMode(this.currentMode);
    this.updateDisplay();
  },

  switchMode(mode) {
    this.pause();
    this.currentMode = mode;
    this.duration = this.getDurationByMode(mode);
    this.updateDisplay();
    this.updateModeIndicator();
  },

  setActivity(activity) {
    this.currentActivity = activity;
    // при смене активности обновляем индикатор, если режим работы
    if (this.currentMode === 'work') {
      this.updateModeIndicator();
    }
  }
};

// Менеджер активностей
const ActivityManager = {
  activities: [],

  async loadActivities() {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Ошибка загрузки активностей');
      this.activities = await response.json();
      this.renderSelect();
      this.renderList();
    } catch (err) {
      console.error(err);
    }
  },

  renderSelect() {
    const select = document.getElementById('activity-select');
    if (!select) return;
    select.innerHTML = '';
    this.activities.forEach(act => {
      const option = document.createElement('option');
      option.value = act.name;
      option.textContent = act.name;
      select.appendChild(option);
    });
    if (this.activities.length > 0) {
      select.value = this.activities[0].name;
      Timer.setActivity(select.value);
    }
    // После обновления селекта обновляем индикатор, если режим работы
    if (Timer.currentMode === 'work') {
      Timer.updateModeIndicator();
    }
  },

  renderList() {
    const list = document.getElementById('activity-list');
    if (!list) return;
    list.innerHTML = '';
    this.activities.forEach(act => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="activity-name">${act.name}</span>
        <button class="delete-activity" data-id="${act.id}">&times;</button>
      `;
      list.appendChild(li);
    });

    document.querySelectorAll('.delete-activity').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await this.deleteActivity(id);
      });
    });
  },

  async addActivity(name) {
    if (!name.trim()) return;
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Ошибка добавления');
      const newActivity = await response.json();
      this.activities.push(newActivity);
      this.renderSelect();
      this.renderList();
    } catch (err) {
      console.error(err);
    }
  },

  async deleteActivity(id) {
    if (!confirm('Удалить активность? Сессии с этой активностью останутся.')) return;
    try {
      const response = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Ошибка удаления');
      this.activities = this.activities.filter(a => a.id != id);
      this.renderSelect();
      this.renderList();
    } catch (err) {
      console.error(err);
    }
  }
};

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Timer.isRunning) Timer.tick();
});

document.addEventListener('DOMContentLoaded', async () => {
  Timer.switchMode('work');

  const sound = document.getElementById('timer-end-sound');
  if (sound) sound.load();

  document.getElementById('start-btn')?.addEventListener('click', () => Timer.start());
  document.getElementById('pause-btn')?.addEventListener('click', () => Timer.pause());
  document.getElementById('reset-btn')?.addEventListener('click', () => Timer.reset());

  await ActivityManager.loadActivities();

  const activitySelect = document.getElementById('activity-select');
  if (activitySelect) {
    activitySelect.addEventListener('change', (e) => {
      Timer.setActivity(e.target.value);
    });
  }

  // Кнопка показа/скрытия панели управления активностями
  const toggleBtn = document.getElementById('toggle-activity-manager');
  const manager = document.getElementById('activity-manager');
  const closeBtn = document.getElementById('close-activity-manager');

  if (toggleBtn && manager) {
    toggleBtn.addEventListener('click', () => {
      manager.style.display = manager.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (closeBtn && manager) {
    closeBtn.addEventListener('click', () => {
      manager.style.display = 'none';
    });
  }

  document.getElementById('add-activity-btn')?.addEventListener('click', () => {
    const input = document.getElementById('new-activity-input');
    ActivityManager.addActivity(input.value.trim());
    input.value = '';
  });

  const workDurationSelect = document.getElementById('work-duration');
  const customContainer = document.getElementById('custom-duration-container');
  const customInput = document.getElementById('custom-minutes');

  function updateWorkDuration() {
    const selected = workDurationSelect.value;
    if (selected === 'custom') {
      customContainer.style.display = 'inline-flex';
      const mins = parseInt(customInput.value, 10) || 1;
      Timer.workDuration = mins * 60;
    } else {
      customContainer.style.display = 'none';
      Timer.workDuration = parseInt(selected, 10);
    }
    if (Timer.currentMode === 'work') {
      Timer.duration = Timer.workDuration;
      Timer.updateDisplay();
    }
  }

  workDurationSelect.addEventListener('change', updateWorkDuration);
  customInput.addEventListener('input', () => {
    if (workDurationSelect.value === 'custom') {
      const mins = parseInt(customInput.value, 10) || 1;
      Timer.workDuration = mins * 60;
      if (Timer.currentMode === 'work') {
        Timer.duration = Timer.workDuration;
        Timer.updateDisplay();
      }
    }
  });

  updateWorkDuration();

  if (activitySelect && activitySelect.value) {
    Timer.setActivity(activitySelect.value);
  }
});