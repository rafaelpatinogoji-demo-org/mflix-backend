const {
  f_getAllEmbeddedMovies,
  f_getEmbeddedMovieById,
  f_createEmbeddedMovie,
  f_updateEmbeddedMovie,
  f_deleteEmbeddedMovie,
  f_searchEmbeddedMovies
} = require('../../controllers/embeddedMovieController');
const EmbeddedMovie = require('../../models/EmbeddedMovie');
const vectorSearchService = require('../../services/vectorSearchService');

jest.mock('../../models/EmbeddedMovie');
jest.mock('../../services/vectorSearchService');

describe('EmbeddedMovie Controller', () => {
  let v_mockReq;
  let v_mockRes;

  beforeEach(() => {
    v_mockReq = {
      query: {},
      params: {},
      body: {}
    };
    v_mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('f_getAllEmbeddedMovies', () => {
    it('should return paginated embedded movies with default pagination', async () => {
      const v_mockEmbeddedMovies = [
        { 
          _id: '1', 
          title: 'Movie 1', 
          year: 2020,
          plot_embedding_voyage_3_large: [0.1, 0.2, 0.3],
          num_mflix_comments: 10
        },
        { 
          _id: '2', 
          title: 'Movie 2', 
          year: 2021,
          plot_embedding_voyage_3_large: [0.4, 0.5, 0.6],
          num_mflix_comments: 5
        }
      ];
      
      EmbeddedMovie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockEmbeddedMovies)
      });
      EmbeddedMovie.countDocuments.mockResolvedValue(25);

      await f_getAllEmbeddedMovies(v_mockReq, v_mockRes);

      expect(EmbeddedMovie.find).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith({
        embeddedMovies: v_mockEmbeddedMovies,
        currentPage: 1,
        totalPages: 3,
        totalEmbeddedMovies: 25
      });
    });

    it('should return paginated embedded movies with custom pagination', async () => {
      v_mockReq.query = { page: '3', limit: '20' };
      const v_mockEmbeddedMovies = [
        { _id: '41', title: 'Movie 41', plot_embedding: [0.1, 0.2] }
      ];
      
      EmbeddedMovie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockEmbeddedMovies)
      });
      EmbeddedMovie.countDocuments.mockResolvedValue(100);

      await f_getAllEmbeddedMovies(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        embeddedMovies: v_mockEmbeddedMovies,
        currentPage: 3,
        totalPages: 5,
        totalEmbeddedMovies: 100
      });
    });

    it('should handle errors and return 500 status', async () => {
      EmbeddedMovie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await f_getAllEmbeddedMovies(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  describe('f_getEmbeddedMovieById', () => {
    it('should return embedded movie by valid ID with embedding data', async () => {
      const v_mockEmbeddedMovie = { 
        _id: '123', 
        title: 'Test Movie', 
        year: 2020,
        plot_embedding_voyage_3_large: [0.1, 0.2, 0.3, 0.4, 0.5],
        fullplot: 'A detailed plot description',
        num_mflix_comments: 15
      };
      v_mockReq.params.id = '123';
      EmbeddedMovie.findById.mockResolvedValue(v_mockEmbeddedMovie);

      await f_getEmbeddedMovieById(v_mockReq, v_mockRes);

      expect(EmbeddedMovie.findById).toHaveBeenCalledWith('123');
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockEmbeddedMovie);
    });

    it('should return 404 for non-existent embedded movie', async () => {
      v_mockReq.params.id = '999';
      EmbeddedMovie.findById.mockResolvedValue(null);

      await f_getEmbeddedMovieById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Embedded movie not found'
      });
    });

    it('should handle malformed ID error', async () => {
      v_mockReq.params.id = 'invalid-id';
      EmbeddedMovie.findById.mockRejectedValue(new Error('Cast to ObjectId failed'));

      await f_getEmbeddedMovieById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Cast to ObjectId failed'
      });
    });
  });

  describe('f_createEmbeddedMovie', () => {
    it('should create a new embedded movie with embedding fields', async () => {
      const v_movieData = { 
        title: 'New Movie', 
        year: 2023, 
        genres: ['Action'],
        plot_embedding_voyage_3_large: [0.1, 0.2, 0.3]
      };
      const v_savedMovie = { _id: '123', ...v_movieData };
      v_mockReq.body = v_movieData;

      const v_mockSave = jest.fn().mockResolvedValue(v_savedMovie);
      EmbeddedMovie.mockImplementation(() => ({
        save: v_mockSave
      }));

      await f_createEmbeddedMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(201);
      expect(v_mockRes.json).toHaveBeenCalledWith(v_savedMovie);
    });

    it('should return 400 for validation errors', async () => {
      v_mockReq.body = { year: 2023 };

      const v_mockSave = jest.fn().mockRejectedValue(new Error('Title is required'));
      EmbeddedMovie.mockImplementation(() => ({
        save: v_mockSave
      }));

      await f_createEmbeddedMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Title is required'
      });
    });
  });

  describe('f_updateEmbeddedMovie', () => {
    it('should update embedded movie including embedding fields', async () => {
      const v_updatedMovie = { 
        _id: '123', 
        title: 'Updated Movie', 
        year: 2024,
        plot_embedding: [0.5, 0.6, 0.7]
      };
      v_mockReq.params.id = '123';
      v_mockReq.body = { 
        title: 'Updated Movie', 
        year: 2024,
        plot_embedding: [0.5, 0.6, 0.7]
      };
      EmbeddedMovie.findByIdAndUpdate.mockResolvedValue(v_updatedMovie);

      await f_updateEmbeddedMovie(v_mockReq, v_mockRes);

      expect(EmbeddedMovie.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        v_mockReq.body,
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedMovie);
    });

    it('should return 404 for non-existent embedded movie', async () => {
      v_mockReq.params.id = '999';
      v_mockReq.body = { title: 'Updated' };
      EmbeddedMovie.findByIdAndUpdate.mockResolvedValue(null);

      await f_updateEmbeddedMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Embedded movie not found'
      });
    });
  });

  describe('f_deleteEmbeddedMovie', () => {
    it('should delete embedded movie successfully', async () => {
      const v_deletedMovie = { _id: '123', title: 'Deleted Movie' };
      v_mockReq.params.id = '123';
      EmbeddedMovie.findByIdAndDelete.mockResolvedValue(v_deletedMovie);

      await f_deleteEmbeddedMovie(v_mockReq, v_mockRes);

      expect(EmbeddedMovie.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Embedded movie deleted successfully'
      });
    });

    it('should return 404 for non-existent embedded movie', async () => {
      v_mockReq.params.id = '999';
      EmbeddedMovie.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteEmbeddedMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Embedded movie not found'
      });
    });
  });

  describe('f_searchEmbeddedMovies', () => {
    it('should search embedded movies by title', async () => {
      v_mockReq.query = { title: 'Inception' };
      const v_mockMovies = [
        { _id: '1', title: 'Inception', year: 2010, plot_embedding: [0.1, 0.2] }
      ];
      EmbeddedMovie.find.mockResolvedValue(v_mockMovies);

      await f_searchEmbeddedMovies(v_mockReq, v_mockRes);

      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        title: { $regex: 'Inception', $options: 'i' }
      });
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockMovies);
    });

    it('should search embedded movies by genre', async () => {
      v_mockReq.query = { genre: 'Sci-Fi' };
      const v_mockMovies = [
        { _id: '1', title: 'Sci-Fi Movie', genres: ['Sci-Fi'], plot_embedding: [0.3, 0.4] }
      ];
      EmbeddedMovie.find.mockResolvedValue(v_mockMovies);

      await f_searchEmbeddedMovies(v_mockReq, v_mockRes);

      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        genres: { $in: ['Sci-Fi'] }
      });
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockMovies);
    });

    it('should handle search errors', async () => {
      v_mockReq.query = { title: 'Test' };
      EmbeddedMovie.find.mockRejectedValue(new Error('Search error'));

      await f_searchEmbeddedMovies(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Search error'
      });
    });
  });

  describe('Integration with vectorSearchService', () => {
    it('should use vectorSearchService for semantic search when plot text is provided', async () => {
      const v_mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const v_mockSearchResults = [
        { _id: '1', title: 'Similar Movie 1', plot_embedding: v_mockEmbedding }
      ];

      vectorSearchService.generateEmbedding.mockResolvedValue(v_mockEmbedding);
      vectorSearchService.vectorSearch.mockResolvedValue(v_mockSearchResults);

      const v_plotText = 'A story about space exploration';
      const v_result = await vectorSearchService.generateEmbedding(v_plotText);
      const v_searchResult = await vectorSearchService.vectorSearch(v_result, EmbeddedMovie, 10);

      expect(vectorSearchService.generateEmbedding).toHaveBeenCalledWith(v_plotText);
      expect(vectorSearchService.vectorSearch).toHaveBeenCalledWith(v_mockEmbedding, EmbeddedMovie, 10);
      expect(v_searchResult).toEqual(v_mockSearchResults);
    });

    it('should use hybridSearch for combined semantic and filter search', async () => {
      const v_mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const v_mockFilters = { year: { $gte: 2020 }, genres: { $in: ['Action'] } };
      const v_mockResults = [
        { _id: '1', title: 'Action Movie', year: 2021, genres: ['Action'] }
      ];

      vectorSearchService.generateEmbedding.mockResolvedValue(v_mockEmbedding);
      vectorSearchService.hybridSearch.mockResolvedValue(v_mockResults);

      const v_embedding = await vectorSearchService.generateEmbedding('action movie');
      const v_results = await vectorSearchService.hybridSearch(v_embedding, EmbeddedMovie, v_mockFilters, 5);

      expect(vectorSearchService.hybridSearch).toHaveBeenCalledWith(
        v_mockEmbedding, 
        EmbeddedMovie, 
        v_mockFilters, 
        5
      );
      expect(v_results).toEqual(v_mockResults);
    });

    it('should handle vectorSearchService errors gracefully', async () => {
      vectorSearchService.generateEmbedding.mockRejectedValue(
        new Error('Failed to generate embedding: API error')
      );

      await expect(
        vectorSearchService.generateEmbedding('test plot')
      ).rejects.toThrow('Failed to generate embedding: API error');
    });
  });
});
