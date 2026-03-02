const express = require('express');
const router = express.Router();
const ActivityModel = require('../models/ActivityModel');
const SessionModel = require('../models/SessionModel');

const activityModel = new ActivityModel();
const sessionModel = new SessionModel();

// ----- Активности -----
router.get('/activities', async (req, res) => {
  try {
    const activities = await activityModel.getAll();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/activities', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Поле name обязательно' });
  try {
    const newActivity = await activityModel.create(name);
    res.status(201).json(newActivity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/activities/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Некорректный ID' });
  try {
    const deleted = await activityModel.delete(id);
    if (!deleted) return res.status(404).json({ error: 'Активность не найдена' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- Сессии -----
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await sessionModel.getAll();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions', async (req, res) => {
  const { activityType, duration, comment } = req.body;
  if (!activityType || !duration) {
    return res.status(400).json({ error: 'activityType и duration обязательны' });
  }
  try {
    const newSession = await sessionModel.create({ activityType, duration, comment });
    res.status(201).json(newSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;