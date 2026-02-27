const express = require('express');
const router = express.Router();
const TaskModel = require('../models/TaskModel');
const SessionModel = require('../models/SessionModel');
const ActivityModel = require('../models/ActivityModel'); // новый импорт

const taskModel = new TaskModel();
const sessionModel = new SessionModel();
const activityModel = new ActivityModel(); // инициализация

// ----- Маршруты для задач (не используются в интерфейсе, но оставлены) -----
router.get('/tasks', (req, res) => {
  res.json(taskModel.getAll());
});

router.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Поле title обязательно' });
  res.status(201).json(taskModel.create({ title }));
});

router.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Некорректный ID' });
  const updated = taskModel.update(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Задача не найдена' });
  res.json(updated);
});

router.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Некорректный ID' });
  const deleted = taskModel.delete(id);
  if (!deleted) return res.status(404).json({ error: 'Задача не найдена' });
  res.status(204).send();
});

// ----- Маршруты для сессий -----
router.get('/sessions', (req, res) => {
  res.json(sessionModel.getAll());
});

router.post('/sessions', (req, res) => {
  const { activityType, duration, comment } = req.body;
  if (!activityType || !duration) {
    return res.status(400).json({ error: 'activityType и duration обязательны' });
  }
  res.status(201).json(sessionModel.create({ activityType, duration, comment }));
});

// ----- Маршруты для активностей -----
router.get('/activities', (req, res) => {
  res.json(activityModel.getAll());
});

router.post('/activities', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Поле name обязательно' });
  res.status(201).json(activityModel.create(name));
});

router.delete('/activities/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Некорректный ID' });
  const deleted = activityModel.delete(id);
  if (!deleted) return res.status(404).json({ error: 'Активность не найдена' });
  res.status(204).send();
});

module.exports = router;