import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: string;
  image?: string; // Added image field
  favoriteExhibitions?: string[];
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  image: {
    type: String,
    default: ''
  },
  favoriteExhibitions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exhibition'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.User || 
  mongoose.model<IUser>('User', UserSchema);