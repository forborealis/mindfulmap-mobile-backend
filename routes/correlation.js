const express = require('express');
const router = express.Router();
const MoodLog = require('../models/MoodLog');
const Correlation = require('../models/Correlation');
const moment = require('moment');

// Fetch correlation analysis for a user
router.get('/', async (req, res) => {
  try {
    const { user } = req.query;
    const startOfWeek = moment().startOf('isoWeek'); // Monday
    const endOfWeek = moment().endOf('isoWeek'); // Sunday

    const weeklyLogs = await MoodLog.find({
      user,
      date: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() },
    });

    console.log('Weekly Logs:', weeklyLogs);

    if (weeklyLogs.length < 2) {
      return res.json([{ message: 'Data is currently insufficient to run analysis' }]);
    }

    const moodActivityMap = {};
    const moodSocialMap = {};
    const sleepQualityCount = {
      'No Sleep': 0,
      'Poor Sleep': 0,
      'Medium Sleep': 0,
      'Good Sleep': 0
    };
    let healthCount = 0;

    weeklyLogs.forEach(log => {
      const { mood, activities, social, health, sleepQuality } = log;

      // Handle activities
      activities.forEach(activity => {
        if (!moodActivityMap[mood]) {
          moodActivityMap[mood] = {};
        }

        if (!moodActivityMap[mood][activity]) {
          moodActivityMap[mood][activity] = 0;
        }

        moodActivityMap[mood][activity]++;
      });

      // Handle social activities
      social.forEach(socialActivity => {
        if (!moodSocialMap[mood]) {
          moodSocialMap[mood] = {};
        }

        if (!moodSocialMap[mood][socialActivity]) {
          moodSocialMap[mood][socialActivity] = 0;
        }

        moodSocialMap[mood][socialActivity]++;
      });

      // Handle health activities
      if (health.length > 0) {
        healthCount++;
      }

      // Handle sleep quality
      if (sleepQuality in sleepQualityCount) {
        sleepQualityCount[sleepQuality]++;
      }
    });

    console.log('Mood Activity Map:', moodActivityMap);
    console.log('Social Activity Map:', moodSocialMap);
    console.log('Sleep Quality Count:', sleepQualityCount);

    const correlationResults = [];
    let topMood = null;
    let topMoodCount = 0;
    let topMoodActivity = null;
    let topMoodActivityCount = 0;

    Object.keys(moodActivityMap).forEach(mood => {
      const moodCount = Object.values(moodActivityMap[mood]).reduce((a, b) => a + b, 0);
      if (moodCount >= 3 && moodCount > topMoodCount) {
        topMood = mood;
        topMoodCount = moodCount;
        topMoodActivity = null;
        topMoodActivityCount = 0;

        Object.keys(moodActivityMap[mood]).forEach(activity => {
          if (moodActivityMap[mood][activity] > topMoodActivityCount) {
            topMoodActivity = activity;
            topMoodActivityCount = moodActivityMap[mood][activity];
          }
        });
      }
    });

    if (topMood && topMoodActivity) {
      const percentage = ((topMoodActivityCount / topMoodCount) * 100).toFixed(2);
      correlationResults.push({
        correlationValue: parseFloat(percentage),
        correlationMood: topMood,
        correlationActivity: topMoodActivity
      });
    }

    // Analyze social activity patterns
    let topSocialMood = null;
    let topSocialMoodCount = 0;
    let topSocialActivity = null;
    let topSocialActivityCount = 0;

    Object.keys(moodSocialMap).forEach(mood => {
      const moodCount = Object.values(moodSocialMap[mood]).reduce((a, b) => a + b, 0);
      if (moodCount >= 3 && moodCount > topSocialMoodCount) {
        topSocialMood = mood;
        topSocialMoodCount = moodCount;
        topSocialActivity = null;
        topSocialActivityCount = 0;

        Object.keys(moodSocialMap[mood]).forEach(socialActivity => {
          if (moodSocialMap[mood][socialActivity] > topSocialActivityCount) {
            topSocialActivity = socialActivity;
            topSocialActivityCount = moodSocialMap[mood][socialActivity];
          }
        });
      }
    });

    if (topSocialMood && topSocialActivity) {
      const percentage = ((topSocialActivityCount / topSocialMoodCount) * 100).toFixed(2);
      correlationResults.push({
        correlationValue: parseFloat(percentage),
        correlationMood: topSocialMood,
        correlationSocial: topSocialActivity
      });
    }

    // Analyze sleep quality patterns
    const totalSleepLogs = Object.values(sleepQualityCount).reduce((a, b) => a + b, 0);
    const poorSleepLogs = sleepQualityCount['No Sleep'] + sleepQualityCount['Poor Sleep'];
    const mediumSleepLogs = sleepQualityCount['Medium Sleep'];
    const goodSleepLogs = sleepQualityCount['Good Sleep'];

    const poorSleepPercentage = ((poorSleepLogs / totalSleepLogs) * 100).toFixed(2);
    const mediumSleepPercentage = ((mediumSleepLogs / totalSleepLogs) * 100).toFixed(2);
    const goodSleepPercentage = ((goodSleepLogs / totalSleepLogs) * 100).toFixed(2);

    const sleepQualityResults = [
      { quality: 'Poor', percentage: poorSleepPercentage, count: poorSleepLogs },
      { quality: 'Medium', percentage: mediumSleepPercentage, count: mediumSleepLogs },
      { quality: 'Good', percentage: goodSleepPercentage, count: goodSleepLogs }
    ];

    // Find the top sleep quality result
    const topSleepQuality = sleepQualityResults.reduce((prev, current) => (prev.count > current.count ? prev : current));
    correlationResults.push({
      sleepQualityValue: parseFloat(topSleepQuality.percentage),
      sleepQuality: topSleepQuality.quality
    });

    // Analyze health activity patterns
    if (healthCount >= 3) {
      correlationResults.push({
        healthStatus: 'Health-related activities are normal'
      });
    } else {
      correlationResults.push({
        healthStatus: 'Health-related activities are low'
      });
    }

    console.log('Correlation Results:', correlationResults);

    // Check if today is Sunday
    const today = moment().day();
    if (today === 0) { // 0 is Sunday
      await Correlation.deleteMany({ user });
      const correlation = new Correlation({
        user,
        correlationResults
      });
      await correlation.save();
    }

    res.json(correlationResults);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;