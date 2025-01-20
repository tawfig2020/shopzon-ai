module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
        singleQuote: true,
        semi: true,
        tabWidth: 2,
      },
    ],
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-console': [
      'warn',
      {
        allow: ['info', 'warn', 'error'],
      },
    ],
  },
  ignorePatterns: [
    'node_modules/',
    'venv/',
    'dist/',
    'build/',
    'coverage/',
    '*.test.js',
    'jest.config.js',
  ],
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/tests/**/*.js',
        'deploy.js',
        'create-dirs.js',
        'src/tests/connection-test.js',
      ],
      env: {
        jest: true,
      },
      rules: {
        'no-undef': 'off',
        'no-console': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
};
