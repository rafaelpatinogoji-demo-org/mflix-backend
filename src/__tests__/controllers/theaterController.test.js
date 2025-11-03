const {
  f_getAllTheaters,
  f_getTheaterById,
  f_createTheater,
  f_updateTheater,
  f_deleteTheater
} = require('../../controllers/theaterController');
const Theater = require('../../models/Theater');
const { mockTheater } = require('../mocks/mockModels');

jest.mock('../../models/Theater');

describe('TheaterController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {}
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('f_getAllTheaters', () => {
    it('should return paginated theaters with default pagination', async () => {
      const mockTheaters = [mockTheater, { ...mockTheater, _id: '507f1f77bcf86cd799439015' }];
      Theater.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTheaters)
      });
      Theater.countDocuments.mockResolvedValue(30);

      await f_getAllTheaters(mockReq, mockRes);

      expect(Theater.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        theaters: mockTheaters,
        currentPage: 1,
        totalPages: 3,
        totalTheaters: 30
      });
    });

    it('should return paginated theaters with custom page and limit', async () => {
      mockReq.query = { page: '2', limit: '15' };
      const mockTheaters = [mockTheater];
      Theater.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTheaters)
      });
      Theater.countDocuments.mockResolvedValue(40);

      await f_getAllTheaters(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        theaters: mockTheaters,
        currentPage: 2,
        totalPages: 3,
        totalTheaters: 40
      });
    });

    it('should handle errors and return 500 status', async () => {
      const errorMessage = 'Database error';
      Theater.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error(errorMessage))
      });

      await f_getAllTheaters(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });

    it('should return empty array when no theaters exist', async () => {
      Theater.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      Theater.countDocuments.mockResolvedValue(0);

      await f_getAllTheaters(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        theaters: [],
        currentPage: 1,
        totalPages: 0,
        totalTheaters: 0
      });
    });
  });

  describe('f_getTheaterById', () => {
    it('should return theater with location data when found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      Theater.findById.mockResolvedValue(mockTheater);

      await f_getTheaterById(mockReq, mockRes);

      expect(Theater.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
      expect(mockRes.json).toHaveBeenCalledWith(mockTheater);
    });

    it('should return theater with geo coordinates', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      Theater.findById.mockResolvedValue(mockTheater);

      await f_getTheaterById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          location: expect.objectContaining({
            geo: expect.objectContaining({
              coordinates: expect.any(Array)
            })
          })
        })
      );
    });

    it('should return 404 when theater not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      Theater.findById.mockResolvedValue(null);

      await f_getTheaterById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Theater not found' });
    });

    it('should handle errors and return 500 status', async () => {
      mockReq.params.id = 'invalid-id';
      const errorMessage = 'Invalid ID format';
      Theater.findById.mockRejectedValue(new Error(errorMessage));

      await f_getTheaterById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_createTheater', () => {
    it('should create theater with location data and return 201 status', async () => {
      mockReq.body = {
        theaterId: 2001,
        location: {
          address: {
            street1: '456 Oak Ave',
            city: 'Chicago',
            state: 'IL',
            zipcode: '60601'
          },
          geo: {
            type: 'Point',
            coordinates: [-87.6298, 41.8781]
          }
        }
      };
      const savedTheater = { ...mockTheater, ...mockReq.body };
      Theater.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedTheater)
      }));

      await f_createTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(savedTheater);
    });

    it('should return 400 when theaterId is missing', async () => {
      mockReq.body = {
        location: {
          address: { city: 'Chicago' }
        }
      };
      const errorMessage = 'Validation error: theaterId is required';
      Theater.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error(errorMessage))
      }));

      await f_createTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });

    it('should return 400 when geo coordinates are missing', async () => {
      mockReq.body = {
        theaterId: 3001,
        location: {
          address: { city: 'Test City' }
        }
      };
      const errorMessage = 'Validation error: coordinates are required';
      Theater.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error(errorMessage))
      }));

      await f_createTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_updateTheater', () => {
    it('should update theater and return updated data', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      mockReq.body = {
        location: {
          address: {
            street1: '789 New St',
            city: 'New City',
            state: 'NY',
            zipcode: '10001'
          }
        }
      };
      const updatedTheater = { ...mockTheater, location: mockReq.body.location };
      Theater.findByIdAndUpdate.mockResolvedValue(updatedTheater);

      await f_updateTheater(mockReq, mockRes);

      expect(Theater.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        mockReq.body,
        { new: true, runValidators: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedTheater);
    });

    it('should update theater geo coordinates', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      mockReq.body = {
        location: {
          geo: {
            type: 'Point',
            coordinates: [-74.0060, 40.7128]
          }
        }
      };
      const updatedTheater = { ...mockTheater, location: { ...mockTheater.location, ...mockReq.body.location } };
      Theater.findByIdAndUpdate.mockResolvedValue(updatedTheater);

      await f_updateTheater(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedTheater);
    });

    it('should return 404 when theater not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      mockReq.body = { theaterId: 5000 };
      Theater.findByIdAndUpdate.mockResolvedValue(null);

      await f_updateTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Theater not found' });
    });

    it('should return 400 when validation fails', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      mockReq.body = { theaterId: 'invalid' };
      const errorMessage = 'Validation error';
      Theater.findByIdAndUpdate.mockRejectedValue(new Error(errorMessage));

      await f_updateTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_deleteTheater', () => {
    it('should delete theater and return success message', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      Theater.findByIdAndDelete.mockResolvedValue(mockTheater);

      await f_deleteTheater(mockReq, mockRes);

      expect(Theater.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Theater deleted successfully' });
    });

    it('should return 404 when theater not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      Theater.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Theater not found' });
    });

    it('should handle errors and return 500 status', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439014';
      const errorMessage = 'Database error';
      Theater.findByIdAndDelete.mockRejectedValue(new Error(errorMessage));

      await f_deleteTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});
