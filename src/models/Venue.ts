// src/models/Venue.ts - Model definition for exhibition venues

import mongoose, { Schema, Document } from 'mongoose';

export interface IVenue extends Document {
  name: string;
  address?: string;
  city: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  defaultClosedDays?: string[];
  websiteUrl?: string;
  notes?: string;
  isActive: boolean; // To "soft delete" venues instead of removing them
  addedDate: Date;
  lastUpdated: Date;
}

const VenueSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a venue name'],
    maxlength: [100, 'Name cannot be more than 100 characters'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Please provide a city'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Please provide a country'],
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  defaultClosedDays: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: [] // Default to empty array (open every day)
  },
  websiteUrl: String,
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  },
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Text indexes for search
VenueSchema.index({ 
  name: 'text', 
  address: 'text', 
  city: 'text', 
  country: 'text', 
  notes: 'text'
});

// Update the lastUpdated field when a venue is modified
VenueSchema.pre('findOneAndUpdate', function() {
  this.set({ lastUpdated: new Date() });
});

// Use mongoose.models to check if the model already exists or create a new one
export default mongoose.models.Venue || 
  mongoose.model<IVenue>('Venue', VenueSchema); 