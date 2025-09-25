const mongoose = require('mongoose');

const validMovie = {
  title: 'Test Movie',
  year: 2023,
  plot: 'A test movie plot',
  genres: ['Drama', 'Action'],
  runtime: 120,
  imdb: {
    rating: 8.5,
    votes: 1000,
    id: 12345
  }
};

const validMoviesList = [
  {
    title: 'Movie One',
    year: 2021,
    plot: 'First test movie plot',
    genres: ['Drama', 'Romance'],
    runtime: 110,
    imdb: {
      rating: 7.5,
      votes: 800,
      id: 12346
    }
  },
  {
    title: 'Movie Two',
    year: 2022,
    plot: 'Second test movie plot',
    genres: ['Action', 'Thriller'],
    runtime: 130,
    imdb: {
      rating: 8.0,
      votes: 1200,
      id: 12347
    }
  },
  {
    title: 'Movie Three',
    year: 2023,
    plot: 'Third test movie plot',
    genres: ['Comedy', 'Family'],
    runtime: 95,
    imdb: {
      rating: 6.8,
      votes: 600,
      id: 12348
    }
  }
];

const invalidMovie = {
  year: 2023,
  plot: 'Invalid movie without title',
  genres: ['Drama']
};

module.exports = {
  validMovie,
  validMoviesList,
  invalidMovie
};
