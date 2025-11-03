const EmbeddedMovie = require('../models/EmbeddedMovie');
const vectorSearchService = require('../services/vectorSearchService');

// Obtiene todas las películas embebidas con paginación
const f_getAllEmbeddedMovies = async (p_req, p_res) => {
  try {
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_skip = (v_page - 1) * v_limit;

    const v_embeddedMovies = await EmbeddedMovie.find()
      .skip(v_skip)
      .limit(v_limit);

    const v_total = await EmbeddedMovie.countDocuments();

    p_res.json({
      embeddedMovies: v_embeddedMovies,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalEmbeddedMovies: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Obtiene una película embebida específica por su ID
const f_getEmbeddedMovieById = async (p_req, p_res) => {
  try {
    const v_embeddedMovie = await EmbeddedMovie.findById(p_req.params.id);
    if (!v_embeddedMovie) {
      return p_res.status(404).json({ message: 'Embedded movie not found' });
    }
    p_res.json(v_embeddedMovie);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Crea una nueva película embebida
const f_createEmbeddedMovie = async (p_req, p_res) => {
  try {
    const v_embeddedMovie = new EmbeddedMovie(p_req.body);
    const v_savedEmbeddedMovie = await v_embeddedMovie.save();
    p_res.status(201).json(v_savedEmbeddedMovie);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Actualiza una película embebida existente por su ID
const f_updateEmbeddedMovie = async (p_req, p_res) => {
  try {
    const v_embeddedMovie = await EmbeddedMovie.findByIdAndUpdate(
      p_req.params.id,
      p_req.body,
      { new: true, runValidators: true }
    );
    if (!v_embeddedMovie) {
      return p_res.status(404).json({ message: 'Embedded movie not found' });
    }
    p_res.json(v_embeddedMovie);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Elimina una película embebida por su ID
const f_deleteEmbeddedMovie = async (p_req, p_res) => {
  try {
    const v_embeddedMovie = await EmbeddedMovie.findByIdAndDelete(p_req.params.id);
    if (!v_embeddedMovie) {
      return p_res.status(404).json({ message: 'Embedded movie not found' });
    }
    p_res.json({ message: 'Embedded movie deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Busca películas embebidas por título, género o año
const f_searchEmbeddedMovies = async (p_req, p_res) => {
  try {
    const { title, genre, year } = p_req.query;
    const v_filter = {};

    if (title) {
      v_filter.title = { $regex: title, $options: 'i' };
    }
    if (genre) {
      v_filter.genres = { $in: [genre] };
    }
    if (year) {
      v_filter.year = parseInt(year);
    }

    const v_embeddedMovies = await EmbeddedMovie.find(v_filter);
    p_res.json(v_embeddedMovies);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Vector search usando Voyage AI
const f_vectorSearch = async (p_req, p_res) => {
  try {
    const { query, limit = 10, model = 'voyage-3-large' } = p_req.query;
    
    if (!query) {
      return p_res.status(400).json({ message: 'Query parameter is required' });
    }

    const v_results = await vectorSearchService.vectorSearch(query, parseInt(limit), model);
    p_res.json({
      query: query,
      model: model,
      results: v_results,
      count: v_results.length
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Hybrid search (vector + filtros tradicionales)
const f_hybridSearch = async (p_req, p_res) => {
  try {
    const { query, limit = 10, title, genre, year } = p_req.query;
    
    if (!query) {
      return p_res.status(400).json({ message: 'Query parameter is required' });
    }

    const v_filters = {};
    if (title) v_filters.title = title;
    if (genre) v_filters.genre = genre;
    if (year) v_filters.year = year;

    const v_results = await vectorSearchService.hybridSearch(query, v_filters, parseInt(limit));
    p_res.json({
      query: query,
      filters: v_filters,
      results: v_results,
      count: v_results.length
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

module.exports = {
  f_getAllEmbeddedMovies,
  f_getEmbeddedMovieById,
  f_createEmbeddedMovie,
  f_updateEmbeddedMovie,
  f_deleteEmbeddedMovie,
  f_searchEmbeddedMovies,
  f_vectorSearch,
  f_hybridSearch
};
