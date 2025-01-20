module.exports = {
  api: {
    url: 'https://us-central1-shopsyncai-19aba.cloudfunctions.net',
  },
  firebase: {
    projectId: 'shopsyncai-19aba',
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
};
