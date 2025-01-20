const { exec } = require('child_process');
const path = require('path');

// Configuration
const config = {
  buildCommand: 'npm run build',
  deployCommand: 'firebase deploy --only hosting',
  projectId: 'shopsyncai-445000'
};

// Utility function to execute commands
const execPromise = command => new Promise((resolve, reject) => {
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

async function deploy() {
  try {
    console.log('Starting deployment process...');

    // Install dependencies with legacy peer deps
    console.log('Installing dependencies...');
    await execPromise('npm install --legacy-peer-deps');

    // Build the project
    console.log('Building the project...');
    await execPromise(config.buildCommand);

    // Deploy to Firebase
    console.log('Deploying to Firebase...');
    await execPromise(config.deployCommand);

    console.log('Deployment completed successfully! 🚀');
    console.log(`Visit your app at: https://${config.projectId}.web.app`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
deploy();
