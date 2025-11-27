const mongoose = require('mongoose');
const EmbeddedMovie = require('../../../src/models/EmbeddedMovie');

describe('EmbeddedMovie Model', () => {
  describe('Schema Definition', () => {
    it('should have the correct collection name', () => {
      expect(EmbeddedMovie.collection.collectionName).toBe('embedded_movies');
    });

    it('should have all expected fields defined in schema', () => {
      const v_schemaPaths = Object.keys(EmbeddedMovie.schema.paths);
      expect(v_schemaPaths).toContain('plot');
      expect(v_schemaPaths).toContain('genres');
      expect(v_schemaPaths).toContain('runtime');
      expect(v_schemaPaths).toContain('rated');
      expect(v_schemaPaths).toContain('cast');
      expect(v_schemaPaths).toContain('poster');
      expect(v_schemaPaths).toContain('title');
      expect(v_schemaPaths).toContain('fullplot');
      expect(v_schemaPaths).toContain('languages');
      expect(v_schemaPaths).toContain('released');
      expect(v_schemaPaths).toContain('directors');
      expect(v_schemaPaths).toContain('writers');
      expect(v_schemaPaths).toContain('awards.wins');
      expect(v_schemaPaths).toContain('awards.nominations');
      expect(v_schemaPaths).toContain('awards.text');
      expect(v_schemaPaths).toContain('lastupdated');
      expect(v_schemaPaths).toContain('year');
      expect(v_schemaPaths).toContain('imdb.rating');
      expect(v_schemaPaths).toContain('imdb.votes');
      expect(v_schemaPaths).toContain('imdb.id');
      expect(v_schemaPaths).toContain('countries');
      expect(v_schemaPaths).toContain('type');
      expect(v_schemaPaths).toContain('tomatoes.viewer.rating');
      expect(v_schemaPaths).toContain('tomatoes.dvd');
      expect(v_schemaPaths).toContain('tomatoes.lastUpdated');
      expect(v_schemaPaths).toContain('num_mflix_comments');
      expect(v_schemaPaths).toContain('plot_embedding');
      expect(v_schemaPaths).toContain('plot_embedding_voyage_3_large');
      expect(v_schemaPaths).toContain('_id');
    });
  });

  describe('Required Field Validation', () => {
    it('should require title field', async () => {
      const v_movie = new EmbeddedMovie({
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
      const v_movie = new EmbeddedMovie({
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
      const v_movie = new EmbeddedMovie({
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
      const v_movie = new EmbeddedMovie({
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
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie'
      });

      expect(v_movie.title).toBe('Test Movie');
      expect(typeof v_movie.title).toBe('string');
    });

    it('should accept string for plot', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        plot: 'A short plot description'
      });

      expect(v_movie.plot).toBe('A short plot description');
    });

    it('should accept string for fullplot', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        fullplot: 'A very long and detailed plot description'
      });

      expect(v_movie.fullplot).toBe('A very long and detailed plot description');
    });

    it('should accept number for runtime', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        runtime: 120
      });

      expect(v_movie.runtime).toBe(120);
    });

    it('should accept string for rated', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        rated: 'PG-13'
      });

      expect(v_movie.rated).toBe('PG-13');
    });

    it('should accept string for poster', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        poster: 'https://example.com/poster.jpg'
      });

      expect(v_movie.poster).toBe('https://example.com/poster.jpg');
    });

    it('should accept number for year', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        year: 2024
      });

      expect(v_movie.year).toBe(2024);
    });

    it('should accept string for lastupdated', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        lastupdated: '2024-06-15 10:30:00.000000000'
      });

      expect(v_movie.lastupdated).toBe('2024-06-15 10:30:00.000000000');
    });

    it('should accept string for type', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        type: 'movie'
      });

      expect(v_movie.type).toBe('movie');
    });

    it('should accept number for num_mflix_comments', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        num_mflix_comments: 42
      });

      expect(v_movie.num_mflix_comments).toBe(42);
    });

    it('should accept Date for released', () => {
      const v_date = new Date('2024-06-15');
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        released: v_date
      });

      expect(v_movie.released.getTime()).toBe(v_date.getTime());
    });

    it('should cast string number to number for runtime', () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        runtime: '120'
      });

      expect(v_movie.runtime).toBe(120);
      expect(typeof v_movie.runtime).toBe('number');
    });

    it('should cast string number to number for year', () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        year: '2024'
      });

      expect(v_movie.year).toBe(2024);
      expect(typeof v_movie.year).toBe('number');
    });
  });

  describe('Array Validation', () => {
    it('should accept an array of strings for genres', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        genres: ['Action', 'Drama', 'Comedy']
      });

      expect(v_movie.genres).toHaveLength(3);
      expect(v_movie.genres).toContain('Action');
      expect(v_movie.genres).toContain('Drama');
      expect(v_movie.genres).toContain('Comedy');
    });

    it('should accept an array of strings for cast', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        cast: ['Actor One', 'Actor Two', 'Actor Three']
      });

      expect(v_movie.cast).toHaveLength(3);
      expect(v_movie.cast).toContain('Actor One');
    });

    it('should accept an array of strings for languages', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        languages: ['English', 'Spanish', 'French']
      });

      expect(v_movie.languages).toHaveLength(3);
      expect(v_movie.languages).toContain('English');
    });

    it('should accept an array of strings for directors', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        directors: ['Director One', 'Director Two']
      });

      expect(v_movie.directors).toHaveLength(2);
      expect(v_movie.directors).toContain('Director One');
    });

    it('should accept an array of strings for writers', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        writers: ['Writer One', 'Writer Two']
      });

      expect(v_movie.writers).toHaveLength(2);
      expect(v_movie.writers).toContain('Writer One');
    });

    it('should accept an array of strings for countries', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        countries: ['USA', 'UK', 'Canada']
      });

      expect(v_movie.countries).toHaveLength(3);
      expect(v_movie.countries).toContain('USA');
    });

    it('should accept an empty array for genres', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        genres: []
      });

      expect(v_movie.genres).toHaveLength(0);
    });

    it('should default arrays to empty when not provided', () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie'
      });

      expect(Array.isArray(v_movie.genres)).toBe(true);
      expect(Array.isArray(v_movie.cast)).toBe(true);
      expect(Array.isArray(v_movie.languages)).toBe(true);
      expect(Array.isArray(v_movie.directors)).toBe(true);
      expect(Array.isArray(v_movie.writers)).toBe(true);
      expect(Array.isArray(v_movie.countries)).toBe(true);
    });
  });

  describe('Nested Object Validation - Awards', () => {
    it('should accept awards object with all fields', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        awards: {
          wins: 5,
          nominations: 10,
          text: '5 wins & 10 nominations'
        }
      });

      expect(v_movie.awards.wins).toBe(5);
      expect(v_movie.awards.nominations).toBe(10);
      expect(v_movie.awards.text).toBe('5 wins & 10 nominations');
    });

    it('should accept awards object with only wins', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        awards: {
          wins: 3
        }
      });

      expect(v_movie.awards.wins).toBe(3);
      expect(v_movie.awards.nominations).toBeUndefined();
    });

    it('should accept awards object with only nominations', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        awards: {
          nominations: 7
        }
      });

      expect(v_movie.awards.nominations).toBe(7);
    });

    it('should accept awards object with only text', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        awards: {
          text: 'Nominated for 3 Oscars'
        }
      });

      expect(v_movie.awards.text).toBe('Nominated for 3 Oscars');
    });

    it('should accept empty awards object', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        awards: {}
      });

      expect(v_movie.awards).toBeDefined();
    });
  });

  describe('Nested Object Validation - IMDB', () => {
    it('should accept imdb object with all fields', async () => {
      const v_movie = new EmbeddedMovie({
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
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        imdb: {
          rating: 7.5
        }
      });

      expect(v_movie.imdb.rating).toBe(7.5);
    });

    it('should accept imdb object with only votes', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        imdb: {
          votes: 50000
        }
      });

      expect(v_movie.imdb.votes).toBe(50000);
    });

    it('should accept imdb object with only id', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        imdb: {
          id: 99999
        }
      });

      expect(v_movie.imdb.id).toBe(99999);
    });

    it('should cast string numbers in imdb to numbers', () => {
      const v_movie = new EmbeddedMovie({
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

  describe('Nested Object Validation - Tomatoes', () => {
    it('should accept tomatoes object with all fields', async () => {
      const v_dvdDate = new Date('2024-09-15');
      const v_lastUpdated = new Date('2024-06-20');
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        tomatoes: {
          viewer: {
            rating: 4.2,
            numReviews: 5000,
            meter: 85
          },
          dvd: v_dvdDate,
          lastUpdated: v_lastUpdated
        }
      });

      expect(v_movie.tomatoes.viewer.rating).toBe(4.2);
      expect(v_movie.tomatoes.viewer.numReviews).toBe(5000);
      expect(v_movie.tomatoes.viewer.meter).toBe(85);
      expect(v_movie.tomatoes.dvd.getTime()).toBe(v_dvdDate.getTime());
      expect(v_movie.tomatoes.lastUpdated.getTime()).toBe(v_lastUpdated.getTime());
    });

    it('should accept tomatoes object with only viewer', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        tomatoes: {
          viewer: {
            rating: 3.8,
            numReviews: 2500,
            meter: 72
          }
        }
      });

      expect(v_movie.tomatoes.viewer.rating).toBe(3.8);
      expect(v_movie.tomatoes.viewer.numReviews).toBe(2500);
      expect(v_movie.tomatoes.viewer.meter).toBe(72);
    });

    it('should accept tomatoes object with partial viewer', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        tomatoes: {
          viewer: {
            rating: 4.0
          }
        }
      });

      expect(v_movie.tomatoes.viewer.rating).toBe(4.0);
      expect(v_movie.tomatoes.viewer.numReviews).toBeUndefined();
    });

    it('should accept tomatoes object with only dvd date', async () => {
      const v_dvdDate = new Date('2024-09-15');
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        tomatoes: {
          dvd: v_dvdDate
        }
      });

      expect(v_movie.tomatoes.dvd.getTime()).toBe(v_dvdDate.getTime());
    });

    it('should accept empty tomatoes object', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        tomatoes: {}
      });

      expect(v_movie.tomatoes).toBeDefined();
    });
  });

  describe('Mixed Type Validation - Embeddings', () => {
    it('should accept array for plot_embedding', async () => {
      const v_embedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        plot_embedding: v_embedding
      });

      expect(v_movie.plot_embedding).toEqual(v_embedding);
    });

    it('should accept array for plot_embedding_voyage_3_large', async () => {
      const v_embedding = [0.01, 0.02, 0.03, 0.04, 0.05];
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        plot_embedding_voyage_3_large: v_embedding
      });

      expect(v_movie.plot_embedding_voyage_3_large).toEqual(v_embedding);
    });

    it('should accept large embedding arrays', async () => {
      const v_embedding = Array.from({ length: 1536 }, () => Math.random());
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        plot_embedding: v_embedding
      });

      expect(v_movie.plot_embedding).toHaveLength(1536);
    });

    it('should accept null for plot_embedding', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        plot_embedding: null
      });

      expect(v_movie.plot_embedding).toBeNull();
    });

    it('should accept object for plot_embedding (Mixed type)', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        plot_embedding: { type: 'dense', values: [0.1, 0.2] }
      });

      expect(v_movie.plot_embedding).toEqual({ type: 'dense', values: [0.1, 0.2] });
    });
  });

  describe('Complete Document Validation', () => {
    it('should create a valid embedded movie with all fields', async () => {
      const v_movieData = {
        title: 'The Complete Test Movie',
        plot: 'A short plot',
        fullplot: 'A very detailed and long plot description',
        genres: ['Action', 'Drama'],
        runtime: 150,
        rated: 'R',
        cast: ['Actor One', 'Actor Two'],
        poster: 'https://example.com/poster.jpg',
        languages: ['English', 'Spanish'],
        released: new Date('2024-06-15'),
        directors: ['Director One'],
        writers: ['Writer One', 'Writer Two'],
        awards: {
          wins: 10,
          nominations: 25,
          text: '10 wins & 25 nominations'
        },
        lastupdated: '2024-06-20 10:30:00.000000000',
        year: 2024,
        imdb: {
          rating: 9.0,
          votes: 500000,
          id: 54321
        },
        countries: ['USA', 'UK'],
        type: 'movie',
        tomatoes: {
          viewer: {
            rating: 4.5,
            numReviews: 10000,
            meter: 92
          },
          dvd: new Date('2024-09-15'),
          lastUpdated: new Date('2024-06-20')
        },
        num_mflix_comments: 150,
        plot_embedding: [0.1, 0.2, 0.3],
        plot_embedding_voyage_3_large: [0.01, 0.02, 0.03]
      };

      const v_movie = new EmbeddedMovie(v_movieData);

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
    });

    it('should create a valid embedded movie with minimal fields', async () => {
      const v_movie = new EmbeddedMovie({
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
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie'
      });

      expect(v_movie._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(v_movie._id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', async () => {
      const v_longTitle = 'A'.repeat(1000);
      const v_movie = new EmbeddedMovie({
        title: v_longTitle
      });

      expect(v_movie.title).toBe(v_longTitle);
      expect(v_movie.title.length).toBe(1000);
    });

    it('should handle very long plot', async () => {
      const v_longPlot = 'B'.repeat(5000);
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        plot: v_longPlot
      });

      expect(v_movie.plot).toBe(v_longPlot);
    });

    it('should handle very long fullplot', async () => {
      const v_longFullplot = 'C'.repeat(20000);
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        fullplot: v_longFullplot
      });

      expect(v_movie.fullplot).toBe(v_longFullplot);
    });

    it('should handle zero runtime', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        runtime: 0
      });

      expect(v_movie.runtime).toBe(0);
    });

    it('should handle negative year', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Ancient Movie',
        year: -500
      });

      expect(v_movie.year).toBe(-500);
    });

    it('should handle large number of genres', async () => {
      const v_genres = Array.from({ length: 50 }, (_, i) => `Genre${i}`);
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        genres: v_genres
      });

      expect(v_movie.genres).toHaveLength(50);
    });

    it('should handle large cast', async () => {
      const v_cast = Array.from({ length: 100 }, (_, i) => `Actor ${i}`);
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        cast: v_cast
      });

      expect(v_movie.cast).toHaveLength(100);
    });

    it('should handle special characters in title', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test: Movie! @#$%^&*()_+-=[]{}|;\':",.<>?/~`'
      });

      expect(v_movie.title).toBe('Test: Movie! @#$%^&*()_+-=[]{}|;\':",.<>?/~`');
    });

    it('should handle unicode characters in title', async () => {
      const v_movie = new EmbeddedMovie({
        title: '测试电影 テスト映画 Тестовый фильм'
      });

      expect(v_movie.title).toBe('测试电影 テスト映画 Тестовый фильм');
    });

    it('should handle empty string title validation error', async () => {
      const v_movie = new EmbeddedMovie({
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

    it('should handle decimal rating in imdb', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        imdb: {
          rating: 7.89
        }
      });

      expect(v_movie.imdb.rating).toBe(7.89);
    });

    it('should handle zero awards', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        awards: {
          wins: 0,
          nominations: 0,
          text: 'No awards'
        }
      });

      expect(v_movie.awards.wins).toBe(0);
      expect(v_movie.awards.nominations).toBe(0);
    });

    it('should handle large awards numbers', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        awards: {
          wins: 100,
          nominations: 500
        }
      });

      expect(v_movie.awards.wins).toBe(100);
      expect(v_movie.awards.nominations).toBe(500);
    });

    it('should handle past released date', async () => {
      const v_pastDate = new Date('1920-01-01');
      const v_movie = new EmbeddedMovie({
        title: 'Old Movie',
        released: v_pastDate
      });

      expect(v_movie.released.getTime()).toBe(v_pastDate.getTime());
    });

    it('should handle future released date', async () => {
      const v_futureDate = new Date('2030-12-31');
      const v_movie = new EmbeddedMovie({
        title: 'Future Movie',
        released: v_futureDate
      });

      expect(v_movie.released.getTime()).toBe(v_futureDate.getTime());
    });

    it('should handle zero num_mflix_comments', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        num_mflix_comments: 0
      });

      expect(v_movie.num_mflix_comments).toBe(0);
    });

    it('should handle large num_mflix_comments', async () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie',
        num_mflix_comments: 1000000
      });

      expect(v_movie.num_mflix_comments).toBe(1000000);
    });
  });

  describe('Model Methods', () => {
    it('should have toJSON method', () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie'
      });

      const v_json = v_movie.toJSON();
      expect(v_json).toBeDefined();
      expect(v_json.title).toBe('Test Movie');
    });

    it('should have toObject method', () => {
      const v_movie = new EmbeddedMovie({
        title: 'Test Movie'
      });

      const v_obj = v_movie.toObject();
      expect(v_obj).toBeDefined();
      expect(v_obj.title).toBe('Test Movie');
    });
  });

  describe('Schema Options', () => {
    it('should not have timestamps enabled', () => {
      expect(EmbeddedMovie.schema.options.timestamps).toBeFalsy();
    });

    it('should have correct model name', () => {
      expect(EmbeddedMovie.modelName).toBe('EmbeddedMovie');
    });
  });
});
