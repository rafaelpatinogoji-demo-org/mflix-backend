const {
  f_createMovieSession,
  f_getAllMovieSessions,
  f_getMovieSessionById,
  f_updateMovieSession,
  f_deleteMovieSession,
  f_getSessionsByMovie
} = require('../../../src/controllers/movieSessionController');
const MovieSession = require('../../../src/models/MovieSession');
const Movie = require('../../../src/models/Movie');
const Theater = require('../../../src/models/Theater');

jest.mock('../../../src/models/MovieSession');
jest.mock('../../../src/models/Movie');
jest.mock('../../../src/models/Theater');

describe('MovieSession Controller', () => {
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

  describe('f_createMovieSession', () => {
    describe('Reference Validation', () => {
      it('should return 404 when movie not found', async () => {
        Movie.findById = jest.fn().mockResolvedValue(null);
        v_mockReq.body = {
          movieId: 'nonexistentMovie',
          theaterId: 'theater123',
          sessionTime: '2024-12-25T14:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createMovieSession(v_mockReq, v_mockRes);

        expect(Movie.findById).toHaveBeenCalledWith('nonexistentMovie');
        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Movie not found'
        });
      });

      it('should return 404 when theater not found', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        Theater.findById = jest.fn().mockResolvedValue(null);

        v_mockReq.body = {
          movieId: 'movie123',
          theaterId: 'nonexistentTheater',
          sessionTime: '2024-12-25T14:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createMovieSession(v_mockReq, v_mockRes);

        expect(Theater.findById).toHaveBeenCalledWith('nonexistentTheater');
        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater not found'
        });
      });
    });

    describe('Success Cases', () => {
      it('should create movie session with populated references', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie', year: 2024 };
        const v_mockTheater = { _id: 'theater123', theaterId: 1, location: { address: { city: 'NYC' } } };
        const v_savedSession = {
          _id: 'session123',
          movie: 'movie123',
          theater: 'theater123',
          sessionTime: new Date('2024-12-25T14:00:00Z'),
          price: 15,
          totalSeats: 100,
          availableSeats: 100,
          populate: jest.fn().mockResolvedValue({
            _id: 'session123',
            movie: { _id: 'movie123', title: 'Test Movie', year: 2024 },
            theater: { _id: 'theater123', theaterId: 1, location: { address: { city: 'NYC' } } },
            sessionTime: new Date('2024-12-25T14:00:00Z'),
            price: 15,
            totalSeats: 100,
            availableSeats: 100
          })
        };

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        MovieSession.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(v_savedSession)
        }));

        v_mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: '2024-12-25T14:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createMovieSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(201);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Movie session created successfully',
          session: expect.any(Object)
        });
      });

      it('should set availableSeats equal to totalSeats on creation', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        
        let v_capturedSessionData;
        MovieSession.mockImplementation((data) => {
          v_capturedSessionData = data;
          return {
            save: jest.fn().mockResolvedValue({
              ...data,
              _id: 'session123',
              populate: jest.fn().mockResolvedValue({ ...data, _id: 'session123' })
            })
          };
        });

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);

        v_mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: '2024-12-25T14:00:00Z',
          price: 15,
          totalSeats: 150
        };

        await f_createMovieSession(v_mockReq, v_mockRes);

        expect(v_capturedSessionData.availableSeats).toBe(150);
        expect(v_capturedSessionData.totalSeats).toBe(150);
      });
    });

    describe('Error Handling', () => {
      it('should return 400 when save fails', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_error = new Error('Validation failed');

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        MovieSession.mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(v_error)
        }));

        v_mockReq.body = {
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionTime: '2024-12-25T14:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createMovieSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Validation failed'
        });
      });
    });
  });

  describe('f_getAllMovieSessions', () => {
    describe('Pagination', () => {
      it('should return sessions with default pagination', async () => {
        const v_mockSessions = [
          { _id: 'session1', movie: { title: 'Movie 1' }, theater: { theaterId: 1 } },
          { _id: 'session2', movie: { title: 'Movie 2' }, theater: { theaterId: 2 } }
        ];

        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(v_mockSessions)
          })
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(25);

        await f_getAllMovieSessions(v_mockReq, v_mockRes);

        expect(MovieSession.find).toHaveBeenCalled();
        expect(v_mockRes.json).toHaveBeenCalledWith({
          sessions: v_mockSessions,
          currentPage: 1,
          totalPages: 3,
          totalSessions: 25
        });
      });

      it('should return sessions with custom pagination', async () => {
        const v_mockSessions = [
          { _id: 'session3', movie: { title: 'Movie 3' }, theater: { theaterId: 3 } }
        ];

        v_mockReq.query = { page: '3', limit: '5' };

        const v_mockSkip = jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockSessions)
        });
        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: v_mockSkip
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(15);

        await f_getAllMovieSessions(v_mockReq, v_mockRes);

        expect(v_mockSkip).toHaveBeenCalledWith(10);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          sessions: v_mockSessions,
          currentPage: 3,
          totalPages: 3,
          totalSessions: 15
        });
      });

      it('should handle invalid page parameter gracefully', async () => {
        v_mockReq.query = { page: 'invalid' };

        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(0);

        await f_getAllMovieSessions(v_mockReq, v_mockRes);

        expect(v_mockRes.json).toHaveBeenCalledWith({
          sessions: [],
          currentPage: 1,
          totalPages: 0,
          totalSessions: 0
        });
      });
    });

    describe('Population', () => {
      it('should populate movie and theater references', async () => {
        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(0);

        await f_getAllMovieSessions(v_mockReq, v_mockRes);

        expect(v_mockPopulate).toHaveBeenCalledWith([
          { path: 'movie', select: 'title year' },
          { path: 'theater', select: 'theaterId location' }
        ]);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_error = new Error('Database error');
        MovieSession.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(v_error)
            })
          })
        });

        await f_getAllMovieSessions(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });

  describe('f_getMovieSessionById', () => {
    describe('Success Cases', () => {
      it('should return session with populated references', async () => {
        const v_mockSession = {
          _id: 'session123',
          movie: { _id: 'movie123', title: 'Test Movie', year: 2024 },
          theater: { _id: 'theater123', theaterId: 1, location: { address: { city: 'NYC' } } },
          sessionTime: new Date('2024-12-25T14:00:00Z'),
          price: 15,
          totalSeats: 100,
          availableSeats: 80
        };

        MovieSession.findById = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(v_mockSession)
        });
        v_mockReq.params = { id: 'session123' };

        await f_getMovieSessionById(v_mockReq, v_mockRes);

        expect(MovieSession.findById).toHaveBeenCalledWith('session123');
        expect(v_mockRes.json).toHaveBeenCalledWith(v_mockSession);
      });
    });

    describe('Not Found', () => {
      it('should return 404 when session not found', async () => {
        MovieSession.findById = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        });
        v_mockReq.params = { id: 'nonexistent' };

        await f_getMovieSessionById(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Movie session not found'
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_error = new Error('Database error');
        MovieSession.findById = jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(v_error)
        });
        v_mockReq.params = { id: 'session123' };

        await f_getMovieSessionById(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });

  describe('f_updateMovieSession', () => {
    describe('Success Cases', () => {
      it('should update and return session with populated references', async () => {
        const v_updatedSession = {
          _id: 'session123',
          movie: { _id: 'movie123', title: 'Test Movie', year: 2024 },
          theater: { _id: 'theater123', theaterId: 1 },
          sessionTime: new Date('2024-12-26T16:00:00Z'),
          price: 20,
          totalSeats: 100,
          availableSeats: 75
        };

        MovieSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(v_updatedSession)
        });
        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = { price: 20, sessionTime: '2024-12-26T16:00:00Z' };

        await f_updateMovieSession(v_mockReq, v_mockRes);

        expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
          'session123',
          v_mockReq.body,
          { new: true, runValidators: true }
        );
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Movie session updated successfully',
          session: v_updatedSession
        });
      });
    });

    describe('Not Found', () => {
      it('should return 404 when session not found', async () => {
        MovieSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        });
        v_mockReq.params = { id: 'nonexistent' };
        v_mockReq.body = { price: 20 };

        await f_updateMovieSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Movie session not found'
        });
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when validation fails', async () => {
        const v_error = new Error('Validation error');
        MovieSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(v_error)
        });
        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = { price: -10 };

        await f_updateMovieSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Validation error'
        });
      });
    });
  });

  describe('f_deleteMovieSession', () => {
    describe('Success Cases', () => {
      it('should delete session and return success message', async () => {
        const v_deletedSession = { _id: 'session123', movie: 'movie123' };
        MovieSession.findByIdAndDelete = jest.fn().mockResolvedValue(v_deletedSession);
        v_mockReq.params = { id: 'session123' };

        await f_deleteMovieSession(v_mockReq, v_mockRes);

        expect(MovieSession.findByIdAndDelete).toHaveBeenCalledWith('session123');
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Movie session deleted successfully'
        });
      });
    });

    describe('Not Found', () => {
      it('should return 404 when session not found', async () => {
        MovieSession.findByIdAndDelete = jest.fn().mockResolvedValue(null);
        v_mockReq.params = { id: 'nonexistent' };

        await f_deleteMovieSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Movie session not found'
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_error = new Error('Database error');
        MovieSession.findByIdAndDelete = jest.fn().mockRejectedValue(v_error);
        v_mockReq.params = { id: 'session123' };

        await f_deleteMovieSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });

  describe('f_getSessionsByMovie', () => {
    describe('Movie Validation', () => {
      it('should return 404 when movie not found', async () => {
        Movie.findById = jest.fn().mockResolvedValue(null);
        v_mockReq.params = { movieId: 'nonexistentMovie' };

        await f_getSessionsByMovie(v_mockReq, v_mockRes);

        expect(Movie.findById).toHaveBeenCalledWith('nonexistentMovie');
        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Movie not found'
        });
      });
    });

    describe('Date Filtering - Specific Date', () => {
      it('should filter sessions by specific date', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie', year: 2024 };
        const v_mockSessions = [
          { _id: 'session1', sessionTime: new Date('2024-12-25T14:00:00Z') },
          { _id: 'session2', sessionTime: new Date('2024-12-25T18:00:00Z') }
        ];

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        
        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(v_mockSessions)
          })
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(2);

        v_mockReq.params = { movieId: 'movie123' };
        v_mockReq.query = { date: '2024-12-25' };

        await f_getSessionsByMovie(v_mockReq, v_mockRes);

        expect(MovieSession.find).toHaveBeenCalledWith(
          expect.objectContaining({
            movie: 'movie123',
            sessionTime: expect.objectContaining({
              $gte: expect.any(Date),
              $lt: expect.any(Date)
            })
          })
        );
        expect(v_mockRes.json).toHaveBeenCalledWith({
          movie: v_mockMovie,
          sessions: v_mockSessions,
          currentPage: 1,
          totalPages: 1,
          totalSessions: 2
        });
      });
    });

    describe('Date Filtering - Date Range', () => {
      it('should filter sessions by start date only', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        const v_mockSessions = [];

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        
        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(v_mockSessions)
          })
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(0);

        v_mockReq.params = { movieId: 'movie123' };
        v_mockReq.query = { startDate: '2024-12-20' };

        await f_getSessionsByMovie(v_mockReq, v_mockRes);

        expect(MovieSession.find).toHaveBeenCalledWith(
          expect.objectContaining({
            movie: 'movie123',
            sessionTime: expect.objectContaining({
              $gte: expect.any(Date)
            })
          })
        );
      });

      it('should filter sessions by end date only', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        const v_mockSessions = [];

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        
        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(v_mockSessions)
          })
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(0);

        v_mockReq.params = { movieId: 'movie123' };
        v_mockReq.query = { endDate: '2024-12-31' };

        await f_getSessionsByMovie(v_mockReq, v_mockRes);

        expect(MovieSession.find).toHaveBeenCalledWith(
          expect.objectContaining({
            movie: 'movie123',
            sessionTime: expect.objectContaining({
              $lte: expect.any(Date)
            })
          })
        );
      });

      it('should filter sessions by both start and end date', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        const v_mockSessions = [
          { _id: 'session1', sessionTime: new Date('2024-12-25T14:00:00Z') }
        ];

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        
        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(v_mockSessions)
          })
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(1);

        v_mockReq.params = { movieId: 'movie123' };
        v_mockReq.query = { startDate: '2024-12-20', endDate: '2024-12-31' };

        await f_getSessionsByMovie(v_mockReq, v_mockRes);

        expect(MovieSession.find).toHaveBeenCalledWith(
          expect.objectContaining({
            movie: 'movie123',
            sessionTime: expect.objectContaining({
              $gte: expect.any(Date),
              $lte: expect.any(Date)
            })
          })
        );
      });
    });

    describe('No Date Filter', () => {
      it('should return all sessions for movie without date filter', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie', year: 2024 };
        const v_mockSessions = [
          { _id: 'session1', sessionTime: new Date('2024-12-20T14:00:00Z') },
          { _id: 'session2', sessionTime: new Date('2024-12-25T14:00:00Z') },
          { _id: 'session3', sessionTime: new Date('2024-12-30T14:00:00Z') }
        ];

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        
        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(v_mockSessions)
          })
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(3);

        v_mockReq.params = { movieId: 'movie123' };

        await f_getSessionsByMovie(v_mockReq, v_mockRes);

        expect(MovieSession.find).toHaveBeenCalledWith({ movie: 'movie123' });
        expect(v_mockRes.json).toHaveBeenCalledWith({
          movie: v_mockMovie,
          sessions: v_mockSessions,
          currentPage: 1,
          totalPages: 1,
          totalSessions: 3
        });
      });
    });

    describe('Pagination', () => {
      it('should apply pagination to sessions by movie', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        const v_mockSessions = [{ _id: 'session6' }];

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        
        const v_mockSkip = jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockSessions)
        });
        const v_mockPopulate = jest.fn().mockReturnValue({
          skip: v_mockSkip
        });
        MovieSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        MovieSession.countDocuments = jest.fn().mockResolvedValue(15);

        v_mockReq.params = { movieId: 'movie123' };
        v_mockReq.query = { page: '2', limit: '5' };

        await f_getSessionsByMovie(v_mockReq, v_mockRes);

        expect(v_mockSkip).toHaveBeenCalledWith(5);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          movie: v_mockMovie,
          sessions: v_mockSessions,
          currentPage: 2,
          totalPages: 3,
          totalSessions: 15
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        const v_error = new Error('Database error');

        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        MovieSession.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(v_error)
            })
          })
        });

        v_mockReq.params = { movieId: 'movie123' };

        await f_getSessionsByMovie(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });
});
