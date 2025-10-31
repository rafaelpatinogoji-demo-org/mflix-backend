import mongoose, { Schema, Document, Types } from 'mongoose';

interface IComment extends Document {
  name: string;
  email: string;
  movie_id: Types.ObjectId;
  text: string;
  date: Date;
}

const c_commentSchema = new Schema<IComment>({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  movie_id: {
    type: Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'comments'
});

export default mongoose.model<IComment>('Comment', c_commentSchema);
