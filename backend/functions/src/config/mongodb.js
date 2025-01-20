const mongoose = require('mongoose');
const { logger } = require('./init');

let isConnected = false;

const connectToMongoDB = async () => {
  try {
    if (!isConnected) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://tawfig2030shopi:ASMARA2020klshopi@shopi.ejaom.mongodb.net/?retryWrites=true&w=majority&appName=Shopi';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      isConnected = true;
      logger.info('MongoDB connected successfully');
      
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        isConnected = false;
        logger.warn('MongoDB disconnected');
      });
      
      return mongoose.connection;
    }
  } catch (error) {
    isConnected = false;
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

const ensureMongoDBConnection = async (req, res, next) => {
  try {
    if (!isConnected) {
      await connectToMongoDB();
    }
    next();
  } catch (error) {
    logger.error('MongoDB connection middleware error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
};

module.exports = {
  connectToMongoDB,
  ensureMongoDBConnection
};
