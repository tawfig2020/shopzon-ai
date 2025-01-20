const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function executeCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error: ${errorMessage}${colors.reset}`);
    process.exit(1);
  }
}

console.log(`${colors.bright}Starting build process...${colors.reset}\n`);

// Install dependencies
console.log(`\n${colors.yellow}Installing dependencies...${colors.reset}`);
executeCommand('npm install --legacy-peer-deps', 'Failed to install dependencies');

// Build the application
console.log(`\n${colors.yellow}Building the application...${colors.reset}`);
executeCommand('npm run build', 'Build failed');

// Initialize Firebase if needed
console.log(`\n${colors.yellow}Checking Firebase initialization...${colors.reset}`);
executeCommand('firebase --version || npm install -g firebase-tools', 'Failed to initialize Firebase');

// Deploy to Firebase
console.log(`\n${colors.yellow}Deploying to Firebase...${colors.reset}`);
if (process.env.FIREBASE_TOKEN) {
  executeCommand('firebase deploy --only hosting --token "$FIREBASE_TOKEN"', 'Deployment failed');
} else {
  console.log(`${colors.yellow}No FIREBASE_TOKEN found. Please run 'firebase login:ci' to get a token for CI/CD deployment.${colors.reset}`);
  executeCommand('firebase deploy --only hosting', 'Deployment failed');
}

console.log(`\n${colors.green}${colors.bright}✓ Build and deployment completed successfully!${colors.reset}`);
