import mongoose, { Schema, Document } from 'mongoose';

interface ITheater extends Document {
  theaterId: number;
  location: {
    address: {
      street1?: string;
      city?: string;
      state?: string;
      zipcode?: string;
    };
    geo: {
      type: string;
      coordinates: number[];
    };
  };
}

const c_theaterSchema = new Schema<ITheater>({
  theaterId: {
    type: Number,
    required: true
  },
  location: {
    address: {
      street1: String,
      city: String,
      state: String,
      zipcode: String
    },
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  }
}, {
  collection: 'theaters'
});

export default mongoose.model<ITheater>('Theater', c_theaterSchema);
