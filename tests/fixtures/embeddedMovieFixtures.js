const mongoose = require('mongoose');

const validEmbeddedMovie = {
  title: 'Test Embedded Movie',
  year: 2023,
  plot: 'A test embedded movie plot',
  genres: ['Drama', 'Action'],
  runtime: 120,
  cast: ['Actor One', 'Actor Two'],
  directors: ['Director One'],
  writers: ['Writer One'],
  languages: ['English'],
  countries: ['USA'],
  imdb: {
    rating: 8.5,
    votes: 1000,
    id: 12345
  },
  tomatoes: {
    viewer: {
      rating: 4.5,
      numReviews: 500,
      meter: 90
    }
  },
  plot_embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
};

const validEmbeddedMoviesList = [
  {
    title: 'Embedded Movie One',
    year: 2021,
    plot: 'First test embedded movie plot',
    genres: ['Drama', 'Romance'],
    runtime: 110,
    cast: ['Actor A', 'Actor B'],
    directors: ['Director A'],
    writers: ['Writer A'],
    languages: ['English'],
    countries: ['USA'],
    imdb: {
      rating: 7.5,
      votes: 800,
      id: 12346
    },
    plot_embedding: [0.2, 0.3, 0.4, 0.5, 0.6]
  },
  {
    title: 'Embedded Movie Two',
    year: 2022,
    plot: 'Second test embedded movie plot',
    genres: ['Action', 'Thriller'],
    runtime: 130,
    cast: ['Actor C', 'Actor D'],
    directors: ['Director B'],
    writers: ['Writer B'],
    languages: ['English', 'Spanish'],
    countries: ['USA', 'Mexico'],
    imdb: {
      rating: 8.0,
      votes: 1200,
      id: 12347
    },
    plot_embedding: [0.3, 0.4, 0.5, 0.6, 0.7]
  },
  {
    title: 'Embedded Movie Three',
    year: 2023,
    plot: 'Third test embedded movie plot',
    genres: ['Comedy', 'Family'],
    runtime: 95,
    cast: ['Actor E', 'Actor F'],
    directors: ['Director C'],
    writers: ['Writer C'],
    languages: ['French'],
    countries: ['France'],
    imdb: {
      rating: 6.8,
      votes: 600,
      id: 12348
    },
    plot_embedding: [0.4, 0.5, 0.6, 0.7, 0.8]
  }
];

const invalidEmbeddedMovie = {
  year: 2023,
  plot: 'Invalid embedded movie without title',
  genres: ['Drama']
};

module.exports = {
  validEmbeddedMovie,
  validEmbeddedMoviesList,
  invalidEmbeddedMovie
};
