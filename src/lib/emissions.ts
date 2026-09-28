import { getSession } from 'next-auth/react';
import mongoose from 'mongoose';
import dbConnect from './dbConnect';

// Define User model type
type UserDocument = mongoose.Document & {
  email: string;
  points: number;
  dailyEmissions: Array<{
    date: Date;
    emissions: number;
    pointsEarned: number;
  }>;
  lastEmissionDate?: Date;
  save: () => Promise<UserDocument>;
};

const User = mongoose.models.User as mongoose.Model<UserDocument> || 
  mongoose.model<UserDocument>('User', new mongoose.Schema({
    email: String,
    points: { type: Number, default: 0 },
    dailyEmissions: [{
      date: { type: Date, default: Date.now },
      emissions: Number,
      pointsEarned: { type: Number, default: 0 }
    }],
    lastEmissionDate: Date
  }));

export interface EmissionEntry {
  date: Date;
  emissions: number;
  pointsEarned: number;
}

export interface SaveEmissionResponse {
  success: boolean;
  pointsEarned: number;
  message: string;
}

// Check if user has already saved emissions today
export const hasSavedEmissionsToday = (lastEmissionDate: Date | null): boolean => {
  if (!lastEmissionDate) return false;
  
  const today = new Date();
  const lastDate = new Date(lastEmissionDate);
  
  return (
    lastDate.getDate() === today.getDate() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getFullYear() === today.getFullYear()
  );
};

// Save daily emission data
// @returns Points earned (positive or negative)
export const saveDailyEmission = async (emissions: number): Promise<SaveEmissionResponse> => {
  await dbConnect();
  const session = await getSession();
  
  if (!session?.user?.email) {
    throw new Error('User not authenticated');
  }
  
  const user = await User.findOne({ email: session.user.email });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if already saved today
  const lastEmission = user.dailyEmissions[user.dailyEmissions.length - 1];
  
  if (lastEmission) {
    const lastDate = new Date(lastEmission.date);
    lastDate.setHours(0, 0, 0, 0);
    
    if (lastDate.getTime() === today.getTime()) {
      return {
        success: false,
        pointsEarned: 0,
        message: 'You have already saved your emissions today.'
      };
    }
  }
  
  // Calculate points based on previous day's emissions
  let pointsEarned = 0;
  
  if (lastEmission) {
    if (emissions < lastEmission.emissions) {
      pointsEarned = 10; // Emissions decreased
    } else {
      pointsEarned = -5; // Emissions increased or stayed the same
    }
  }
  
  // Create new emission entry
  const newEntry = {
    date: new Date(),
    emissions,
    pointsEarned
  };
  
  // Update user's points and emission history
  user.points = (user.points || 0) + pointsEarned;
  user.dailyEmissions.push(newEntry);
  user.lastEmissionDate = new Date();
  
  await user.save();
  
  return {
    success: true,
    pointsEarned,
    message: pointsEarned > 0 
      ? `Great job! You earned ${pointsEarned} points for reducing your emissions!`
      : pointsEarned < 0
        ? `Your emissions increased. -5 points. Try to reduce them tomorrow!`
        : 'Emissions saved successfully!'
  };
};

// Get user's emission history
export const getEmissionHistory = async (): Promise<EmissionEntry[]> => {
  await dbConnect();
  const session = await getSession();
  
  if (!session?.user?.email) {
    throw new Error('User not authenticated');
  }
  
  const user = await User.findOne(
    { email: session.user.email },
    { dailyEmissions: 1, _id: 0 }
  );
  
  if (!user) {
    return [];
  }
  
  // Sort by date in ascending order
  return user.dailyEmissions.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};
