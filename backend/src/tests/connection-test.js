const dotenv = require('dotenv');
const { initializeServices } = require('../config/init');

dotenv.config();

const testConnections = async () => {
  try {
    console.log('Testing all service connections...');

    const { mongoose, firestore, redisClient } = await initializeServices();

    // Test MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    console.log(`MongoDB Status: ${mongoStatus}`);

    // Test Firestore
    if (firestore) {
      try {
        await firestore.collection('test').doc('test').set({ test: true });
        await firestore.collection('test').doc('test').delete();
        console.log('Firestore Status: Connected');
      } catch (error) {
        console.error('Firestore Error:', error);
      }
    }

    // Test Redis
    if (redisClient) {
      try {
        await redisClient.set('test', 'test');
        await redisClient.get('test');
        await redisClient.del('test');
        console.log('Redis Status: Connected');
      } catch (error) {
        console.error('Redis Error:', error);
      }
    }

    console.log('Connection tests completed.');
    process.exit(0);
  } catch (error) {
    console.error('Connection test failed:', error);
    process.exit(1);
  }
};

testConnections();
