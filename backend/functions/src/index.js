const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { logger } = require('./config/init');
const { ensureMongoDBConnection } = require('./config/mongodb');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// MongoDB connection middleware
app.use(ensureMongoDBConnection);

// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({ 
    status: 'healthy',
    mongodb: 'connected',
    timestamp: new Date().toISOString() 
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Export the Express API as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
