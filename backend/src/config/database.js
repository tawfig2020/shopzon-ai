const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('../utils/logger');

// Redis client setup
let redisClient = null;

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Redis connection
const connectRedis = async () => {
  try {
    if (process.env.USE_REDIS === 'true') {
      redisClient = redis.createClient({
        url: process.env.REDIS_URI,
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
      });

      redisClient.on('error', (err) => logger.error('Redis Client Error', err));
      redisClient.on('connect', () => logger.info('Redis Client Connected'));
      redisClient.on('ready', () => logger.info('Redis Client Ready'));
      redisClient.on('reconnecting', () => logger.info('Redis Client Reconnecting'));
      redisClient.on('end', () => {
        logger.info('Redis Client Connection Ended');
        redisClient = null;
      });

      await redisClient.connect();

      // Test Redis connection
      await redisClient.ping();
      logger.info('Redis connection test successful');
    } else {
      logger.info('Redis is disabled');
    }
  } catch (error) {
    logger.error(`Redis Connection Error: ${error.message}`);
    redisClient = null;
  }
};

// Get Redis client (for use in routes)
const getRedisClient = () => redisClient;

module.exports = {
  connectDB,
  connectRedis,
  getRedisClient,
};
