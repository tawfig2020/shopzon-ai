const fs = require('fs-extra');
const path = require('path');

// Ensure lib directory exists
fs.ensureDirSync('lib');

// Copy JavaScript files
fs.copySync('src', 'lib', {
    filter: (src) => {
        return path.extname(src) === '.js' || fs.statSync(src).isDirectory();
    }
});

// Copy package.json and other necessary files
fs.copySync('package.json', 'lib/package.json');

console.log('Build completed!');
