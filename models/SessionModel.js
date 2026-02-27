// Простая in-memory модель для хранения завершённых сессий активности


class SessionModel {
  constructor() {
    this.sessions = [];
    this.currentId = 1;
  }

  create(data) {
    const newSession = {
      id: this.currentId++,
      activityType: data.activityType,
      duration: data.duration,
      comment: data.comment || '',
      timestamp: new Date().toISOString(),
    };
    this.sessions.push(newSession);
    return newSession;
  }

  getAll() {
    return this.sessions;
  }

  getByActivity(activityType) {
    return this.sessions.filter(s => s.activityType === activityType);
  }
}

module.exports = SessionModel;