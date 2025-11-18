jest.mock('mongoose', () => ({
  connect: jest.fn()
}));

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

const mongoose = require('mongoose');
const dotenv = require('dotenv');

describe('Database Configuration', () => {
  let v_originalEnv;
  let v_consoleLog;
  let v_consoleError;
  let v_processExit;
  let f_connectDB;
  let v_dotenvCalledOnLoad = false;
  
  beforeAll(() => {
    v_dotenvCalledOnLoad = dotenv.config.mock.calls.length === 0;
    f_connectDB = require('../../../src/config/database');
    v_dotenvCalledOnLoad = dotenv.config.mock.calls.length > 0;
  });

  beforeEach(() => {
    v_originalEnv = { ...process.env };
    
    v_consoleLog = jest.spyOn(console, 'log').mockImplementation();
    v_consoleError = jest.spyOn(console, 'error').mockImplementation();
    v_processExit = jest.spyOn(process, 'exit').mockImplementation();
    
    mongoose.connect.mockClear();
  });

  afterEach(() => {
    process.env = v_originalEnv;
    v_consoleLog.mockRestore();
    v_consoleError.mockRestore();
    v_processExit.mockRestore();
  });

  describe('Connection Configuration Tests', () => {
    it('should successfully connect with default localhost URI when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/mflix');
      expect(v_consoleLog).toHaveBeenCalledWith('MongoDB connected successfully');
      expect(v_processExit).not.toHaveBeenCalled();
    });

    it('should successfully connect with custom environment URI when MONGODB_URI is set', async () => {
      const v_customUri = 'mongodb://custom-host:27017/custom-db';
      process.env.MONGODB_URI = v_customUri;
      
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(mongoose.connect).toHaveBeenCalledWith(v_customUri);
      expect(v_consoleLog).toHaveBeenCalledWith('MongoDB connected successfully');
      expect(v_processExit).not.toHaveBeenCalled();
    });

    it('should call mongoose.connect with proper URI', async () => {
      const v_testUri = 'mongodb://test-server:27017/test-db';
      process.env.MONGODB_URI = v_testUri;
      
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(mongoose.connect).toHaveBeenCalledWith(v_testUri);
    });

    it('should call dotenv.config() on module load', () => {
      expect(v_dotenvCalledOnLoad).toBe(true);
    });

    it('should log connection success message when connected successfully', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/mflix';
      
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(v_consoleLog).toHaveBeenCalledWith('MongoDB connected successfully');
      expect(v_consoleLog).toHaveBeenCalledTimes(1);
    });
  });

  describe('Environment Variable Handling Tests', () => {
    it('should use MONGODB_URI environment variable when set', async () => {
      const v_envUri = 'mongodb://env-server:27017/env-db';
      process.env.MONGODB_URI = v_envUri;
      
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(mongoose.connect).toHaveBeenCalledWith(v_envUri);
    });

    it('should use default localhost URI when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/mflix');
    });

    it('should use default localhost URI when MONGODB_URI is empty string', async () => {
      process.env.MONGODB_URI = '';
      
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/mflix');
    });

    it('should pass through invalid URI format from environment variable', async () => {
      const v_invalidUri = 'invalid-uri-format';
      process.env.MONGODB_URI = v_invalidUri;
      
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(mongoose.connect).toHaveBeenCalledWith(v_invalidUri);
    });

    it('should prioritize MONGODB_URI environment variable over default', async () => {
      const v_envUri = 'mongodb://priority-test:27017/priority-db';
      process.env.MONGODB_URI = v_envUri;
      
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(mongoose.connect).toHaveBeenCalledWith(v_envUri);
      expect(mongoose.connect).not.toHaveBeenCalledWith('mongodb://localhost:27017/mflix');
    });
  });

  describe('Error Scenarios Tests', () => {
    it('should handle connection failure with invalid URI', async () => {
      const v_error = new Error('Invalid URI');
      process.env.MONGODB_URI = 'invalid-uri';
      
      mongoose.connect.mockRejectedValue(v_error);
      
      await f_connectDB();
      
      expect(v_consoleError).toHaveBeenCalledWith('MongoDB connection error:', v_error);
      expect(v_processExit).toHaveBeenCalledWith(1);
    });

    it('should handle connection timeout scenario', async () => {
      const v_timeoutError = new Error('Connection timeout');
      v_timeoutError.name = 'MongooseServerSelectionError';
      
      mongoose.connect.mockRejectedValue(v_timeoutError);
      
      await f_connectDB();
      
      expect(v_consoleError).toHaveBeenCalledWith('MongoDB connection error:', v_timeoutError);
      expect(v_processExit).toHaveBeenCalledWith(1);
    });

    it('should handle network error', async () => {
      const v_networkError = new Error('Network unreachable');
      v_networkError.code = 'ENETUNREACH';
      
      mongoose.connect.mockRejectedValue(v_networkError);
      
      await f_connectDB();
      
      expect(v_consoleError).toHaveBeenCalledWith('MongoDB connection error:', v_networkError);
      expect(v_processExit).toHaveBeenCalledWith(1);
    });

    it('should handle authentication error', async () => {
      const v_authError = new Error('Authentication failed');
      v_authError.name = 'MongoServerError';
      v_authError.code = 18;
      
      mongoose.connect.mockRejectedValue(v_authError);
      
      await f_connectDB();
      
      expect(v_consoleError).toHaveBeenCalledWith('MongoDB connection error:', v_authError);
      expect(v_processExit).toHaveBeenCalledWith(1);
    });

    it('should handle generic database error', async () => {
      const v_genericError = new Error('Database connection failed');
      
      mongoose.connect.mockRejectedValue(v_genericError);
      
      await f_connectDB();
      
      expect(v_consoleError).toHaveBeenCalledWith('MongoDB connection error:', v_genericError);
      expect(v_processExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Process Exit Behavior Tests', () => {
    it('should call process.exit(1) on connection failure', async () => {
      const v_error = new Error('Connection failed');
      
      mongoose.connect.mockRejectedValue(v_error);
      
      await f_connectDB();
      
      expect(v_processExit).toHaveBeenCalledWith(1);
      expect(v_processExit).toHaveBeenCalledTimes(1);
    });

    it('should NOT call process.exit on successful connection', async () => {
      mongoose.connect.mockResolvedValue();
      
      await f_connectDB();
      
      expect(v_processExit).not.toHaveBeenCalled();
    });

    it('should call console.error before process.exit on failure', async () => {
      const v_error = new Error('Test error');
      
      mongoose.connect.mockRejectedValue(v_error);
      
      await f_connectDB();
      
      expect(v_consoleError).toHaveBeenCalled();
      expect(v_processExit).toHaveBeenCalled();
      expect(v_consoleError).toHaveBeenCalledWith('MongoDB connection error:', v_error);
    });

    it('should format error message correctly on failure', async () => {
      const v_error = new Error('Specific error message');
      
      mongoose.connect.mockRejectedValue(v_error);
      
      await f_connectDB();
      
      expect(v_consoleError).toHaveBeenCalledWith('MongoDB connection error:', v_error);
      expect(v_consoleError.mock.calls[0][0]).toBe('MongoDB connection error:');
      expect(v_consoleError.mock.calls[0][1]).toBe(v_error);
    });

    it('should ensure process.exit prevents further execution', async () => {
      const v_error = new Error('Fatal error');
      let v_executedAfterExit = false;
      
      mongoose.connect.mockRejectedValue(v_error);
      v_processExit.mockImplementation(() => {
        throw new Error('Process exit called');
      });
      
      try {
        await f_connectDB();
        v_executedAfterExit = true;
      } catch (p_error) {
        if (p_error.message !== 'Process exit called') {
          throw p_error;
        }
      }
      
      expect(v_processExit).toHaveBeenCalledWith(1);
      expect(v_executedAfterExit).toBe(false);
    });
  });
});
