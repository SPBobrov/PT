class ActivityModel {
  constructor() {
    this.activities = [
      { id: 1, name: 'Работа' },
      { id: 2, name: 'Учеба' },
      { id: 3, name: 'Чтение' },
      { id: 4, name: 'Текст' },
      { id: 5, name: 'Физкультура' },
      { id: 6, name: 'Отдых' }
    ];
    this.currentId = 7;
  }

  getAll() {
    return this.activities;
  }

  create(name) {
    const newActivity = { id: this.currentId++, name };
    this.activities.push(newActivity);
    return newActivity;
  }

  delete(id) {
    const index = this.activities.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.activities.splice(index, 1);
    return true;
  }
}

module.exports = ActivityModel;