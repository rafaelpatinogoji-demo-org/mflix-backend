const mongoose = require('mongoose');
const Theater = require('../../../src/models/Theater');

describe('Theater Model', () => {
  describe('Schema Definition', () => {
    it('should have the correct collection name', () => {
      expect(Theater.collection.collectionName).toBe('theaters');
    });

    it('should have all expected fields defined in schema', () => {
      const v_schemaPaths = Object.keys(Theater.schema.paths);
      expect(v_schemaPaths).toContain('theaterId');
      expect(v_schemaPaths).toContain('location.address.street1');
      expect(v_schemaPaths).toContain('location.address.city');
      expect(v_schemaPaths).toContain('location.address.state');
      expect(v_schemaPaths).toContain('location.address.zipcode');
      expect(v_schemaPaths).toContain('location.geo.type');
      expect(v_schemaPaths).toContain('location.geo.coordinates');
      expect(v_schemaPaths).toContain('_id');
    });
  });

  describe('Required Field Validation', () => {
    it('should require theaterId field', async () => {
      const v_theater = new Theater({
        location: {
          address: {
            street1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipcode: '10001'
          },
          geo: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      let v_error;
      try {
        await v_theater.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.theaterId).toBeDefined();
      expect(v_error.errors.theaterId.kind).toBe('required');
    });

    it('should require location.geo.coordinates field', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          address: {
            street1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipcode: '10001'
          },
          geo: {
            type: 'Point'
          }
        }
      });

      let v_error;
      try {
        await v_theater.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors['location.geo.coordinates']).toBeDefined();
    });

    it('should pass validation with required fields', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      let v_error;
      try {
        await v_theater.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });
  });

  describe('Type Validation', () => {
    it('should accept number for theaterId', async () => {
      const v_theater = new Theater({
        theaterId: 123,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.theaterId).toBe(123);
      expect(typeof v_theater.theaterId).toBe('number');
    });

    it('should cast string number to number for theaterId', () => {
      const v_theater = new Theater({
        theaterId: '456',
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.theaterId).toBe(456);
      expect(typeof v_theater.theaterId).toBe('number');
    });

    it('should accept string for address fields', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          address: {
            street1: '123 Main Street',
            city: 'Los Angeles',
            state: 'CA',
            zipcode: '90001'
          },
          geo: {
            coordinates: [-118.243683, 34.052235]
          }
        }
      });

      expect(v_theater.location.address.street1).toBe('123 Main Street');
      expect(v_theater.location.address.city).toBe('Los Angeles');
      expect(v_theater.location.address.state).toBe('CA');
      expect(v_theater.location.address.zipcode).toBe('90001');
    });
  });

  describe('Nested Object Validation - Location', () => {
    it('should accept complete location object', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          address: {
            street1: '456 Broadway',
            city: 'Chicago',
            state: 'IL',
            zipcode: '60601'
          },
          geo: {
            type: 'Point',
            coordinates: [-87.629799, 41.878113]
          }
        }
      });

      expect(v_theater.location.address.street1).toBe('456 Broadway');
      expect(v_theater.location.address.city).toBe('Chicago');
      expect(v_theater.location.address.state).toBe('IL');
      expect(v_theater.location.address.zipcode).toBe('60601');
      expect(v_theater.location.geo.type).toBe('Point');
      expect(v_theater.location.geo.coordinates).toEqual([-87.629799, 41.878113]);
    });

    it('should accept location with only geo', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: [-122.419418, 37.774929]
          }
        }
      });

      expect(v_theater.location.geo.coordinates).toEqual([-122.419418, 37.774929]);
    });

    it('should accept partial address', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          address: {
            city: 'Miami'
          },
          geo: {
            coordinates: [-80.191788, 25.761681]
          }
        }
      });

      expect(v_theater.location.address.city).toBe('Miami');
      expect(v_theater.location.address.street1).toBeUndefined();
    });
  });

  describe('Geospatial Validation - Coordinates', () => {
    it('should accept valid coordinates array', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.location.geo.coordinates).toHaveLength(2);
      expect(v_theater.location.geo.coordinates[0]).toBe(-73.935242);
      expect(v_theater.location.geo.coordinates[1]).toBe(40.730610);
    });

    it('should accept coordinates at extreme longitude values', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: [-180, 0]
          }
        }
      });

      expect(v_theater.location.geo.coordinates[0]).toBe(-180);
    });

    it('should accept coordinates at extreme latitude values', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: [0, 90]
          }
        }
      });

      expect(v_theater.location.geo.coordinates[1]).toBe(90);
    });

    it('should accept coordinates at origin', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: [0, 0]
          }
        }
      });

      expect(v_theater.location.geo.coordinates).toEqual([0, 0]);
    });

    it('should accept negative coordinates', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: [-122.4194, -37.7749]
          }
        }
      });

      expect(v_theater.location.geo.coordinates[0]).toBe(-122.4194);
      expect(v_theater.location.geo.coordinates[1]).toBe(-37.7749);
    });

    it('should accept coordinates with high precision', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: [-73.93524256789, 40.73061012345]
          }
        }
      });

      expect(v_theater.location.geo.coordinates[0]).toBe(-73.93524256789);
      expect(v_theater.location.geo.coordinates[1]).toBe(40.73061012345);
    });
  });

  describe('Enum Validation - Geo Type', () => {
    it('should accept Point as geo type', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.location.geo.type).toBe('Point');
    });

    it('should default geo type to Point', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.location.geo.type).toBe('Point');
    });

    it('should reject invalid geo type', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Polygon',
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      let v_error;
      try {
        await v_theater.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors['location.geo.type']).toBeDefined();
      expect(v_error.errors['location.geo.type'].kind).toBe('enum');
    });

    it('should have Point as only valid enum value', () => {
      const v_geoTypePath = Theater.schema.path('location.geo.type');
      expect(v_geoTypePath.enumValues).toContain('Point');
      expect(v_geoTypePath.enumValues).toHaveLength(1);
    });
  });

  describe('Default Values', () => {
    it('should default geo type to Point', () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.location.geo.type).toBe('Point');
    });
  });

  describe('Complete Document Validation', () => {
    it('should create a valid theater with all fields', async () => {
      const v_theaterData = {
        theaterId: 100,
        location: {
          address: {
            street1: '789 Cinema Drive',
            city: 'Seattle',
            state: 'WA',
            zipcode: '98101'
          },
          geo: {
            type: 'Point',
            coordinates: [-122.332069, 47.606209]
          }
        }
      };

      const v_theater = new Theater(v_theaterData);

      let v_error;
      try {
        await v_theater.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_theater.theaterId).toBe(v_theaterData.theaterId);
      expect(v_theater.location.address.street1).toBe(v_theaterData.location.address.street1);
      expect(v_theater.location.address.city).toBe(v_theaterData.location.address.city);
      expect(v_theater.location.geo.coordinates).toEqual(v_theaterData.location.geo.coordinates);
    });

    it('should create a valid theater with minimal fields', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      let v_error;
      try {
        await v_theater.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should generate an ObjectId for _id', () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(v_theater._id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero theaterId', async () => {
      const v_theater = new Theater({
        theaterId: 0,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.theaterId).toBe(0);
    });

    it('should handle large theaterId', async () => {
      const v_theater = new Theater({
        theaterId: 999999999,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.theaterId).toBe(999999999);
    });

    it('should handle negative theaterId', async () => {
      const v_theater = new Theater({
        theaterId: -1,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.theaterId).toBe(-1);
    });

    it('should handle very long street address', async () => {
      const v_longStreet = 'A'.repeat(500);
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          address: {
            street1: v_longStreet
          },
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      expect(v_theater.location.address.street1).toBe(v_longStreet);
    });

    it('should handle special characters in address', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          address: {
            street1: '123 Main St. #456',
            city: "St. John's",
            state: 'NL',
            zipcode: 'A1A 1A1'
          },
          geo: {
            coordinates: [-52.712830, 47.561510]
          }
        }
      });

      expect(v_theater.location.address.street1).toBe('123 Main St. #456');
      expect(v_theater.location.address.city).toBe("St. John's");
    });

    it('should handle unicode characters in address', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          address: {
            street1: '東京都渋谷区',
            city: '東京',
            state: '日本'
          },
          geo: {
            coordinates: [139.691706, 35.689487]
          }
        }
      });

      expect(v_theater.location.address.street1).toBe('東京都渋谷区');
      expect(v_theater.location.address.city).toBe('東京');
    });

    it('should handle empty coordinates array validation error', async () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            type: 'Point',
            coordinates: []
          }
        }
      });

      let v_error;
      try {
        await v_theater.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
    });
  });

  describe('Index Validation', () => {
    it('should have 2dsphere index on coordinates', () => {
      const v_coordinatesPath = Theater.schema.path('location.geo.coordinates');
      expect(v_coordinatesPath.options.index).toBe('2dsphere');
    });
  });

  describe('Model Methods', () => {
    it('should have toJSON method', () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      const v_json = v_theater.toJSON();
      expect(v_json).toBeDefined();
      expect(v_json.theaterId).toBe(1);
    });

    it('should have toObject method', () => {
      const v_theater = new Theater({
        theaterId: 1,
        location: {
          geo: {
            coordinates: [-73.935242, 40.730610]
          }
        }
      });

      const v_obj = v_theater.toObject();
      expect(v_obj).toBeDefined();
      expect(v_obj.theaterId).toBe(1);
    });
  });

  describe('Schema Options', () => {
    it('should not have timestamps enabled', () => {
      expect(Theater.schema.options.timestamps).toBeFalsy();
    });

    it('should have correct model name', () => {
      expect(Theater.modelName).toBe('Theater');
    });
  });
});
