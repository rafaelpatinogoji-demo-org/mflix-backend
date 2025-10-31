const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const Theater = require('../../src/models/Theater');

let mongoServer;

beforeAll(async () => {
  await mongoose.disconnect();
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Theater.deleteMany({});
});

describe('Theater Routes Integration Tests', () => {
  describe('GET /api/theaters', () => {
    it('should return paginated theaters', async () => {
      await Theater.create([
        {
          theaterId: 101,
          location: {
            address: {
              street1: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipcode: '10001'
            },
            geo: {
              type: 'Point',
              coordinates: [-74.0060, 40.7128]
            }
          }
        },
        {
          theaterId: 102,
          location: {
            address: {
              street1: '456 Oak Ave',
              city: 'Los Angeles',
              state: 'CA',
              zipcode: '90001'
            },
            geo: {
              type: 'Point',
              coordinates: [-118.2437, 34.0522]
            }
          }
        }
      ]);

      const response = await request(app)
        .get('/api/theaters')
        .expect(200);

      expect(response.body).toHaveProperty('theaters');
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('totalTheaters', 2);
      expect(response.body.theaters.length).toBe(2);
    });

    it('should support custom pagination', async () => {
      const theaters = Array.from({ length: 15 }, (_, i) => ({
        theaterId: i + 1,
        location: {
          address: {
            street1: `${i + 1} Main St`,
            city: 'Test City',
            state: 'TS',
            zipcode: '00000'
          },
          geo: {
            type: 'Point',
            coordinates: [-74.0060, 40.7128]
          }
        }
      }));

      await Theater.create(theaters);

      const response = await request(app)
        .get('/api/theaters?page=2&limit=5')
        .expect(200);

      expect(response.body.currentPage).toBe(2);
      expect(response.body.theaters.length).toBe(5);
      expect(response.body.totalPages).toBe(3);
    });
  });

  describe('GET /api/theaters/:id', () => {
    it('should return theater by id', async () => {
      const theater = await Theater.create({
        theaterId: 101,
        location: {
          address: {
            street1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipcode: '10001'
          },
          geo: {
            type: 'Point',
            coordinates: [-74.0060, 40.7128]
          }
        }
      });

      const response = await request(app)
        .get(`/api/theaters/${theater._id}`)
        .expect(200);

      expect(response.body.theaterId).toBe(101);
    });

    it('should return 404 for non-existent theater', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/theaters/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe('Theater not found');
    });
  });

  describe('POST /api/theaters', () => {
    it('should create a new theater', async () => {
      const theaterData = {
        theaterId: 103,
        location: {
          address: {
            street1: '789 Broadway',
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

      const response = await request(app)
        .post('/api/theaters')
        .send(theaterData)
        .expect(201);

      expect(response.body.theaterId).toBe(103);
      expect(response.body.location.address.city).toBe('Chicago');
    });
  });

  describe('PUT /api/theaters/:id', () => {
    it('should update theater', async () => {
      const theater = await Theater.create({
        theaterId: 101,
        location: {
          address: {
            street1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipcode: '10001'
          },
          geo: {
            type: 'Point',
            coordinates: [-74.0060, 40.7128]
          }
        }
      });

      const response = await request(app)
        .put(`/api/theaters/${theater._id}`)
        .send({ theaterId: 999 })
        .expect(200);

      expect(response.body.theaterId).toBe(999);
    });
  });

  describe('DELETE /api/theaters/:id', () => {
    it('should delete theater', async () => {
      const theater = await Theater.create({
        theaterId: 101,
        location: {
          address: {
            street1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipcode: '10001'
          },
          geo: {
            type: 'Point',
            coordinates: [-74.0060, 40.7128]
          }
        }
      });

      await request(app)
        .delete(`/api/theaters/${theater._id}`)
        .expect(200);

      const deletedTheater = await Theater.findById(theater._id);
      expect(deletedTheater).toBeNull();
    });
  });

  describe('GET /api/theaters/nearby', () => {
    beforeEach(async () => {
      await Theater.create([
        {
          theaterId: 101,
          location: {
            address: {
              street1: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipcode: '10001'
            },
            geo: {
              type: 'Point',
              coordinates: [-74.0060, 40.7128]
            }
          }
        },
        {
          theaterId: 102,
          location: {
            address: {
              street1: '456 Oak Ave',
              city: 'Los Angeles',
              state: 'CA',
              zipcode: '90001'
            },
            geo: {
              type: 'Point',
              coordinates: [-118.2437, 34.0522]
            }
          }
        }
      ]);
    });

    it('should find nearby theaters within radius (km)', async () => {
      const response = await request(app)
        .get('/api/theaters/nearby?latitude=40.7128&longitude=-74.0060&radius=10&unit=km')
        .expect(200);

      expect(response.body).toHaveProperty('theaters');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.theaters)).toBe(true);
    });

    it('should find nearby theaters within radius (miles)', async () => {
      const response = await request(app)
        .get('/api/theaters/nearby?latitude=40.7128&longitude=-74.0060&radius=10&unit=miles')
        .expect(200);

      expect(response.body).toHaveProperty('theaters');
      expect(Array.isArray(response.body.theaters)).toBe(true);
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/api/theaters/nearby?latitude=40.7128')
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/theaters/nearby?latitude=100&longitude=-74.0060&radius=10')
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });
  });
});
