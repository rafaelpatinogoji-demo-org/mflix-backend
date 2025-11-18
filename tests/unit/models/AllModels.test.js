const mongoose = require('mongoose');

const Movie = require('../../../src/models/Movie');
const Comment = require('../../../src/models/Comment');
const Booking = require('../../../src/models/Booking');
const User = require('../../../src/models/User');
const Theater = require('../../../src/models/Theater');
const Session = require('../../../src/models/Session');
const TheaterSession = require('../../../src/models/TheaterSession');
const MovieSession = require('../../../src/models/MovieSession');
const EmbeddedMovie = require('../../../src/models/EmbeddedMovie');

describe('Model Schema Validation Tests', () => {
  
  describe('Movie Model', () => {
    describe('Required Fields', () => {
      it('should require title field', () => {
        const v_movie = new Movie({});
        const v_error = v_movie.validateSync();
        expect(v_error.errors.title).toBeDefined();
        expect(v_error.errors.title.message).toContain('required');
      });

      it('should create movie with only required title field', () => {
        const v_movie = new Movie({ title: 'Test Movie' });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Type Validation', () => {
      it('should accept valid string for title', () => {
        const v_movie = new Movie({ title: 'Valid Title' });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid number for year', () => {
        const v_movie = new Movie({ title: 'Test', year: 2024 });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid number for runtime', () => {
        const v_movie = new Movie({ title: 'Test', runtime: 120 });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Array Validation', () => {
      it('should accept array of strings for genres', () => {
        const v_movie = new Movie({ 
          title: 'Test', 
          genres: ['Action', 'Drama', 'Thriller'] 
        });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept empty array for genres', () => {
        const v_movie = new Movie({ title: 'Test', genres: [] });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Nested Objects - IMDB Schema', () => {
      it('should accept valid imdb nested object', () => {
        const v_movie = new Movie({ 
          title: 'Test',
          imdb: { rating: 8.5, votes: 1000, id: 12345 }
        });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept imdb with only rating', () => {
        const v_movie = new Movie({ 
          title: 'Test',
          imdb: { rating: 7.5 }
        });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept empty imdb object', () => {
        const v_movie = new Movie({ 
          title: 'Test',
          imdb: {}
        });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Optional Fields', () => {
      it('should accept movie without optional plot field', () => {
        const v_movie = new Movie({ title: 'Test' });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept movie with plot field', () => {
        const v_movie = new Movie({ 
          title: 'Test',
          plot: 'A great story about testing'
        });
        const v_error = v_movie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });
  });

  describe('Comment Model', () => {
    describe('Required Fields', () => {
      it('should require name field', () => {
        const v_comment = new Comment({});
        const v_error = v_comment.validateSync();
        expect(v_error.errors.name).toBeDefined();
      });

      it('should require email field', () => {
        const v_comment = new Comment({});
        const v_error = v_comment.validateSync();
        expect(v_error.errors.email).toBeDefined();
      });

      it('should require movie_id field', () => {
        const v_comment = new Comment({});
        const v_error = v_comment.validateSync();
        expect(v_error.errors.movie_id).toBeDefined();
      });

      it('should require text field', () => {
        const v_comment = new Comment({});
        const v_error = v_comment.validateSync();
        expect(v_error.errors.text).toBeDefined();
      });
    });

    describe('ObjectId References', () => {
      it('should accept valid ObjectId for movie_id', () => {
        const v_validObjectId = new mongoose.Types.ObjectId();
        const v_comment = new Comment({
          name: 'John Doe',
          email: 'john@example.com',
          movie_id: v_validObjectId,
          text: 'Great movie!'
        });
        const v_error = v_comment.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Number Validation with Min/Max', () => {
      it('should accept rating within valid range (1-10)', () => {
        const v_comment = new Comment({
          name: 'John',
          email: 'john@example.com',
          movie_id: new mongoose.Types.ObjectId(),
          text: 'Good',
          rating: 8
        });
        const v_error = v_comment.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should reject rating below minimum (< 1)', () => {
        const v_comment = new Comment({
          name: 'John',
          email: 'john@example.com',
          movie_id: new mongoose.Types.ObjectId(),
          text: 'Good',
          rating: 0
        });
        const v_error = v_comment.validateSync();
        expect(v_error.errors.rating).toBeDefined();
      });

      it('should reject rating above maximum (> 10)', () => {
        const v_comment = new Comment({
          name: 'John',
          email: 'john@example.com',
          movie_id: new mongoose.Types.ObjectId(),
          text: 'Good',
          rating: 11
        });
        const v_error = v_comment.validateSync();
        expect(v_error.errors.rating).toBeDefined();
      });
    });

    describe('Default Values', () => {
      it('should set default value for date field', () => {
        const v_comment = new Comment({
          name: 'John',
          email: 'john@example.com',
          movie_id: new mongoose.Types.ObjectId(),
          text: 'Good'
        });
        expect(v_comment.date).toBeDefined();
        expect(v_comment.date).toBeInstanceOf(Date);
      });

      it('should set default value 0 for helpful_votes', () => {
        const v_comment = new Comment({
          name: 'John',
          email: 'john@example.com',
          movie_id: new mongoose.Types.ObjectId(),
          text: 'Good'
        });
        expect(v_comment.helpful_votes).toBe(0);
      });

      it('should set default value 0 for not_helpful_votes', () => {
        const v_comment = new Comment({
          name: 'John',
          email: 'john@example.com',
          movie_id: new mongoose.Types.ObjectId(),
          text: 'Good'
        });
        expect(v_comment.not_helpful_votes).toBe(0);
      });
    });
  });

  describe('Booking Model', () => {
    describe('Required Fields', () => {
      it('should require movie field', () => {
        const v_booking = new Booking({});
        const v_error = v_booking.validateSync();
        expect(v_error.errors.movie).toBeDefined();
      });

      it('should require theater field', () => {
        const v_booking = new Booking({});
        const v_error = v_booking.validateSync();
        expect(v_error.errors.theater).toBeDefined();
      });

      it('should require session field', () => {
        const v_booking = new Booking({});
        const v_error = v_booking.validateSync();
        expect(v_error.errors.session).toBeDefined();
      });

      it('should require user field', () => {
        const v_booking = new Booking({});
        const v_error = v_booking.validateSync();
        expect(v_error.errors.user).toBeDefined();
      });

      it('should require totalPrice field', () => {
        const v_booking = new Booking({});
        const v_error = v_booking.validateSync();
        expect(v_error.errors.totalPrice).toBeDefined();
      });
    });

    describe('Enum Constraints', () => {
      it('should accept valid status value: confirmed', () => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50,
          status: 'confirmed'
        });
        const v_error = v_booking.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid status value: pending', () => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50,
          status: 'pending'
        });
        const v_error = v_booking.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid status value: cancelled', () => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50,
          status: 'cancelled'
        });
        const v_error = v_booking.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid status value: completed', () => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50,
          status: 'completed'
        });
        const v_error = v_booking.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should reject invalid status value', () => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50,
          status: 'invalid_status'
        });
        const v_error = v_booking.validateSync();
        expect(v_error.errors.status).toBeDefined();
      });

      it('should set default status to pending', () => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50
        });
        expect(v_booking.status).toBe('pending');
      });
    });

    describe('Array Fields', () => {
      it('should accept array of strings for seats', () => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50,
          seats: ['A1', 'A2', 'A3']
        });
        const v_error = v_booking.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept empty seats array', () => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50,
          seats: []
        });
        const v_error = v_booking.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Date Fields', () => {
      it('should set default bookingDate', () => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50
        });
        expect(v_booking.bookingDate).toBeDefined();
        expect(v_booking.bookingDate).toBeInstanceOf(Date);
      });

      it('should accept custom cancellationDate', () => {
        const v_date = new Date('2024-12-31');
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          totalPrice: 25.50,
          cancellationDate: v_date
        });
        const v_error = v_booking.validateSync();
        expect(v_error).toBeUndefined();
      });
    });
  });

  describe('User Model', () => {
    describe('Required Fields', () => {
      it('should require name field', () => {
        const v_user = new User({});
        const v_error = v_user.validateSync();
        expect(v_error.errors.name).toBeDefined();
      });

      it('should require email field', () => {
        const v_user = new User({});
        const v_error = v_user.validateSync();
        expect(v_error.errors.email).toBeDefined();
      });

      it('should require password field', () => {
        const v_user = new User({});
        const v_error = v_user.validateSync();
        expect(v_error.errors.password).toBeDefined();
      });

      it('should create user with all required fields', () => {
        const v_user = new User({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'securePassword123'
        });
        const v_error = v_user.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Type Validation', () => {
      it('should accept valid string for name', () => {
        const v_user = new User({
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123'
        });
        const v_error = v_user.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid string for email', () => {
        const v_user = new User({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
        const v_error = v_user.validateSync();
        expect(v_error).toBeUndefined();
      });
    });
  });

  describe('Theater Model', () => {
    describe('Required Fields', () => {
      it('should require theaterId field', () => {
        const v_theater = new Theater({});
        const v_error = v_theater.validateSync();
        expect(v_error.errors.theaterId).toBeDefined();
      });

      it('should create theater with required theaterId', () => {
        const v_theater = new Theater({
          theaterId: 12345,
          location: {
            geo: {
              coordinates: [-73.9857, 40.7484]
            }
          }
        });
        const v_error = v_theater.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Nested Objects - Location', () => {
      it('should accept nested address object', () => {
        const v_theater = new Theater({
          theaterId: 123,
          location: {
            address: {
              street1: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipcode: '10001'
            },
            geo: {
              coordinates: [-73.9857, 40.7484]
            }
          }
        });
        const v_error = v_theater.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept partial address object', () => {
        const v_theater = new Theater({
          theaterId: 123,
          location: {
            address: {
              city: 'New York'
            },
            geo: {
              coordinates: [-73.9857, 40.7484]
            }
          }
        });
        const v_error = v_theater.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Geographic Coordinates', () => {
      it('should require coordinates in geo object', () => {
        const v_theater = new Theater({
          theaterId: 123,
          location: {
            geo: {}
          }
        });
        const v_error = v_theater.validateSync();
        expect(v_error.errors['location.geo.coordinates']).toBeDefined();
      });

      it('should accept valid coordinates array', () => {
        const v_theater = new Theater({
          theaterId: 123,
          location: {
            geo: {
              coordinates: [-73.9857, 40.7484]
            }
          }
        });
        const v_error = v_theater.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept Point as geo type', () => {
        const v_theater = new Theater({
          theaterId: 123,
          location: {
            geo: {
              type: 'Point',
              coordinates: [-73.9857, 40.7484]
            }
          }
        });
        const v_error = v_theater.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should set default type to Point', () => {
        const v_theater = new Theater({
          theaterId: 123,
          location: {
            geo: {
              coordinates: [-73.9857, 40.7484]
            }
          }
        });
        expect(v_theater.location.geo.type).toBe('Point');
      });
    });
  });

  describe('Session Model', () => {
    describe('Required Fields', () => {
      it('should require user_id field', () => {
        const v_session = new Session({});
        const v_error = v_session.validateSync();
        expect(v_error.errors.user_id).toBeDefined();
      });

      it('should require jwt field', () => {
        const v_session = new Session({});
        const v_error = v_session.validateSync();
        expect(v_error.errors.jwt).toBeDefined();
      });

      it('should require expiry field', () => {
        const v_session = new Session({});
        const v_error = v_session.validateSync();
        expect(v_error.errors.expiry).toBeDefined();
      });

      it('should create session with all required fields', () => {
        const v_session = new Session({
          user_id: 'user123',
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          expiry: new Date('2024-12-31')
        });
        const v_error = v_session.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Enum Constraints', () => {
      it('should accept valid status: active', () => {
        const v_session = new Session({
          user_id: 'user123',
          jwt: 'token123',
          expiry: new Date('2024-12-31'),
          status: 'active'
        });
        const v_error = v_session.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid status: inactive', () => {
        const v_session = new Session({
          user_id: 'user123',
          jwt: 'token123',
          expiry: new Date('2024-12-31'),
          status: 'inactive'
        });
        const v_error = v_session.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should reject invalid status value', () => {
        const v_session = new Session({
          user_id: 'user123',
          jwt: 'token123',
          expiry: new Date('2024-12-31'),
          status: 'invalid'
        });
        const v_error = v_session.validateSync();
        expect(v_error.errors.status).toBeDefined();
      });

      it('should set default status to active', () => {
        const v_session = new Session({
          user_id: 'user123',
          jwt: 'token123',
          expiry: new Date('2024-12-31')
        });
        expect(v_session.status).toBe('active');
      });
    });

    describe('Date Fields', () => {
      it('should accept Date object for expiry', () => {
        const v_date = new Date('2024-12-31');
        const v_session = new Session({
          user_id: 'user123',
          jwt: 'token123',
          expiry: v_date
        });
        const v_error = v_session.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should set default createdAt', () => {
        const v_session = new Session({
          user_id: 'user123',
          jwt: 'token123',
          expiry: new Date('2024-12-31')
        });
        expect(v_session.createdAt).toBeDefined();
        expect(v_session.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('TheaterSession Model', () => {
    describe('Required Fields', () => {
      it('should require theater field', () => {
        const v_theaterSession = new TheaterSession({});
        const v_error = v_theaterSession.validateSync();
        expect(v_error.errors.theater).toBeDefined();
      });

      it('should require movie field', () => {
        const v_theaterSession = new TheaterSession({});
        const v_error = v_theaterSession.validateSync();
        expect(v_error.errors.movie).toBeDefined();
      });

      it('should require showtime field', () => {
        const v_theaterSession = new TheaterSession({});
        const v_error = v_theaterSession.validateSync();
        expect(v_error.errors.showtime).toBeDefined();
      });

      it('should require endTime field', () => {
        const v_theaterSession = new TheaterSession({});
        const v_error = v_theaterSession.validateSync();
        expect(v_error.errors.endTime).toBeDefined();
      });

      it('should require price field', () => {
        const v_theaterSession = new TheaterSession({});
        const v_error = v_theaterSession.validateSync();
        expect(v_error.errors.price).toBeDefined();
      });

      it('should require availableSeats field', () => {
        const v_theaterSession = new TheaterSession({});
        const v_error = v_theaterSession.validateSync();
        expect(v_error.errors.availableSeats).toBeDefined();
      });

      it('should require totalSeats field', () => {
        const v_theaterSession = new TheaterSession({});
        const v_error = v_theaterSession.validateSync();
        expect(v_error.errors.totalSeats).toBeDefined();
      });
    });

    describe('ObjectId References', () => {
      it('should accept valid ObjectId for theater', () => {
        const v_theaterSession = new TheaterSession({
          theater: new mongoose.Types.ObjectId(),
          movie: new mongoose.Types.ObjectId(),
          showtime: new Date('2024-12-31T19:00:00'),
          endTime: new Date('2024-12-31T21:30:00'),
          price: 15.50,
          availableSeats: 100,
          totalSeats: 150
        });
        const v_error = v_theaterSession.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid ObjectId for movie', () => {
        const v_theaterSession = new TheaterSession({
          theater: new mongoose.Types.ObjectId(),
          movie: new mongoose.Types.ObjectId(),
          showtime: new Date('2024-12-31T19:00:00'),
          endTime: new Date('2024-12-31T21:30:00'),
          price: 15.50,
          availableSeats: 100,
          totalSeats: 150
        });
        const v_error = v_theaterSession.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Number Fields', () => {
      it('should accept valid number for price', () => {
        const v_theaterSession = new TheaterSession({
          theater: new mongoose.Types.ObjectId(),
          movie: new mongoose.Types.ObjectId(),
          showtime: new Date('2024-12-31T19:00:00'),
          endTime: new Date('2024-12-31T21:30:00'),
          price: 12.99,
          availableSeats: 100,
          totalSeats: 150
        });
        const v_error = v_theaterSession.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid number for availableSeats', () => {
        const v_theaterSession = new TheaterSession({
          theater: new mongoose.Types.ObjectId(),
          movie: new mongoose.Types.ObjectId(),
          showtime: new Date('2024-12-31T19:00:00'),
          endTime: new Date('2024-12-31T21:30:00'),
          price: 15.50,
          availableSeats: 75,
          totalSeats: 150
        });
        const v_error = v_theaterSession.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid number for totalSeats', () => {
        const v_theaterSession = new TheaterSession({
          theater: new mongoose.Types.ObjectId(),
          movie: new mongoose.Types.ObjectId(),
          showtime: new Date('2024-12-31T19:00:00'),
          endTime: new Date('2024-12-31T21:30:00'),
          price: 15.50,
          availableSeats: 100,
          totalSeats: 200
        });
        const v_error = v_theaterSession.validateSync();
        expect(v_error).toBeUndefined();
      });
    });
  });

  describe('MovieSession Model', () => {
    describe('Required Fields', () => {
      it('should require movie field', () => {
        const v_movieSession = new MovieSession({});
        const v_error = v_movieSession.validateSync();
        expect(v_error.errors.movie).toBeDefined();
      });

      it('should require theater field', () => {
        const v_movieSession = new MovieSession({});
        const v_error = v_movieSession.validateSync();
        expect(v_error.errors.theater).toBeDefined();
      });

      it('should require sessionTime field', () => {
        const v_movieSession = new MovieSession({});
        const v_error = v_movieSession.validateSync();
        expect(v_error.errors.sessionTime).toBeDefined();
      });

      it('should require price field', () => {
        const v_movieSession = new MovieSession({});
        const v_error = v_movieSession.validateSync();
        expect(v_error.errors.price).toBeDefined();
      });

      it('should require totalSeats field', () => {
        const v_movieSession = new MovieSession({});
        const v_error = v_movieSession.validateSync();
        expect(v_error.errors.totalSeats).toBeDefined();
      });

      it('should require availableSeats field', () => {
        const v_movieSession = new MovieSession({});
        const v_error = v_movieSession.validateSync();
        expect(v_error.errors.availableSeats).toBeDefined();
      });
    });

    describe('Enum Constraints', () => {
      it('should accept valid status: scheduled', () => {
        const v_movieSession = new MovieSession({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          sessionTime: new Date('2024-12-31T19:00:00'),
          price: 15.50,
          totalSeats: 150,
          availableSeats: 100,
          status: 'scheduled'
        });
        const v_error = v_movieSession.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid status: cancelled', () => {
        const v_movieSession = new MovieSession({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          sessionTime: new Date('2024-12-31T19:00:00'),
          price: 15.50,
          totalSeats: 150,
          availableSeats: 100,
          status: 'cancelled'
        });
        const v_error = v_movieSession.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept valid status: completed', () => {
        const v_movieSession = new MovieSession({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          sessionTime: new Date('2024-12-31T19:00:00'),
          price: 15.50,
          totalSeats: 150,
          availableSeats: 100,
          status: 'completed'
        });
        const v_error = v_movieSession.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should reject invalid status value', () => {
        const v_movieSession = new MovieSession({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          sessionTime: new Date('2024-12-31T19:00:00'),
          price: 15.50,
          totalSeats: 150,
          availableSeats: 100,
          status: 'invalid_status'
        });
        const v_error = v_movieSession.validateSync();
        expect(v_error.errors.status).toBeDefined();
      });

      it('should set default status to scheduled', () => {
        const v_movieSession = new MovieSession({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          sessionTime: new Date('2024-12-31T19:00:00'),
          price: 15.50,
          totalSeats: 150,
          availableSeats: 100
        });
        expect(v_movieSession.status).toBe('scheduled');
      });
    });

    describe('Array Fields', () => {
      it('should accept array of strings for bookedSeats', () => {
        const v_movieSession = new MovieSession({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          sessionTime: new Date('2024-12-31T19:00:00'),
          price: 15.50,
          totalSeats: 150,
          availableSeats: 100,
          bookedSeats: ['A1', 'A2', 'B1']
        });
        const v_error = v_movieSession.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept empty bookedSeats array', () => {
        const v_movieSession = new MovieSession({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          sessionTime: new Date('2024-12-31T19:00:00'),
          price: 15.50,
          totalSeats: 150,
          availableSeats: 100,
          bookedSeats: []
        });
        const v_error = v_movieSession.validateSync();
        expect(v_error).toBeUndefined();
      });
    });
  });

  describe('EmbeddedMovie Model', () => {
    describe('Required Fields', () => {
      it('should require title field', () => {
        const v_embeddedMovie = new EmbeddedMovie({});
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error.errors.title).toBeDefined();
      });

      it('should create embedded movie with only title', () => {
        const v_embeddedMovie = new EmbeddedMovie({ title: 'Test Movie' });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Array Fields', () => {
      it('should accept array of strings for genres', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          genres: ['Action', 'Drama']
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept array of strings for cast', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          cast: ['Actor 1', 'Actor 2', 'Actor 3']
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept array of strings for languages', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          languages: ['English', 'Spanish']
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept array of strings for directors', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          directors: ['Director 1', 'Director 2']
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept array of strings for writers', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          writers: ['Writer 1', 'Writer 2']
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept array of strings for countries', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          countries: ['USA', 'UK']
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Nested Objects - Awards', () => {
      it('should accept nested awards object', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          awards: {
            wins: 5,
            nominations: 10,
            text: 'Won 5 Oscars'
          }
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept partial awards object', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          awards: {
            wins: 3
          }
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Nested Objects - IMDB', () => {
      it('should accept nested imdb object', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          imdb: {
            rating: 8.5,
            votes: 100000,
            id: 12345
          }
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept partial imdb object', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          imdb: {
            rating: 7.5
          }
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Nested Objects - Tomatoes', () => {
      it('should accept nested tomatoes object with viewer', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          tomatoes: {
            viewer: {
              rating: 4.5,
              numReviews: 1000,
              meter: 85
            },
            dvd: new Date('2024-01-01'),
            lastUpdated: new Date('2024-06-01')
          }
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept partial tomatoes object', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          tomatoes: {
            viewer: {
              rating: 4.0
            }
          }
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Date Fields', () => {
      it('should accept Date for released field', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          released: new Date('2024-01-15')
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Mixed Type Fields', () => {
      it('should accept mixed type for plot_embedding', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          plot_embedding: [0.1, 0.2, 0.3, 0.4]
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept mixed type for plot_embedding_voyage_3_large', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          plot_embedding_voyage_3_large: { vector: [0.1, 0.2, 0.3] }
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Optional String Fields', () => {
      it('should accept optional plot field', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          plot: 'A great story'
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept optional fullplot field', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          fullplot: 'A very detailed story about testing'
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept optional rated field', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          rated: 'PG-13'
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept optional poster field', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          poster: 'https://example.com/poster.jpg'
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept optional type field', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          type: 'movie'
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });

    describe('Optional Number Fields', () => {
      it('should accept optional runtime field', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          runtime: 120
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept optional year field', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          year: 2024
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });

      it('should accept optional num_mflix_comments field', () => {
        const v_embeddedMovie = new EmbeddedMovie({
          title: 'Test',
          num_mflix_comments: 42
        });
        const v_error = v_embeddedMovie.validateSync();
        expect(v_error).toBeUndefined();
      });
    });
  });
});
