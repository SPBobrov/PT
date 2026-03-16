// public/js/app.js

// Класс для одного таймера
class TimerInstance {
  constructor(id, activity, workDuration, globalComment) {
    this.id = id;
    this.activity = activity;
    this.workDuration = workDuration; // длительность в секундах
    this.duration = workDuration;
    this.totalDuration = workDuration;
    this.startTime = null;
    this.isRunning = false;
    this.interval = null;
    this.comment = globalComment; // начальное значение из глобального поля
    // Создаём DOM-элементы
    this.createUI();
  }

  createUI() {
    const container = document.getElementById('timers-container');
    const card = document.createElement('div');
    card.className = 'timer-card';
    card.id = `timer-${this.id}`;

    // Заголовок с активностью и кнопкой удаления
    const header = document.createElement('div');
    header.className = 'timer-card-header';
    header.innerHTML = `
      <span class="activity-name">${this.activity}</span>
      <button class="delete-timer-btn" title="Удалить">✕</button>
    `;
    card.appendChild(header);

    // Отображение таймера
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'timer-display';
    timeDisplay.id = `timer-display-${this.id}`;
    timeDisplay.textContent = this.formatTime(this.duration);
    card.appendChild(timeDisplay);

    // Кнопки управления (изначально: Пауза и Стоп)
    const controls = document.createElement('div');
    controls.className = 'timer-controls';
    controls.innerHTML = `
      <button class="btn btn-secondary pause-btn" data-id="${this.id}">Пауза</button>
      <button class="btn btn-secondary stop-btn" data-id="${this.id}">Стоп</button>
    `;
    card.appendChild(controls);

    // Поле комментария
    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.className = 'timer-comment';
    commentInput.id = `comment-${this.id}`;
    commentInput.placeholder = 'Комментарий...';
    commentInput.value = this.comment;
    card.appendChild(commentInput);

    container.appendChild(card);

    // Сохраняем ссылки
    this.displayElement = timeDisplay;
    this.commentInput = commentInput;
    this.card = card;
    this.pauseBtn = controls.querySelector('.pause-btn');
    this.stopBtn = controls.querySelector('.stop-btn');
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateDisplay() {
    if (this.displayElement) {
      this.displayElement.textContent = this.formatTime(this.duration);
    }
  }

  tick() {
    if (!this.isRunning || !this.startTime) return;

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
    const remaining = this.totalDuration - elapsedSeconds;

    if (remaining <= 0) {
      this.pause(); // останавливаем интервал
      playSound();
      saveSession(this.activity, this.totalDuration, this.commentInput.value);
      this.duration = this.workDuration;
      this.updateDisplay();
      // после завершения кнопка "Пауза" должна стать "Старт"
      this.pauseBtn.textContent = 'Старт';
      return;
    }

    this.duration = remaining;
    this.updateDisplay();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();
    this.totalDuration = this.duration;
    this.interval = setInterval(() => this.tick(), 1000);
    this.tick();
    // Меняем кнопку на "Пауза"
    this.pauseBtn.textContent = 'Пауза';
  }

  pause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    this.startTime = null;
    // Меняем кнопку на "Старт"
    this.pauseBtn.textContent = 'Старт';
  }

  stop() {
    let elapsed = 0;
    if (this.startTime) {
      elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      if (elapsed > this.totalDuration) elapsed = this.totalDuration;
    }
    this.pause(); // останавливаем и меняем кнопку на "Старт", но потом карточка будет удалена

    if (elapsed > 0) {
      saveSession(this.activity, elapsed, this.commentInput.value);
    }

    // Удаляем карточку
    TimerManager.removeTimer(this);
  }

  // Сохранить сессию без остановки (для аварийного завершения)
  saveCurrentProgress() {
    if (this.isRunning && this.startTime) {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      if (elapsed > 0) {
        return {
          activity: this.activity,
          duration: elapsed,
          comment: this.commentInput.value
        };
      }
    }
    return null;
  }
}

// Менеджер всех таймеров
const TimerManager = {
  timers: [],
  nextId: 1,

  addTimer(activity, globalWorkDuration, globalComment) {
    const timer = new TimerInstance(this.nextId++, activity, globalWorkDuration, globalComment);
    this.timers.push(timer);
    this.attachEvents(timer);
    return timer;
  },

  removeTimer(timer) {
    // Удаляем из DOM
    if (timer.card && timer.card.parentNode) {
      timer.card.remove();
    }
    // Удаляем из массива
    const index = this.timers.indexOf(timer);
    if (index !== -1) this.timers.splice(index, 1);
  },

  attachEvents(timer) {
    // Обработчик для кнопки "Пауза"/"Старт"
    timer.pauseBtn.addEventListener('click', () => {
      if (timer.isRunning) {
        timer.pause();
      } else {
        timer.start();
      }
    });

    // Обработчик для кнопки "Стоп" – теперь просто вызывает timer.stop()
    timer.stopBtn.addEventListener('click', () => {
      timer.stop();
    });

    // Обработчик для кнопки удаления (крестик) – удаляем без сохранения
    timer.card.querySelector('.delete-timer-btn').addEventListener('click', () => {
      // Если таймер активен, сначала останавливаем с сохранением
      if (timer.isRunning) {
        timer.stop(); // stop() сохранит сессию и удалит карточку
      } else {
        // Если неактивен, просто удаляем
        TimerManager.removeTimer(timer);
      }
    });

    // При изменении комментария обновляем в объекте
    timer.commentInput.addEventListener('change', (e) => {
      timer.comment = e.target.value;
    });
  },

  // Сохранить все активные таймеры (для beforeunload)
  saveAllRunning() {
    const sessions = [];
    this.timers.forEach(timer => {
      const session = timer.saveCurrentProgress();
      if (session) sessions.push(session);
    });
    return sessions;
  },

  // Обновить все дисплеи (при возвращении на страницу)
  refreshAll() {
    this.timers.forEach(timer => {
      timer.updateDisplay();
    });
  }
};

// Вспомогательные функции
function playSound() {
  const sound = document.getElementById('timer-end-sound');
  if (sound) sound.play().catch(e => console.log('Не удалось воспроизвести звук', e));
}

function saveSession(activityType, duration, comment) {
  fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activityType, duration, comment }),
  })
    .then(response => {
      if (!response.ok) console.error('Ошибка сохранения сессии:', response.statusText);
    })
    .catch(err => console.error('Ошибка сети при сохранении сессии:', err));
}

// Менеджер активностей (без изменений)
const ActivityManager = {
  activities: [],

  async loadActivities() {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Ошибка загрузки активностей');
      this.activities = await response.json();
      this.renderSelect(); // для панели управления
      this.renderList();   // для списка удаления
      this.renderChoiceList(); // для модального окна
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

  renderChoiceList() {
    const container = document.getElementById('activity-choice-list');
    if (!container) return;
    container.innerHTML = '';
    this.activities.forEach(act => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.style.width = '100%';
      btn.textContent = act.name;
      btn.addEventListener('click', () => {
        const workDuration = getCurrentWorkDuration();
        const globalComment = document.getElementById('global-comment').value;
        const timer = TimerManager.addTimer(act.name, workDuration, globalComment);
        timer.start();
        document.getElementById('activity-choice-modal').style.display = 'none';
      });
      container.appendChild(btn);
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
      this.renderChoiceList();
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
      this.renderChoiceList();
    } catch (err) {
      console.error(err);
    }
  }
};

// Получение текущей длительности работы из глобального селекта
function getCurrentWorkDuration() {
  const select = document.getElementById('work-duration');
  const customContainer = document.getElementById('custom-duration-container');
  if (select.value === 'custom') {
    const mins = parseInt(document.getElementById('custom-minutes').value, 10) || 1;
    return mins * 60;
  } else {
    return parseInt(select.value, 10);
  }
}

// Обработчики событий
document.addEventListener('visibilitychange', () => {
  TimerManager.refreshAll();
});

window.addEventListener('beforeunload', () => {
  const sessions = TimerManager.saveAllRunning();
  if (sessions.length > 0) {
    const blob = new Blob([JSON.stringify(sessions)], { type: 'application/json' });
    navigator.sendBeacon('/api/sessions/bulk', blob);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const sound = document.getElementById('timer-end-sound');
  if (sound) sound.load();

  await ActivityManager.loadActivities();

  const workDurationSelect = document.getElementById('work-duration');
  const customContainer = document.getElementById('custom-duration-container');
  const customInput = document.getElementById('custom-minutes');

  workDurationSelect.addEventListener('change', () => {
    if (workDurationSelect.value === 'custom') {
      customContainer.style.display = 'inline-flex';
    } else {
      customContainer.style.display = 'none';
    }
  });

  customInput.addEventListener('input', () => {});

  // Кнопки быстрых активностей
  document.querySelectorAll('.activity-btn[data-activity]').forEach(btn => {
    btn.addEventListener('click', () => {
      const activity = btn.dataset.activity;
      const workDuration = getCurrentWorkDuration();
      const globalComment = document.getElementById('global-comment').value;
      const timer = TimerManager.addTimer(activity, workDuration, globalComment);
      timer.start();
    });
  });

  document.getElementById('more-activities-btn').addEventListener('click', () => {
    ActivityManager.renderChoiceList();
    document.getElementById('activity-choice-modal').style.display = 'flex';
  });

  document.getElementById('close-choice-modal').addEventListener('click', () => {
    document.getElementById('activity-choice-modal').style.display = 'none';
  });

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

  document.getElementById('add-activity-btn').addEventListener('click', () => {
    const input = document.getElementById('new-activity-input');
    ActivityManager.addActivity(input.value.trim());
    input.value = '';
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout');
    window.location.href = '/login.html';
  });
});