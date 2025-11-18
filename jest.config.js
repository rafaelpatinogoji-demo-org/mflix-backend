module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    'src/controllers/commentController.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/models/Comment.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/routes/commentRoutes.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true,
  testTimeout: 30000
};
