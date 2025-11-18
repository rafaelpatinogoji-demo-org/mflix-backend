# Voyage AI Vector Search Setup Guide

This guide explains how to set up and use Voyage AI vector search functionality in the Mflix Backend API.

## Overview

The Mflix Backend API includes vector search capabilities powered by Voyage AI embeddings and MongoDB Atlas Vector Search. This allows you to perform semantic search on movie plots, finding movies based on meaning rather than just keyword matching.

## Prerequisites

1. **Voyage AI API Key**: You need a Voyage AI API key to generate embeddings
2. **MongoDB Atlas Cluster**: Your cluster must support Atlas Vector Search (M10+ tier recommended)
3. **Sample Data**: The `sample_mflix` database with the `embedded_movies` collection

## Step 1: Get Your Voyage AI API Key

1. Sign up or log in to [Voyage AI Dashboard](https://dashboard.voyageai.com)
2. Navigate to **Organization** > **API Keys**
3. Click **Create new secret key**
4. Copy your API key (it should start with `pa-`)
5. Store it securely - you won't be able to see it again

## Step 2: Configure Environment Variables

Add your Voyage AI API key to the `.env` file:

```bash
# Copy the example file if you haven't already
cp .env.example .env

# Edit .env and add your API key
VOYAGE_API_KEY=pa-your-actual-api-key-here
```

**Important**: Never commit your `.env` file to version control. It's already in `.gitignore`.

## Step 3: Create MongoDB Atlas Vector Search Index

The vector search functionality requires an Atlas Search index on the `embedded_movies` collection.

### Option A: Create Index via Atlas UI

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to your cluster
3. Click on **Search** tab
4. Click **Create Search Index**
5. Select **JSON Editor**
6. Use the following index definition:

```json
{
  "name": "plot_embedding_voyage_3_large",
  "type": "vectorSearch",
  "fields": [
    {
      "type": "vector",
      "path": "plot_embedding_voyage_3_large",
      "numDimensions": 2048,
      "similarity": "cosine"
    }
  ]
}
```

7. Select the `sample_mflix` database and `embedded_movies` collection
8. Click **Create Search Index**
9. Wait for the index to build (this may take a few minutes)

### Option B: Create Index via MongoDB Shell

```javascript
db.embedded_movies.createSearchIndex(
  "plot_embedding_voyage_3_large",
  "vectorSearch",
  {
    fields: [
      {
        type: "vector",
        path: "plot_embedding_voyage_3_large",
        numDimensions: 2048,
        similarity: "cosine"
      }
    ]
  }
);
```

### Verify Index Creation

You can verify the index was created successfully:

```javascript
db.embedded_movies.listSearchIndexes();
```

The index status should show as "READY" once it's built.

## Step 4: Understanding the Data

The `embedded_movies` collection contains:
- **3,483 total documents** (movies in Western, Action, and Fantasy genres)
- **3,403 documents with embeddings** already generated
- **Embedding field**: `plot_embedding_voyage_3_large` (2048 dimensions)
- **Model used**: Voyage AI's `voyage-3-large` model

The embeddings are stored as BSON Binary data for efficient storage and retrieval.

## Step 5: Test Vector Search

### Start the Server

```bash
npm start
```

### Test Vector Search Endpoint

```bash
# Basic vector search
curl "http://localhost:3000/api/embedded-movies/vector-search?query=space%20adventure&limit=5"

# Vector search with more results
curl "http://localhost:3000/api/embedded-movies/vector-search?query=romantic%20comedy&limit=10"
```

### Test Hybrid Search Endpoint

Hybrid search combines vector similarity with traditional filters:

```bash
# Search with genre filter
curl "http://localhost:3000/api/embedded-movies/hybrid-search?query=epic%20battle&genre=Action&limit=5"

# Search with year filter
curl "http://localhost:3000/api/embedded-movies/hybrid-search?query=western%20showdown&year=1973&limit=5"
```

## API Endpoints

### Vector Search

**Endpoint**: `GET /api/embedded-movies/vector-search`

**Query Parameters**:
- `query` (required): The search query text
- `limit` (optional, default: 10): Number of results to return
- `model` (optional, default: 'voyage-3-large'): Voyage AI model to use

**Example Response**:
```json
{
  "query": "space adventure",
  "model": "voyage-3-large",
  "results": [
    {
      "_id": "573a1396f29313caabce582d",
      "title": "Star Wars",
      "plot": "Luke Skywalker joins forces with a Jedi Knight...",
      "genres": ["Action", "Adventure", "Fantasy"],
      "year": 1977,
      "rating": 8.6,
      "score": 0.89
    }
  ],
  "count": 5
}
```

### Hybrid Search

**Endpoint**: `GET /api/embedded-movies/hybrid-search`

**Query Parameters**:
- `query` (required): The search query text
- `limit` (optional, default: 10): Number of results to return
- `title` (optional): Filter by movie title (regex)
- `genre` (optional): Filter by genre
- `year` (optional): Filter by release year

## Technical Details

### Voyage AI Configuration

- **Model**: `voyage-3-large`
- **Output Dimensions**: 2048
- **Input Type**: `query` for search queries, `document` for indexing
- **Similarity Metric**: Cosine similarity

### How It Works

1. **Query Processing**: Your search query is sent to Voyage AI to generate a 2048-dimensional embedding
2. **Vector Search**: MongoDB Atlas performs k-nearest neighbor (kNN) search using the query embedding
3. **Scoring**: Results are ranked by cosine similarity score (0-1, higher is better)
4. **Response**: Top matching movies are returned with their similarity scores

### Performance Considerations

- **Rate Limits**: Voyage AI has rate limits on API calls. See [Voyage AI Rate Limits](https://docs.voyageai.com/docs/rate-limits)
- **Caching**: Consider caching common queries to reduce API calls
- **Batch Processing**: For bulk operations, use Voyage AI's batch embedding API

## Troubleshooting

### Error: "VOYAGE_API_KEY environment variable is not set"

**Solution**: Make sure you've added `VOYAGE_API_KEY` to your `.env` file and restarted the server.

### Error: "Vector search failed: index not found"

**Solution**: The Atlas Vector Search index hasn't been created yet. Follow Step 3 to create the index.

### Error: "Vector search failed: dimension mismatch"

**Solution**: The query embedding dimensions don't match the index. Ensure you're using `outputDimension: 2048` when generating embeddings.

### Empty Results

**Possible causes**:
1. The Atlas Search index is still building (check index status in Atlas UI)
2. Your query is too specific or doesn't match any movie plots
3. The index isn't configured correctly (verify the index definition)

### Slow Performance

**Possible causes**:
1. Voyage AI API latency (typically 200-500ms per request)
2. Large result sets (reduce the `limit` parameter)
3. Atlas cluster tier (upgrade to M10+ for better performance)

## Additional Resources

- [Voyage AI Documentation](https://docs.voyageai.com/)
- [MongoDB Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [Sample Mflix Dataset](https://www.mongodb.com/docs/atlas/sample-data/sample-mflix/)

## Security Best Practices

1. **Never commit API keys**: Keep your `.env` file out of version control
2. **Use environment variables**: Always use `process.env.VOYAGE_API_KEY` in code
3. **Rotate keys regularly**: Generate new API keys periodically
4. **Monitor usage**: Check your Voyage AI dashboard for unusual activity
5. **Rate limiting**: Implement rate limiting on your API endpoints to prevent abuse

## Cost Considerations

Voyage AI charges based on the number of tokens processed. The `voyage-3-large` model with 2048 dimensions is more expensive than smaller models. Consider:

- Using smaller dimensions (1024 or 512) for cost savings if accuracy permits
- Caching embeddings for frequently searched queries
- Implementing request throttling to control costs

For current pricing, see [Voyage AI Pricing](https://docs.voyageai.com/docs/pricing).
