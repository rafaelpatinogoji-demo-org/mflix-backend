const voyage = require('voyageai');
const EmbeddedMovie = require('../models/EmbeddedMovie');

class VectorSearchService {
  constructor() {
    this.voyageClient = new voyage.VoyageAI({
      apiKey: process.env.VOYAGE_API_KEY
    });
  }

  async generateEmbedding(text, model = 'voyage-3-large', inputType = 'query') {
    try {
      const embedding = await this.voyageClient.embed({
        inputs: [text],
        model: model,
        inputType: inputType
      });
      
      return embedding.data[0].embedding;
    } catch (error) {
      throw new Error(`Error generating embedding: ${error.message}`);
    }
  }

  async vectorSearch(queryText, limit = 10, model = 'voyage-3-large') {
    try {
      const queryEmbedding = await this.generateEmbedding(queryText, model, 'query');
      
      const results = await EmbeddedMovie.aggregate([
        {
          $search: {
            index: 'plot_embedding_voyage_3_large',
            knnBeta: {
              vector: queryEmbedding,
              path: 'plot_embedding_voyage_3_large',
              k: limit
            }
          }
        },
        {
          $project: {
            title: 1,
            plot: 1,
            genres: 1,
            year: 1,
            rating: { $ifNull: ['$imdb.rating', null] },
            score: { $meta: 'searchScore' }
          }
        }
      ]);

      return results;
    } catch (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }

  async hybridSearch(queryText, filters = {}, limit = 10) {
    try {
      const queryEmbedding = await this.generateEmbedding(queryText, 'voyage-3-large', 'query');
      
      const matchStage = {};
      
      if (filters.title) {
        matchStage.title = { $regex: filters.title, $options: 'i' };
      }
      if (filters.genre) {
        matchStage.genres = { $in: [filters.genre] };
      }
      if (filters.year) {
        matchStage.year = parseInt(filters.year);
      }

      const pipeline = [
        {
          $search: {
            index: 'plot_embedding_voyage_3_large',
            knnBeta: {
              vector: queryEmbedding,
              path: 'plot_embedding_voyage_3_large',
              k: limit * 2
            }
          }
        }
      ];

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      pipeline.push({
        $project: {
          title: 1,
          plot: 1,
          genres: 1,
          year: 1,
          rating: { $ifNull: ['$imdb.rating', null] },
          score: { $meta: 'searchScore' }
        }
      });

      pipeline.push({ $limit: limit });

      const results = await EmbeddedMovie.aggregate(pipeline);
      return results;
    } catch (error) {
      throw new Error(`Hybrid search failed: ${error.message}`);
    }
  }
}

module.exports = new VectorSearchService();
