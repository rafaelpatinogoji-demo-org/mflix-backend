const mongoose = require('mongoose');
const Movie = require('../../../src/models/Movie');

describe('Movie Model', () => {
  describe('Schema Definition', () => {
    it('should have the correct collection name', () => {
      expect(Movie.collection.collectionName).toBe('movies');
    });

    it('should have all expected fields defined in schema', () => {
      const v_schemaPaths = Object.keys(Movie.schema.paths);
      expect(v_schemaPaths).toContain('plot');
      expect(v_schemaPaths).toContain('genres');
      expect(v_schemaPaths).toContain('runtime');
      expect(v_schemaPaths).toContain('title');
      expect(v_schemaPaths).toContain('year');
      expect(v_schemaPaths).toContain('imdb');
      expect(v_schemaPaths).toContain('_id');
    });
  });

  describe('Required Field Validation', () => {
    it('should require title field', async () => {
      const v_movie = new Movie({
        plot: 'A test plot',
        year: 2024
      });

      let v_error;
      try {
        await v_movie.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.title).toBeDefined();
      expect(v_error.errors.title.kind).toBe('required');
    });

    it('should pass validation with only title provided', async () => {
      const v_movie = new Movie({
        title: 'Test Movie'
      });

      let v_error;
      try {
        await v_movie.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should not require plot field', async () => {
      const v_movie = new Movie({
        title: 'Test Movie'
      });

      let v_error;
      try {
        await v_movie.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should not require runtime field', async () => {
      const v_movie = new Movie({
        title: 'Test Movie'
      });

      let v_error;
      try {
        await v_movie.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should not require year field', async () => {
      const v_movie = new Movie({
        title: 'Test Movie'
      });

      let v_error;
      try {
        await v_movie.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });
  });

  describe('Type Validation', () => {
    it('should accept string for title', async () => {
      const v_movie = new Movie({
        title: 'Test Movie'
      });

      expect(v_movie.title).toBe('Test Movie');
    });

    it('should accept string for plot', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        plot: 'A test plot description'
      });

      expect(v_movie.plot).toBe('A test plot description');
    });

    it('should accept number for runtime', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        runtime: 120
      });

      expect(v_movie.runtime).toBe(120);
    });

    it('should accept number for year', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        year: 2024
      });

      expect(v_movie.year).toBe(2024);
    });

    it('should cast string number to number for runtime', () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        runtime: '120'
      });

      expect(v_movie.runtime).toBe(120);
      expect(typeof v_movie.runtime).toBe('number');
    });

    it('should cast string number to number for year', () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        year: '2024'
      });

      expect(v_movie.year).toBe(2024);
      expect(typeof v_movie.year).toBe('number');
    });
  });

  describe('Array Validation - Genres', () => {
    it('should accept an array of strings for genres', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        genres: ['Action', 'Drama', 'Comedy']
      });

      expect(v_movie.genres).toHaveLength(3);
      expect(v_movie.genres).toContain('Action');
      expect(v_movie.genres).toContain('Drama');
      expect(v_movie.genres).toContain('Comedy');
    });

    it('should accept an empty array for genres', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        genres: []
      });

      expect(v_movie.genres).toHaveLength(0);
    });

    it('should accept a single genre', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        genres: ['Action']
      });

      expect(v_movie.genres).toHaveLength(1);
      expect(v_movie.genres[0]).toBe('Action');
    });

    it('should default genres to empty array when not provided', () => {
      const v_movie = new Movie({
        title: 'Test Movie'
      });

      expect(Array.isArray(v_movie.genres)).toBe(true);
      expect(v_movie.genres).toHaveLength(0);
    });
  });

  describe('Nested Object Validation - IMDB', () => {
    it('should accept imdb object with all fields', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        imdb: {
          rating: 8.5,
          votes: 100000,
          id: 12345
        }
      });

      expect(v_movie.imdb.rating).toBe(8.5);
      expect(v_movie.imdb.votes).toBe(100000);
      expect(v_movie.imdb.id).toBe(12345);
    });

    it('should accept imdb object with only rating', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        imdb: {
          rating: 7.5
        }
      });

      expect(v_movie.imdb.rating).toBe(7.5);
      expect(v_movie.imdb.votes).toBeUndefined();
      expect(v_movie.imdb.id).toBeUndefined();
    });

    it('should accept imdb object with only votes', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        imdb: {
          votes: 50000
        }
      });

      expect(v_movie.imdb.votes).toBe(50000);
      expect(v_movie.imdb.rating).toBeUndefined();
    });

    it('should accept imdb object with only id', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        imdb: {
          id: 99999
        }
      });

      expect(v_movie.imdb.id).toBe(99999);
    });

    it('should not create _id for imdb subdocument', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        imdb: {
          rating: 8.0,
          votes: 10000,
          id: 12345
        }
      });

      expect(v_movie.imdb._id).toBeUndefined();
    });

    it('should accept empty imdb object', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        imdb: {}
      });

      expect(v_movie.imdb).toBeDefined();
    });

    it('should cast string numbers in imdb to numbers', () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        imdb: {
          rating: '8.5',
          votes: '100000',
          id: '12345'
        }
      });

      expect(v_movie.imdb.rating).toBe(8.5);
      expect(v_movie.imdb.votes).toBe(100000);
      expect(v_movie.imdb.id).toBe(12345);
    });
  });

  describe('Complete Document Validation', () => {
    it('should create a valid movie with all fields', async () => {
      const v_movieData = {
        title: 'The Test Movie',
        plot: 'An exciting test movie plot',
        genres: ['Action', 'Thriller'],
        runtime: 150,
        year: 2024,
        imdb: {
          rating: 9.0,
          votes: 500000,
          id: 54321
        }
      };

      const v_movie = new Movie(v_movieData);

      let v_error;
      try {
        await v_movie.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_movie.title).toBe(v_movieData.title);
      expect(v_movie.plot).toBe(v_movieData.plot);
      expect(v_movie.genres).toEqual(v_movieData.genres);
      expect(v_movie.runtime).toBe(v_movieData.runtime);
      expect(v_movie.year).toBe(v_movieData.year);
      expect(v_movie.imdb.rating).toBe(v_movieData.imdb.rating);
      expect(v_movie.imdb.votes).toBe(v_movieData.imdb.votes);
      expect(v_movie.imdb.id).toBe(v_movieData.imdb.id);
    });

    it('should create a valid movie with minimal fields', async () => {
      const v_movie = new Movie({
        title: 'Minimal Movie'
      });

      let v_error;
      try {
        await v_movie.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_movie.title).toBe('Minimal Movie');
    });

    it('should generate an ObjectId for _id', () => {
      const v_movie = new Movie({
        title: 'Test Movie'
      });

      expect(v_movie._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(v_movie._id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', async () => {
      const v_longTitle = 'A'.repeat(1000);
      const v_movie = new Movie({
        title: v_longTitle
      });

      expect(v_movie.title).toBe(v_longTitle);
      expect(v_movie.title.length).toBe(1000);
    });

    it('should handle very long plot', async () => {
      const v_longPlot = 'B'.repeat(5000);
      const v_movie = new Movie({
        title: 'Test Movie',
        plot: v_longPlot
      });

      expect(v_movie.plot).toBe(v_longPlot);
      expect(v_movie.plot.length).toBe(5000);
    });

    it('should handle zero runtime', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        runtime: 0
      });

      expect(v_movie.runtime).toBe(0);
    });

    it('should handle negative year', async () => {
      const v_movie = new Movie({
        title: 'Ancient Movie',
        year: -500
      });

      expect(v_movie.year).toBe(-500);
    });

    it('should handle decimal rating in imdb', async () => {
      const v_movie = new Movie({
        title: 'Test Movie',
        imdb: {
          rating: 7.89
        }
      });

      expect(v_movie.imdb.rating).toBe(7.89);
    });

    it('should handle large number of genres', async () => {
      const v_genres = Array.from({ length: 50 }, (_, i) => `Genre${i}`);
      const v_movie = new Movie({
        title: 'Test Movie',
        genres: v_genres
      });

      expect(v_movie.genres).toHaveLength(50);
    });

    it('should handle special characters in title', async () => {
      const v_movie = new Movie({
        title: 'Test: Movie! @#$%^&*()_+-=[]{}|;\':",.<>?/~`'
      });

      expect(v_movie.title).toBe('Test: Movie! @#$%^&*()_+-=[]{}|;\':",.<>?/~`');
    });

    it('should handle unicode characters in title', async () => {
      const v_movie = new Movie({
        title: '测试电影 テスト映画 Тестовый фильм'
      });

      expect(v_movie.title).toBe('测试电影 テスト映画 Тестовый фильм');
    });

    it('should handle empty string title validation error', async () => {
      const v_movie = new Movie({
        title: ''
      });

      let v_error;
      try {
        await v_movie.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.title).toBeDefined();
    });
  });

  describe('Model Methods', () => {
    it('should have toJSON method', () => {
      const v_movie = new Movie({
        title: 'Test Movie'
      });

      const v_json = v_movie.toJSON();
      expect(v_json).toBeDefined();
      expect(v_json.title).toBe('Test Movie');
    });

    it('should have toObject method', () => {
      const v_movie = new Movie({
        title: 'Test Movie'
      });

      const v_obj = v_movie.toObject();
      expect(v_obj).toBeDefined();
      expect(v_obj.title).toBe('Test Movie');
    });
  });
});
