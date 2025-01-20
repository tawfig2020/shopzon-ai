const config = {
  development: {
    baseURL: 'http://localhost:5001/shopsyncai-445000/us-central1/api',
    timeout: 5000,
  },
  production: {
    baseURL: 'https://us-central1-shopsyncai-445000.cloudfunctions.net/api',
    timeout: 10000,
  },
  test: {
    baseURL: 'http://localhost:5001/shopsyncai-445000/us-central1/api',
    timeout: 1000,
  },
};

export default config[process.env.NODE_ENV || 'development'];
