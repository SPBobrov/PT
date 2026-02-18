// Простая in-memory модель для хранения завершённых сессий активности
class SessionModel {
  constructor() {
    this.sessions = [];
    this.currentId = 1;
  }

  // Создать новую сессию
  create(data) {
    const newSession = {
      id: this.currentId++,
      activityType: data.activityType,
      duration: data.duration, // в секундах
      timestamp: new Date().toISOString(),
    };
    this.sessions.push(newSession);
    return newSession;
  }

  // Получить все сессии
  getAll() {
    return this.sessions;
  }

  // Опционально: получить сессии за сегодня / по типу
  getByActivity(activityType) {
    return this.sessions.filter(s => s.activityType === activityType);
  }
}

module.exports = SessionModel;