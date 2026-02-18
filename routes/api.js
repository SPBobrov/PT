const express = require('express');
const router = express.Router();
const TaskModel = require('../models/TaskModel');

// Инициализируем модель (in-memory хранилище)
const taskModel = new TaskModel();

// GET /api/tasks – получить все задачи
router.get('/tasks', (req, res) => {
  const tasks = taskModel.getAll();
  res.json(tasks);
});

// POST /api/tasks – создать новую задачу
router.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Поле title обязательно' });
  }

  const newTask = taskModel.create({ title });
  res.status(201).json(newTask);
});

// PUT /api/tasks/:id – обновить задачу
router.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Некорректный ID' });
  }

  const updatedTask = taskModel.update(id, req.body);
  if (!updatedTask) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }

  res.json(updatedTask);
});

// DELETE /api/tasks/:id – удалить задачу
router.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Некорректный ID' });
  }

  const deleted = taskModel.delete(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }

  res.status(204).send(); // No content
});

module.exports = router;