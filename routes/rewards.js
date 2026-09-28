import express from 'express';

const router = express.Router();

// Mock rewards data - in a real app, this would come from a database
const mockRewards = [
  {
    _id: '1',
    id: '1',
    title: 'Eco-Friendly Water Bottle',
    description: 'Reusable stainless steel water bottle that keeps drinks cold for 24 hours',
    points: 150,
    category: 'lifestyle',
    image: '🚰',
    stock: 50,
    brand: 'EcoBrand',
    price: 25.99,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    popularity: 85
  },
  {
    _id: '2',
    id: '2',
    title: 'Organic Cotton T-Shirt',
    description: 'Comfortable t-shirt made from 100% organic cotton, fair trade certified',
    points: 200,
    category: 'lifestyle',
    image: '👕',
    stock: 30,
    brand: 'GreenThreads',
    price: 35.00,
    isActive: true,
    createdAt: new Date('2024-01-20'),
    popularity: 72
  },
  {
    _id: '3',
    id: '3',
    title: 'Bamboo Toothbrush Set',
    description: 'Pack of 4 biodegradable bamboo toothbrushes with charcoal bristles',
    points: 75,
    category: 'lifestyle',
    image: '🪥',
    stock: 100,
    brand: 'BambooCare',
    price: 12.99,
    isActive: true,
    createdAt: new Date('2024-01-25'),
    popularity: 95
  },
  {
    _id: '4',
    id: '4',
    title: 'Solar Phone Charger',
    description: 'Portable solar charger compatible with all smartphones, charges in 2-3 hours of sunlight',
    points: 400,
    category: 'electronics',
    image: '🔋',
    stock: 15,
    brand: 'SolarTech',
    price: 89.99,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    popularity: 68
  },
  {
    _id: '5',
    id: '5',
    title: 'Organic Coffee Subscription',
    description: 'Monthly delivery of premium organic coffee beans from sustainable farms',
    points: 300,
    category: 'food',
    image: '☕',
    stock: 25,
    brand: 'EcoBrew',
    price: 45.00,
    isActive: true,
    createdAt: new Date('2024-02-05'),
    popularity: 78
  }
];

// GET /api/rewards - Get all regular rewards
router.get('/', async (req, res) => {
  try {
    res.json(mockRewards);
  } catch (err) {
    console.error('Error fetching rewards:', err);
    res.status(500).json({ message: 'Error fetching rewards' });
  }
});

// GET /api/rewards/:id - Get reward by ID
router.get('/:id', async (req, res) => {
  try {
    const reward = mockRewards.find(r => r.id === req.params.id);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    res.json(reward);
  } catch (err) {
    console.error('Error fetching reward:', err);
    res.status(500).json({ message: 'Error fetching reward' });
  }
});

// GET /api/rewards/categories - Get available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'all', name: 'All', displayName: 'All Rewards', icon: 'gift' },
      { id: 'lifestyle', name: 'Lifestyle', displayName: 'Lifestyle', icon: 'shopping-bag' },
      { id: 'food', name: 'Food & Drinks', displayName: 'Food & Drinks', icon: 'coffee' },
      { id: 'electronics', name: 'Electronics', displayName: 'Electronics', icon: 'smartphone' },
      { id: 'eco', name: 'Eco', displayName: 'Eco-Friendly', icon: 'leaf' },
      { id: 'premium', name: 'Premium', displayName: 'Premium', icon: 'star' }
    ];
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// POST /api/rewards/redeem - Redeem a reward
router.post('/redeem', async (req, res) => {
  try {
    const { rewardId, userId } = req.body;

    if (!rewardId || !userId) {
      return res.status(400).json({ message: 'Reward ID and User ID are required' });
    }

    const reward = mockRewards.find(r => r.id === rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    if (reward.stock <= 0) {
      return res.status(400).json({ message: 'Reward out of stock' });
    }

    // Generate a mock redemption code
    const redemptionCode = 'ECO' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // In a real app, you would:
    // 1. Check user's points
    // 2. Deduct points from user
    // 3. Create redemption record
    // 4. Update reward stock

    res.json({
      success: true,
      code: redemptionCode,
      message: 'Reward redeemed successfully',
      userPoints: 1000 // Mock user points after redemption
    });
  } catch (err) {
    console.error('Error redeeming reward:', err);
    res.status(500).json({ message: 'Error redeeming reward' });
  }
});

export default router;
