import { Schema, model, models } from 'mongoose';

const PageViewSchema = new Schema({
  page: {
    type: String,
    required: true,
    index: true
  },
  path: {
    type: String,
    required: true
  },
  referrer: String,
  userAgent: String,
  ip: String,
  country: String,
  city: String,
  // User info if logged in
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sessionId: String,
  // Additional data
  exhibitionId: {
    type: Schema.Types.ObjectId,
    ref: 'Exhibition',
    required: false
  },
  articleId: {
    type: Schema.Types.ObjectId,
    ref: 'Article',
    required: false
  },
  // Time spent on page (in seconds)
  duration: {
    type: Number,
    default: 0
  },
  // Interaction data
  clicks: {
    type: Number,
    default: 0
  },
  scrollDepth: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const EventSchema = new Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['click', 'search', 'filter', 'share', 'favorite', 'download', 'signup', 'login']
  },
  eventName: String,
  eventValue: Schema.Types.Mixed,
  page: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sessionId: String,
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

// Daily aggregated stats
const DailyStatsSchema = new Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  pageViews: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  newUsers: {
    type: Number,
    default: 0
  },
  avgSessionDuration: {
    type: Number,
    default: 0
  },
  bounceRate: {
    type: Number,
    default: 0
  },
  topPages: [{
    page: String,
    views: Number
  }],
  topReferrers: [{
    referrer: String,
    count: Number
  }],
  deviceTypes: {
    desktop: { type: Number, default: 0 },
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 }
  },
  countries: [{
    country: String,
    count: Number
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
PageViewSchema.index({ createdAt: -1 });
PageViewSchema.index({ page: 1, createdAt: -1 });
PageViewSchema.index({ userId: 1, createdAt: -1 });
PageViewSchema.index({ sessionId: 1 });

EventSchema.index({ eventType: 1, createdAt: -1 });
EventSchema.index({ userId: 1, createdAt: -1 });
EventSchema.index({ sessionId: 1 });

DailyStatsSchema.index({ date: -1 });

export const PageView = models.PageView || model('PageView', PageViewSchema);
export const Event = models.Event || model('Event', EventSchema);
export const DailyStats = models.DailyStats || model('DailyStats', DailyStatsSchema);