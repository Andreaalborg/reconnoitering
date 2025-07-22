// src/models/User.ts - Updated with preferences

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: string;
  image?: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpires?: Date;
  oauthProvider?: 'google' | 'facebook' | 'credentials';
  oauthId?: string;
  favoriteExhibitions?: string[];
  preferences?: {
    preferredTags?: string[];
    preferredArtists?: string[];
    preferredLocations?: string[];
    excludedTags?: string[];
    notificationFrequency?: 'daily' | 'weekly' | 'monthly' | 'never';
  };
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
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpires: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordTokenExpires: {
    type: Date
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'facebook', 'credentials'],
    default: 'credentials'
  },
  oauthId: {
    type: String
  },
  favoriteExhibitions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exhibition'
  }],
  preferences: {
    preferredTags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag'
    }],
    preferredArtists: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist'
    }],
    preferredLocations: [String],
    excludedTags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag'
    }],
    notificationFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.User || 
  mongoose.model<IUser>('User', UserSchema);