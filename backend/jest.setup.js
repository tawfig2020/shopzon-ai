require('dotenv').config({ path: '.env.test' });

// Mock MongoDB connection for tests
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  connection: {
    readyState: 1,
    db: {
      collections: jest.fn().mockResolvedValue([]),
    },
  },
  disconnect: jest.fn().mockResolvedValue(true),
}));

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user-id' }),
  }),
}));
