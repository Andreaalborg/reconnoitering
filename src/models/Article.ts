import { Schema, model, models } from 'mongoose';

const ArticleSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  excerpt: {
    type: String,
    required: [true, 'Please provide an excerpt'],
    maxlength: [500, 'Excerpt cannot be more than 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide content']
  },
  coverImage: {
    type: String,
    required: false
  },
  author: {
    type: String,
    required: true,
    default: 'Reconnoitering Team'
  },
  category: {
    type: String,
    enum: ['art-trends', 'museum-news', 'artist-spotlight', 'collecting', 'technology', 'events'],
    default: 'art-trends'
  },
  tags: [{
    type: String
  }],
  publishedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  readTime: {
    type: Number, // in minutes
    default: 5
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better search performance
ArticleSchema.index({ title: 'text', content: 'text', tags: 1 });
ArticleSchema.index({ slug: 1 });
ArticleSchema.index({ publishedAt: -1 });
ArticleSchema.index({ status: 1, publishedAt: -1 });

const Article = models.Article || model('Article', ArticleSchema);

export default Article;