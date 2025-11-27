const {
  f_getTheaterSessions,
  f_createTheaterSession,
  f_updateTheaterSession,
  f_deleteTheaterSession
} = require('../../../src/controllers/theaterSessionController');
const TheaterSession = require('../../../src/models/TheaterSession');
const Theater = require('../../../src/models/Theater');
const Movie = require('../../../src/models/Movie');

jest.mock('../../../src/models/TheaterSession');
jest.mock('../../../src/models/Theater');
jest.mock('../../../src/models/Movie');

describe('TheaterSession Controller', () => {
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

  describe('f_getTheaterSessions', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when theaterId is missing', async () => {
        v_mockReq.query = {};

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater ID is required'
        });
      });
    });

    describe('Date Validation', () => {
      it('should return 400 when date format is invalid', async () => {
        v_mockReq.query = { theaterId: 'theater123', date: 'invalid-date' };

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid date format'
        });
      });
    });

    describe('Theater Validation', () => {
      it('should return 404 when theater not found', async () => {
        const v_mockSessions = [];
        
        const v_mockSort = jest.fn().mockResolvedValue(v_mockSessions);
        const v_mockPopulate = jest.fn().mockReturnValue({
          sort: v_mockSort
        });
        TheaterSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        Theater.findById = jest.fn().mockResolvedValue(null);

        v_mockReq.query = { theaterId: 'nonexistentTheater' };

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(Theater.findById).toHaveBeenCalledWith('nonexistentTheater');
        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater not found'
        });
      });
    });

    describe('Success Cases - No Filters', () => {
      it('should return all sessions for a theater without date filter', async () => {
        const v_mockTheater = {
          _id: 'theater123',
          theaterId: 1,
          location: { address: { city: 'NYC' } }
        };
        const v_mockSessions = [
          {
            _id: 'session1',
            movie: { title: 'Movie 1', year: 2024 },
            showtime: new Date('2024-12-25T14:00:00Z'),
            price: 15
          },
          {
            _id: 'session2',
            movie: { title: 'Movie 2', year: 2024 },
            showtime: new Date('2024-12-25T18:00:00Z'),
            price: 18
          }
        ];

        const v_mockSort = jest.fn().mockResolvedValue(v_mockSessions);
        const v_mockPopulate = jest.fn().mockReturnValue({
          sort: v_mockSort
        });
        TheaterSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);

        v_mockReq.query = { theaterId: 'theater123' };

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(TheaterSession.find).toHaveBeenCalledWith({ theater: 'theater123' });
        expect(v_mockRes.json).toHaveBeenCalledWith({
          theater: v_mockTheater,
          sessions: v_mockSessions,
          count: 2
        });
      });
    });

    describe('Success Cases - Date Filter', () => {
      it('should filter sessions by specific date', async () => {
        const v_mockTheater = {
          _id: 'theater123',
          theaterId: 1,
          location: { address: { city: 'NYC' } }
        };
        const v_mockSessions = [
          {
            _id: 'session1',
            movie: { title: 'Movie 1' },
            showtime: new Date('2024-12-25T14:00:00Z')
          }
        ];

        const v_mockSort = jest.fn().mockResolvedValue(v_mockSessions);
        const v_mockPopulate = jest.fn().mockReturnValue({
          sort: v_mockSort
        });
        TheaterSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);

        v_mockReq.query = { theaterId: 'theater123', date: '2024-12-25' };

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(TheaterSession.find).toHaveBeenCalledWith(
          expect.objectContaining({
            theater: 'theater123',
            showtime: expect.objectContaining({
              $gte: expect.any(Date),
              $lte: expect.any(Date)
            })
          })
        );
        expect(v_mockRes.json).toHaveBeenCalledWith({
          theater: v_mockTheater,
          sessions: v_mockSessions,
          count: 1
        });
      });
    });

    describe('Success Cases - Movie Filter', () => {
      it('should filter sessions by movie ID', async () => {
        const v_mockTheater = {
          _id: 'theater123',
          theaterId: 1,
          location: { address: { city: 'NYC' } }
        };
        const v_mockSessions = [
          {
            _id: 'session1',
            movie: { _id: 'movie123', title: 'Specific Movie' },
            showtime: new Date('2024-12-25T14:00:00Z')
          }
        ];

        const v_mockSort = jest.fn().mockResolvedValue(v_mockSessions);
        const v_mockPopulate = jest.fn().mockReturnValue({
          sort: v_mockSort
        });
        TheaterSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);

        v_mockReq.query = { theaterId: 'theater123', movieId: 'movie123' };

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(TheaterSession.find).toHaveBeenCalledWith({
          theater: 'theater123',
          movie: 'movie123'
        });
        expect(v_mockRes.json).toHaveBeenCalledWith({
          theater: v_mockTheater,
          sessions: v_mockSessions,
          count: 1
        });
      });
    });

    describe('Success Cases - Combined Filters', () => {
      it('should filter sessions by both date and movie ID', async () => {
        const v_mockTheater = {
          _id: 'theater123',
          theaterId: 1,
          location: { address: { city: 'NYC' } }
        };
        const v_mockSessions = [];

        const v_mockSort = jest.fn().mockResolvedValue(v_mockSessions);
        const v_mockPopulate = jest.fn().mockReturnValue({
          sort: v_mockSort
        });
        TheaterSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);

        v_mockReq.query = { theaterId: 'theater123', date: '2024-12-25', movieId: 'movie123' };

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(TheaterSession.find).toHaveBeenCalledWith(
          expect.objectContaining({
            theater: 'theater123',
            movie: 'movie123',
            showtime: expect.objectContaining({
              $gte: expect.any(Date),
              $lte: expect.any(Date)
            })
          })
        );
      });
    });

    describe('Population', () => {
      it('should populate movie details with correct fields', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockSessions = [];

        const v_mockSort = jest.fn().mockResolvedValue(v_mockSessions);
        const v_mockPopulate = jest.fn().mockReturnValue({
          sort: v_mockSort
        });
        TheaterSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);

        v_mockReq.query = { theaterId: 'theater123' };

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(v_mockPopulate).toHaveBeenCalledWith({
          path: 'movie',
          select: 'title year genres runtime plot imdb'
        });
      });
    });

    describe('Sorting', () => {
      it('should sort sessions by showtime ascending', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockSessions = [];

        const v_mockSort = jest.fn().mockResolvedValue(v_mockSessions);
        const v_mockPopulate = jest.fn().mockReturnValue({
          sort: v_mockSort
        });
        TheaterSession.find = jest.fn().mockReturnValue({
          populate: v_mockPopulate
        });
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);

        v_mockReq.query = { theaterId: 'theater123' };

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(v_mockSort).toHaveBeenCalledWith({ showtime: 1 });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_error = new Error('Database connection failed');
        TheaterSession.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(v_error)
          })
        });

        v_mockReq.query = { theaterId: 'theater123' };

        await f_getTheaterSessions(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database connection failed'
        });
      });
    });
  });

  describe('f_createTheaterSession', () => {
    describe('Reference Validation', () => {
      it('should return 404 when theater not found', async () => {
        Theater.findById = jest.fn().mockResolvedValue(null);

        v_mockReq.body = {
          theater: 'nonexistentTheater',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T16:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(Theater.findById).toHaveBeenCalledWith('nonexistentTheater');
        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater not found'
        });
      });

      it('should return 404 when movie not found', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(null);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'nonexistentMovie',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T16:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(Movie.findById).toHaveBeenCalledWith('nonexistentMovie');
        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Movie not found'
        });
      });
    });

    describe('Date Validation', () => {
      it('should return 400 when showtime format is invalid', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: 'invalid-date',
          endTime: '2024-12-25T16:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid date format for showtime or endTime'
        });
      });

      it('should return 400 when endTime format is invalid', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: 'invalid-date',
          price: 15,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid date format for showtime or endTime'
        });
      });

      it('should return 400 when showtime is not before endTime', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T18:00:00Z',
          endTime: '2024-12-25T14:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Showtime must be before end time'
        });
      });

      it('should return 400 when showtime equals endTime', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T14:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Showtime must be before end time'
        });
      });
    });

    describe('Price Validation', () => {
      it('should return 400 when price is zero', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T16:00:00Z',
          price: 0,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Price must be a positive number'
        });
      });

      it('should return 400 when price is negative', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T16:00:00Z',
          price: -10,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Price must be a positive number'
        });
      });
    });

    describe('Seats Validation', () => {
      it('should return 400 when totalSeats is zero', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T16:00:00Z',
          price: 15,
          totalSeats: 0
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Total seats must be a positive number'
        });
      });

      it('should return 400 when totalSeats is negative', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T16:00:00Z',
          price: 15,
          totalSeats: -50
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Total seats must be a positive number'
        });
      });
    });

    describe('Success Cases', () => {
      it('should create theater session with populated references', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1, location: { address: { city: 'NYC' } } };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie', year: 2024, genres: ['Action'], runtime: 120 };
        const v_savedSession = {
          _id: 'session123',
          theater: 'theater123',
          movie: 'movie123',
          showtime: new Date('2024-12-25T14:00:00Z'),
          endTime: new Date('2024-12-25T16:00:00Z'),
          price: 15,
          totalSeats: 100,
          availableSeats: 100,
          populate: jest.fn().mockResolvedValue({
            _id: 'session123',
            theater: { _id: 'theater123', theaterId: 1, location: { address: { city: 'NYC' } } },
            movie: { _id: 'movie123', title: 'Test Movie', year: 2024, genres: ['Action'], runtime: 120 },
            showtime: new Date('2024-12-25T14:00:00Z'),
            endTime: new Date('2024-12-25T16:00:00Z'),
            price: 15,
            totalSeats: 100,
            availableSeats: 100
          })
        };

        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        TheaterSession.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(v_savedSession)
        }));

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T16:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(201);
        expect(v_mockRes.json).toHaveBeenCalled();
      });

      it('should set availableSeats equal to totalSeats on creation', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        
        let v_capturedSessionData;
        TheaterSession.mockImplementation((data) => {
          v_capturedSessionData = data;
          return {
            save: jest.fn().mockResolvedValue({
              ...data,
              _id: 'session123',
              populate: jest.fn().mockResolvedValue({ ...data, _id: 'session123' })
            })
          };
        });

        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T16:00:00Z',
          price: 15,
          totalSeats: 200
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_capturedSessionData.availableSeats).toBe(200);
        expect(v_capturedSessionData.totalSeats).toBe(200);
      });
    });

    describe('Error Handling', () => {
      it('should return 400 when save fails', async () => {
        const v_mockTheater = { _id: 'theater123', theaterId: 1 };
        const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
        const v_error = new Error('Validation failed');

        Theater.findById = jest.fn().mockResolvedValue(v_mockTheater);
        Movie.findById = jest.fn().mockResolvedValue(v_mockMovie);
        TheaterSession.mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(v_error)
        }));

        v_mockReq.body = {
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2024-12-25T14:00:00Z',
          endTime: '2024-12-25T16:00:00Z',
          price: 15,
          totalSeats: 100
        };

        await f_createTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Validation failed'
        });
      });
    });
  });

  describe('f_updateTheaterSession', () => {
    describe('Date Validation', () => {
      it('should return 400 when showtime format is invalid', async () => {
        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = { showtime: 'invalid-date' };

        await f_updateTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid date format for showtime'
        });
      });

      it('should return 400 when endTime format is invalid', async () => {
        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = { endTime: 'invalid-date' };

        await f_updateTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid date format for endTime'
        });
      });
    });

    describe('Success Cases', () => {
      it('should update session with showtime only', async () => {
        const v_updatedSession = {
          _id: 'session123',
          theater: { _id: 'theater123', theaterId: 1 },
          movie: { _id: 'movie123', title: 'Test Movie' },
          showtime: new Date('2024-12-26T14:00:00Z'),
          endTime: new Date('2024-12-25T16:00:00Z'),
          price: 15,
          totalSeats: 100
        };

        TheaterSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(v_updatedSession)
        });

        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = { showtime: '2024-12-26T14:00:00Z' };

        await f_updateTheaterSession(v_mockReq, v_mockRes);

        expect(TheaterSession.findByIdAndUpdate).toHaveBeenCalledWith(
          'session123',
          expect.objectContaining({
            showtime: expect.any(Date)
          }),
          { new: true, runValidators: true }
        );
        expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
      });

      it('should update session with endTime only', async () => {
        const v_updatedSession = {
          _id: 'session123',
          theater: { _id: 'theater123', theaterId: 1 },
          movie: { _id: 'movie123', title: 'Test Movie' },
          showtime: new Date('2024-12-25T14:00:00Z'),
          endTime: new Date('2024-12-25T18:00:00Z'),
          price: 15,
          totalSeats: 100
        };

        TheaterSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(v_updatedSession)
        });

        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = { endTime: '2024-12-25T18:00:00Z' };

        await f_updateTheaterSession(v_mockReq, v_mockRes);

        expect(TheaterSession.findByIdAndUpdate).toHaveBeenCalledWith(
          'session123',
          expect.objectContaining({
            endTime: expect.any(Date)
          }),
          { new: true, runValidators: true }
        );
        expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
      });

      it('should update session with price only', async () => {
        const v_updatedSession = {
          _id: 'session123',
          theater: { _id: 'theater123', theaterId: 1 },
          movie: { _id: 'movie123', title: 'Test Movie' },
          showtime: new Date('2024-12-25T14:00:00Z'),
          endTime: new Date('2024-12-25T16:00:00Z'),
          price: 20,
          totalSeats: 100
        };

        TheaterSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(v_updatedSession)
        });

        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = { price: 20 };

        await f_updateTheaterSession(v_mockReq, v_mockRes);

        expect(TheaterSession.findByIdAndUpdate).toHaveBeenCalledWith(
          'session123',
          { price: 20 },
          { new: true, runValidators: true }
        );
        expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
      });

      it('should update session with totalSeats only', async () => {
        const v_updatedSession = {
          _id: 'session123',
          theater: { _id: 'theater123', theaterId: 1 },
          movie: { _id: 'movie123', title: 'Test Movie' },
          showtime: new Date('2024-12-25T14:00:00Z'),
          endTime: new Date('2024-12-25T16:00:00Z'),
          price: 15,
          totalSeats: 150
        };

        TheaterSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(v_updatedSession)
        });

        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = { totalSeats: 150 };

        await f_updateTheaterSession(v_mockReq, v_mockRes);

        expect(TheaterSession.findByIdAndUpdate).toHaveBeenCalledWith(
          'session123',
          { totalSeats: 150 },
          { new: true, runValidators: true }
        );
        expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
      });

      it('should update session with multiple fields', async () => {
        const v_updatedSession = {
          _id: 'session123',
          theater: { _id: 'theater123', theaterId: 1 },
          movie: { _id: 'movie123', title: 'Test Movie' },
          showtime: new Date('2024-12-26T14:00:00Z'),
          endTime: new Date('2024-12-26T16:00:00Z'),
          price: 25,
          totalSeats: 200
        };

        TheaterSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(v_updatedSession)
        });

        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = {
          showtime: '2024-12-26T14:00:00Z',
          endTime: '2024-12-26T16:00:00Z',
          price: 25,
          totalSeats: 200
        };

        await f_updateTheaterSession(v_mockReq, v_mockRes);

        expect(TheaterSession.findByIdAndUpdate).toHaveBeenCalledWith(
          'session123',
          expect.objectContaining({
            showtime: expect.any(Date),
            endTime: expect.any(Date),
            price: 25,
            totalSeats: 200
          }),
          { new: true, runValidators: true }
        );
        expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
      });
    });

    describe('Not Found', () => {
      it('should return 404 when session not found', async () => {
        TheaterSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        });

        v_mockReq.params = { id: 'nonexistent' };
        v_mockReq.body = { price: 20 };

        await f_updateTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater session not found'
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 400 when validation fails', async () => {
        const v_error = new Error('Validation error');
        TheaterSession.findByIdAndUpdate = jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(v_error)
        });

        v_mockReq.params = { id: 'session123' };
        v_mockReq.body = { price: 20 };

        await f_updateTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(400);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Validation error'
        });
      });
    });
  });

  describe('f_deleteTheaterSession', () => {
    describe('Success Cases', () => {
      it('should delete session and return success message', async () => {
        const v_deletedSession = {
          _id: 'session123',
          theater: 'theater123',
          movie: 'movie123'
        };
        TheaterSession.findByIdAndDelete = jest.fn().mockResolvedValue(v_deletedSession);

        v_mockReq.params = { id: 'session123' };

        await f_deleteTheaterSession(v_mockReq, v_mockRes);

        expect(TheaterSession.findByIdAndDelete).toHaveBeenCalledWith('session123');
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater session deleted successfully'
        });
      });
    });

    describe('Not Found', () => {
      it('should return 404 when session not found', async () => {
        TheaterSession.findByIdAndDelete = jest.fn().mockResolvedValue(null);

        v_mockReq.params = { id: 'nonexistent' };

        await f_deleteTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(404);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Theater session not found'
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when database error occurs', async () => {
        const v_error = new Error('Database error');
        TheaterSession.findByIdAndDelete = jest.fn().mockRejectedValue(v_error);

        v_mockReq.params = { id: 'session123' };

        await f_deleteTheaterSession(v_mockReq, v_mockRes);

        expect(v_mockRes.status).toHaveBeenCalledWith(500);
        expect(v_mockRes.json).toHaveBeenCalledWith({
          message: 'Database error'
        });
      });
    });
  });
});
