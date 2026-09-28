import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['cleanup', 'workshop', 'planting', 'collection', 'community', 'education'],
    default: 'community'
  },
  points: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizerName: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  image: {
    type: String,
    default: ''
  },
  photos: [{
    type: String,
    default: []
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Event || mongoose.model('Event', eventSchema);
