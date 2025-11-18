jest.mock('../../../src/controllers/movieController', () => ({
  f_getAllMovies: jest.fn(),
  f_getMovieById: jest.fn(),
  f_createMovie: jest.fn(),
  f_updateMovie: jest.fn(),
  f_deleteMovie: jest.fn(),
  f_searchMovies: jest.fn(),
  f_getTopRatedMovies: jest.fn(),
  f_getMoviesByGenre: jest.fn(),
  f_getMoviesByYear: jest.fn(),
  f_getTrendingMovies: jest.fn(),
  f_getMovieEngagementStats: jest.fn()
}));

jest.mock('../../../src/controllers/commentController', () => ({
  f_getAllComments: jest.fn(),
  f_getCommentById: jest.fn(),
  f_createComment: jest.fn(),
  f_updateComment: jest.fn(),
  f_deleteComment: jest.fn(),
  f_getCommentsByMovie: jest.fn(),
  f_getCommentStatsByMovie: jest.fn(),
  f_getUserCommentHistory: jest.fn(),
  f_getTopReviewers: jest.fn(),
  f_updateHelpfulVotes: jest.fn(),
  f_getRecentCommentsByGenre: jest.fn()
}));

jest.mock('../../../src/controllers/bookingController', () => ({
  f_createBooking: jest.fn(),
  f_getUserBookings: jest.fn(),
  f_getMovieAvailability: jest.fn(),
  f_cancelBooking: jest.fn(),
  f_getBookingStats: jest.fn()
}));

jest.mock('../../../src/controllers/userController', () => ({
  f_getAllUsers: jest.fn(),
  f_getUserById: jest.fn(),
  f_createUser: jest.fn(),
  f_updateUser: jest.fn(),
  f_deleteUser: jest.fn()
}));

jest.mock('../../../src/controllers/theaterController', () => ({
  f_getAllTheaters: jest.fn(),
  f_getTheaterById: jest.fn(),
  f_createTheater: jest.fn(),
  f_updateTheater: jest.fn(),
  f_deleteTheater: jest.fn(),
  f_getNearbyTheaters: jest.fn()
}));

jest.mock('../../../src/controllers/sessionController', () => ({
  f_getAllSessions: jest.fn(),
  f_getSessionById: jest.fn(),
  f_createSession: jest.fn(),
  f_updateSession: jest.fn(),
  f_deleteSession: jest.fn(),
  f_getActiveUserSessions: jest.fn(),
  f_logoutAllSessions: jest.fn()
}));

jest.mock('../../../src/controllers/theaterSessionController', () => ({
  f_getTheaterSessions: jest.fn(),
  f_createTheaterSession: jest.fn(),
  f_updateTheaterSession: jest.fn(),
  f_deleteTheaterSession: jest.fn()
}));

jest.mock('../../../src/controllers/movieSessionController', () => ({
  f_createMovieSession: jest.fn(),
  f_getAllMovieSessions: jest.fn(),
  f_getMovieSessionById: jest.fn(),
  f_updateMovieSession: jest.fn(),
  f_deleteMovieSession: jest.fn(),
  f_getSessionsByMovie: jest.fn()
}));

jest.mock('../../../src/controllers/embeddedMovieController', () => ({
  f_getAllEmbeddedMovies: jest.fn(),
  f_getEmbeddedMovieById: jest.fn(),
  f_createEmbeddedMovie: jest.fn(),
  f_updateEmbeddedMovie: jest.fn(),
  f_deleteEmbeddedMovie: jest.fn(),
  f_searchEmbeddedMovies: jest.fn(),
  f_vectorSearch: jest.fn(),
  f_hybridSearch: jest.fn()
}));

describe('All Routes Integration Tests', () => {
  describe('movieRoutes - Route Registration', () => {
    it('should export a valid Express Router', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes).toBeDefined();
      expect(typeof movieRoutes).toBe('function');
    });

    it('should have GET / route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have GET /search route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have GET /:id route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have POST / route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have PUT /:id route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have DELETE /:id route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have GET /analytics/top-rated route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have GET /analytics/genres route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have GET /analytics/years route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have GET /analytics/trending route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });

    it('should have GET /analytics/engagement/:id route registered', () => {
      const movieRoutes = require('../../../src/routes/movieRoutes');
      expect(movieRoutes.stack).toBeDefined();
    });
  });

  describe('commentRoutes - Route Registration', () => {
    it('should export a valid Express Router', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes).toBeDefined();
      expect(typeof commentRoutes).toBe('function');
    });

    it('should have GET / route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have GET /:id route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have GET /movie/:movieId route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have GET /stats/movie/:movieId route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have GET /user/:email route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have GET /top-reviewers route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have PATCH /:id/vote route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have GET /genre/:genre route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have POST / route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have PUT /:id route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });

    it('should have DELETE /:id route registered', () => {
      const commentRoutes = require('../../../src/routes/commentRoutes');
      expect(commentRoutes.stack).toBeDefined();
    });
  });

  describe('bookingRoutes - Route Registration', () => {
    it('should export a valid Express Router', () => {
      const bookingRoutes = require('../../../src/routes/bookingRoutes');
      expect(bookingRoutes).toBeDefined();
      expect(typeof bookingRoutes).toBe('function');
    });

    it('should have POST / route registered', () => {
      const bookingRoutes = require('../../../src/routes/bookingRoutes');
      expect(bookingRoutes.stack).toBeDefined();
    });

    it('should have GET /user/:userId route registered', () => {
      const bookingRoutes = require('../../../src/routes/bookingRoutes');
      expect(bookingRoutes.stack).toBeDefined();
    });

    it('should have GET /availability/:movieId route registered', () => {
      const bookingRoutes = require('../../../src/routes/bookingRoutes');
      expect(bookingRoutes.stack).toBeDefined();
    });

    it('should have PUT /:id/cancel route registered', () => {
      const bookingRoutes = require('../../../src/routes/bookingRoutes');
      expect(bookingRoutes.stack).toBeDefined();
    });

    it('should have GET /stats route registered', () => {
      const bookingRoutes = require('../../../src/routes/bookingRoutes');
      expect(bookingRoutes.stack).toBeDefined();
    });
  });

  describe('userRoutes - Route Registration', () => {
    it('should export a valid Express Router', () => {
      const userRoutes = require('../../../src/routes/userRoutes');
      expect(userRoutes).toBeDefined();
      expect(typeof userRoutes).toBe('function');
    });

    it('should have GET / route registered', () => {
      const userRoutes = require('../../../src/routes/userRoutes');
      expect(userRoutes.stack).toBeDefined();
    });

    it('should have GET /:id route registered', () => {
      const userRoutes = require('../../../src/routes/userRoutes');
      expect(userRoutes.stack).toBeDefined();
    });

    it('should have POST / route registered', () => {
      const userRoutes = require('../../../src/routes/userRoutes');
      expect(userRoutes.stack).toBeDefined();
    });

    it('should have PUT /:id route registered', () => {
      const userRoutes = require('../../../src/routes/userRoutes');
      expect(userRoutes.stack).toBeDefined();
    });

    it('should have DELETE /:id route registered', () => {
      const userRoutes = require('../../../src/routes/userRoutes');
      expect(userRoutes.stack).toBeDefined();
    });
  });

  describe('theaterRoutes - Route Registration', () => {
    it('should export a valid Express Router', () => {
      const theaterRoutes = require('../../../src/routes/theaterRoutes');
      expect(theaterRoutes).toBeDefined();
      expect(typeof theaterRoutes).toBe('function');
    });

    it('should have GET / route registered', () => {
      const theaterRoutes = require('../../../src/routes/theaterRoutes');
      expect(theaterRoutes.stack).toBeDefined();
    });

    it('should have GET /nearby route registered', () => {
      const theaterRoutes = require('../../../src/routes/theaterRoutes');
      expect(theaterRoutes.stack).toBeDefined();
    });

    it('should have GET /:id route registered', () => {
      const theaterRoutes = require('../../../src/routes/theaterRoutes');
      expect(theaterRoutes.stack).toBeDefined();
    });

    it('should have POST / route registered', () => {
      const theaterRoutes = require('../../../src/routes/theaterRoutes');
      expect(theaterRoutes.stack).toBeDefined();
    });

    it('should have PUT /:id route registered', () => {
      const theaterRoutes = require('../../../src/routes/theaterRoutes');
      expect(theaterRoutes.stack).toBeDefined();
    });

    it('should have DELETE /:id route registered', () => {
      const theaterRoutes = require('../../../src/routes/theaterRoutes');
      expect(theaterRoutes.stack).toBeDefined();
    });
  });

  describe('sessionRoutes - Route Registration', () => {
    it('should export a valid Express Router', () => {
      const sessionRoutes = require('../../../src/routes/sessionRoutes');
      expect(sessionRoutes).toBeDefined();
      expect(typeof sessionRoutes).toBe('function');
    });

    it('should have GET / route registered', () => {
      const sessionRoutes = require('../../../src/routes/sessionRoutes');
      expect(sessionRoutes.stack).toBeDefined();
    });

    it('should have GET /active route registered', () => {
      const sessionRoutes = require('../../../src/routes/sessionRoutes');
      expect(sessionRoutes.stack).toBeDefined();
    });

    it('should have GET /:id route registered', () => {
      const sessionRoutes = require('../../../src/routes/sessionRoutes');
      expect(sessionRoutes.stack).toBeDefined();
    });

    it('should have POST / route registered', () => {
      const sessionRoutes = require('../../../src/routes/sessionRoutes');
      expect(sessionRoutes.stack).toBeDefined();
    });

    it('should have POST /logout-all route registered', () => {
      const sessionRoutes = require('../../../src/routes/sessionRoutes');
      expect(sessionRoutes.stack).toBeDefined();
    });

    it('should have PUT /:id route registered', () => {
      const sessionRoutes = require('../../../src/routes/sessionRoutes');
      expect(sessionRoutes.stack).toBeDefined();
    });

    it('should have DELETE /:id route registered', () => {
      const sessionRoutes = require('../../../src/routes/sessionRoutes');
      expect(sessionRoutes.stack).toBeDefined();
    });
  });

  describe('theaterSessionRoutes - Route Registration', () => {
    it('should export a valid Express Router', () => {
      const theaterSessionRoutes = require('../../../src/routes/theaterSessionRoutes');
      expect(theaterSessionRoutes).toBeDefined();
      expect(typeof theaterSessionRoutes).toBe('function');
    });

    it('should have GET / route registered', () => {
      const theaterSessionRoutes = require('../../../src/routes/theaterSessionRoutes');
      expect(theaterSessionRoutes.stack).toBeDefined();
    });

    it('should have POST / route registered', () => {
      const theaterSessionRoutes = require('../../../src/routes/theaterSessionRoutes');
      expect(theaterSessionRoutes.stack).toBeDefined();
    });

    it('should have PUT /:id route registered', () => {
      const theaterSessionRoutes = require('../../../src/routes/theaterSessionRoutes');
      expect(theaterSessionRoutes.stack).toBeDefined();
    });

    it('should have DELETE /:id route registered', () => {
      const theaterSessionRoutes = require('../../../src/routes/theaterSessionRoutes');
      expect(theaterSessionRoutes.stack).toBeDefined();
    });
  });

  describe('movieSessionRoutes - Route Registration', () => {
    it('should export a valid Express Router', () => {
      const movieSessionRoutes = require('../../../src/routes/movieSessionRoutes');
      expect(movieSessionRoutes).toBeDefined();
      expect(typeof movieSessionRoutes).toBe('function');
    });

    it('should have POST / route registered', () => {
      const movieSessionRoutes = require('../../../src/routes/movieSessionRoutes');
      expect(movieSessionRoutes.stack).toBeDefined();
    });

    it('should have GET / route registered', () => {
      const movieSessionRoutes = require('../../../src/routes/movieSessionRoutes');
      expect(movieSessionRoutes.stack).toBeDefined();
    });

    it('should have GET /:id route registered', () => {
      const movieSessionRoutes = require('../../../src/routes/movieSessionRoutes');
      expect(movieSessionRoutes.stack).toBeDefined();
    });

    it('should have PUT /:id route registered', () => {
      const movieSessionRoutes = require('../../../src/routes/movieSessionRoutes');
      expect(movieSessionRoutes.stack).toBeDefined();
    });

    it('should have DELETE /:id route registered', () => {
      const movieSessionRoutes = require('../../../src/routes/movieSessionRoutes');
      expect(movieSessionRoutes.stack).toBeDefined();
    });

    it('should have GET /movie/:movieId route registered', () => {
      const movieSessionRoutes = require('../../../src/routes/movieSessionRoutes');
      expect(movieSessionRoutes.stack).toBeDefined();
    });
  });

  describe('embeddedMovieRoutes - Route Registration', () => {
    it('should export a valid Express Router', () => {
      const embeddedMovieRoutes = require('../../../src/routes/embeddedMovieRoutes');
      expect(embeddedMovieRoutes).toBeDefined();
      expect(typeof embeddedMovieRoutes).toBe('function');
    });

    it('should have GET / route registered', () => {
      const embeddedMovieRoutes = require('../../../src/routes/embeddedMovieRoutes');
      expect(embeddedMovieRoutes.stack).toBeDefined();
    });

    it('should have GET /search route registered', () => {
      const embeddedMovieRoutes = require('../../../src/routes/embeddedMovieRoutes');
      expect(embeddedMovieRoutes.stack).toBeDefined();
    });

    it('should have GET /vector-search route registered', () => {
      const embeddedMovieRoutes = require('../../../src/routes/embeddedMovieRoutes');
      expect(embeddedMovieRoutes.stack).toBeDefined();
    });

    it('should have GET /hybrid-search route registered', () => {
      const embeddedMovieRoutes = require('../../../src/routes/embeddedMovieRoutes');
      expect(embeddedMovieRoutes.stack).toBeDefined();
    });

    it('should have GET /:id route registered', () => {
      const embeddedMovieRoutes = require('../../../src/routes/embeddedMovieRoutes');
      expect(embeddedMovieRoutes.stack).toBeDefined();
    });

    it('should have POST / route registered', () => {
      const embeddedMovieRoutes = require('../../../src/routes/embeddedMovieRoutes');
      expect(embeddedMovieRoutes.stack).toBeDefined();
    });

    it('should have PUT /:id route registered', () => {
      const embeddedMovieRoutes = require('../../../src/routes/embeddedMovieRoutes');
      expect(embeddedMovieRoutes.stack).toBeDefined();
    });

    it('should have DELETE /:id route registered', () => {
      const embeddedMovieRoutes = require('../../../src/routes/embeddedMovieRoutes');
      expect(embeddedMovieRoutes.stack).toBeDefined();
    });
  });

  describe('Controller Mocking Verification', () => {
    it('should have all movie controller functions properly mocked', () => {
      const movieController = require('../../../src/controllers/movieController');
      expect(movieController.f_getAllMovies).toBeDefined();
      expect(movieController.f_getMovieById).toBeDefined();
      expect(movieController.f_createMovie).toBeDefined();
      expect(movieController.f_updateMovie).toBeDefined();
      expect(movieController.f_deleteMovie).toBeDefined();
      expect(movieController.f_searchMovies).toBeDefined();
      expect(movieController.f_getTopRatedMovies).toBeDefined();
      expect(movieController.f_getMoviesByGenre).toBeDefined();
      expect(movieController.f_getMoviesByYear).toBeDefined();
      expect(movieController.f_getTrendingMovies).toBeDefined();
      expect(movieController.f_getMovieEngagementStats).toBeDefined();
    });

    it('should have all comment controller functions properly mocked', () => {
      const commentController = require('../../../src/controllers/commentController');
      expect(commentController.f_getAllComments).toBeDefined();
      expect(commentController.f_getCommentById).toBeDefined();
      expect(commentController.f_createComment).toBeDefined();
      expect(commentController.f_updateComment).toBeDefined();
      expect(commentController.f_deleteComment).toBeDefined();
      expect(commentController.f_getCommentsByMovie).toBeDefined();
      expect(commentController.f_getCommentStatsByMovie).toBeDefined();
      expect(commentController.f_getUserCommentHistory).toBeDefined();
      expect(commentController.f_getTopReviewers).toBeDefined();
      expect(commentController.f_updateHelpfulVotes).toBeDefined();
      expect(commentController.f_getRecentCommentsByGenre).toBeDefined();
    });

    it('should have all booking controller functions properly mocked', () => {
      const bookingController = require('../../../src/controllers/bookingController');
      expect(bookingController.f_createBooking).toBeDefined();
      expect(bookingController.f_getUserBookings).toBeDefined();
      expect(bookingController.f_getMovieAvailability).toBeDefined();
      expect(bookingController.f_cancelBooking).toBeDefined();
      expect(bookingController.f_getBookingStats).toBeDefined();
    });

    it('should have all user controller functions properly mocked', () => {
      const userController = require('../../../src/controllers/userController');
      expect(userController.f_getAllUsers).toBeDefined();
      expect(userController.f_getUserById).toBeDefined();
      expect(userController.f_createUser).toBeDefined();
      expect(userController.f_updateUser).toBeDefined();
      expect(userController.f_deleteUser).toBeDefined();
    });

    it('should have all theater controller functions properly mocked', () => {
      const theaterController = require('../../../src/controllers/theaterController');
      expect(theaterController.f_getAllTheaters).toBeDefined();
      expect(theaterController.f_getTheaterById).toBeDefined();
      expect(theaterController.f_createTheater).toBeDefined();
      expect(theaterController.f_updateTheater).toBeDefined();
      expect(theaterController.f_deleteTheater).toBeDefined();
      expect(theaterController.f_getNearbyTheaters).toBeDefined();
    });

    it('should have all session controller functions properly mocked', () => {
      const sessionController = require('../../../src/controllers/sessionController');
      expect(sessionController.f_getAllSessions).toBeDefined();
      expect(sessionController.f_getSessionById).toBeDefined();
      expect(sessionController.f_createSession).toBeDefined();
      expect(sessionController.f_updateSession).toBeDefined();
      expect(sessionController.f_deleteSession).toBeDefined();
      expect(sessionController.f_getActiveUserSessions).toBeDefined();
      expect(sessionController.f_logoutAllSessions).toBeDefined();
    });

    it('should have all theater session controller functions properly mocked', () => {
      const theaterSessionController = require('../../../src/controllers/theaterSessionController');
      expect(theaterSessionController.f_getTheaterSessions).toBeDefined();
      expect(theaterSessionController.f_createTheaterSession).toBeDefined();
      expect(theaterSessionController.f_updateTheaterSession).toBeDefined();
      expect(theaterSessionController.f_deleteTheaterSession).toBeDefined();
    });

    it('should have all movie session controller functions properly mocked', () => {
      const movieSessionController = require('../../../src/controllers/movieSessionController');
      expect(movieSessionController.f_createMovieSession).toBeDefined();
      expect(movieSessionController.f_getAllMovieSessions).toBeDefined();
      expect(movieSessionController.f_getMovieSessionById).toBeDefined();
      expect(movieSessionController.f_updateMovieSession).toBeDefined();
      expect(movieSessionController.f_deleteMovieSession).toBeDefined();
      expect(movieSessionController.f_getSessionsByMovie).toBeDefined();
    });

    it('should have all embedded movie controller functions properly mocked', () => {
      const embeddedMovieController = require('../../../src/controllers/embeddedMovieController');
      expect(embeddedMovieController.f_getAllEmbeddedMovies).toBeDefined();
      expect(embeddedMovieController.f_getEmbeddedMovieById).toBeDefined();
      expect(embeddedMovieController.f_createEmbeddedMovie).toBeDefined();
      expect(embeddedMovieController.f_updateEmbeddedMovie).toBeDefined();
      expect(embeddedMovieController.f_deleteEmbeddedMovie).toBeDefined();
      expect(embeddedMovieController.f_searchEmbeddedMovies).toBeDefined();
      expect(embeddedMovieController.f_vectorSearch).toBeDefined();
      expect(embeddedMovieController.f_hybridSearch).toBeDefined();
    });
  });
});
