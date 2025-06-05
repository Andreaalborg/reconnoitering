// src/models/Exhibition.ts - Model definition only

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExhibition extends Document {
  title: string;
  venue: Types.ObjectId;
  description?: string;
  startDate: Date;
  endDate: Date;
  imageUrl?: string;
  tags: Types.ObjectId[];
  artists: Types.ObjectId[];
  ticketUrl?: string;
  websiteUrl?: string;
  notes?: string;
  addedDate: Date;
  lastUpdated: Date;
  location: {
    city: string;
    country: string;
  };
}

const ExhibitionSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Tittel er påkrevd'],
    trim: true,
    maxlength: [150, 'Tittel kan ikke være lengre enn 150 tegn']
  },
  venue: {
    type: Schema.Types.ObjectId,
    ref: 'Venue',
    required: [true, 'Venue er påkrevd']
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Startdato er påkrevd']
  },
  endDate: {
    type: Date,
    required: [true, 'Sluttdato er påkrevd']
  },
  imageUrl: String,
  tags: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  artists: [{
    type: Schema.Types.ObjectId,
    ref: 'Artist'
  }],
  ticketUrl: String,
  websiteUrl: String,
  notes: String,
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  location: {
    city: String,
    country: String
  }
});

ExhibitionSchema.index({ title: 'text', description: 'text' });
ExhibitionSchema.index({ venue: 1, startDate: 1, endDate: 1 });
ExhibitionSchema.index({ 'location.city': 1, 'location.country': 1 });
ExhibitionSchema.index({ tags: 1 });
ExhibitionSchema.index({ artists: 1 });

ExhibitionSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

ExhibitionSchema.pre('findOneAndUpdate', function() {
  this.set({ lastUpdated: new Date() });
});

export default mongoose.models.Exhibition || 
  mongoose.model<IExhibition>('Exhibition', ExhibitionSchema);