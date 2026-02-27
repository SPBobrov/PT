const express = require('express');
const router = express.Router();
const TaskModel = require('../models/TaskModel');
const SessionModel = require('../models/SessionModel');

// Инициализируем модели
const taskModel = new TaskModel();
const sessionModel = new SessionModel();

// ----- Маршруты для задач -----
router.get('/tasks', (req, res) => {
  const tasks = taskModel.getAll();
  res.json(tasks);
});

router.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Поле title обязательно' });
  }
  const newTask = taskModel.create({ title });
  res.status(201).json(newTask);
});

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

router.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Некорректный ID' });
  }
  const deleted = taskModel.delete(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }
  res.status(204).send();
});

// ----- Маршруты для сессий активности -----
// GET /api/sessions – получить все сессии
router.get('/sessions', (req, res) => {
  const sessions = sessionModel.getAll();
  res.json(sessions);
});

// POST /api/sessions – сохранить завершённую сессию
router.post('/sessions', (req, res) => {
  const { activityType, duration, comment } = req.body;
  if (!activityType || !duration) {
    return res.status(400).json({ error: 'activityType и duration обязательны' });
  }
  const newSession = sessionModel.create({ activityType, duration, comment });
  res.status(201).json(newSession);
});

module.exports = router;