const { ESLint } = require('eslint');

async function main() {
  // Create an instance of ESLint with --fix option
  const eslint = new ESLint({ fix: true });

  // Lint files and fix them
  const results = await eslint.lintFiles(['src/**/*.{js,jsx,ts,tsx}']);

  // Apply fixes
  await ESLint.outputFixes(results);

  // Format results
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = await formatter.format(results);

  // Log results
  console.log(resultText);
}

main().catch((error) => {
  console.error('Error running ESLint:', error);
  process.exit(1);
});
