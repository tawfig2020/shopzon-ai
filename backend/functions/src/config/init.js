const admin = require('firebase-admin');
const mongoose = require('mongoose');

// Configure logger
const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  debug: (message, ...args) => {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
};

// MongoDB initialization function
const initMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://tawfig2030shopi:ASMARA2020klshopi@shopi.ejaom.mongodb.net/?retryWrites=true&w=majority&appName=Shopi';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

module.exports = {
  logger,
  initMongoDB,
};
