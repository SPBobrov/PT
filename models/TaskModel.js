// Простая in-memory модель для хранения задач
class TaskModel {
  constructor() {
    this.tasks = [];
    this.currentId = 1;
  }

  // Получить все задачи
  getAll() {
    return this.tasks;
  }

  // Создать новую задачу
  create(taskData) {
    const newTask = {
      id: this.currentId++,
      title: taskData.title || 'Без названия',
      completed: false,
      pomodorosCompleted: 0,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    return newTask;
  }

  // Обновить задачу по id (передаём частичные данные)
  update(id, data) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;

    // Обновляем только переданные поля
    if (data.title !== undefined) task.title = data.title;
    if (data.completed !== undefined) task.completed = data.completed;
    if (data.pomodorosCompleted !== undefined) task.pomodorosCompleted = data.pomodorosCompleted;

    return task;
  }

  // Удалить задачу по id
  delete(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.tasks.splice(index, 1);
    return true;
  }
}

module.exports = TaskModel;