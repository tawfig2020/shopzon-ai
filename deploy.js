const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  frontend: {
    dir: path.join(__dirname, 'frontend'),
    buildCommand: 'npm run build',
    buildDir: 'build'
  },
  backend: {
    dir: path.join(__dirname, 'backend'),
    buildCommand: 'npm run build',
    buildDir: 'dist'
  }
};

// Utility functions
const execPromise = command => new Promise((resolve, reject) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      reject(error);
      return;
    }
    console.log(stdout);
    resolve();
  });
});

const validateEnvironment = () => {
  const requiredEnvVars = [
    'REACT_APP_API_URL',
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'MONGODB_URI',
    'FIREBASE_SERVICE_ACCOUNT_PATH'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }
};

const buildFrontend = async () => {
  console.log('Building frontend...');
  process.chdir(config.frontend.dir);
  await execPromise('npm install');
  await execPromise(config.frontend.buildCommand);
};

const buildBackend = async () => {
  console.log('Building backend...');
  process.chdir(config.backend.dir);
  await execPromise('npm install');
  await execPromise(config.backend.buildCommand);
};

const deploy = async () => {
  try {
    console.log('Starting deployment process...');
    
    // Validate environment
    validateEnvironment();
    
    // Build frontend and backend
    await buildFrontend();
    await buildBackend();
    
    console.log('Deployment completed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
};

// Run deployment
deploy();
