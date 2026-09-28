import express from 'express';
import mongoose from 'mongoose';
import verifyToken from '../middleware/auth.js';
import Product from '../models/Product.js';
import NGO from '../models/ngo.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate('ngoId', 'organizationName').sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get products by NGO
router.get('/ngo/:ngoId', async (req, res) => {
  try {
    const products = await Product.find({
      ngoId: req.params.ngoId,
      isActive: true
    }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Error fetching NGO products:', err);
    res.status(500).json({ message: 'Error fetching NGO products' });
  }
});

// Add a new product
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, price, link, pointsRequired, quantity, category, imageUrl } = req.body;

    // Verify NGO exists and user is authorized
    const ngo = await NGO.findById(req.user.id);
    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      link,
      pointsRequired,
      quantity,
      category,
      ngoId: req.user.id,
      ngoName: ngo.organizationName,
      imageUrl: imageUrl || ''
    });

    const savedProduct = await newProduct.save();

    // Update NGO's productsPosted array
    ngo.productsPosted.push({
      productId: savedProduct._id,
      postedAt: new Date()
    });
    await ngo.save();

    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Error adding product' });
  }
});

// Update a product
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, price, link, pointsRequired, quantity, category, imageUrl, isActive } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product (is the NGO that posted it)
    if (product.ngoId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        link,
        pointsRequired,
        quantity,
        category,
        imageUrl,
        isActive
      },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete a product
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product (is the NGO that posted it)
    if (product.ngoId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Remove from NGO's productsPosted array
    await NGO.findByIdAndUpdate(req.user.id, {
      $pull: { productsPosted: { productId: req.params.id } }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('ngoId', 'organizationName');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

export default router;
