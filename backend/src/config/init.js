const mongoose = require('mongoose');
const Redis = require('ioredis');
const winston = require('winston');
const admin = require('firebase-admin');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

let redisClient = null;
let firestore = null;

async function initMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    logger.info('MongoDB connected successfully');
    
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error during MongoDB connection closure:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
}

async function initFirebase() {
  if (!admin.apps.length) {
    try {
      const serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          .replace(/\$\{n\}/g, '\n')
          .replace(/\[n\]/g, '\n'),
        client_email: process.env.GCP_CLIENT_EMAIL,
        client_id: process.env.GCP_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GCP_CLIENT_EMAIL}`,
      };

      logger.info('Initializing Firebase with service account:', {
        ...serviceAccount,
        private_key: '***',
      });

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      firestore = admin.firestore();
      logger.info('Firebase initialized successfully');
    } catch (error) {
      logger.error('Firebase initialization error:', error);
      throw error;
    }
  }
}

function initRedis() {
  if (process.env.USE_REDIS === 'true') {
    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }
}

async function initializeServices() {
  try {
    await initMongoDB();
    await initFirebase();
    initRedis();
    return {
      mongoose,
      firestore,
      redisClient,
    };
  } catch (error) {
    logger.error('Error initializing services:', error);
    throw error;
  }
}

const getRedisClient = () => redisClient;
const getFirestore = () => firestore;

module.exports = {
  initializeServices,
  getRedisClient,
  getFirestore,
  logger,
};
