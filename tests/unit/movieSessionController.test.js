const {
  f_createMovieSession,
  f_getAllMovieSessions,
  f_getMovieSessionById,
  f_updateMovieSession,
  f_deleteMovieSession,
  f_getSessionsByMovie
} = require('../../src/controllers/movieSessionController');

const MovieSession = require('../../src/models/MovieSession');
const Movie = require('../../src/models/Movie');
const Theater = require('../../src/models/Theater');

jest.mock('../../src/models/MovieSession');
jest.mock('../../src/models/Movie');
jest.mock('../../src/models/Theater');

describe('movieSessionController', () => {
  let mockReq;
  let mockRes;

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
    jest.clearAllMocks();
  });

  describe('f_createMovieSession', () => {
    describe('movie and theater validation', () => {
      it('should return 404 when movie not found', async () => {
        mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: '2024-01-15T19:00:00',
          price: 12.50,
          totalSeats: 100
        };
        Movie.findById = jest.fn().mockResolvedValue(null);

        await f_createMovieSession(mockReq, mockRes);

        expect(Movie.findById).toHaveBeenCalledWith('movie123');
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Movie not found'
        });
      });

      it('should return 404 when theater not found', async () => {
        mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: '2024-01-15T19:00:00',
          price: 12.50,
          totalSeats: 100
        };
        Movie.findById = jest.fn().mockResolvedValue({ _id: 'movie123', title: 'Test Movie' });
        Theater.findById = jest.fn().mockResolvedValue(null);

        await f_createMovieSession(mockReq, mockRes);

        expect(Theater.findById).toHaveBeenCalledWith('theater123');
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Theater not found'
        });
      });
    });

    describe('session creation with availability tracking', () => {
      it('should create session with availableSeats equal to totalSeats', async () => {
        mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: '2024-01-15T19:00:00',
          price: 12.50,
          totalSeats: 150
        };

        Movie.findById = jest.fn().mockResolvedValue({ _id: 'movie123', title: 'Test Movie' });
        Theater.findById = jest.fn().mockResolvedValue({ _id: 'theater123', theaterId: 101 });

        const mockSavedSession = {
          _id: 'session123',
          movie: 'movie123',
          theater: 'theater123',
          sessionTime: new Date('2024-01-15T19:00:00'),
          price: 12.50,
          totalSeats: 150,
          availableSeats: 150,
          populate: jest.fn().mockResolvedValue({
            _id: 'session123',
            movie: { _id: 'movie123', title: 'Test Movie', year: 2024 },
            theater: { _id: 'theater123', theaterId: 101, location: {} },
            sessionTime: new Date('2024-01-15T19:00:00'),
            price: 12.50,
            totalSeats: 150,
            availableSeats: 150
          })
        };

        MovieSession.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(mockSavedSession)
        }));

        await f_createMovieSession(mockReq, mockRes);

        expect(MovieSession).toHaveBeenCalledWith({
          movie: 'movie123',
          theater: 'theater123',
          sessionTime: expect.any(Date),
          price: 12.50,
          totalSeats: 150,
          availableSeats: 150
        });
      });

      it('should convert sessionTime string to Date object', async () => {
        mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: '2024-01-15T19:00:00',
          price: 12.50,
          totalSeats: 100
        };

        Movie.findById = jest.fn().mockResolvedValue({ _id: 'movie123' });
        Theater.findById = jest.fn().mockResolvedValue({ _id: 'theater123' });

        const mockSavedSession = {
          _id: 'session123',
          populate: jest.fn().mockResolvedValue({})
        };

        MovieSession.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(mockSavedSession)
        }));

        await f_createMovieSession(mockReq, mockRes);

        const constructorCall = MovieSession.mock.calls[0][0];
        expect(constructorCall.sessionTime).toBeInstanceOf(Date);
        expect(constructorCall.sessionTime.toISOString()).toBe('2024-01-15T19:00:00.000Z');
      });

      it('should populate movie and theater in response', async () => {
        mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: '2024-01-15T19:00:00',
          price: 12.50,
          totalSeats: 100
        };

        Movie.findById = jest.fn().mockResolvedValue({ _id: 'movie123' });
        Theater.findById = jest.fn().mockResolvedValue({ _id: 'theater123' });

        const mockPopulatedSession = {
          _id: 'session123',
          movie: { _id: 'movie123', title: 'Test Movie', year: 2024 },
          theater: { _id: 'theater123', theaterId: 101, location: {} }
        };

        const mockSavedSession = {
          _id: 'session123',
          populate: jest.fn().mockResolvedValue(mockPopulatedSession)
        };

        MovieSession.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(mockSavedSession)
        }));

        await f_createMovieSession(mockReq, mockRes);

        expect(mockSavedSession.populate).toHaveBeenCalledWith([
          { path: 'movie', select: 'title year' },
          { path: 'theater', select: 'theaterId location' }
        ]);
      });

      it('should return 201 with success message', async () => {
        mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: '2024-01-15T19:00:00',
          price: 12.50,
          totalSeats: 100
        };

        Movie.findById = jest.fn().mockResolvedValue({ _id: 'movie123' });
        Theater.findById = jest.fn().mockResolvedValue({ _id: 'theater123' });

        const mockSavedSession = {
          _id: 'session123',
          movie: { _id: 'movie123', title: 'Test Movie', year: 2024 },
          theater: { _id: 'theater123', theaterId: 101 },
          populate: jest.fn().mockImplementation(function() {
            return Promise.resolve(this);
          })
        };

        MovieSession.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(mockSavedSession)
        }));

        await f_createMovieSession(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Movie session created successfully',
          session: mockSavedSession
        });
      });
    });

    describe('validation errors', () => {
      it('should return 400 on validation error', async () => {
        mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: 'invalid-date',
          price: 12.50,
          totalSeats: 100
        };

        Movie.findById = jest.fn().mockResolvedValue({ _id: 'movie123' });
        Theater.findById = jest.fn().mockResolvedValue({ _id: 'theater123' });

        const validationError = new Error('Invalid date format');
        MovieSession.mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(validationError)
        }));

        await f_createMovieSession(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid date format'
        });
      });
    });
  });

  describe('f_getAllMovieSessions', () => {
    describe('pagination', () => {
      it('should use default pagination when no query params provided', async () => {
        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);
        MovieSession.countDocuments = jest.fn().mockResolvedValue(0);

        await f_getAllMovieSessions(mockReq, mockRes);

        expect(mockFind.skip).toHaveBeenCalledWith(0);
        expect(mockFind.limit).toHaveBeenCalledWith(10);
        expect(mockRes.json).toHaveBeenCalledWith({
          sessions: [],
          currentPage: 1,
          totalPages: 0,
          totalSessions: 0
        });
      });

      it('should apply custom page and limit', async () => {
        mockReq.query = { page: '2', limit: '20' };

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);
        MovieSession.countDocuments = jest.fn().mockResolvedValue(50);

        await f_getAllMovieSessions(mockReq, mockRes);

        expect(mockFind.skip).toHaveBeenCalledWith(20);
        expect(mockFind.limit).toHaveBeenCalledWith(20);
        expect(mockRes.json).toHaveBeenCalledWith({
          sessions: [],
          currentPage: 2,
          totalPages: 3,
          totalSessions: 50
        });
      });
    });

    describe('populate movie and theater', () => {
      it('should populate both movie and theater references', async () => {
        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);
        MovieSession.countDocuments = jest.fn().mockResolvedValue(0);

        await f_getAllMovieSessions(mockReq, mockRes);

        expect(mockFind.populate).toHaveBeenCalledWith([
          { path: 'movie', select: 'title year' },
          { path: 'theater', select: 'theaterId location' }
        ]);
      });
    });

    describe('error handling', () => {
      it('should return 500 on database error', async () => {
        const dbError = new Error('Database error');
        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockRejectedValue(dbError)
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);

        await f_getAllMovieSessions(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });

  describe('f_getMovieSessionById', () => {
    it('should return session with populated references', async () => {
      mockReq.params.id = 'session123';
      const mockSession = {
        _id: 'session123',
        movie: { _id: 'movie123', title: 'Test Movie', year: 2024 },
        theater: { _id: 'theater123', theaterId: 101, location: {} }
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockSession)
      };
      MovieSession.findById = jest.fn().mockReturnValue(mockFind);

      await f_getMovieSessionById(mockReq, mockRes);

      expect(MovieSession.findById).toHaveBeenCalledWith('session123');
      expect(mockFind.populate).toHaveBeenCalledWith([
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' }
      ]);
      expect(mockRes.json).toHaveBeenCalledWith(mockSession);
    });

    it('should return 404 when session not found', async () => {
      mockReq.params.id = 'session123';

      const mockFind = {
        populate: jest.fn().mockResolvedValue(null)
      };
      MovieSession.findById = jest.fn().mockReturnValue(mockFind);

      await f_getMovieSessionById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Movie session not found'
      });
    });

    it('should return 500 on database error', async () => {
      mockReq.params.id = 'session123';
      const dbError = new Error('Database error');

      const mockFind = {
        populate: jest.fn().mockRejectedValue(dbError)
      };
      MovieSession.findById = jest.fn().mockReturnValue(mockFind);

      await f_getMovieSessionById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  describe('f_updateMovieSession', () => {
    it('should update session with new: true and runValidators: true', async () => {
      mockReq.params.id = 'session123';
      mockReq.body = { price: 15.00 };

      const mockUpdatedSession = {
        _id: 'session123',
        price: 15.00
      };

      const mockUpdate = {
        populate: jest.fn().mockResolvedValue(mockUpdatedSession)
      };
      MovieSession.findByIdAndUpdate = jest.fn().mockReturnValue(mockUpdate);

      await f_updateMovieSession(mockReq, mockRes);

      expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        { price: 15.00 },
        { new: true, runValidators: true }
      );
    });

    it('should return 404 when session not found', async () => {
      mockReq.params.id = 'session123';
      mockReq.body = { price: 15.00 };

      const mockUpdate = {
        populate: jest.fn().mockResolvedValue(null)
      };
      MovieSession.findByIdAndUpdate = jest.fn().mockReturnValue(mockUpdate);

      await f_updateMovieSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Movie session not found'
      });
    });

    it('should return 400 on validation error', async () => {
      mockReq.params.id = 'session123';
      mockReq.body = { price: -10 };

      const validationError = new Error('Price must be positive');
      const mockUpdate = {
        populate: jest.fn().mockRejectedValue(validationError)
      };
      MovieSession.findByIdAndUpdate = jest.fn().mockReturnValue(mockUpdate);

      await f_updateMovieSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Price must be positive'
      });
    });
  });

  describe('f_deleteMovieSession', () => {
    it('should delete session successfully', async () => {
      mockReq.params.id = 'session123';
      const mockSession = { _id: 'session123' };
      MovieSession.findByIdAndDelete = jest.fn().mockResolvedValue(mockSession);

      await f_deleteMovieSession(mockReq, mockRes);

      expect(MovieSession.findByIdAndDelete).toHaveBeenCalledWith('session123');
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Movie session deleted successfully'
      });
    });

    it('should return 404 when session not found', async () => {
      mockReq.params.id = 'session123';
      MovieSession.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await f_deleteMovieSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Movie session not found'
      });
    });

    it('should return 500 on database error', async () => {
      mockReq.params.id = 'session123';
      const dbError = new Error('Database error');
      MovieSession.findByIdAndDelete = jest.fn().mockRejectedValue(dbError);

      await f_deleteMovieSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  describe('f_getSessionsByMovie', () => {
    describe('movie validation', () => {
      it('should return 404 when movie not found', async () => {
        mockReq.params.movieId = 'movie123';
        Movie.findById = jest.fn().mockResolvedValue(null);

        await f_getSessionsByMovie(mockReq, mockRes);

        expect(Movie.findById).toHaveBeenCalledWith('movie123');
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Movie not found'
        });
      });
    });

    describe('date filtering', () => {
      beforeEach(() => {
        Movie.findById = jest.fn().mockResolvedValue({ _id: 'movie123', title: 'Test Movie' });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(0);
      });

      it('should filter sessions for single date (24-hour window)', async () => {
        mockReq.params.movieId = 'movie123';
        mockReq.query = { date: '2024-01-15' };

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);

        await f_getSessionsByMovie(mockReq, mockRes);

        const filterCall = MovieSession.find.mock.calls[0][0];
        expect(filterCall.movie).toBe('movie123');
        expect(filterCall.sessionTime).toHaveProperty('$gte');
        expect(filterCall.sessionTime).toHaveProperty('$lt');

        const startDate = new Date('2024-01-15');
        const endDate = new Date('2024-01-15');
        endDate.setDate(endDate.getDate() + 1);

        expect(filterCall.sessionTime.$gte).toEqual(startDate);
        expect(filterCall.sessionTime.$lt).toEqual(endDate);
      });

      it('should filter sessions with date range using startDate', async () => {
        mockReq.params.movieId = 'movie123';
        mockReq.query = { startDate: '2024-01-15' };

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);

        await f_getSessionsByMovie(mockReq, mockRes);

        const filterCall = MovieSession.find.mock.calls[0][0];
        expect(filterCall.sessionTime).toHaveProperty('$gte');
        expect(filterCall.sessionTime.$gte).toEqual(new Date('2024-01-15'));
      });

      it('should filter sessions with date range using endDate', async () => {
        mockReq.params.movieId = 'movie123';
        mockReq.query = { endDate: '2024-01-31' };

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);

        await f_getSessionsByMovie(mockReq, mockRes);

        const filterCall = MovieSession.find.mock.calls[0][0];
        expect(filterCall.sessionTime).toHaveProperty('$lte');
        expect(filterCall.sessionTime.$lte).toEqual(new Date('2024-01-31'));
      });

      it('should filter sessions with both startDate and endDate', async () => {
        mockReq.params.movieId = 'movie123';
        mockReq.query = { startDate: '2024-01-15', endDate: '2024-01-31' };

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);

        await f_getSessionsByMovie(mockReq, mockRes);

        const filterCall = MovieSession.find.mock.calls[0][0];
        expect(filterCall.sessionTime).toHaveProperty('$gte');
        expect(filterCall.sessionTime).toHaveProperty('$lte');
        expect(filterCall.sessionTime.$gte).toEqual(new Date('2024-01-15'));
        expect(filterCall.sessionTime.$lte).toEqual(new Date('2024-01-31'));
      });

      it('should return all sessions when no date filter provided', async () => {
        mockReq.params.movieId = 'movie123';
        mockReq.query = {};

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);

        await f_getSessionsByMovie(mockReq, mockRes);

        const filterCall = MovieSession.find.mock.calls[0][0];
        expect(filterCall.movie).toBe('movie123');
        expect(filterCall.sessionTime).toBeUndefined();
      });
    });

    describe('pagination with filtered results', () => {
      beforeEach(() => {
        Movie.findById = jest.fn().mockResolvedValue({ _id: 'movie123', title: 'Test Movie' });
      });

      it('should apply pagination to filtered results', async () => {
        mockReq.params.movieId = 'movie123';
        mockReq.query = { date: '2024-01-15', page: '2', limit: '5' };

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);
        MovieSession.countDocuments = jest.fn().mockResolvedValue(15);

        await f_getSessionsByMovie(mockReq, mockRes);

        expect(mockFind.skip).toHaveBeenCalledWith(5);
        expect(mockFind.limit).toHaveBeenCalledWith(5);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            currentPage: 2,
            totalPages: 3,
            totalSessions: 15
          })
        );
      });
    });

    describe('populate calls', () => {
      beforeEach(() => {
        Movie.findById = jest.fn().mockResolvedValue({ _id: 'movie123', title: 'Test Movie' });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(0);
      });

      it('should populate movie and theater references', async () => {
        mockReq.params.movieId = 'movie123';

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        MovieSession.find = jest.fn().mockReturnValue(mockFind);

        await f_getSessionsByMovie(mockReq, mockRes);

        expect(mockFind.populate).toHaveBeenCalledWith([
          { path: 'movie', select: 'title year' },
          { path: 'theater', select: 'theaterId location' }
        ]);
      });
    });

    describe('error handling', () => {
      it('should return 500 on database error', async () => {
        mockReq.params.movieId = 'movie123';
        const dbError = new Error('Database error');
        Movie.findById = jest.fn().mockRejectedValue(dbError);

        await f_getSessionsByMovie(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });
});
