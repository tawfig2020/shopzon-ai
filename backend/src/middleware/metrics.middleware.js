const { redisClient } = require('../config/database');
const logger = require('../utils/logger');

const metricsMiddleware = async (req, res, next) => {
  const start = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function
  res.end = async function (...args) {
    const duration = Date.now() - start;
    const path = req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    try {
      // Store response time metrics
      const responseTimeKey = 'metrics:response_time';
      const existingResponseTimes = JSON.parse((await redisClient.get(responseTimeKey)) || '[]');
      existingResponseTimes.push({
        timestamp: new Date().toISOString(),
        path,
        method,
        duration,
      });
      // Keep only last 100 entries
      if (existingResponseTimes.length > 100) {
        existingResponseTimes.shift();
      }
      await redisClient.set(responseTimeKey, JSON.stringify(existingResponseTimes));

      // Track error rate
      if (statusCode >= 400) {
        const errorRateKey = 'metrics:error_rate';
        const existingErrors = JSON.parse((await redisClient.get(errorRateKey)) || '[]');
        existingErrors.push({
          timestamp: new Date().toISOString(),
          path,
          method,
          statusCode,
        });
        // Keep only last 100 entries
        if (existingErrors.length > 100) {
          existingErrors.shift();
        }
        await redisClient.set(errorRateKey, JSON.stringify(existingErrors));
      }

      // Track user activity
      const activityKey = 'metrics:user_activity';
      const existingActivity = JSON.parse((await redisClient.get(activityKey)) || '[]');
      existingActivity.push({
        timestamp: new Date().toISOString(),
        path,
        method,
        userId: req.user?.id || 'anonymous',
      });
      // Keep only last 100 entries
      if (existingActivity.length > 100) {
        existingActivity.shift();
      }
      await redisClient.set(activityKey, JSON.stringify(existingActivity));
    } catch (error) {
      logger.error('Error storing metrics:', error);
    }

    // Call original end function
    originalEnd.apply(res, args);
  };

  next();
};

module.exports = metricsMiddleware;
