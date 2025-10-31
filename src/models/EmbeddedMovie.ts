import mongoose, { Schema, Document } from 'mongoose';

interface IEmbeddedMovie extends Document {
  plot?: string;
  genres?: string[];
  runtime?: number;
  rated?: string;
  cast?: string[];
  poster?: string;
  title: string;
  fullplot?: string;
  languages?: string[];
  released?: Date;
  directors?: string[];
  writers?: string[];
  awards?: {
    wins?: number;
    nominations?: number;
    text?: string;
  };
  lastupdated?: string;
  year?: number;
  imdb?: {
    rating?: number;
    votes?: number;
    id?: number;
  };
  countries?: string[];
  type?: string;
  tomatoes?: {
    viewer?: {
      rating?: number;
      numReviews?: number;
      meter?: number;
    };
    dvd?: Date;
    lastUpdated?: Date;
  };
  num_mflix_comments?: number;
  plot_embedding?: any;
  plot_embedding_voyage_3_large?: any;
}

const c_embeddedMovieSchema = new Schema<IEmbeddedMovie>({
  plot: String,
  genres: [String],
  runtime: Number,
  rated: String,
  cast: [String],
  poster: String,
  title: {
    type: String,
    required: true
  },
  fullplot: String,
  languages: [String],
  released: Date,
  directors: [String],
  writers: [String],
  awards: {
    wins: Number,
    nominations: Number,
    text: String
  },
  lastupdated: String,
  year: Number,
  imdb: {
    rating: Number,
    votes: Number,
    id: Number
  },
  countries: [String],
  type: String,
  tomatoes: {
    viewer: {
      rating: Number,
      numReviews: Number,
      meter: Number
    },
    dvd: Date,
    lastUpdated: Date
  },
  num_mflix_comments: Number,
  plot_embedding: Schema.Types.Mixed,
  plot_embedding_voyage_3_large: Schema.Types.Mixed
}, {
  collection: 'embedded_movies'
});

export default mongoose.model<IEmbeddedMovie>('EmbeddedMovie', c_embeddedMovieSchema);
