const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  projectId: 'shopsyncai-445000',
  region: 'us-central1',
  runtime: 'nodejs18',
};

// Utility function to execute commands
const execPromise = (command) =>
  new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        reject(error);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve();
    });
  });

// Check if required files exist
const checkRequiredFiles = () => {
  const requiredFiles = ['app.yaml', 'package.json', 'server.js'];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      throw new Error(`Required file ${file} not found`);
    }
  }
};

async function deploy() {
  try {
    console.log('Starting backend deployment process...');

    // Check required files
    checkRequiredFiles();

    // Install dependencies
    console.log('Installing dependencies...');
    await execPromise('npm install --production');

    // Deploy to Google Cloud
    console.log('Deploying to Google Cloud...');
    await execPromise('gcloud app deploy app.yaml --quiet');

    console.log('Deployment completed successfully! 🚀');
    console.log(`Visit your app at: https://${config.projectId}.uc.r.appspot.com`);
    
    // Log deployment information
    console.log('\nDeployment Information:');
    console.log('------------------------');
    console.log(`Project ID: ${config.projectId}`);
    console.log(`Region: ${config.region}`);
    console.log(`Runtime: ${config.runtime}`);
    console.log(`API Base URL: https://${config.projectId}.uc.r.appspot.com/api`);
    
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
deploy();
