import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  name: string;
  slug: string;
  description?: string;
  addedDate: Date;
  lastUpdated: Date;
}

const TagSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Navn er påkrevd'],
    unique: true,
    trim: true,
    maxlength: [50, 'Navn kan ikke være lengre enn 50 tegn']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
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

TagSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  this.lastUpdated = new Date();
  next();
});

export default mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema); 