const logger = require('../utils/logger');

const deploymentConfig = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
    },
  },

  // Firebase configuration
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  },

  // Frontend configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'dev',
  },

  // Initialize deployment configuration
  init: () => {
    // Validate required environment variables
    const requiredEnvVars = ['MONGODB_URI', 'FIREBASE_SERVICE_ACCOUNT_PATH', 'JWT_SECRET'];

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
      process.exit(1);
    }

    // Log deployment configuration
    logger.info('Deployment configuration initialized', {
      environment: deploymentConfig.server.env,
      port: deploymentConfig.server.port,
    });

    return deploymentConfig;
  },
};

module.exports = deploymentConfig;
