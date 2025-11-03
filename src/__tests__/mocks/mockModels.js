const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedpassword123',
  toJSON: function() {
    return {
      _id: this._id,
      name: this.name,
      email: this.email,
      password: this.password
    };
  }
};

const mockComment = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Test Commenter',
  email: 'commenter@example.com',
  movie_id: {
    _id: '507f1f77bcf86cd799439013',
    title: 'Test Movie',
    year: 2024
  },
  text: 'Great movie!',
  date: new Date('2024-01-01'),
  toJSON: function() {
    return {
      _id: this._id,
      name: this.name,
      email: this.email,
      movie_id: this.movie_id,
      text: this.text,
      date: this.date
    };
  }
};

const mockTheater = {
  _id: '507f1f77bcf86cd799439014',
  theaterId: 1001,
  location: {
    address: {
      street1: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipcode: '62701'
    },
    geo: {
      type: 'Point',
      coordinates: [-89.6501, 39.7817]
    }
  },
  toJSON: function() {
    return {
      _id: this._id,
      theaterId: this.theaterId,
      location: this.location
    };
  }
};

module.exports = {
  mockUser,
  mockComment,
  mockTheater
};
