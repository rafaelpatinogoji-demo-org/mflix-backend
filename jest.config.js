module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/controllers/theaterController.js',
    'src/controllers/movieSessionController.js'
  ],
  coverageThreshold: {
    'src/controllers/theaterController.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/controllers/movieSessionController.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true
};
