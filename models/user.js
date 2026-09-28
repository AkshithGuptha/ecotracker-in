import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'ngo', 'organizer'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  ecoPoints: {
    type: Number,
    default: 0
  },
  activitiesLogged: {
    type: Number,
    default: 0
  },
  eventsParticipated: [{
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    participatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  redeemHistory: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    redeemedAt: {
      type: Date,
      default: Date.now
    },
    pointsSpent: {
      type: Number,
      required: true
    }
  }],
  carbonEntries: [{
    date: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', userSchema);
