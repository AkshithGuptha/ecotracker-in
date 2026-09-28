import express from 'express';
import verifyToken from '../middleware/auth.js';
import User from '../models/user.js';
import Product from '../models/Product.js';

const router = express.Router();

// Register for a product (redeem product)
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Find the user and product
    const user = await User.findById(userId);
    const product = await Product.findById(productId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is active
    if (!product.isActive) {
      return res.status(400).json({ message: 'Product is not available' });
    }

    // Check if user has already redeemed this product
    const alreadyRedeemed = user.redeemHistory.some(
      redeem => redeem.productId.toString() === productId
    );
    if (alreadyRedeemed) {
      return res.status(400).json({ message: 'Already redeemed this product' });
    }

    // Check if user has enough points
    if (user.ecoPoints < product.pointsRequired) {
      return res.status(400).json({
        message: 'Not enough points to redeem this product'
      });
    }

    // Deduct points and add to redeem history
    user.ecoPoints -= product.pointsRequired;
    user.redeemHistory.push({
      productId: productId,
      pointsSpent: product.pointsRequired
    });
    await user.save();

    // Increment redeemed count for product
    product.redeemedCount += 1;
    await product.save();

    res.json({
      success: true,
      message: 'Successfully redeemed the product',
      points: user.ecoPoints
    });

  } catch (error) {
    console.error('Error redeeming product:', error);
    res.status(500).json({ message: 'Error redeeming product' });
  }
});

// Get user's redeem history
router.get('/my-registrations', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('redeemHistory.productId', 'name description pointsRequired imageUrl')
      .select('redeemHistory');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.redeemHistory);
  } catch (error) {
    console.error('Error fetching redeem history:', error);
    res.status(500).json({ message: 'Error fetching redeem history' });
  }
});

export default router;
