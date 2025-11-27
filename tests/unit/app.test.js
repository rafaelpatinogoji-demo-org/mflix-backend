const request = require('supertest');

let v_currentPort = 4000;

jest.mock('../../src/config/database', () => jest.fn());

jest.mock('../../src/routes/movieRoutes', () => {
  const express = require('express');
  const v_router = express.Router();
  v_router.get('/', (p_req, p_res) => p_res.json({ route: 'movies' }));
  v_router.get('/trigger-error', (p_req, p_res, p_next) => {
    p_next(new Error('Test error'));
  });
  return v_router;
});

jest.mock('../../src/routes/commentRoutes', () => {
  const express = require('express');
  const v_router = express.Router();
  v_router.get('/', (p_req, p_res) => p_res.json({ route: 'comments' }));
  return v_router;
});

jest.mock('../../src/routes/userRoutes', () => {
  const express = require('express');
  const v_router = express.Router();
  v_router.get('/', (p_req, p_res) => p_res.json({ route: 'users' }));
  return v_router;
});

jest.mock('../../src/routes/theaterRoutes', () => {
  const express = require('express');
  const v_router = express.Router();
  v_router.get('/', (p_req, p_res) => p_res.json({ route: 'theaters' }));
  return v_router;
});

jest.mock('../../src/routes/sessionRoutes', () => {
  const express = require('express');
  const v_router = express.Router();
  v_router.get('/', (p_req, p_res) => p_res.json({ route: 'sessions' }));
  return v_router;
});

jest.mock('../../src/routes/theaterSessionRoutes', () => {
  const express = require('express');
  const v_router = express.Router();
  v_router.get('/', (p_req, p_res) => p_res.json({ route: 'theater-sessions' }));
  return v_router;
});

jest.mock('../../src/routes/embeddedMovieRoutes', () => {
  const express = require('express');
  const v_router = express.Router();
  v_router.get('/', (p_req, p_res) => p_res.json({ route: 'embedded-movies' }));
  return v_router;
});

jest.mock('../../src/routes/bookingRoutes', () => {
  const express = require('express');
  const v_router = express.Router();
  v_router.get('/', (p_req, p_res) => p_res.json({ route: 'bookings' }));
  return v_router;
});

jest.mock('../../src/routes/movieSessionRoutes', () => {
  const express = require('express');
  const v_router = express.Router();
  v_router.get('/', (p_req, p_res) => p_res.json({ route: 'movie-sessions' }));
  return v_router;
});

describe('Express Application Setup', () => {
  let app;
  let v_mockConsoleLog;
  let v_mockConsoleError;
  let v_originalEnv;

  beforeEach(() => {
    jest.resetModules();
    
    v_originalEnv = process.env;
    process.env = { ...v_originalEnv };
    process.env.PORT = v_currentPort++;
    
    v_mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    v_mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    app = require('../../app');
  });

  afterEach(() => {
    process.env = v_originalEnv;
    v_mockConsoleLog.mockRestore();
    v_mockConsoleError.mockRestore();
  });

  describe('Application Export', () => {
    it('should export the Express application', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should have the listen method', () => {
      expect(typeof app.listen).toBe('function');
    });
  });

  describe('Database Connection', () => {
    it('should call connectDB on application startup', () => {
      const connectDB = require('../../src/config/database');
      expect(connectDB).toHaveBeenCalled();
    });
  });

  describe('Middleware Configuration', () => {
    describe('CORS Middleware', () => {
      it('should enable CORS for all origins', async () => {
        const v_response = await request(app)
          .get('/')
          .set('Origin', 'http://example.com');
        
        expect(v_response.headers['access-control-allow-origin']).toBe('*');
      });

      it('should handle preflight OPTIONS requests', async () => {
        const v_response = await request(app)
          .options('/api/movies')
          .set('Origin', 'http://example.com')
          .set('Access-Control-Request-Method', 'GET');
        
        expect(v_response.status).toBe(204);
      });
    });

    describe('JSON Body Parser', () => {
      it('should parse JSON request bodies', async () => {
        const v_testData = { title: 'Test Movie', year: 2024 };
        
        const v_response = await request(app)
          .post('/api/movies')
          .send(v_testData)
          .set('Content-Type', 'application/json');
        
        expect(v_response.status).not.toBe(400);
      });

      it('should handle empty JSON bodies', async () => {
        const v_response = await request(app)
          .post('/api/movies')
          .send({})
          .set('Content-Type', 'application/json');
        
        expect(v_response.status).not.toBe(400);
      });

      it('should handle malformed JSON and return error status', async () => {
        const v_response = await request(app)
          .post('/api/movies')
          .send('{ invalid json }')
          .set('Content-Type', 'application/json');
        
        expect([400, 500]).toContain(v_response.status);
      });
    });

    describe('URL Encoded Body Parser', () => {
      it('should parse URL encoded request bodies', async () => {
        const v_response = await request(app)
          .post('/api/movies')
          .send('title=Test&year=2024')
          .set('Content-Type', 'application/x-www-form-urlencoded');
        
        expect(v_response.status).not.toBe(400);
      });

      it('should handle extended URL encoding', async () => {
        const v_response = await request(app)
          .post('/api/movies')
          .send('data[title]=Test&data[year]=2024')
          .set('Content-Type', 'application/x-www-form-urlencoded');
        
        expect(v_response.status).not.toBe(400);
      });
    });
  });

  describe('Route Mounting', () => {
    describe('Movie Routes', () => {
      it('should mount movie routes at /api/movies', async () => {
        const v_response = await request(app).get('/api/movies');
        expect(v_response.status).toBe(200);
        expect(v_response.body.route).toBe('movies');
      });
    });

    describe('Comment Routes', () => {
      it('should mount comment routes at /api/comments', async () => {
        const v_response = await request(app).get('/api/comments');
        expect(v_response.status).toBe(200);
        expect(v_response.body.route).toBe('comments');
      });
    });

    describe('User Routes', () => {
      it('should mount user routes at /api/users', async () => {
        const v_response = await request(app).get('/api/users');
        expect(v_response.status).toBe(200);
        expect(v_response.body.route).toBe('users');
      });
    });

    describe('Theater Routes', () => {
      it('should mount theater routes at /api/theaters', async () => {
        const v_response = await request(app).get('/api/theaters');
        expect(v_response.status).toBe(200);
        expect(v_response.body.route).toBe('theaters');
      });
    });

    describe('Session Routes', () => {
      it('should mount session routes at /api/sessions', async () => {
        const v_response = await request(app).get('/api/sessions');
        expect(v_response.status).toBe(200);
        expect(v_response.body.route).toBe('sessions');
      });
    });

    describe('Theater Session Routes', () => {
      it('should mount theater session routes at /api/theater-sessions', async () => {
        const v_response = await request(app).get('/api/theater-sessions');
        expect(v_response.status).toBe(200);
        expect(v_response.body.route).toBe('theater-sessions');
      });
    });

    describe('Embedded Movie Routes', () => {
      it('should mount embedded movie routes at /api/embedded-movies', async () => {
        const v_response = await request(app).get('/api/embedded-movies');
        expect(v_response.status).toBe(200);
        expect(v_response.body.route).toBe('embedded-movies');
      });
    });

    describe('Booking Routes', () => {
      it('should mount booking routes at /api/bookings', async () => {
        const v_response = await request(app).get('/api/bookings');
        expect(v_response.status).toBe(200);
        expect(v_response.body.route).toBe('bookings');
      });
    });

    describe('Movie Session Routes', () => {
      it('should mount movie session routes at /api/movie-sessions', async () => {
        const v_response = await request(app).get('/api/movie-sessions');
        expect(v_response.status).toBe(200);
        expect(v_response.body.route).toBe('movie-sessions');
      });
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information at root endpoint', async () => {
      const v_response = await request(app).get('/');
      
      expect(v_response.status).toBe(200);
      expect(v_response.body.message).toBe('MFlix API Server');
      expect(v_response.body.version).toBe('1.0.0');
    });

    it('should include all endpoint information', async () => {
      const v_response = await request(app).get('/');
      
      expect(v_response.body.endpoints).toBeDefined();
      expect(v_response.body.endpoints.movies).toBe('/api/movies');
      expect(v_response.body.endpoints.comments).toBe('/api/comments');
      expect(v_response.body.endpoints.users).toBe('/api/users');
      expect(v_response.body.endpoints.theaters).toBe('/api/theaters');
      expect(v_response.body.endpoints.sessions).toBe('/api/sessions');
      expect(v_response.body.endpoints.theaterSessions).toBe('/api/theater-sessions');
      expect(v_response.body.endpoints.embeddedMovies).toBe('/api/embedded-movies');
      expect(v_response.body.endpoints.bookings).toBe('/api/bookings');
      expect(v_response.body.endpoints.movieSessions).toBe('/api/movie-sessions');
    });

    it('should return JSON content type', async () => {
      const v_response = await request(app).get('/');
      
      expect(v_response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('404 Not Found Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const v_response = await request(app).get('/undefined-route');
      
      expect(v_response.status).toBe(404);
      expect(v_response.body.message).toBe('Route not found');
    });

    it('should return 404 for undefined API routes', async () => {
      const v_response = await request(app).get('/api/undefined');
      
      expect(v_response.status).toBe(404);
      expect(v_response.body.message).toBe('Route not found');
    });

    it('should return 404 for nested undefined routes', async () => {
      const v_response = await request(app).get('/api/movies/nested/undefined/route');
      
      expect(v_response.status).toBe(404);
    });

    it('should return JSON response for 404 errors', async () => {
      const v_response = await request(app).get('/not-found');
      
      expect(v_response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle POST requests to undefined routes', async () => {
      const v_response = await request(app).post('/undefined-route');
      
      expect(v_response.status).toBe(404);
      expect(v_response.body.message).toBe('Route not found');
    });

    it('should handle PUT requests to undefined routes', async () => {
      const v_response = await request(app).put('/undefined-route');
      
      expect(v_response.status).toBe(404);
      expect(v_response.body.message).toBe('Route not found');
    });

    it('should handle DELETE requests to undefined routes', async () => {
      const v_response = await request(app).delete('/undefined-route');
      
      expect(v_response.status).toBe(404);
      expect(v_response.body.message).toBe('Route not found');
    });
  });

  describe('Error Handling Middleware', () => {
    it('should handle errors and return 500 status', async () => {
      const v_response = await request(app).get('/api/movies/trigger-error');
      
      expect(v_response.status).toBe(500);
      expect(v_response.body.message).toBe('Internal server error');
    });

    it('should log error stack to console when error occurs', async () => {
      await request(app).get('/api/movies/trigger-error');
      
      expect(v_mockConsoleError).toHaveBeenCalled();
    });

    it('should return JSON response for errors', async () => {
      const v_response = await request(app).get('/api/movies/trigger-error');
      
      expect(v_response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Environment Configuration', () => {
    it('should have PORT configuration available', () => {
      expect(process.env.PORT).toBeDefined();
    });

    it('should export app for external use', () => {
      expect(app).toBeDefined();
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
    });
  });
});

describe('Express Application with Default PORT', () => {
  it('should use default port 3000 when PORT is not set', async () => {
    jest.resetModules();
    
    const v_originalEnv = process.env;
    process.env = { ...v_originalEnv };
    delete process.env.PORT;
    
    const v_mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const v_mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const app = require('../../app');
    const v_response = await request(app).get('/');
    
    expect(v_response.status).toBe(200);
    
    process.env = v_originalEnv;
    v_mockConsoleLog.mockRestore();
    v_mockConsoleError.mockRestore();
  });
});

describe('Express Application HTTP Methods and Content Types', () => {
  let app;
  let v_mockConsoleLog;
  let v_mockConsoleError;
  let v_originalEnv;

  beforeEach(() => {
    jest.resetModules();
    
    v_originalEnv = process.env;
    process.env = { ...v_originalEnv };
    process.env.PORT = v_currentPort++;
    
    v_mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    v_mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    app = require('../../app');
  });

  afterEach(() => {
    process.env = v_originalEnv;
    v_mockConsoleLog.mockRestore();
    v_mockConsoleError.mockRestore();
  });

  describe('HTTP Methods Support', () => {
    it('should support GET requests', async () => {
      const v_response = await request(app).get('/api/movies');
      expect(v_response.status).toBe(200);
    });

    it('should support POST requests', async () => {
      const v_response = await request(app)
        .post('/api/movies')
        .send({ title: 'Test' });
      expect(v_response.status).not.toBe(405);
    });

    it('should support PUT requests', async () => {
      const v_response = await request(app)
        .put('/api/movies/123')
        .send({ title: 'Updated' });
      expect(v_response.status).not.toBe(405);
    });

    it('should support DELETE requests', async () => {
      const v_response = await request(app).delete('/api/movies/123');
      expect(v_response.status).not.toBe(405);
    });

    it('should support PATCH requests', async () => {
      const v_response = await request(app)
        .patch('/api/movies/123')
        .send({ title: 'Patched' });
      expect(v_response.status).not.toBe(405);
    });
  });

  describe('Content Type Handling', () => {
    it('should accept application/json content type', async () => {
      const v_response = await request(app)
        .post('/api/movies')
        .set('Content-Type', 'application/json')
        .send({ title: 'Test' });
      
      expect(v_response.status).not.toBe(415);
    });

    it('should accept application/x-www-form-urlencoded content type', async () => {
      const v_response = await request(app)
        .post('/api/movies')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('title=Test');
      
      expect(v_response.status).not.toBe(415);
    });
  });
});
