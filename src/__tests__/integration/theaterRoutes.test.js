const request = require('supertest');
const express = require('express');
const theaterRoutes = require('../../routes/theaterRoutes');
const Theater = require('../../models/Theater');
const { mockTheater } = require('../mocks/mockModels');

jest.mock('../../models/Theater');
jest.mock('../../config/database', () => jest.fn());

const app = express();
app.use(express.json());
app.use('/api/theaters', theaterRoutes);

describe('Theater Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/theaters', () => {
    it('should return paginated theaters', async () => {
      const mockTheaters = [mockTheater, { ...mockTheater, _id: '507f1f77bcf86cd799439015' }];
      Theater.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTheaters)
      });
      Theater.countDocuments.mockResolvedValue(30);

      const response = await request(app).get('/api/theaters');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('theaters');
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages', 3);
      expect(response.body).toHaveProperty('totalTheaters', 30);
    });

    it('should handle pagination query parameters', async () => {
      const mockTheaters = [mockTheater];
      Theater.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTheaters)
      });
      Theater.countDocuments.mockResolvedValue(60);

      const response = await request(app).get('/api/theaters?page=4&limit=15');

      expect(response.status).toBe(200);
      expect(response.body.currentPage).toBe(4);
      expect(response.body.totalPages).toBe(4);
    });

    it('should return theaters with location data', async () => {
      Theater.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockTheater])
      });
      Theater.countDocuments.mockResolvedValue(10);

      const response = await request(app).get('/api/theaters');

      expect(response.status).toBe(200);
      expect(response.body.theaters[0]).toHaveProperty('location');
      expect(response.body.theaters[0].location).toHaveProperty('geo');
    });

    it('should handle database errors', async () => {
      Theater.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app).get('/api/theaters');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Database error');
    });
  });

  describe('GET /api/theaters/:id', () => {
    it('should return theater by id with location data', async () => {
      Theater.findById.mockResolvedValue(mockTheater);

      const response = await request(app).get('/api/theaters/507f1f77bcf86cd799439014');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', mockTheater._id);
      expect(response.body).toHaveProperty('theaterId', mockTheater.theaterId);
      expect(response.body).toHaveProperty('location');
    });

    it('should return theater with geo coordinates', async () => {
      Theater.findById.mockResolvedValue(mockTheater);

      const response = await request(app).get('/api/theaters/507f1f77bcf86cd799439014');

      expect(response.status).toBe(200);
      expect(response.body.location.geo).toHaveProperty('coordinates');
      expect(Array.isArray(response.body.location.geo.coordinates)).toBe(true);
    });

    it('should return 404 when theater not found', async () => {
      Theater.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/theaters/507f1f77bcf86cd799439014');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Theater not found');
    });

    it('should handle invalid id format', async () => {
      Theater.findById.mockRejectedValue(new Error('Invalid ID format'));

      const response = await request(app).get('/api/theaters/invalid-id');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/theaters', () => {
    it('should create a new theater', async () => {
      const newTheater = {
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
      const savedTheater = { ...mockTheater, ...newTheater };
      Theater.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedTheater)
      }));

      const response = await request(app)
        .post('/api/theaters')
        .send(newTheater);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('theaterId', newTheater.theaterId);
    });

    it('should return 400 when theaterId is missing', async () => {
      Theater.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Validation error: theaterId is required'))
      }));

      const response = await request(app)
        .post('/api/theaters')
        .send({ location: { address: { city: 'Test' } } });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when geo coordinates are missing', async () => {
      Theater.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Validation error: coordinates are required'))
      }));

      const response = await request(app)
        .post('/api/theaters')
        .send({
          theaterId: 3001,
          location: { address: { city: 'Test' } }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/theaters/:id', () => {
    it('should update theater', async () => {
      const updatedData = {
        location: {
          address: {
            street1: '789 New St',
            city: 'New City',
            state: 'NY',
            zipcode: '10001'
          }
        }
      };
      const updatedTheater = { ...mockTheater, location: updatedData.location };
      Theater.findByIdAndUpdate.mockResolvedValue(updatedTheater);

      const response = await request(app)
        .put('/api/theaters/507f1f77bcf86cd799439014')
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.location.address.city).toBe('New City');
    });

    it('should update theater geo coordinates', async () => {
      const updatedData = {
        location: {
          geo: {
            type: 'Point',
            coordinates: [-74.0060, 40.7128]
          }
        }
      };
      const updatedTheater = { ...mockTheater };
      Theater.findByIdAndUpdate.mockResolvedValue(updatedTheater);

      const response = await request(app)
        .put('/api/theaters/507f1f77bcf86cd799439014')
        .send(updatedData);

      expect(response.status).toBe(200);
    });

    it('should return 404 when theater not found', async () => {
      Theater.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/theaters/507f1f77bcf86cd799439014')
        .send({ theaterId: 5000 });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Theater not found');
    });

    it('should return 400 when validation fails', async () => {
      Theater.findByIdAndUpdate.mockRejectedValue(new Error('Validation error'));

      const response = await request(app)
        .put('/api/theaters/507f1f77bcf86cd799439014')
        .send({ theaterId: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/theaters/:id', () => {
    it('should delete theater', async () => {
      Theater.findByIdAndDelete.mockResolvedValue(mockTheater);

      const response = await request(app).delete('/api/theaters/507f1f77bcf86cd799439014');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Theater deleted successfully');
    });

    it('should return 404 when theater not found', async () => {
      Theater.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/theaters/507f1f77bcf86cd799439014');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Theater not found');
    });

    it('should handle database errors', async () => {
      Theater.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/theaters/507f1f77bcf86cd799439014');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });
});
