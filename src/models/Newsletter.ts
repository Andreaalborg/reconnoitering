// src/models/Newsletter.ts
import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface INewsletter extends Document {
  email: string;
  status: 'pending' | 'subscribed' | 'unsubscribed';
  subscriptionDate?: Date;
  unsubscribeDate?: Date;
  unsubscribeToken: string;
  preferences?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    categories: string[];
  };
  source?: string; // Where they subscribed from
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  status: {
    type: String,
    enum: ['pending', 'subscribed', 'unsubscribed'],
    default: 'pending'
  },
  subscriptionDate: {
    type: Date
  },
  unsubscribeDate: {
    type: Date
  },
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  preferences: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    categories: [{
      type: String
    }]
  },
  source: {
    type: String,
    default: 'footer'
  },
  ipAddress: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

// Generate unsubscribe token before saving
NewsletterSchema.pre('save', function(next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Indexes
NewsletterSchema.index({ email: 1 });
NewsletterSchema.index({ status: 1 });
NewsletterSchema.index({ unsubscribeToken: 1 });

export default mongoose.models.Newsletter || 
  mongoose.model<INewsletter>('Newsletter', NewsletterSchema);