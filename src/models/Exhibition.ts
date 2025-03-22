import mongoose, { Schema, Document } from 'mongoose';

export interface IExhibition extends Document {
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  startDate: Date;
  endDate: Date;
  location: {
    name: string;
    address?: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  category: string[];
  artists: string[];
  tags: string[];
  ticketPrice?: string;
  ticketUrl?: string;
  websiteUrl?: string;
  addedDate: Date;
  popularity: number;
  featured: boolean;
}

const ExhibitionSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the exhibition'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  coverImage: {
    type: String,
    required: [true, 'Please provide a cover image URL'],
  },
  images: [String],
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date'],
  },
  location: {
    name: {
      type: String,
      required: [true, 'Please provide a location name'],
    },
    address: String,
    city: {
      type: String,
      required: [true, 'Please provide a city'],
    },
    country: {
      type: String,
      required: [true, 'Please provide a country'],
    },
    coordinates: {
      lat: Number,
      lng: Number,
    }
  },
  category: [String],
  artists: [String],
  tags: [String],
  ticketPrice: String,
  ticketUrl: String,
  websiteUrl: String,
  addedDate: {
    type: Date,
    default: Date.now,
  },
  popularity: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  }
});

// Legg til tekstindekser for søk
ExhibitionSchema.index({ 
  title: 'text', 
  description: 'text', 
  'location.name': 'text', 
  'location.city': 'text', 
  'location.country': 'text', 
  artists: 'text',
  category: 'text', 
  tags: 'text'
});

// Use mongoose.models to check if the model already exists or create a new one
export default mongoose.models.Exhibition || 
  mongoose.model<IExhibition>('Exhibition', ExhibitionSchema);