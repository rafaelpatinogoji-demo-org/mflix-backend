module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!node_modules/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  coverageThreshold: {
    'src/config/database.js': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
