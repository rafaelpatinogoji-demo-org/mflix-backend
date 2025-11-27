const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
const mockEmbed = jest.fn();
const mockVoyageAI = jest.fn().mockImplementation(() => ({
  embed: mockEmbed
}));

jest.mock('voyageai', () => ({
  VoyageAI: mockVoyageAI
}));

jest.mock('../../../src/models/EmbeddedMovie', () => ({
  aggregate: jest.fn()
}));

const EmbeddedMovie = require('../../../src/models/EmbeddedMovie');
const VectorSearchService = require('../../../src/services/vectorSearchService');

describe('VectorSearchService', () => {
  describe('constructor', () => {
    it('should initialize VoyageAI client with API key from environment', () => {
      expect(mockVoyageAI).toHaveBeenCalledWith({
        apiKey: process.env.VOYAGE_API_KEY
      });
    });

    it('should create a voyageClient instance', () => {
      expect(VectorSearchService.voyageClient).toBeDefined();
    });
  });

  beforeEach(() => {
    mockEmbed.mockClear();
    EmbeddedMovie.aggregate.mockClear();
    mockEmbed.mockResolvedValue({
      data: [{ embedding: mockEmbedding }]
    });
  });

  describe('generateEmbedding', () => {
    describe('successful embedding generation', () => {
      it('should generate embedding with default parameters', async () => {
        const v_text = 'A movie about space exploration';
        
        const v_result = await VectorSearchService.generateEmbedding(v_text);
        
        expect(mockEmbed).toHaveBeenCalledWith({
          inputs: [v_text],
          model: 'voyage-3-large',
          inputType: 'query'
        });
        expect(v_result).toEqual(mockEmbedding);
      });

      it('should generate embedding with custom model parameter', async () => {
        const v_text = 'A romantic comedy';
        const v_customModel = 'voyage-2';
        
        const v_result = await VectorSearchService.generateEmbedding(v_text, v_customModel);
        
        expect(mockEmbed).toHaveBeenCalledWith({
          inputs: [v_text],
          model: v_customModel,
          inputType: 'query'
        });
        expect(v_result).toEqual(mockEmbedding);
      });

      it('should generate embedding with custom inputType parameter', async () => {
        const v_text = 'An action thriller';
        const v_model = 'voyage-3-large';
        const v_inputType = 'document';
        
        const v_result = await VectorSearchService.generateEmbedding(v_text, v_model, v_inputType);
        
        expect(mockEmbed).toHaveBeenCalledWith({
          inputs: [v_text],
          model: v_model,
          inputType: v_inputType
        });
        expect(v_result).toEqual(mockEmbedding);
      });

      it('should generate embedding with all custom parameters', async () => {
        const v_text = 'A horror movie';
        const v_model = 'voyage-lite-02-instruct';
        const v_inputType = 'document';
        
        const v_result = await VectorSearchService.generateEmbedding(v_text, v_model, v_inputType);
        
        expect(mockEmbed).toHaveBeenCalledWith({
          inputs: [v_text],
          model: v_model,
          inputType: v_inputType
        });
        expect(v_result).toEqual(mockEmbedding);
      });

      it('should return the embedding array from the response', async () => {
        const v_expectedEmbedding = [0.9, 0.8, 0.7, 0.6, 0.5];
        mockEmbed.mockResolvedValueOnce({
          data: [{ embedding: v_expectedEmbedding }]
        });
        
        const v_result = await VectorSearchService.generateEmbedding('test text');
        
        expect(v_result).toEqual(v_expectedEmbedding);
      });

      it('should handle empty text input', async () => {
        const v_text = '';
        
        const v_result = await VectorSearchService.generateEmbedding(v_text);
        
        expect(mockEmbed).toHaveBeenCalledWith({
          inputs: [v_text],
          model: 'voyage-3-large',
          inputType: 'query'
        });
        expect(v_result).toEqual(mockEmbedding);
      });

      it('should handle long text input', async () => {
        const v_longText = 'A'.repeat(10000);
        
        const v_result = await VectorSearchService.generateEmbedding(v_longText);
        
        expect(mockEmbed).toHaveBeenCalledWith({
          inputs: [v_longText],
          model: 'voyage-3-large',
          inputType: 'query'
        });
        expect(v_result).toEqual(mockEmbedding);
      });
    });

    describe('error handling', () => {
      it('should throw error when VoyageAI API fails', async () => {
        const v_apiError = new Error('API rate limit exceeded');
        mockEmbed.mockRejectedValueOnce(v_apiError);
        
        await expect(VectorSearchService.generateEmbedding('test'))
          .rejects
          .toThrow('Error generating embedding: API rate limit exceeded');
      });

      it('should throw error when VoyageAI returns invalid response', async () => {
        mockEmbed.mockRejectedValueOnce(new Error('Invalid API key'));
        
        await expect(VectorSearchService.generateEmbedding('test'))
          .rejects
          .toThrow('Error generating embedding: Invalid API key');
      });

      it('should throw error when network fails', async () => {
        mockEmbed.mockRejectedValueOnce(new Error('Network error'));
        
        await expect(VectorSearchService.generateEmbedding('test'))
          .rejects
          .toThrow('Error generating embedding: Network error');
      });

      it('should throw error with proper message format', async () => {
        const v_errorMessage = 'Connection timeout';
        mockEmbed.mockRejectedValueOnce(new Error(v_errorMessage));
        
        await expect(VectorSearchService.generateEmbedding('test'))
          .rejects
          .toThrow(`Error generating embedding: ${v_errorMessage}`);
      });
    });
  });

  describe('vectorSearch', () => {
    const v_mockSearchResults = [
      {
        _id: '507f1f77bcf86cd799439011',
        title: 'Inception',
        plot: 'A thief who steals corporate secrets through dream-sharing technology',
        genres: ['Action', 'Sci-Fi'],
        year: 2010,
        rating: 8.8,
        score: 0.95
      },
      {
        _id: '507f1f77bcf86cd799439012',
        title: 'The Matrix',
        plot: 'A computer hacker learns about the true nature of reality',
        genres: ['Action', 'Sci-Fi'],
        year: 1999,
        rating: 8.7,
        score: 0.92
      }
    ];

    beforeEach(() => {
      EmbeddedMovie.aggregate.mockResolvedValue(v_mockSearchResults);
    });

    describe('successful vector search', () => {
      it('should perform vector search with default parameters', async () => {
        const v_queryText = 'movies about dreams';
        
        const v_results = await VectorSearchService.vectorSearch(v_queryText);
        
        expect(mockEmbed).toHaveBeenCalledWith({
          inputs: [v_queryText],
          model: 'voyage-3-large',
          inputType: 'query'
        });
        expect(EmbeddedMovie.aggregate).toHaveBeenCalled();
        expect(v_results).toEqual(v_mockSearchResults);
      });

      it('should perform vector search with custom limit', async () => {
        const v_queryText = 'action movies';
        const v_limit = 5;
        
        const v_results = await VectorSearchService.vectorSearch(v_queryText, v_limit);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        expect(v_aggregateCall[0].$search.knnBeta.k).toBe(v_limit);
        expect(v_results).toEqual(v_mockSearchResults);
      });

      it('should perform vector search with custom model', async () => {
        const v_queryText = 'comedy movies';
        const v_limit = 10;
        const v_model = 'voyage-2';
        
        await VectorSearchService.vectorSearch(v_queryText, v_limit, v_model);
        
        expect(mockEmbed).toHaveBeenCalledWith({
          inputs: [v_queryText],
          model: v_model,
          inputType: 'query'
        });
      });

      it('should build correct aggregation pipeline with $search stage', async () => {
        const v_queryText = 'sci-fi movies';
        const v_limit = 15;
        
        await VectorSearchService.vectorSearch(v_queryText, v_limit);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        
        expect(v_aggregateCall[0].$search).toBeDefined();
        expect(v_aggregateCall[0].$search.index).toBe('plot_embedding_voyage_3_large');
        expect(v_aggregateCall[0].$search.knnBeta.vector).toEqual(mockEmbedding);
        expect(v_aggregateCall[0].$search.knnBeta.path).toBe('plot_embedding_voyage_3_large');
        expect(v_aggregateCall[0].$search.knnBeta.k).toBe(v_limit);
      });

      it('should build correct aggregation pipeline with $project stage', async () => {
        const v_queryText = 'thriller movies';
        
        await VectorSearchService.vectorSearch(v_queryText);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        
        expect(v_aggregateCall[1].$project).toBeDefined();
        expect(v_aggregateCall[1].$project.title).toBe(1);
        expect(v_aggregateCall[1].$project.plot).toBe(1);
        expect(v_aggregateCall[1].$project.genres).toBe(1);
        expect(v_aggregateCall[1].$project.year).toBe(1);
        expect(v_aggregateCall[1].$project.rating).toEqual({ $ifNull: ['$imdb.rating', null] });
        expect(v_aggregateCall[1].$project.score).toEqual({ $meta: 'searchScore' });
      });

      it('should return empty array when no results found', async () => {
        EmbeddedMovie.aggregate.mockResolvedValueOnce([]);
        
        const v_results = await VectorSearchService.vectorSearch('nonexistent movie');
        
        expect(v_results).toEqual([]);
      });

      it('should handle single result', async () => {
        const v_singleResult = [v_mockSearchResults[0]];
        EmbeddedMovie.aggregate.mockResolvedValueOnce(v_singleResult);
        
        const v_results = await VectorSearchService.vectorSearch('inception');
        
        expect(v_results).toEqual(v_singleResult);
        expect(v_results.length).toBe(1);
      });

      it('should use default limit of 10 when not specified', async () => {
        await VectorSearchService.vectorSearch('test query');
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        expect(v_aggregateCall[0].$search.knnBeta.k).toBe(10);
      });
    });

    describe('error handling', () => {
      it('should throw error when embedding generation fails', async () => {
        mockEmbed.mockRejectedValueOnce(new Error('Embedding failed'));
        
        await expect(VectorSearchService.vectorSearch('test'))
          .rejects
          .toThrow('Vector search failed: Error generating embedding: Embedding failed');
      });

      it('should throw error when MongoDB aggregation fails', async () => {
        EmbeddedMovie.aggregate.mockRejectedValueOnce(new Error('Database connection lost'));
        
        await expect(VectorSearchService.vectorSearch('test'))
          .rejects
          .toThrow('Vector search failed: Database connection lost');
      });

      it('should throw error with proper message format', async () => {
        const v_dbError = 'Index not found';
        EmbeddedMovie.aggregate.mockRejectedValueOnce(new Error(v_dbError));
        
        await expect(VectorSearchService.vectorSearch('test'))
          .rejects
          .toThrow(`Vector search failed: ${v_dbError}`);
      });

      it('should throw error when aggregate returns undefined', async () => {
        EmbeddedMovie.aggregate.mockRejectedValueOnce(new Error('Aggregation error'));
        
        await expect(VectorSearchService.vectorSearch('test'))
          .rejects
          .toThrow('Vector search failed: Aggregation error');
      });
    });
  });

  describe('hybridSearch', () => {
    const v_mockHybridResults = [
      {
        _id: '507f1f77bcf86cd799439013',
        title: 'The Dark Knight',
        plot: 'Batman faces the Joker',
        genres: ['Action', 'Crime', 'Drama'],
        year: 2008,
        rating: 9.0,
        score: 0.98
      },
      {
        _id: '507f1f77bcf86cd799439014',
        title: 'Batman Begins',
        plot: 'Bruce Wayne becomes Batman',
        genres: ['Action', 'Adventure'],
        year: 2005,
        rating: 8.2,
        score: 0.89
      }
    ];

    beforeEach(() => {
      EmbeddedMovie.aggregate.mockResolvedValue(v_mockHybridResults);
    });

    describe('successful hybrid search', () => {
      it('should perform hybrid search with default parameters', async () => {
        const v_queryText = 'superhero movies';
        
        const v_results = await VectorSearchService.hybridSearch(v_queryText);
        
        expect(mockEmbed).toHaveBeenCalledWith({
          inputs: [v_queryText],
          model: 'voyage-3-large',
          inputType: 'query'
        });
        expect(EmbeddedMovie.aggregate).toHaveBeenCalled();
        expect(v_results).toEqual(v_mockHybridResults);
      });

      it('should perform hybrid search with empty filters', async () => {
        const v_queryText = 'action movies';
        const v_filters = {};
        
        const v_results = await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_hasMatchStage = v_aggregateCall.some(stage => stage.$match);
        expect(v_hasMatchStage).toBe(false);
        expect(v_results).toEqual(v_mockHybridResults);
      });

      it('should perform hybrid search with custom limit', async () => {
        const v_queryText = 'drama movies';
        const v_filters = {};
        const v_limit = 20;
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters, v_limit);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        expect(v_aggregateCall[0].$search.knnBeta.k).toBe(v_limit * 2);
        
        const v_limitStage = v_aggregateCall.find(stage => stage.$limit);
        expect(v_limitStage.$limit).toBe(v_limit);
      });

      it('should use default limit of 10 when not specified', async () => {
        await VectorSearchService.hybridSearch('test query');
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        expect(v_aggregateCall[0].$search.knnBeta.k).toBe(20);
        
        const v_limitStage = v_aggregateCall.find(stage => stage.$limit);
        expect(v_limitStage.$limit).toBe(10);
      });
    });

    describe('filter building', () => {
      it('should build title filter with regex and case-insensitive option', async () => {
        const v_queryText = 'batman movies';
        const v_filters = { title: 'Dark Knight' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeDefined();
        expect(v_matchStage.$match.title).toEqual({ $regex: 'Dark Knight', $options: 'i' });
      });

      it('should build genre filter with $in operator', async () => {
        const v_queryText = 'action movies';
        const v_filters = { genre: 'Action' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeDefined();
        expect(v_matchStage.$match.genres).toEqual({ $in: ['Action'] });
      });

      it('should build year filter with parsed integer', async () => {
        const v_queryText = 'movies from 2008';
        const v_filters = { year: '2008' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeDefined();
        expect(v_matchStage.$match.year).toBe(2008);
      });

      it('should build year filter with integer input', async () => {
        const v_queryText = 'movies from 2010';
        const v_filters = { year: 2010 };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeDefined();
        expect(v_matchStage.$match.year).toBe(2010);
      });

      it('should build combined filters with title and genre', async () => {
        const v_queryText = 'superhero action';
        const v_filters = { title: 'Batman', genre: 'Action' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeDefined();
        expect(v_matchStage.$match.title).toEqual({ $regex: 'Batman', $options: 'i' });
        expect(v_matchStage.$match.genres).toEqual({ $in: ['Action'] });
      });

      it('should build combined filters with title and year', async () => {
        const v_queryText = 'dark knight 2008';
        const v_filters = { title: 'Dark', year: '2008' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeDefined();
        expect(v_matchStage.$match.title).toEqual({ $regex: 'Dark', $options: 'i' });
        expect(v_matchStage.$match.year).toBe(2008);
      });

      it('should build combined filters with genre and year', async () => {
        const v_queryText = 'action 2008';
        const v_filters = { genre: 'Crime', year: '2008' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeDefined();
        expect(v_matchStage.$match.genres).toEqual({ $in: ['Crime'] });
        expect(v_matchStage.$match.year).toBe(2008);
      });

      it('should build combined filters with all three filters', async () => {
        const v_queryText = 'batman action 2008';
        const v_filters = { title: 'Knight', genre: 'Drama', year: '2008' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeDefined();
        expect(v_matchStage.$match.title).toEqual({ $regex: 'Knight', $options: 'i' });
        expect(v_matchStage.$match.genres).toEqual({ $in: ['Drama'] });
        expect(v_matchStage.$match.year).toBe(2008);
      });

      it('should not add $match stage when filters object is empty', async () => {
        const v_queryText = 'any movie';
        const v_filters = {};
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeUndefined();
      });

      it('should ignore undefined filter values', async () => {
        const v_queryText = 'test movie';
        const v_filters = { title: undefined, genre: 'Action', year: undefined };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_matchStage = v_aggregateCall.find(stage => stage.$match);
        
        expect(v_matchStage).toBeDefined();
        expect(v_matchStage.$match.genres).toEqual({ $in: ['Action'] });
        expect(v_matchStage.$match.title).toBeUndefined();
        expect(v_matchStage.$match.year).toBeUndefined();
      });
    });

    describe('aggregation pipeline structure', () => {
      it('should build correct pipeline with $search stage', async () => {
        const v_queryText = 'test query';
        const v_limit = 10;
        
        await VectorSearchService.hybridSearch(v_queryText, {}, v_limit);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        
        expect(v_aggregateCall[0].$search).toBeDefined();
        expect(v_aggregateCall[0].$search.index).toBe('plot_embedding_voyage_3_large');
        expect(v_aggregateCall[0].$search.knnBeta.vector).toEqual(mockEmbedding);
        expect(v_aggregateCall[0].$search.knnBeta.path).toBe('plot_embedding_voyage_3_large');
        expect(v_aggregateCall[0].$search.knnBeta.k).toBe(v_limit * 2);
      });

      it('should build correct pipeline with $project stage', async () => {
        const v_queryText = 'test query';
        
        await VectorSearchService.hybridSearch(v_queryText);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_projectStage = v_aggregateCall.find(stage => stage.$project);
        
        expect(v_projectStage).toBeDefined();
        expect(v_projectStage.$project.title).toBe(1);
        expect(v_projectStage.$project.plot).toBe(1);
        expect(v_projectStage.$project.genres).toBe(1);
        expect(v_projectStage.$project.year).toBe(1);
        expect(v_projectStage.$project.rating).toEqual({ $ifNull: ['$imdb.rating', null] });
        expect(v_projectStage.$project.score).toEqual({ $meta: 'searchScore' });
      });

      it('should build correct pipeline with $limit stage', async () => {
        const v_queryText = 'test query';
        const v_limit = 15;
        
        await VectorSearchService.hybridSearch(v_queryText, {}, v_limit);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_limitStage = v_aggregateCall.find(stage => stage.$limit);
        
        expect(v_limitStage).toBeDefined();
        expect(v_limitStage.$limit).toBe(v_limit);
      });

      it('should place $match stage after $search when filters exist', async () => {
        const v_queryText = 'test query';
        const v_filters = { genre: 'Action' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        
        expect(v_aggregateCall[0].$search).toBeDefined();
        expect(v_aggregateCall[1].$match).toBeDefined();
      });

      it('should place $limit stage at the end of pipeline', async () => {
        const v_queryText = 'test query';
        const v_filters = { genre: 'Action' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        const v_lastStage = v_aggregateCall[v_aggregateCall.length - 1];
        
        expect(v_lastStage.$limit).toBeDefined();
      });

      it('should have correct pipeline order: $search, $match (if filters), $project, $limit', async () => {
        const v_queryText = 'test query';
        const v_filters = { title: 'Test', genre: 'Action', year: '2020' };
        
        await VectorSearchService.hybridSearch(v_queryText, v_filters);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        
        expect(v_aggregateCall[0].$search).toBeDefined();
        expect(v_aggregateCall[1].$match).toBeDefined();
        expect(v_aggregateCall[2].$project).toBeDefined();
        expect(v_aggregateCall[3].$limit).toBeDefined();
      });

      it('should have correct pipeline order without filters: $search, $project, $limit', async () => {
        const v_queryText = 'test query';
        
        await VectorSearchService.hybridSearch(v_queryText);
        
        const v_aggregateCall = EmbeddedMovie.aggregate.mock.calls[0][0];
        
        expect(v_aggregateCall[0].$search).toBeDefined();
        expect(v_aggregateCall[1].$project).toBeDefined();
        expect(v_aggregateCall[2].$limit).toBeDefined();
      });
    });

    describe('error handling', () => {
      it('should throw error when embedding generation fails', async () => {
        mockEmbed.mockRejectedValueOnce(new Error('Embedding service unavailable'));
        
        await expect(VectorSearchService.hybridSearch('test'))
          .rejects
          .toThrow('Hybrid search failed: Error generating embedding: Embedding service unavailable');
      });

      it('should throw error when MongoDB aggregation fails', async () => {
        EmbeddedMovie.aggregate.mockRejectedValueOnce(new Error('Aggregation timeout'));
        
        await expect(VectorSearchService.hybridSearch('test'))
          .rejects
          .toThrow('Hybrid search failed: Aggregation timeout');
      });

      it('should throw error with proper message format', async () => {
        const v_dbError = 'Collection not found';
        EmbeddedMovie.aggregate.mockRejectedValueOnce(new Error(v_dbError));
        
        await expect(VectorSearchService.hybridSearch('test'))
          .rejects
          .toThrow(`Hybrid search failed: ${v_dbError}`);
      });

      it('should handle database connection errors', async () => {
        EmbeddedMovie.aggregate.mockRejectedValueOnce(new Error('MongoNetworkError: connection refused'));
        
        await expect(VectorSearchService.hybridSearch('test'))
          .rejects
          .toThrow('Hybrid search failed: MongoNetworkError: connection refused');
      });
    });

    describe('result handling', () => {
      it('should return empty array when no results found', async () => {
        EmbeddedMovie.aggregate.mockResolvedValueOnce([]);
        
        const v_results = await VectorSearchService.hybridSearch('nonexistent movie');
        
        expect(v_results).toEqual([]);
      });

      it('should return single result correctly', async () => {
        const v_singleResult = [v_mockHybridResults[0]];
        EmbeddedMovie.aggregate.mockResolvedValueOnce(v_singleResult);
        
        const v_results = await VectorSearchService.hybridSearch('dark knight');
        
        expect(v_results).toEqual(v_singleResult);
        expect(v_results.length).toBe(1);
      });

      it('should return multiple results correctly', async () => {
        const v_results = await VectorSearchService.hybridSearch('batman movies');
        
        expect(v_results).toEqual(v_mockHybridResults);
        expect(v_results.length).toBe(2);
      });

      it('should preserve result order from aggregation', async () => {
        const v_orderedResults = [
          { ...v_mockHybridResults[0], score: 0.99 },
          { ...v_mockHybridResults[1], score: 0.85 }
        ];
        EmbeddedMovie.aggregate.mockResolvedValueOnce(v_orderedResults);
        
        const v_results = await VectorSearchService.hybridSearch('test');
        
        expect(v_results[0].score).toBe(0.99);
        expect(v_results[1].score).toBe(0.85);
      });
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      EmbeddedMovie.aggregate.mockResolvedValue([]);
    });

    it('should use same embedding model for vectorSearch and hybridSearch', async () => {
      await VectorSearchService.vectorSearch('test query');
      await VectorSearchService.hybridSearch('test query');
      
      const v_calls = mockEmbed.mock.calls;
      expect(v_calls[0][0].model).toBe('voyage-3-large');
      expect(v_calls[1][0].model).toBe('voyage-3-large');
    });

    it('should use query inputType for both search methods', async () => {
      await VectorSearchService.vectorSearch('test query');
      await VectorSearchService.hybridSearch('test query');
      
      const v_calls = mockEmbed.mock.calls;
      expect(v_calls[0][0].inputType).toBe('query');
      expect(v_calls[1][0].inputType).toBe('query');
    });

    it('should use same index name for both search methods', async () => {
      await VectorSearchService.vectorSearch('test query');
      await VectorSearchService.hybridSearch('test query');
      
      const v_vectorSearchPipeline = EmbeddedMovie.aggregate.mock.calls[0][0];
      const v_hybridSearchPipeline = EmbeddedMovie.aggregate.mock.calls[1][0];
      
      expect(v_vectorSearchPipeline[0].$search.index).toBe('plot_embedding_voyage_3_large');
      expect(v_hybridSearchPipeline[0].$search.index).toBe('plot_embedding_voyage_3_large');
    });

    it('should handle multiple sequential searches', async () => {
      await VectorSearchService.vectorSearch('query 1');
      await VectorSearchService.vectorSearch('query 2');
      await VectorSearchService.hybridSearch('query 3');
      
      expect(mockEmbed).toHaveBeenCalledTimes(3);
      expect(EmbeddedMovie.aggregate).toHaveBeenCalledTimes(3);
    });
  });
});
