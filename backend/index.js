const functions = require('firebase-functions');
const app = require('./src/server');

// Create and export the api function
exports.api = functions.https.onRequest(app);
