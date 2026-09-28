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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS method for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(200).json([]); // Return empty array if not authenticated
    }

    // Connect to database
    await connectDB();
    
    // Find user and get emissions
    const user = await User.findOne(
      { email: session.user.email },
      { dailyEmissions: 1, points: 1, lastEmissionDate: 1 }
    );

    if (!user) {
      return res.status(200).json([]); // Return empty array if user has no emissions
    }

    // Sort emissions by date in descending order (newest first)
    const sortedEmissions = [...(user.dailyEmissions || [])].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return res.status(200).json(sortedEmissions || []);
      
  } catch (error) {
    console.error('Error fetching emission history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emission history. Please try again.'
    });
  }
}
