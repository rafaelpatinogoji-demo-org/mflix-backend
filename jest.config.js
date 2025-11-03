module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
