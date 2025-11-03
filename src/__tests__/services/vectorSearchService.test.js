process.env.VOYAGE_API_KEY = 'test-api-key';

const vectorSearchService = require('../../services/vectorSearchService');
const axios = require('axios');

jest.mock('axios');

describe('VectorSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should successfully generate embedding from text', async () => {
      const v_mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
      const v_mockResponse = {
        data: {
          data: [{ embedding: v_mockEmbedding }]
        }
      };
      axios.post.mockResolvedValue(v_mockResponse);

      const v_text = 'A thrilling adventure story about exploration';
      const v_result = await vectorSearchService.generateEmbedding(v_text);

      expect(axios.post).toHaveBeenCalledWith(
        'https://api.voyageai.com/v1/embeddings',
        {
          input: v_text,
          model: 'voyage-3-large'
        },
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        }
      );
      expect(v_result).toEqual(v_mockEmbedding);
    });

    it('should throw error for empty text', async () => {
      await expect(
        vectorSearchService.generateEmbedding('')
      ).rejects.toThrow('Text must be a non-empty string');
    });

    it('should throw error for non-string input', async () => {
      await expect(
        vectorSearchService.generateEmbedding(123)
      ).rejects.toThrow('Text must be a non-empty string');

      await expect(
        vectorSearchService.generateEmbedding(null)
      ).rejects.toThrow('Text must be a non-empty string');

      await expect(
        vectorSearchService.generateEmbedding(undefined)
      ).rejects.toThrow('Text must be a non-empty string');
    });

    it('should handle API failures gracefully', async () => {
      axios.post.mockRejectedValue(new Error('API request failed'));

      await expect(
        vectorSearchService.generateEmbedding('test text')
      ).rejects.toThrow('Failed to generate embedding: API request failed');
    });

    it('should handle network errors', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      await expect(
        vectorSearchService.generateEmbedding('test text')
      ).rejects.toThrow('Failed to generate embedding: Network error');
    });

    it('should handle authentication errors', async () => {
      axios.post.mockRejectedValue(new Error('401 Unauthorized'));

      await expect(
        vectorSearchService.generateEmbedding('test text')
      ).rejects.toThrow('Failed to generate embedding: 401 Unauthorized');
    });
  });

  describe('vectorSearch', () => {
    let v_mockCollection;

    beforeEach(() => {
      v_mockCollection = {
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn()
        })
      };
    });

    it('should perform kNN vector search successfully', async () => {
      const v_embedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const v_mockResults = [
        { _id: '1', title: 'Movie 1', score: 0.95 },
        { _id: '2', title: 'Movie 2', score: 0.87 }
      ];
      
      v_mockCollection.aggregate().toArray.mockResolvedValue(v_mockResults);

      const v_results = await vectorSearchService.vectorSearch(v_embedding, v_mockCollection, 10);

      expect(v_mockCollection.aggregate).toHaveBeenCalledWith([
        {
          $vectorSearch: {
            index: 'plot_embedding_index',
            path: 'plot_embedding_voyage_3_large',
            queryVector: v_embedding,
            numCandidates: 100,
            limit: 10
          }
        }
      ]);
      expect(v_results).toEqual(v_mockResults);
    });

    it('should respect limit parameter', async () => {
      const v_embedding = [0.1, 0.2, 0.3];
      const v_limit = 5;
      const v_mockResults = [
        { _id: '1', title: 'Movie 1' }
      ];
      
      v_mockCollection.aggregate().toArray.mockResolvedValue(v_mockResults);

      await vectorSearchService.vectorSearch(v_embedding, v_mockCollection, v_limit);

      expect(v_mockCollection.aggregate).toHaveBeenCalledWith([
        {
          $vectorSearch: {
            index: 'plot_embedding_index',
            path: 'plot_embedding_voyage_3_large',
            queryVector: v_embedding,
            numCandidates: 50,
            limit: 5
          }
        }
      ]);
    });

    it('should use default limit when not specified', async () => {
      const v_embedding = [0.1, 0.2, 0.3];
      const v_mockResults = [];
      
      v_mockCollection.aggregate().toArray.mockResolvedValue(v_mockResults);

      await vectorSearchService.vectorSearch(v_embedding, v_mockCollection);

      expect(v_mockCollection.aggregate).toHaveBeenCalledWith([
        {
          $vectorSearch: {
            index: 'plot_embedding_index',
            path: 'plot_embedding_voyage_3_large',
            queryVector: v_embedding,
            numCandidates: 100,
            limit: 10
          }
        }
      ]);
    });

    it('should throw error for invalid embedding', async () => {
      await expect(
        vectorSearchService.vectorSearch('not-an-array', v_mockCollection)
      ).rejects.toThrow('Embedding must be an array');

      await expect(
        vectorSearchService.vectorSearch(null, v_mockCollection)
      ).rejects.toThrow('Embedding must be an array');

      await expect(
        vectorSearchService.vectorSearch(123, v_mockCollection)
      ).rejects.toThrow('Embedding must be an array');
    });

    it('should handle database errors', async () => {
      const v_embedding = [0.1, 0.2, 0.3];
      v_mockCollection.aggregate().toArray.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        vectorSearchService.vectorSearch(v_embedding, v_mockCollection)
      ).rejects.toThrow('Vector search failed: Database connection failed');
    });

    it('should return empty array when no results found', async () => {
      const v_embedding = [0.1, 0.2, 0.3];
      v_mockCollection.aggregate().toArray.mockResolvedValue([]);

      const v_results = await vectorSearchService.vectorSearch(v_embedding, v_mockCollection);

      expect(v_results).toEqual([]);
    });
  });

  describe('hybridSearch', () => {
    let v_mockCollection;

    beforeEach(() => {
      v_mockCollection = {
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn()
        })
      };
    });

    it('should perform hybrid search with vector and filters', async () => {
      const v_embedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const v_filters = { year: { $gte: 2020 }, genres: { $in: ['Action'] } };
      const v_mockResults = [
        { _id: '1', title: 'Action Movie', year: 2021 }
      ];
      
      v_mockCollection.aggregate().toArray.mockResolvedValue(v_mockResults);

      const v_results = await vectorSearchService.hybridSearch(
        v_embedding, 
        v_mockCollection, 
        v_filters, 
        10
      );

      expect(v_mockCollection.aggregate).toHaveBeenCalledWith([
        {
          $vectorSearch: {
            index: 'plot_embedding_index',
            path: 'plot_embedding_voyage_3_large',
            queryVector: v_embedding,
            numCandidates: 100,
            limit: 20,
            filter: v_filters
          }
        },
        { $match: v_filters },
        { $limit: 10 }
      ]);
      expect(v_results).toEqual(v_mockResults);
    });

    it('should handle empty filters', async () => {
      const v_embedding = [0.1, 0.2, 0.3];
      const v_emptyFilters = {};
      const v_mockResults = [
        { _id: '1', title: 'Movie 1' }
      ];
      
      v_mockCollection.aggregate().toArray.mockResolvedValue(v_mockResults);

      const v_results = await vectorSearchService.hybridSearch(
        v_embedding, 
        v_mockCollection, 
        v_emptyFilters, 
        5
      );

      expect(v_mockCollection.aggregate).toHaveBeenCalledWith([
        {
          $vectorSearch: {
            index: 'plot_embedding_index',
            path: 'plot_embedding_voyage_3_large',
            queryVector: v_embedding,
            numCandidates: 50,
            limit: 10,
            filter: {}
          }
        },
        { $limit: 5 }
      ]);
      expect(v_results).toEqual(v_mockResults);
    });

    it('should use default limit and empty filters when not specified', async () => {
      const v_embedding = [0.1, 0.2, 0.3];
      const v_mockResults = [];
      
      v_mockCollection.aggregate().toArray.mockResolvedValue(v_mockResults);

      await vectorSearchService.hybridSearch(v_embedding, v_mockCollection);

      expect(v_mockCollection.aggregate).toHaveBeenCalledWith([
        {
          $vectorSearch: {
            index: 'plot_embedding_index',
            path: 'plot_embedding_voyage_3_large',
            queryVector: v_embedding,
            numCandidates: 100,
            limit: 20,
            filter: {}
          }
        },
        { $limit: 10 }
      ]);
    });

    it('should throw error for invalid embedding', async () => {
      await expect(
        vectorSearchService.hybridSearch('not-an-array', v_mockCollection)
      ).rejects.toThrow('Embedding must be an array');

      await expect(
        vectorSearchService.hybridSearch(null, v_mockCollection)
      ).rejects.toThrow('Embedding must be an array');
    });

    it('should handle complex filters', async () => {
      const v_embedding = [0.1, 0.2, 0.3];
      const v_complexFilters = {
        year: { $gte: 2015, $lte: 2023 },
        genres: { $in: ['Action', 'Thriller'] },
        'imdb.rating': { $gte: 7.0 }
      };
      const v_mockResults = [
        { _id: '1', title: 'Thriller Movie', year: 2020, imdb: { rating: 8.5 } }
      ];
      
      v_mockCollection.aggregate().toArray.mockResolvedValue(v_mockResults);

      const v_results = await vectorSearchService.hybridSearch(
        v_embedding, 
        v_mockCollection, 
        v_complexFilters, 
        15
      );

      expect(v_mockCollection.aggregate).toHaveBeenCalledWith([
        {
          $vectorSearch: {
            index: 'plot_embedding_index',
            path: 'plot_embedding_voyage_3_large',
            queryVector: v_embedding,
            numCandidates: 150,
            limit: 30,
            filter: v_complexFilters
          }
        },
        { $match: v_complexFilters },
        { $limit: 15 }
      ]);
      expect(v_results).toEqual(v_mockResults);
    });

    it('should handle database errors', async () => {
      const v_embedding = [0.1, 0.2, 0.3];
      v_mockCollection.aggregate().toArray.mockRejectedValue(new Error('Aggregation failed'));

      await expect(
        vectorSearchService.hybridSearch(v_embedding, v_mockCollection)
      ).rejects.toThrow('Hybrid search failed: Aggregation failed');
    });

    it('should return empty array when no matches found', async () => {
      const v_embedding = [0.1, 0.2, 0.3];
      const v_filters = { year: 1900 };
      v_mockCollection.aggregate().toArray.mockResolvedValue([]);

      const v_results = await vectorSearchService.hybridSearch(
        v_embedding, 
        v_mockCollection, 
        v_filters
      );

      expect(v_results).toEqual([]);
    });
  });
});
