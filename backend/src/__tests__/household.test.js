const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Household = require('../models/household.model');
const { generateToken } = require('../utils/auth');

describe('Household API', () => {
  let token;
  let userId;

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId();
    token = generateToken(userId);
  });

  describe('POST /api/households', () => {
    it('should create a new household', async () => {
      const householdData = {
        name: 'Test Household',
      };

      const response = await request(app)
        .post('/api/households')
        .set('Authorization', `Bearer ${token}`)
        .send(householdData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', householdData.name);
      expect(response.body.owner).toBe(userId.toString());
      expect(response.body.members).toHaveLength(1);
    });

    it('should not create a household without authentication', async () => {
      const response = await request(app).post('/api/households').send({ name: 'Test Household' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/households', () => {
    beforeEach(async () => {
      await Household.create({
        name: 'Test Household 1',
        owner: userId,
        members: [{ user: userId, role: 'owner' }],
      });
    });

    it('should get all households for user', async () => {
      const response = await request(app)
        .get('/api/households')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
    });
  });
});
