jest.mock('axios');
jest.mock('../config/database');

beforeAll(() => {
  process.env.VOYAGE_API_KEY = 'test-api-key';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
});

afterAll(() => {
  jest.clearAllMocks();
});
