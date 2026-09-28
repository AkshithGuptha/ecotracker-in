import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecotrack')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define Product schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  pointsRequired: { type: Number, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, required: true },
  ngoId: { type: String, required: true },
  ngoName: { type: String, required: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// Sample NGO products
const sampleProducts = [
  {
    name: 'Eco-Friendly Water Bottle',
    description: 'Reusable stainless steel water bottle that keeps drinks cold for 24 hours',
    price: 25.99,
    pointsRequired: 150,
    quantity: 10,
    category: 'lifestyle',
    ngoId: 'ngo123',
    ngoName: 'Green Earth Foundation',
    imageUrl: '🚰'
  },
  {
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable t-shirt made from 100% organic cotton, fair trade certified',
    price: 35.00,
    pointsRequired: 200,
    quantity: 5,
    category: 'lifestyle',
    ngoId: 'ngo123',
    ngoName: 'Green Earth Foundation',
    imageUrl: '👕'
  },
  {
    name: 'Bamboo Toothbrush Set',
    description: 'Pack of 4 biodegradable bamboo toothbrushes with charcoal bristles',
    price: 12.99,
    pointsRequired: 75,
    quantity: 15,
    category: 'lifestyle',
    ngoId: 'ngo456',
    ngoName: 'Sustainable Living NGO',
    imageUrl: '🪥'
  }
];

// Add sample products
async function addSampleProducts() {
  try {
    await Product.deleteMany({}); // Clear existing products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Added ${products.length} sample NGO products`);
    console.log('Products:');
    products.forEach(p => console.log(`- ${p.name} (${p.pointsRequired} points, ${p.quantity} available)`));
  } catch (error) {
    console.error('❌ Error adding sample products:', error);
  } finally {
    mongoose.connection.close();
  }
}

addSampleProducts();
