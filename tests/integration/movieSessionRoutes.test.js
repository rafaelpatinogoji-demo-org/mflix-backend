const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const MovieSession = require('../../src/models/MovieSession');
const Movie = require('../../src/models/Movie');
const Theater = require('../../src/models/Theater');

let mongoServer;
let testMovie;
let testTheater;

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
  await MovieSession.deleteMany({});
  await Movie.deleteMany({});
  await Theater.deleteMany({});

  testMovie = await Movie.create({
    title: 'Test Movie',
    year: 2024,
    genres: ['Action', 'Adventure'],
    runtime: 120
  });

  testTheater = await Theater.create({
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
});

describe('Movie Session Routes Integration Tests', () => {
  describe('POST /api/movie-sessions', () => {
    it('should create a new movie session', async () => {
      const sessionData = {
        movieId: testMovie._id.toString(),
        theaterId: testTheater._id.toString(),
        sessionTime: '2024-12-25T19:00:00',
        price: 12.50,
        totalSeats: 100
      };

      const response = await request(app)
        .post('/api/movie-sessions')
        .send(sessionData)
        .expect(201);

      expect(response.body.message).toBe('Movie session created successfully');
      expect(response.body.session).toHaveProperty('_id');
      expect(response.body.session.totalSeats).toBe(100);
      expect(response.body.session.availableSeats).toBe(100);
      expect(response.body.session.movie.title).toBe('Test Movie');
    });

    it('should return 404 for non-existent movie', async () => {
      const fakeMovieId = new mongoose.Types.ObjectId();
      const sessionData = {
        movieId: fakeMovieId.toString(),
        theaterId: testTheater._id.toString(),
        sessionTime: '2024-12-25T19:00:00',
        price: 12.50,
        totalSeats: 100
      };

      const response = await request(app)
        .post('/api/movie-sessions')
        .send(sessionData)
        .expect(404);

      expect(response.body.message).toBe('Movie not found');
    });

    it('should return 404 for non-existent theater', async () => {
      const fakeTheaterId = new mongoose.Types.ObjectId();
      const sessionData = {
        movieId: testMovie._id.toString(),
        theaterId: fakeTheaterId.toString(),
        sessionTime: '2024-12-25T19:00:00',
        price: 12.50,
        totalSeats: 100
      };

      const response = await request(app)
        .post('/api/movie-sessions')
        .send(sessionData)
        .expect(404);

      expect(response.body.message).toBe('Theater not found');
    });
  });

  describe('GET /api/movie-sessions', () => {
    it('should return paginated movie sessions', async () => {
      await MovieSession.create([
        {
          movie: testMovie._id,
          theater: testTheater._id,
          sessionTime: new Date('2024-12-25T19:00:00'),
          price: 12.50,
          totalSeats: 100,
          availableSeats: 100
        },
        {
          movie: testMovie._id,
          theater: testTheater._id,
          sessionTime: new Date('2024-12-25T21:00:00'),
          price: 15.00,
          totalSeats: 150,
          availableSeats: 150
        }
      ]);

      const response = await request(app)
        .get('/api/movie-sessions')
        .expect(200);

      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('totalSessions', 2);
      expect(response.body.sessions.length).toBe(2);
    });

    it('should support custom pagination', async () => {
      const sessions = Array.from({ length: 15 }, (_, i) => ({
        movie: testMovie._id,
        theater: testTheater._id,
        sessionTime: new Date(`2024-12-25T${10 + i}:00:00`),
        price: 12.50,
        totalSeats: 100,
        availableSeats: 100
      }));

      await MovieSession.create(sessions);

      const response = await request(app)
        .get('/api/movie-sessions?page=2&limit=5')
        .expect(200);

      expect(response.body.currentPage).toBe(2);
      expect(response.body.sessions.length).toBe(5);
      expect(response.body.totalPages).toBe(3);
    });
  });

  describe('GET /api/movie-sessions/:id', () => {
    it('should return movie session by id', async () => {
      const session = await MovieSession.create({
        movie: testMovie._id,
        theater: testTheater._id,
        sessionTime: new Date('2024-12-25T19:00:00'),
        price: 12.50,
        totalSeats: 100,
        availableSeats: 100
      });

      const response = await request(app)
        .get(`/api/movie-sessions/${session._id}`)
        .expect(200);

      expect(response.body._id).toBe(session._id.toString());
      expect(response.body.price).toBe(12.50);
      expect(response.body.movie.title).toBe('Test Movie');
    });

    it('should return 404 for non-existent session', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/movie-sessions/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe('Movie session not found');
    });
  });

  describe('PUT /api/movie-sessions/:id', () => {
    it('should update movie session', async () => {
      const session = await MovieSession.create({
        movie: testMovie._id,
        theater: testTheater._id,
        sessionTime: new Date('2024-12-25T19:00:00'),
        price: 12.50,
        totalSeats: 100,
        availableSeats: 100
      });

      const response = await request(app)
        .put(`/api/movie-sessions/${session._id}`)
        .send({ price: 15.00 })
        .expect(200);

      expect(response.body.message).toBe('Movie session updated successfully');
      expect(response.body.session.price).toBe(15.00);
    });
  });

  describe('DELETE /api/movie-sessions/:id', () => {
    it('should delete movie session', async () => {
      const session = await MovieSession.create({
        movie: testMovie._id,
        theater: testTheater._id,
        sessionTime: new Date('2024-12-25T19:00:00'),
        price: 12.50,
        totalSeats: 100,
        availableSeats: 100
      });

      await request(app)
        .delete(`/api/movie-sessions/${session._id}`)
        .expect(200);

      const deletedSession = await MovieSession.findById(session._id);
      expect(deletedSession).toBeNull();
    });
  });

  describe('GET /api/movie-sessions/movie/:movieId', () => {
    beforeEach(async () => {
      await MovieSession.create([
        {
          movie: testMovie._id,
          theater: testTheater._id,
          sessionTime: new Date('2024-12-25T19:00:00'),
          price: 12.50,
          totalSeats: 100,
          availableSeats: 100
        },
        {
          movie: testMovie._id,
          theater: testTheater._id,
          sessionTime: new Date('2024-12-26T19:00:00'),
          price: 12.50,
          totalSeats: 100,
          availableSeats: 100
        },
        {
          movie: testMovie._id,
          theater: testTheater._id,
          sessionTime: new Date('2024-12-27T19:00:00'),
          price: 12.50,
          totalSeats: 100,
          availableSeats: 100
        }
      ]);
    });

    it('should return all sessions for a movie', async () => {
      const response = await request(app)
        .get(`/api/movie-sessions/movie/${testMovie._id}`)
        .expect(200);

      expect(response.body.movie.title).toBe('Test Movie');
      expect(response.body.sessions.length).toBe(3);
      expect(response.body.totalSessions).toBe(3);
    });

    it('should filter sessions by single date', async () => {
      const response = await request(app)
        .get(`/api/movie-sessions/movie/${testMovie._id}?date=2024-12-25`)
        .expect(200);

      expect(response.body.sessions.length).toBe(1);
    });

    it('should filter sessions by date range', async () => {
      const response = await request(app)
        .get(`/api/movie-sessions/movie/${testMovie._id}?startDate=2024-12-25&endDate=2024-12-27`)
        .expect(200);

      expect(response.body.sessions.length).toBe(2);
    });

    it('should return 404 for non-existent movie', async () => {
      const fakeMovieId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/movie-sessions/movie/${fakeMovieId}`)
        .expect(404);

      expect(response.body.message).toBe('Movie not found');
    });
  });
});
