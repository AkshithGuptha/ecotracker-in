import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import User from '../../../models/User';

// Helper function to connect to MongoDB
async function connectDB() {
  if (mongoose.connections[0].readyState) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecotrack', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS method for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: `Method ${req.method} not allowed` 
    });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to save emissions'
      });
    }

    // Validate request body
    const { emissions } = req.body;
    if (typeof emissions !== 'number' || emissions < 0 || isNaN(emissions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emissions value. Must be a positive number.'
      });
    }

    // Connect to database
    await connectDB();
    
    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize points earned
    let pointsEarned = 5; // Default points for first emission
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has previous emissions
    if (user.dailyEmissions && user.dailyEmissions.length > 0) {
      const lastEmission = user.dailyEmissions[user.dailyEmissions.length - 1];
      const lastEmissionDate = new Date(lastEmission.date);
      lastEmissionDate.setHours(0, 0, 0, 0);

      // Check if already saved today
      if (lastEmissionDate.getTime() === today.getTime()) {
        return res.status(400).json({
          success: false,
          message: 'You have already saved your emissions for today.'
        });
      }

      // Calculate points based on previous day's emissions
      pointsEarned = emissions < lastEmission.emissions ? 10 : -5;
    }

    // Add new emission entry
    user.dailyEmissions = user.dailyEmissions || [];
    user.dailyEmissions.push({
      date: new Date(),
      emissions,
      pointsEarned
    });

    // Update user points
    user.points = (user.points || 0) + pointsEarned;
    user.lastEmissionDate = new Date();
    
    // Save the user document
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Emissions saved successfully!',
      pointsEarned,
      totalPoints: user.points || 0
    });
    
  } catch (error) {
    console.error('Error saving emissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save emissions. Please try again.'
    });
  }
}
