const {
  f_getAllTheaters,
  f_getTheaterById,
  f_createTheater,
  f_updateTheater,
  f_deleteTheater,
  f_getNearbyTheaters
} = require('../../../src/controllers/theaterController');
const Theater = require('../../../src/models/Theater');

jest.mock('../../../src/models/Theater');

describe('Theater Controller', () => {
  let v_mockReq;
  let v_mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    v_mockReq = {
      params: {},
      query: {},
      body: {}
    };
    v_mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('f_getNearbyTheaters', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when latitude is missing', async () => {
        v_mockReq.query = { longitude: '-73.9857', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius are required parameters'
        });
      });

      it('should return 400 when longitude is missing', async () => {
        v_mockReq.query = { latitude: '40.7128', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius are required parameters'
        });
      });

      it('should return 400 when radius is missing', async () => {
        v_mockReq.query = { latitude: '40.7128', longitude: '-73.9857' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius are required parameters'
        });
      });

      it('should return 400 when latitude is not a valid number', async () => {
        v_mockReq.query = { latitude: 'invalid', longitude: '-73.9857', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius must be valid numbers'
        });
      });

      it('should return 400 when longitude is not a valid number', async () => {
        v_mockReq.query = { latitude: '40.7128', longitude: 'invalid', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius must be valid numbers'
        });
      });

      it('should return 400 when radius is not a valid number', async () => {
        v_mockReq.query = { latitude: '40.7128', longitude: '-73.9857', radius: 'invalid' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Latitude, longitude, and radius must be valid numbers'
        });
      });
    });

    describe('Coordinate Range Validation', () => {
      it('should return 400 when latitude is less than -90', async () => {
        v_mockReq.query = { latitude: '-91', longitude: '-73.9857', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid latitude or longitude values'
        });
      });

      it('should return 400 when latitude is greater than 90', async () => {
        v_mockReq.query = { latitude: '91', longitude: '-73.9857', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid latitude or longitude values'
        });
      });

      it('should return 400 when longitude is less than -180', async () => {
        v_mockReq.query = { latitude: '40.7128', longitude: '-181', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid latitude or longitude values'
        });
      });

      it('should return 400 when longitude is greater than 180', async () => {
        v_mockReq.query = { latitude: '40.7128', longitude: '181', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid latitude or longitude values'
        });
      });
    });

    describe('Radius Validation', () => {
      it('should return 400 when radius is zero', async () => {
        v_mockReq.query = { latitude: '40.7128', longitude: '-73.9857', radius: '0' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Radius must be a positive number'
        });
      });

      it('should return 400 when radius is negative', async () => {
        v_mockReq.query = { latitude: '40.7128', longitude: '-73.9857', radius: '-5' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Radius must be a positive number'
        });
      });
    });

    describe('Geospatial Query - Kilometers (default)', () => {
      it('should find nearby theaters with default km unit', async () => {
        const v_mockTheaters = [
          {
            _id: 'theater1',
            theaterId: 1,
            location: { address: { city: 'New York' } },
            distance: 1500
          },
          {
            _id: 'theater2',
            theaterId: 2,
            location: { address: { city: 'Brooklyn' } },
            distance: 3200
          }
        ];

        Theater.aggregate = jest.fn().mockResolvedValue(v_mockTheaters);
        v_mockReq.query = { latitude: '40.7128', longitude: '-73.9857', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(Theater.aggregate).toHaveBeenCalledWith([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [-73.9857, 40.7128]
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

        expect(v_mockRes.json).toHaveBeenCalledWith({
          theaters: [
            {
              _id: 'theater1',
              theaterId: 1,
              location: { address: { city: 'New York' } },
              distance: 1.5,
              unit: 'km'
            },
            {
              _id: 'theater2',
              theaterId: 2,
              location: { address: { city: 'Brooklyn' } },
              distance: 3.2,
              unit: 'km'
            }
          ],
          count: 2
        });
      });

      it('should find nearby theaters with explicit km unit', async () => {
        const v_mockTheaters = [
          {
            _id: 'theater1',
            theaterId: 1,
            location: { address: { city: 'New York' } },
            distance: 5000
          }
        ];

        Theater.aggregate = jest.fn().mockResolvedValue(v_mockTheaters);
        v_mockReq.query = { latitude: '40.7128', longitude: '-73.9857', radius: '15', unit: 'km' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(Theater.aggregate).toHaveBeenCalledWith([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [-73.9857, 40.7128]
              },
              distanceField: 'distance',
              maxDistance: 15000,
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

        expect(v_mockRes.json).toHaveBeenCalledWith({
          theaters: [
            {
              _id: 'theater1',
              theaterId: 1,
              location: { address: { city: 'New York' } },
              distance: 5,
              unit: 'km'
            }
          ],
          count: 1
        });
      });
    });

    describe('Geospatial Query - Miles', () => {
      it('should find nearby theaters with miles unit', async () => {
        const v_mockTheaters = [
          {
            _id: 'theater1',
            theaterId: 1,
            location: { address: { city: 'New York' } },
            distance: 1609.34
          }
        ];

        Theater.aggregate = jest.fn().mockResolvedValue(v_mockTheaters);
        v_mockReq.query = { latitude: '40.7128', longitude: '-73.9857', radius: '5', unit: 'miles' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(Theater.aggregate).toHaveBeenCalledWith([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [-73.9857, 40.7128]
              },
              distanceField: 'distance',
              maxDistance: 5 * 1609.34,
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

        expect(v_mockRes.json).toHaveBeenCalledWith({
          theaters: [
            {
              _id: 'theater1',
              theaterId: 1,
              location: { address: { city: 'New York' } },
              distance: 1,
              unit: 'miles'
            }
          ],
          count: 1
        });
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array when no theaters found', async () => {
        Theater.aggregate = jest.fn().mockResolvedValue([]);
        v_mockReq.query = { latitude: '40.7128', longitude: '-73.9857', radius: '1' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.json).toHaveBeenCalledWith({
          theaters: [],
          count: 0
        });
      });

      it('should handle boundary latitude values (-90 and 90)', async () => {
        Theater.aggregate = jest.fn().mockResolvedValue([]);
        v_mockReq.query = { latitude: '90', longitude: '0', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.json).toHaveBeenCalled();
      });

      it('should handle boundary longitude values (-180 and 180)', async () => {
        Theater.aggregate = jest.fn().mockResolvedValue([]);
        v_mockReq.query = { latitude: '0', longitude: '-180', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.json).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_error = new Error('Database connection failed');
        Theater.aggregate = jest.fn().mockRejectedValue(v_error);
        v_mockReq.query = { latitude: '40.7128', longitude: '-73.9857', radius: '10' };

        await f_getNearbyTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database connection failed'
        });
      });
    });
  });

  describe('f_getAllTheaters', () => {
    describe('Pagination', () => {
      it('should return theaters with default pagination (page 1, limit 10)', async () => {
        const v_mockTheaters = [
          { _id: 'theater1', theaterId: 1 },
          { _id: 'theater2', theaterId: 2 }
        ];

        Theater.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(v_mockTheaters)
          })
        });
        Theater.countDocuments = jest.fn().mockResolvedValue(25);

        await f_getAllTheaters(v_mockReq, v_mockRes);

        expect(Theater.find).toHaveBeenCalled();
        expect(v_mockRes.json).toHaveBeenCalledWith({
          theaters: v_mockTheaters,
          currentPage: 1,
          totalPages: 3,
          totalTheaters: 25
        });
      });

      it('should return theaters with custom pagination', async () => {
        const v_mockTheaters = [
          { _id: 'theater3', theaterId: 3 },
          { _id: 'theater4', theaterId: 4 }
        ];

        v_mockReq.query = { page: '2', limit: '5' };

        const v_mockSkip = jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockTheaters)
        });
        Theater.find = jest.fn().mockReturnValue({
          skip: v_mockSkip
        });
        Theater.countDocuments = jest.fn().mockResolvedValue(25);

        await f_getAllTheaters(v_mockReq, v_mockRes);

        expect(v_mockSkip).toHaveBeenCalledWith(5);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          theaters: v_mockTheaters,
          currentPage: 2,
          totalPages: 5,
          totalTheaters: 25
        });
      });

      it('should handle invalid page parameter gracefully', async () => {
        v_mockReq.query = { page: 'invalid', limit: '10' };

        Theater.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        });
        Theater.countDocuments = jest.fn().mockResolvedValue(0);

        await f_getAllTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.json).toHaveBeenCalledWith({
          theaters: [],
          currentPage: 1,
          totalPages: 0,
          totalTheaters: 0
        });
      });

      it('should handle invalid limit parameter gracefully', async () => {
        v_mockReq.query = { page: '1', limit: 'invalid' };

        Theater.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        });
        Theater.countDocuments = jest.fn().mockResolvedValue(0);

        await f_getAllTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.json).toHaveBeenCalledWith({
          theaters: [],
          currentPage: 1,
          totalPages: 0,
          totalTheaters: 0
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_error = new Error('Database error');
        Theater.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(v_error)
          })
        });

        await f_getAllTheaters(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });

  describe('f_getTheaterById', () => {
    describe('Success Cases', () => {
      it('should return theater when found', async () => {
        const v_mockTheater = {
          _id: 'theater123',
          theaterId: 1,
          location: {
            address: { city: 'New York', state: 'NY' },
            geo: { type: 'Point', coordinates: [-73.9857, 40.7128] }
          }
        };

        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        v_mockReq.params = { id: 'theater123' };

        await f_getTheaterById(v_mockReq, v_mockRes);

        expect(Theater.findById).toHaveBeenCalledWith('theater123');
        expect(v_mockRes.json).toHaveBeenCalledWith(v_mockTheater);
      });
    });

    describe('Not Found', () => {
      it('should return 404 when theater not found', async () => {
        Theater.findById = jest.fn().mockResolvedValue(null);
        v_mockReq.params = { id: 'nonexistent' };

        await f_getTheaterById(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater not found'
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_error = new Error('Database error');
        Theater.findById = jest.fn().mockRejectedValue(v_error);
        v_mockReq.params = { id: 'theater123' };

        await f_getTheaterById(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });

  describe('f_createTheater', () => {
    describe('Success Cases', () => {
      it('should create and return new theater', async () => {
        const v_theaterData = {
          theaterId: 100,
          location: {
            address: { street1: '123 Main St', city: 'New York', state: 'NY', zipcode: '10001' },
            geo: { type: 'Point', coordinates: [-73.9857, 40.7128] }
          }
        };

        const v_savedTheater = { _id: 'newTheater123', ...v_theaterData };

        Theater.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(v_savedTheater)
        }));

        v_mockReq.body = v_theaterData;

        await f_createTheater(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(201);
        expect(v_mockRes.json).toHaveBeenCalledWith(v_savedTheater);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when validation fails', async () => {
        const v_error = new Error('Validation failed: theaterId is required');

        Theater.mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(v_error)
        }));

        v_mockReq.body = { location: {} };

        await f_createTheater(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Validation failed: theaterId is required'
        });
      });
    });
  });

  describe('f_updateTheater', () => {
    describe('Success Cases', () => {
      it('should update and return theater', async () => {
        const v_updatedTheater = {
          _id: 'theater123',
          theaterId: 1,
          location: {
            address: { city: 'Updated City', state: 'NY' },
            geo: { type: 'Point', coordinates: [-73.9857, 40.7128] }
          }
        };

        Theater.findByIdAndUpdate = jest.fn().mockResolvedValue(v_updatedTheater);
        v_mockReq.params = { id: 'theater123' };
        v_mockReq.body = { location: { address: { city: 'Updated City' } } };

        await f_updateTheater(v_mockReq, v_mockRes);

        expect(Theater.findByIdAndUpdate).toHaveBeenCalledWith(
          'theater123',
          v_mockReq.body,
          { new: true, runValidators: true }
        );
        expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedTheater);
      });
    });

    describe('Not Found', () => {
      it('should return 404 when theater not found', async () => {
        Theater.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
        v_mockReq.params = { id: 'nonexistent' };
        v_mockReq.body = { theaterId: 999 };

        await f_updateTheater(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater not found'
        });
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when validation fails', async () => {
        const v_error = new Error('Validation error');
        Theater.findByIdAndUpdate = jest.fn().mockRejectedValue(v_error);
        v_mockReq.params = { id: 'theater123' };
        v_mockReq.body = { theaterId: -1 };

        await f_updateTheater(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Validation error'
        });
      });
    });
  });

  describe('f_deleteTheater', () => {
    describe('Success Cases', () => {
      it('should delete theater and return success message', async () => {
        const v_deletedTheater = { _id: 'theater123', theaterId: 1 };
        Theater.findByIdAndDelete = jest.fn().mockResolvedValue(v_deletedTheater);
        v_mockReq.params = { id: 'theater123' };

        await f_deleteTheater(v_mockReq, v_mockRes);

        expect(Theater.findByIdAndDelete).toHaveBeenCalledWith('theater123');
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater deleted successfully'
        });
      });
    });

    describe('Not Found', () => {
      it('should return 404 when theater not found', async () => {
        Theater.findByIdAndDelete = jest.fn().mockResolvedValue(null);
        v_mockReq.params = { id: 'nonexistent' };

        await f_deleteTheater(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater not found'
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_error = new Error('Database error');
        Theater.findByIdAndDelete = jest.fn().mockRejectedValue(v_error);
        v_mockReq.params = { id: 'theater123' };

        await f_deleteTheater(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });
});
