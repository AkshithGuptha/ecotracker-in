import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Import Product model (reuse from products.js)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  pointsRequired: { type: Number, required: true },
  quantity: { type: Number, required: false },
  category: { type: String, required: true },
  ngoId: { type: String, required: false },
  ngoName: { type: String, required: false },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// GET /api/rewards/ngo - Get all NGO-submitted products (rewards)
router.get('/', async (req, res) => {
  try {
    // Optionally, filter only active/approved products
    const products = await Product.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });

    // If no products in database, return mock data for testing
    if (products.length === 0) {
      const mockNGOProducts = [
        {
          _id: 'ngo1',
          id: 'ngo1',
          name: 'Eco-Friendly Water Bottle',
          description: 'Reusable stainless steel water bottle that keeps drinks cold for 24 hours',
          price: 25.99,
          pointsRequired: 150,
          quantity: 10,
          category: 'lifestyle',
          ngoId: 'ngo123',
          ngoName: 'Green Earth Foundation',
          imageUrl: '🚰',
          isActive: true,
          createdAt: new Date('2024-01-15')
        },
        {
          _id: 'ngo2',
          id: 'ngo2',
          name: 'Organic Cotton T-Shirt',
          description: 'Comfortable t-shirt made from 100% organic cotton, fair trade certified',
          price: 35.00,
          pointsRequired: 200,
          quantity: 5,
          category: 'lifestyle',
          ngoId: 'ngo123',
          ngoName: 'Green Earth Foundation',
          imageUrl: '👕',
          isActive: true,
          createdAt: new Date('2024-01-20')
        },
        {
          _id: 'ngo3',
          id: 'ngo3',
          name: 'Bamboo Toothbrush Set',
          description: 'Pack of 4 biodegradable bamboo toothbrushes with charcoal bristles',
          price: 12.99,
          pointsRequired: 75,
          quantity: 15,
          category: 'lifestyle',
          ngoId: 'ngo456',
          ngoName: 'Sustainable Living NGO',
          imageUrl: '🪥',
          isActive: true,
          createdAt: new Date('2024-01-25')
        }
      ];
      return res.json(mockNGOProducts);
    }

    // Transform the data to match the expected Reward format
    const transformedProducts = products.map(product => ({
      _id: product._id,
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      pointsRequired: product.pointsRequired,
      quantity: product.quantity,
      category: product.category,
      ngoId: product.ngoId,
      ngoName: product.ngoName,
      imageUrl: product.imageUrl,
      isActive: product.isActive !== false,
      createdAt: product.createdAt
    }));

    res.json(transformedProducts);
  } catch (err) {
    console.error('Error fetching NGO products:', err);
    // Return mock data if database fails
    const mockNGOProducts = [
      {
        _id: 'ngo1',
        id: 'ngo1',
        name: 'Eco-Friendly Water Bottle',
        description: 'Reusable stainless steel water bottle that keeps drinks cold for 24 hours',
        price: 25.99,
        pointsRequired: 150,
        quantity: 10,
        category: 'lifestyle',
        ngoId: 'ngo123',
        ngoName: 'Green Earth Foundation',
        imageUrl: '🚰',
        isActive: true,
        createdAt: new Date('2024-01-15')
      }
    ];
    res.json(mockNGOProducts);
  }
});

export default router;
