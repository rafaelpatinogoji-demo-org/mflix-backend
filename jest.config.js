module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/controllers/theaterController.js',
    'src/controllers/movieSessionController.js',
    'src/controllers/theaterSessionController.js'
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      branches: 80,
      functions: 90,
      statements: 90
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
};
