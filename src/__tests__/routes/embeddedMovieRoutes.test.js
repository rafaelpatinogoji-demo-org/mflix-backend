const request = require('supertest');
const express = require('express');
const embeddedMovieRoutes = require('../../routes/embeddedMovieRoutes');
const EmbeddedMovie = require('../../models/EmbeddedMovie');

jest.mock('../../models/EmbeddedMovie');

const v_app = express();
v_app.use(express.json());
v_app.use('/api/embedded-movies', embeddedMovieRoutes);

describe('EmbeddedMovie Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/embedded-movies', () => {
    it('should return paginated embedded movies', async () => {
      const v_mockEmbeddedMovies = [
        { 
          _id: '1', 
          title: 'Movie 1', 
          year: 2020,
          plot_embedding_voyage_3_large: [0.1, 0.2, 0.3]
        },
        { 
          _id: '2', 
          title: 'Movie 2', 
          year: 2021,
          plot_embedding: [0.4, 0.5, 0.6]
        }
      ];
      
      EmbeddedMovie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockEmbeddedMovies)
      });
      EmbeddedMovie.countDocuments.mockResolvedValue(30);

      const v_response = await request(v_app)
        .get('/api/embedded-movies')
        .expect(200);

      expect(v_response.body).toHaveProperty('embeddedMovies');
      expect(v_response.body).toHaveProperty('currentPage', 1);
      expect(v_response.body).toHaveProperty('totalPages', 3);
      expect(v_response.body).toHaveProperty('totalEmbeddedMovies', 30);
      expect(v_response.body.embeddedMovies).toEqual(v_mockEmbeddedMovies);
    });

    it('should handle pagination query parameters', async () => {
      const v_mockEmbeddedMovies = [
        { _id: '3', title: 'Movie 3', plot_embedding: [0.7, 0.8] }
      ];
      
      EmbeddedMovie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockEmbeddedMovies)
      });
      EmbeddedMovie.countDocuments.mockResolvedValue(100);

      const v_response = await request(v_app)
        .get('/api/embedded-movies?page=3&limit=20')
        .expect(200);

      expect(v_response.body.currentPage).toBe(3);
      expect(v_response.body.totalPages).toBe(5);
    });
  });

  describe('GET /api/embedded-movies/search', () => {
    it('should search embedded movies by title', async () => {
      const v_mockMovies = [
        { _id: '1', title: 'Inception', year: 2010, plot_embedding: [0.1, 0.2] }
      ];
      EmbeddedMovie.find.mockResolvedValue(v_mockMovies);

      const v_response = await request(v_app)
        .get('/api/embedded-movies/search?title=Inception')
        .expect(200);

      expect(v_response.body).toEqual(v_mockMovies);
      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        title: { $regex: 'Inception', $options: 'i' }
      });
    });

    it('should search embedded movies by genre', async () => {
      const v_mockMovies = [
        { _id: '1', title: 'Sci-Fi Movie', genres: ['Sci-Fi'], plot_embedding: [0.3, 0.4] }
      ];
      EmbeddedMovie.find.mockResolvedValue(v_mockMovies);

      const v_response = await request(v_app)
        .get('/api/embedded-movies/search?genre=Sci-Fi')
        .expect(200);

      expect(v_response.body).toEqual(v_mockMovies);
      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        genres: { $in: ['Sci-Fi'] }
      });
    });

    it('should search embedded movies with multiple filters', async () => {
      const v_mockMovies = [
        { 
          _id: '1', 
          title: 'Drama 2022', 
          genres: ['Drama'], 
          year: 2022,
          plot_embedding_voyage_3_large: [0.5, 0.6]
        }
      ];
      EmbeddedMovie.find.mockResolvedValue(v_mockMovies);

      const v_response = await request(v_app)
        .get('/api/embedded-movies/search?title=Drama&genre=Drama&year=2022')
        .expect(200);

      expect(v_response.body).toEqual(v_mockMovies);
    });
  });

  describe('GET /api/embedded-movies/:id', () => {
    it('should return an embedded movie by ID with embedding data', async () => {
      const v_mockMovie = { 
        _id: '123', 
        title: 'Test Movie', 
        year: 2020,
        plot_embedding_voyage_3_large: [0.1, 0.2, 0.3, 0.4, 0.5],
        fullplot: 'A detailed plot',
        num_mflix_comments: 10
      };
      EmbeddedMovie.findById.mockResolvedValue(v_mockMovie);

      const v_response = await request(v_app)
        .get('/api/embedded-movies/123')
        .expect(200);

      expect(v_response.body).toEqual(v_mockMovie);
      expect(EmbeddedMovie.findById).toHaveBeenCalledWith('123');
    });

    it('should return 404 for non-existent embedded movie', async () => {
      EmbeddedMovie.findById.mockResolvedValue(null);

      const v_response = await request(v_app)
        .get('/api/embedded-movies/999')
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Embedded movie not found');
    });
  });

  describe('POST /api/embedded-movies', () => {
    it('should create a new embedded movie with embedding fields', async () => {
      const v_newMovie = { 
        title: 'New Movie', 
        year: 2023, 
        genres: ['Drama'],
        plot_embedding_voyage_3_large: [0.1, 0.2, 0.3]
      };
      const v_savedMovie = { _id: '123', ...v_newMovie };

      const v_mockSave = jest.fn().mockResolvedValue(v_savedMovie);
      EmbeddedMovie.mockImplementation(() => ({
        save: v_mockSave
      }));

      const v_response = await request(v_app)
        .post('/api/embedded-movies')
        .send(v_newMovie)
        .expect(201);

      expect(v_response.body).toEqual(v_savedMovie);
    });

    it('should return 400 for validation errors', async () => {
      const v_mockSave = jest.fn().mockRejectedValue(new Error('Title is required'));
      EmbeddedMovie.mockImplementation(() => ({
        save: v_mockSave
      }));

      const v_response = await request(v_app)
        .post('/api/embedded-movies')
        .send({ year: 2023 })
        .expect(400);

      expect(v_response.body).toHaveProperty('message', 'Title is required');
    });
  });

  describe('PUT /api/embedded-movies/:id', () => {
    it('should update an embedded movie including embedding fields', async () => {
      const v_updatedMovie = { 
        _id: '123', 
        title: 'Updated Movie', 
        year: 2024,
        plot_embedding: [0.5, 0.6, 0.7]
      };
      EmbeddedMovie.findByIdAndUpdate.mockResolvedValue(v_updatedMovie);

      const v_response = await request(v_app)
        .put('/api/embedded-movies/123')
        .send({ 
          title: 'Updated Movie', 
          year: 2024,
          plot_embedding: [0.5, 0.6, 0.7]
        })
        .expect(200);

      expect(v_response.body).toEqual(v_updatedMovie);
    });

    it('should return 404 for non-existent embedded movie', async () => {
      EmbeddedMovie.findByIdAndUpdate.mockResolvedValue(null);

      const v_response = await request(v_app)
        .put('/api/embedded-movies/999')
        .send({ title: 'Updated' })
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Embedded movie not found');
    });
  });

  describe('DELETE /api/embedded-movies/:id', () => {
    it('should delete an embedded movie', async () => {
      const v_deletedMovie = { _id: '123', title: 'Deleted Movie' };
      EmbeddedMovie.findByIdAndDelete.mockResolvedValue(v_deletedMovie);

      const v_response = await request(v_app)
        .delete('/api/embedded-movies/123')
        .expect(200);

      expect(v_response.body).toHaveProperty('message', 'Embedded movie deleted successfully');
    });

    it('should return 404 for non-existent embedded movie', async () => {
      EmbeddedMovie.findByIdAndDelete.mockResolvedValue(null);

      const v_response = await request(v_app)
        .delete('/api/embedded-movies/999')
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Embedded movie not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in GET /api/embedded-movies', async () => {
      EmbeddedMovie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const v_response = await request(v_app)
        .get('/api/embedded-movies')
        .expect(500);

      expect(v_response.body).toHaveProperty('message', 'Database error');
    });

    it('should handle errors in POST /api/embedded-movies', async () => {
      const v_mockSave = jest.fn().mockRejectedValue(new Error('Validation failed'));
      EmbeddedMovie.mockImplementation(() => ({
        save: v_mockSave
      }));

      const v_response = await request(v_app)
        .post('/api/embedded-movies')
        .send({ title: 'Test' })
        .expect(400);

      expect(v_response.body).toHaveProperty('message');
    });
  });
});
