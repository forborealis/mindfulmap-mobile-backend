const express = require('express');
const MoodLog = require('../models/MoodLog');
const router = express.Router();

// POST endpoint to save a new mood log
router.post('/', async (req, res) => {
  try {
    const newMoodLog = new MoodLog(req.body);
    const savedLog = await newMoodLog.save();
    res.status(201).json(savedLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET endpoint to fetch mood logs based on the user ID
router.get('/', async (req, res) => {
  try {
    const { user } = req.query;
    if (!user) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const moodLogs = await MoodLog.find({ user });
    res.status(200).json(moodLogs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;