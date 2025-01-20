const functions = require('firebase-functions');

const config = {
  mongodb: {
    uri: functions.config().mongodb.uri,
  },
  redis: {
    url: functions.config().redis.url,
  },
};

module.exports = config;
