import mongoose, { Schema, Document } from 'mongoose';

interface IImdb {
  rating?: number;
  votes?: number;
  id?: number;
}

interface IMovie extends Document {
  plot?: string;
  genres: string[];
  runtime?: number;
  title: string;
  year?: number;
  imdb?: IImdb;
}

const c_imdbSchema = new Schema<IImdb>({
  rating: {
    type: Number,
    required: false
  },
  votes: {
    type: Number,
    required: false
  },
  id: {
    type: Number,
    required: false
  }
}, { _id: false });

const c_movieSchema = new Schema<IMovie>({
  plot: {
    type: String,
    required: false
  },
  genres: [{
    type: String
  }],
  runtime: {
    type: Number,
    required: false
  },
  title: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: false
  },
  imdb: c_imdbSchema
}, {
  collection: 'movies'
});

export default mongoose.model<IMovie>('Movie', c_movieSchema);
