import mongoose, { Schema, Document } from 'mongoose';

export interface IArtist extends Document {
  name: string;
  slug: string;
  bio?: string;
  imageUrl?: string;
  websiteUrl?: string;
  addedDate: Date;
  lastUpdated: Date;
}

const ArtistSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Navn er påkrevd'],
    unique: true,
    trim: true,
    maxlength: [100, 'Navn kan ikke være lengre enn 100 tegn']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  bio: {
    type: String,
    trim: true
  },
  imageUrl: String,
  websiteUrl: String,
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

ArtistSchema.pre<IArtist>('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-æøå]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  this.lastUpdated = new Date();
  next();
});

export default mongoose.models.Artist || mongoose.model<IArtist>('Artist', ArtistSchema); 