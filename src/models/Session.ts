import mongoose, { Schema, Document } from 'mongoose';

interface ISession extends Document {
  user_id: string;
  jwt: string;
}

const c_sessionSchema = new Schema<ISession>({
  user_id: {
    type: String,
    required: true
  },
  jwt: {
    type: String,
    required: true
  }
}, {
  collection: 'sessions'
});

export default mongoose.model<ISession>('Session', c_sessionSchema);
