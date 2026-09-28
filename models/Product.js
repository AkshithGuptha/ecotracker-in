import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  link: {
    type: String,
    required: false
  },
  pointsRequired: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  imageUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NGO',
    required: true
  },
  ngoName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  redeemedCount: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from creation
  }
}, {
  timestamps: true
});

// Check if model exists before compiling it
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
