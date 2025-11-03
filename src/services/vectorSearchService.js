const axios = require('axios');

class VectorSearchService {
  constructor() {
    this.voyageApiKey = process.env.VOYAGE_API_KEY;
    this.voyageApiUrl = 'https://api.voyageai.com/v1/embeddings';
  }

  async generateEmbedding(p_text) {
    if (!p_text || typeof p_text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    try {
      const v_response = await axios.post(
        this.voyageApiUrl,
        {
          input: p_text,
          model: 'voyage-3-large'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.voyageApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return v_response.data.data[0].embedding;
    } catch (p_error) {
      throw new Error(`Failed to generate embedding: ${p_error.message}`);
    }
  }

  async vectorSearch(p_embedding, p_collection, p_limit = 10) {
    if (!Array.isArray(p_embedding)) {
      throw new Error('Embedding must be an array');
    }

    try {
      const v_results = await p_collection.aggregate([
        {
          $vectorSearch: {
            index: 'plot_embedding_index',
            path: 'plot_embedding_voyage_3_large',
            queryVector: p_embedding,
            numCandidates: p_limit * 10,
            limit: p_limit
          }
        }
      ]).toArray();

      return v_results;
    } catch (p_error) {
      throw new Error(`Vector search failed: ${p_error.message}`);
    }
  }

  async hybridSearch(p_embedding, p_collection, p_filters = {}, p_limit = 10) {
    if (!Array.isArray(p_embedding)) {
      throw new Error('Embedding must be an array');
    }

    try {
      const v_pipeline = [
        {
          $vectorSearch: {
            index: 'plot_embedding_index',
            path: 'plot_embedding_voyage_3_large',
            queryVector: p_embedding,
            numCandidates: p_limit * 10,
            limit: p_limit * 2,
            filter: p_filters
          }
        }
      ];

      if (Object.keys(p_filters).length > 0) {
        v_pipeline.push({ $match: p_filters });
      }

      v_pipeline.push({ $limit: p_limit });

      const v_results = await p_collection.aggregate(v_pipeline).toArray();
      return v_results;
    } catch (p_error) {
      throw new Error(`Hybrid search failed: ${p_error.message}`);
    }
  }
}

module.exports = new VectorSearchService();
