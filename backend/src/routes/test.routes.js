const express = require('express');
const router = express.Router();
const { getRedisClient } = require('../config/database');
const logger = require('../utils/logger');

// Cache expiration times (in seconds)
const CACHE_TIMES = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
};

// Test route with Redis caching
router.get('/cache-test/:id', async (req, res) => {
  try {
    const redisClient = getRedisClient();

    // Check Redis connection
    if (!redisClient) {
      logger.error('Redis client is null');
      return res.status(503).json({ error: 'Redis service unavailable' });
    }

    if (!redisClient.isReady) {
      logger.error('Redis client is not ready');
      return res.status(503).json({ error: 'Redis service not ready' });
    }

    const { id } = req.params;
    const cacheKey = `test:${id}`;

    // Try to get data from Redis cache
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      logger.info('Data retrieved from cache');
      return res.json({
        source: 'cache',
        data: JSON.parse(cachedData),
      });
    }

    // Simulate database operation (slow operation)
    const data = {
      id,
      name: `Test Item ${id}`,
      timestamp: new Date().toISOString(),
      metadata: {
        cached: true,
        ttl: CACHE_TIMES.MEDIUM,
        type: 'test-item',
      },
    };

    // Store in Redis cache with MEDIUM expiration
    await redisClient.setEx(cacheKey, CACHE_TIMES.MEDIUM, JSON.stringify(data));

    logger.info('Data stored in cache');
    res.json({
      source: 'database',
      data,
    });
  } catch (error) {
    logger.error('Cache test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complex caching scenario with hash
router.get('/cache-test/:id/details', async (req, res) => {
  try {
    const redisClient = getRedisClient();
    if (!redisClient?.isReady) {
      return res.status(503).json({ error: 'Redis service unavailable' });
    }

    const { id } = req.params;
    const hashKey = `test:${id}:details`;

    // Try to get all fields from hash
    const cachedDetails = await redisClient.hGetAll(hashKey);

    if (Object.keys(cachedDetails).length > 0) {
      logger.info('Details retrieved from cache');
      return res.json({
        source: 'cache',
        data: {
          ...cachedDetails,
          views: parseInt(cachedDetails.views || '0'),
          lastAccessed: new Date(parseInt(cachedDetails.lastAccessed || Date.now())),
        },
      });
    }

    // Simulate fetching detailed data
    const details = {
      id,
      name: `Test Item ${id}`,
      description: `Detailed description for item ${id}`,
      category: 'test',
      views: 1,
      created: Date.now(),
      lastAccessed: Date.now(),
    };

    // Store in Redis hash with LONG expiration
    for (const [key, value] of Object.entries(details)) {
      await redisClient.hSet(hashKey, key, String(value));
    }
    await redisClient.expire(hashKey, CACHE_TIMES.LONG);

    logger.info('Details stored in cache');
    res.json({
      source: 'database',
      data: details,
    });
  } catch (error) {
    logger.error('Cache test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Increment view count
router.post('/cache-test/:id/view', async (req, res) => {
  try {
    const redisClient = getRedisClient();
    if (!redisClient?.isReady) {
      return res.status(503).json({ error: 'Redis service unavailable' });
    }

    const { id } = req.params;
    const hashKey = `test:${id}:details`;

    // Increment views and update last accessed time
    const views = await redisClient.hIncrBy(hashKey, 'views', 1);
    await redisClient.hSet(hashKey, 'lastAccessed', Date.now());

    res.json({
      success: true,
      views,
    });
  } catch (error) {
    logger.error('View increment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear cache test route
router.delete('/cache-test/:id', async (req, res) => {
  try {
    const redisClient = getRedisClient();

    if (!redisClient || !redisClient.isReady) {
      return res.status(503).json({ error: 'Redis service unavailable' });
    }

    const { id } = req.params;
    const keys = await redisClient.keys(`test:${id}*`);

    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info('Cache cleared for keys:', keys);
      res.json({ message: 'Cache cleared', clearedKeys: keys });
    } else {
      res.json({ message: 'No cache entries found' });
    }
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
