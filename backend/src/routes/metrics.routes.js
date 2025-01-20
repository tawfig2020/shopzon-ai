const express = require('express');
const router = express.Router();
const { redisClient } = require('../config/database');
const auth = require('../middleware/auth.middleware');
const os = require('os');
const metricsController = require('../controllers/metrics.controller');

// Business Metrics
router.get('/user', auth, metricsController.getUserMetrics);
router.get('/household/:id', auth, metricsController.getHouseholdMetrics);

// System Metrics
// Get API response time metrics
router.get('/system/response-time', auth, async (req, res) => {
  try {
    const metrics = await redisClient.get('metrics:response_time');
    res.json(JSON.parse(metrics) || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch response time metrics' });
  }
});

// Get error rate metrics
router.get('/system/error-rate', auth, async (req, res) => {
  try {
    const metrics = await redisClient.get('metrics:error_rate');
    res.json(JSON.parse(metrics) || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch error rate metrics' });
  }
});

// Get user activity metrics
router.get('/system/user-activity', auth, async (req, res) => {
  try {
    const metrics = await redisClient.get('metrics:user_activity');
    res.json(JSON.parse(metrics) || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user activity metrics' });
  }
});

// Get resource usage metrics
router.get('/system/resource-usage', auth, async (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    const cpuUsage = os.loadavg()[0] * 100;

    // Get storage usage from Redis
    const storageMetrics = await redisClient.get('metrics:storage_usage');
    const storageUsage = JSON.parse(storageMetrics)?.usage || 0;

    res.json({
      cpu: Math.min(cpuUsage, 100),
      memory: Math.min(memoryUsage, 100),
      storage: storageUsage,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resource usage metrics' });
  }
});

module.exports = router;
