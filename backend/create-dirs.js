const fs = require('fs');
const path = require('path');

const dirs = ['src/routes', 'src/controllers', 'src/models', 'src/middleware', 'src/config'];

dirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
});
