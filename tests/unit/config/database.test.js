const mongoose = require('mongoose');

jest.mock('mongoose', () => ({
  connect: jest.fn()
}));

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Database Configuration', () => {
  let v_originalEnv;
  let v_mockConsoleLog;
  let v_mockConsoleError;
  let v_mockProcessExit;

  beforeEach(() => {
    v_originalEnv = process.env;
    process.env = { ...v_originalEnv };
    
    v_mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    v_mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    v_mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    mongoose.connect.mockReset();
    jest.resetModules();
  });

  afterEach(() => {
    process.env = v_originalEnv;
    v_mockConsoleLog.mockRestore();
    v_mockConsoleError.mockRestore();
    v_mockProcessExit.mockRestore();
  });

  describe('connectDB function', () => {
    describe('Successful Connection', () => {
      it('should connect to MongoDB using MONGODB_URI from environment variables', async () => {
        process.env.MONGODB_URI = 'mongodb://test-server:27017/test-db';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockResolvedValueOnce();
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockMongoose.connect).toHaveBeenCalledWith('mongodb://test-server:27017/test-db');
        expect(v_mockMongoose.connect).toHaveBeenCalledTimes(1);
      });

      it('should log success message when connection is successful', async () => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/mflix';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockResolvedValueOnce();
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockConsoleLog).toHaveBeenCalledWith('MongoDB connected successfully');
      });

      it('should use default MongoDB URI when MONGODB_URI is not set', async () => {
        delete process.env.MONGODB_URI;
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockResolvedValueOnce();
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockMongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/mflix');
      });

      it('should use default MongoDB URI when MONGODB_URI is empty string', async () => {
        process.env.MONGODB_URI = '';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockResolvedValueOnce();
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockMongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/mflix');
      });
    });

    describe('Connection Failure', () => {
      it('should log error message when connection fails', async () => {
        const v_mockError = new Error('Connection refused');
        process.env.MONGODB_URI = 'mongodb://invalid-host:27017/test';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockRejectedValueOnce(v_mockError);
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockConsoleError).toHaveBeenCalledWith('MongoDB connection error:', v_mockError);
      });

      it('should call process.exit(1) when connection fails', async () => {
        const v_mockError = new Error('Authentication failed');
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockRejectedValueOnce(v_mockError);
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockProcessExit).toHaveBeenCalledWith(1);
      });

      it('should handle network timeout errors', async () => {
        const v_timeoutError = new Error('Network timeout');
        v_timeoutError.name = 'MongoNetworkError';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockRejectedValueOnce(v_timeoutError);
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockConsoleError).toHaveBeenCalledWith('MongoDB connection error:', v_timeoutError);
        expect(v_mockProcessExit).toHaveBeenCalledWith(1);
      });

      it('should handle authentication errors', async () => {
        const v_authError = new Error('Authentication failed');
        v_authError.name = 'MongoServerError';
        v_authError.code = 18;
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockRejectedValueOnce(v_authError);
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockConsoleError).toHaveBeenCalledWith('MongoDB connection error:', v_authError);
        expect(v_mockProcessExit).toHaveBeenCalledWith(1);
      });

      it('should handle invalid connection string errors', async () => {
        const v_invalidUriError = new Error('Invalid connection string');
        v_invalidUriError.name = 'MongoParseError';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockRejectedValueOnce(v_invalidUriError);
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockConsoleError).toHaveBeenCalledWith('MongoDB connection error:', v_invalidUriError);
        expect(v_mockProcessExit).toHaveBeenCalledWith(1);
      });
    });

    describe('Environment Variable Handling', () => {
      it('should prioritize MONGODB_URI over default value', async () => {
        process.env.MONGODB_URI = 'mongodb://custom-host:27017/custom-db';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockResolvedValueOnce();
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockMongoose.connect).toHaveBeenCalledWith('mongodb://custom-host:27017/custom-db');
      });

      it('should handle MongoDB Atlas connection strings', async () => {
        process.env.MONGODB_URI = 'mongodb+srv://user:password@cluster.mongodb.net/mflix?retryWrites=true&w=majority';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockResolvedValueOnce();
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockMongoose.connect).toHaveBeenCalledWith(
          'mongodb+srv://user:password@cluster.mongodb.net/mflix?retryWrites=true&w=majority'
        );
      });

      it('should handle connection strings with special characters', async () => {
        process.env.MONGODB_URI = 'mongodb://user:p%40ssw0rd@localhost:27017/test';
        
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockResolvedValueOnce();
        
        const connectDB = require('../../../src/config/database');
        await connectDB();
        
        expect(v_mockMongoose.connect).toHaveBeenCalledWith('mongodb://user:p%40ssw0rd@localhost:27017/test');
      });
    });

    describe('Module Export', () => {
      it('should export connectDB as a function', () => {
        const connectDB = require('../../../src/config/database');
        expect(typeof connectDB).toBe('function');
      });

      it('should export connectDB as the default export', () => {
        const connectDB = require('../../../src/config/database');
        expect(connectDB).toBeDefined();
        expect(connectDB.name).toBe('connectDB');
      });
    });

    describe('Async Behavior', () => {
      it('should return a promise', () => {
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockResolvedValueOnce();
        
        const connectDB = require('../../../src/config/database');
        const v_result = connectDB();
        
        expect(v_result).toBeInstanceOf(Promise);
      });

      it('should resolve successfully on successful connection', async () => {
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockResolvedValueOnce();
        
        const connectDB = require('../../../src/config/database');
        
        await expect(connectDB()).resolves.toBeUndefined();
      });

      it('should not throw when connection fails (handled internally)', async () => {
        const v_mockMongoose = require('mongoose');
        v_mockMongoose.connect.mockRejectedValueOnce(new Error('Connection failed'));
        
        const connectDB = require('../../../src/config/database');
        
        await expect(connectDB()).resolves.toBeUndefined();
      });
    });
  });
});
