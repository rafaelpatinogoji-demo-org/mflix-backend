const {
  f_getNearbyTheaters,
  f_getAllTheaters,
  f_getTheaterById,
  f_createTheater,
  f_updateTheater,
  f_deleteTheater
} = require('../../src/controllers/theaterController');

const Theater = require('../../src/models/Theater');

jest.mock('../../src/models/Theater');

describe('theaterController', () => {
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {}
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('f_getNearbyTheaters', () => {
    describe('parameter validation', () => {
      it('should return 400 when latitude is missing', async () => {
        mockReq.query = { longitude: '10', radius: '5' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius are required parameters'
        });
      });

      it('should return 400 when longitude is missing', async () => {
        mockReq.query = { latitude: '10', radius: '5' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius are required parameters'
        });
      });

      it('should return 400 when radius is missing', async () => {
        mockReq.query = { latitude: '10', longitude: '20' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius are required parameters'
        });
      });

      it('should return 400 when latitude is not a valid number', async () => {
        mockReq.query = { latitude: 'invalid', longitude: '10', radius: '5' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius must be valid numbers'
        });
      });

      it('should return 400 when longitude is not a valid number', async () => {
        mockReq.query = { latitude: '10', longitude: 'invalid', radius: '5' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius must be valid numbers'
        });
      });

      it('should return 400 when radius is not a valid number', async () => {
        mockReq.query = { latitude: '10', longitude: '20', radius: 'invalid' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius must be valid numbers'
        });
      });
    });

    describe('coordinate range validation', () => {
      it('should return 400 when latitude is less than -90', async () => {
        mockReq.query = { latitude: '-91', longitude: '10', radius: '5' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid latitude or longitude values'
        });
      });

      it('should return 400 when latitude is greater than 90', async () => {
        mockReq.query = { latitude: '91', longitude: '10', radius: '5' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid latitude or longitude values'
        });
      });

      it('should return 400 when longitude is less than -180', async () => {
        mockReq.query = { latitude: '10', longitude: '-181', radius: '5' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid latitude or longitude values'
        });
      });

      it('should return 400 when longitude is greater than 180', async () => {
        mockReq.query = { latitude: '10', longitude: '181', radius: '5' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid latitude or longitude values'
        });
      });

      it('should accept latitude at boundary -90', async () => {
        mockReq.query = { latitude: '-90', longitude: '10', radius: '5' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).not.toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          theaters: [],
          count: 0
        });
      });

      it('should accept latitude at boundary 90', async () => {
        mockReq.query = { latitude: '90', longitude: '10', radius: '5' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).not.toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          theaters: [],
          count: 0
        });
      });

      it('should accept longitude at boundary -180', async () => {
        mockReq.query = { latitude: '10', longitude: '-180', radius: '5' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).not.toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          theaters: [],
          count: 0
        });
      });

      it('should accept longitude at boundary 180', async () => {
        mockReq.query = { latitude: '10', longitude: '180', radius: '5' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).not.toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          theaters: [],
          count: 0
        });
      });
    });

    describe('radius validation', () => {
      it('should return 400 when radius is zero', async () => {
        mockReq.query = { latitude: '10', longitude: '20', radius: '0' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Radius must be a positive number'
        });
      });

      it('should return 400 when radius is negative', async () => {
        mockReq.query = { latitude: '10', longitude: '20', radius: '-5' };

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Radius must be a positive number'
        });
      });
    });

    describe('distance calculation and unit conversion', () => {
      it('should convert km radius to meters (multiply by 1000)', async () => {
        mockReq.query = { latitude: '40.7128', longitude: '-74.0060', radius: '10', unit: 'km' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(Theater.aggregate).toHaveBeenCalledWith([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [-74.0060, 40.7128]
              },
              distanceField: 'distance',
              maxDistance: 10000,
              spherical: true
            }
          },
          {
            $project: {
              theaterId: 1,
              location: 1,
              distance: 1
            }
          }
        ]);
      });

      it('should convert miles radius to meters (multiply by 1609.34)', async () => {
        mockReq.query = { latitude: '40.7128', longitude: '-74.0060', radius: '10', unit: 'miles' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(Theater.aggregate).toHaveBeenCalledWith([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [-74.0060, 40.7128]
              },
              distanceField: 'distance',
              maxDistance: 16093.4,
              spherical: true
            }
          },
          {
            $project: {
              theaterId: 1,
              location: 1,
              distance: 1
            }
          }
        ]);
      });

      it('should default to km when unit is not specified', async () => {
        mockReq.query = { latitude: '40.7128', longitude: '-74.0060', radius: '10' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(Theater.aggregate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              $geoNear: expect.objectContaining({
                maxDistance: 10000
              })
            })
          ])
        );
      });

      it('should convert distance from meters to km in response', async () => {
        mockReq.query = { latitude: '40.7128', longitude: '-74.0060', radius: '10', unit: 'km' };
        const mockTheaters = [
          { _id: '1', theaterId: 101, location: {}, distance: 5000 },
          { _id: '2', theaterId: 102, location: {}, distance: 8500 }
        ];
        Theater.aggregate = jest.fn().mockResolvedValue(mockTheaters);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({
          theaters: [
            { _id: '1', theaterId: 101, location: {}, distance: 5.00, unit: 'km' },
            { _id: '2', theaterId: 102, location: {}, distance: 8.50, unit: 'km' }
          ],
          count: 2
        });
      });

      it('should convert distance from meters to miles in response', async () => {
        mockReq.query = { latitude: '40.7128', longitude: '-74.0060', radius: '10', unit: 'miles' };
        const mockTheaters = [
          { _id: '1', theaterId: 101, location: {}, distance: 8046.7 }
        ];
        Theater.aggregate = jest.fn().mockResolvedValue(mockTheaters);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({
          theaters: [
            { _id: '1', theaterId: 101, location: {}, distance: 5.00, unit: 'miles' }
          ],
          count: 1
        });
      });
    });

    describe('geospatial query logic', () => {
      it('should use correct coordinate order [lng, lat] for GeoJSON', async () => {
        mockReq.query = { latitude: '34.0522', longitude: '-118.2437', radius: '15', unit: 'km' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(Theater.aggregate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              $geoNear: expect.objectContaining({
                near: {
                  type: 'Point',
                  coordinates: [-118.2437, 34.0522]
                }
              })
            })
          ])
        );
      });

      it('should use spherical geometry for calculations', async () => {
        mockReq.query = { latitude: '40.7128', longitude: '-74.0060', radius: '10' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(Theater.aggregate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              $geoNear: expect.objectContaining({
                spherical: true
              })
            })
          ])
        );
      });

      it('should project required fields in results', async () => {
        mockReq.query = { latitude: '40.7128', longitude: '-74.0060', radius: '10' };
        Theater.aggregate = jest.fn().mockResolvedValue([]);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(Theater.aggregate).toHaveBeenCalledWith(
          expect.arrayContaining([
            {
              $project: {
                theaterId: 1,
                location: 1,
                distance: 1
              }
            }
          ])
        );
      });
    });

    describe('error handling', () => {
      it('should return 500 when database query fails', async () => {
        mockReq.query = { latitude: '40.7128', longitude: '-74.0060', radius: '10' };
        const dbError = new Error('Database connection failed');
        Theater.aggregate = jest.fn().mockRejectedValue(dbError);

        await f_getNearbyTheaters(mockReq, mockRes);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding nearby theaters:', dbError);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Database connection failed'
        });
      });
    });
  });

  describe('f_getAllTheaters', () => {
    describe('pagination logic', () => {
      it('should use default pagination when no query params provided', async () => {
        Theater.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        });
        Theater.countDocuments = jest.fn().mockResolvedValue(0);

        await f_getAllTheaters(mockReq, mockRes);

        expect(Theater.find().skip).toHaveBeenCalledWith(0);
        expect(Theater.find().limit).toHaveBeenCalledWith(10);
        expect(mockRes.json).toHaveBeenCalledWith({
          theaters: [],
          currentPage: 1,
          totalPages: 0,
          totalTheaters: 0
        });
      });

      it('should apply custom page and limit', async () => {
        mockReq.query = { page: '3', limit: '20' };
        Theater.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        });
        Theater.countDocuments = jest.fn().mockResolvedValue(100);

        await f_getAllTheaters(mockReq, mockRes);

        expect(Theater.find().skip).toHaveBeenCalledWith(40);
        expect(Theater.find().limit).toHaveBeenCalledWith(20);
        expect(mockRes.json).toHaveBeenCalledWith({
          theaters: [],
          currentPage: 3,
          totalPages: 5,
          totalTheaters: 100
        });
      });

      it('should calculate skip correctly for different pages', async () => {
        mockReq.query = { page: '5', limit: '15' };
        Theater.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        });
        Theater.countDocuments = jest.fn().mockResolvedValue(0);

        await f_getAllTheaters(mockReq, mockRes);

        expect(Theater.find().skip).toHaveBeenCalledWith(60);
      });

      it('should calculate totalPages correctly using Math.ceil', async () => {
        mockReq.query = { page: '1', limit: '10' };
        Theater.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        });
        Theater.countDocuments = jest.fn().mockResolvedValue(25);

        await f_getAllTheaters(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            totalPages: 3
          })
        );
      });
    });

    describe('error handling', () => {
      it('should return 500 when database query fails', async () => {
        const dbError = new Error('Database error');
        Theater.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockRejectedValue(dbError)
        });

        await f_getAllTheaters(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });

  describe('f_getTheaterById', () => {
    it('should return theater when found', async () => {
      const mockTheater = { _id: '123', theaterId: 101, location: {} };
      mockReq.params.id = '123';
      Theater.findById = jest.fn().mockResolvedValue(mockTheater);

      await f_getTheaterById(mockReq, mockRes);

      expect(Theater.findById).toHaveBeenCalledWith('123');
      expect(mockRes.json).toHaveBeenCalledWith(mockTheater);
    });

    it('should return 404 when theater not found', async () => {
      mockReq.params.id = '123';
      Theater.findById = jest.fn().mockResolvedValue(null);

      await f_getTheaterById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater not found'
      });
    });

    it('should return 500 on database error', async () => {
      mockReq.params.id = '123';
      const dbError = new Error('Database error');
      Theater.findById = jest.fn().mockRejectedValue(dbError);

      await f_getTheaterById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  describe('f_createTheater', () => {
    it('should create theater with 201 status', async () => {
      const mockTheaterData = { theaterId: 101, location: {} };
      const mockSavedTheater = { _id: '123', ...mockTheaterData };
      mockReq.body = mockTheaterData;

      Theater.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedTheater)
      }));

      await f_createTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockSavedTheater);
    });

    it('should return 400 on validation error', async () => {
      mockReq.body = { invalidField: 'test' };
      const validationError = new Error('Validation failed');

      Theater.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(validationError)
      }));

      await f_createTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Validation failed'
      });
    });
  });

  describe('f_updateTheater', () => {
    it('should update theater with new: true and runValidators: true', async () => {
      const mockUpdatedTheater = { _id: '123', theaterId: 101, location: {} };
      mockReq.params.id = '123';
      mockReq.body = { theaterId: 101 };
      Theater.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedTheater);

      await f_updateTheater(mockReq, mockRes);

      expect(Theater.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { theaterId: 101 },
        { new: true, runValidators: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedTheater);
    });

    it('should return 404 when theater not found', async () => {
      mockReq.params.id = '123';
      mockReq.body = { theaterId: 101 };
      Theater.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await f_updateTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater not found'
      });
    });

    it('should return 400 on validation error', async () => {
      mockReq.params.id = '123';
      mockReq.body = { invalidField: 'test' };
      const validationError = new Error('Validation failed');
      Theater.findByIdAndUpdate = jest.fn().mockRejectedValue(validationError);

      await f_updateTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Validation failed'
      });
    });
  });

  describe('f_deleteTheater', () => {
    it('should delete theater successfully', async () => {
      const mockTheater = { _id: '123', theaterId: 101 };
      mockReq.params.id = '123';
      Theater.findByIdAndDelete = jest.fn().mockResolvedValue(mockTheater);

      await f_deleteTheater(mockReq, mockRes);

      expect(Theater.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater deleted successfully'
      });
    });

    it('should return 404 when theater not found', async () => {
      mockReq.params.id = '123';
      Theater.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await f_deleteTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater not found'
      });
    });

    it('should return 500 on database error', async () => {
      mockReq.params.id = '123';
      const dbError = new Error('Database error');
      Theater.findByIdAndDelete = jest.fn().mockRejectedValue(dbError);

      await f_deleteTheater(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });
});
