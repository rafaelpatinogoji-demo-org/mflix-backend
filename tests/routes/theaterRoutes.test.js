const mongoose = require('mongoose');
const Theater = require('../../src/models/Theater');
const { testRequest, generateObjectId } = require('../utils/testHelpers');
const { validTheater, validTheatersList, invalidTheater } = require('../fixtures/theaterFixtures');

describe('Theater Routes', () => {
  describe('GET /api/theaters', () => {
    beforeEach(async () => {
      await Theater.insertMany(validTheatersList);
    });

    it('should return a list of theaters with pagination', async () => {
      const response = await testRequest.get('/api/theaters');
      
      expect(response.status).toBe(200);
      expect(response.body.theaters).toHaveLength(3);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalTheaters).toBe(3);
    });

    it('should return paginated results based on page and limit parameters', async () => {
      const response = await testRequest.get('/api/theaters?page=1&limit=2');
      
      expect(response.status).toBe(200);
      expect(response.body.theaters).toHaveLength(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    it('should handle errors and return 500 status', async () => {
      jest.spyOn(Theater, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await testRequest.get('/api/theaters');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/theaters/:id', () => {
    let theaterId;

    beforeEach(async () => {
      const theater = new Theater(validTheater);
      await theater.save();
      theaterId = theater._id.toString();
    });

    it('should return a theater by ID', async () => {
      const response = await testRequest.get(`/api/theaters/${theaterId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.theaterId).toBe(validTheater.theaterId);
      expect(response.body.location.address.city).toBe(validTheater.location.address.city);
      expect(response.body.location.geo.coordinates).toEqual(validTheater.location.geo.coordinates);
    });

    it('should return 404 if theater not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.get(`/api/theaters/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Theater not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.get('/api/theaters/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/theaters', () => {
    it('should create a new theater', async () => {
      const response = await testRequest.post('/api/theaters').send(validTheater);
      
      expect(response.status).toBe(201);
      expect(response.body.theaterId).toBe(validTheater.theaterId);
      expect(response.body.location.address.city).toBe(validTheater.location.address.city);
      expect(response.body.location.geo.coordinates).toEqual(validTheater.location.geo.coordinates);
      
      const savedTheater = await Theater.findById(response.body._id);
      expect(savedTheater).not.toBeNull();
    });

    it('should return 400 for invalid theater data', async () => {
      const response = await testRequest.post('/api/theaters').send(invalidTheater);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should validate geo coordinates format', async () => {
      const invalidGeoTheater = {
        ...validTheater,
        location: {
          ...validTheater.location,
          geo: {
            type: 'Point',
            coordinates: ['invalid', 'coordinates'] // Should be numbers
          }
        }
      };

      const response = await testRequest.post('/api/theaters').send(invalidGeoTheater);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/theaters/:id', () => {
    let theaterId;

    beforeEach(async () => {
      const theater = new Theater(validTheater);
      await theater.save();
      theaterId = theater._id.toString();
    });

    it('should update an existing theater', async () => {
      const updatedData = {
        theaterId: 999,
        location: {
          address: {
            street1: 'Updated Street',
            city: 'Updated City',
            state: 'UC',
            zipcode: '99999'
          },
          geo: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749]
          }
        }
      };

      const response = await testRequest.put(`/api/theaters/${theaterId}`).send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.theaterId).toBe(updatedData.theaterId);
      expect(response.body.location.address.city).toBe(updatedData.location.address.city);
      expect(response.body.location.geo.coordinates).toEqual(updatedData.location.geo.coordinates);
      
      const updatedTheater = await Theater.findById(theaterId);
      expect(updatedTheater.theaterId).toBe(updatedData.theaterId);
    });

    it('should return 404 if theater not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.put(`/api/theaters/${nonExistentId}`).send({
        theaterId: 999
      });
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Theater not found');
    });

    it('should return 400 for invalid update data', async () => {
      const response = await testRequest.put(`/api/theaters/${theaterId}`).send({
        theaterId: 'not-a-number' // Should be a number
      });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('DELETE /api/theaters/:id', () => {
    let theaterId;

    beforeEach(async () => {
      const theater = new Theater(validTheater);
      await theater.save();
      theaterId = theater._id.toString();
    });

    it('should delete an existing theater', async () => {
      const response = await testRequest.delete(`/api/theaters/${theaterId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Theater deleted successfully');
      
      const deletedTheater = await Theater.findById(theaterId);
      expect(deletedTheater).toBeNull();
    });

    it('should return 404 if theater not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.delete(`/api/theaters/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Theater not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.delete('/api/theaters/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });
});
