const express = require('express');
const router = express.Router();
const { version } = require('../../package.json');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      database: global.mongoConnected ? 'connected' : 'disconnected',
      redis: global.redisConnected ? 'connected' : 'disconnected',
    },
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'ShopSyncAI API',
    version,
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        verify: 'GET /api/auth/verify',
      },
      lists: {
        getAll: 'GET /api/lists',
        create: 'POST /api/lists',
        getOne: 'GET /api/lists/:id',
        update: 'PUT /api/lists/:id',
        delete: 'DELETE /api/lists/:id',
      },
      households: {
        getAll: 'GET /api/households',
        create: 'POST /api/households',
        getOne: 'GET /api/households/:id',
        update: 'PUT /api/households/:id',
        delete: 'DELETE /api/households/:id',
      },
      users: {
        profile: 'GET /api/users/profile',
        update: 'PUT /api/users/profile',
      },
      metrics: {
        user: 'GET /api/metrics/user',
        household: 'GET /api/metrics/household/:id',
        system: 'GET /api/metrics/system',
      },
    },
  });
});

module.exports = router;
