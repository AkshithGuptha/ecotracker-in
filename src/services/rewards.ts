import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api';

export interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  image: string;
  stock: number;
  brand: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  postedBy?: {
    id: string;
    name: string;
    type: 'user' | 'ngo';
  };
  isNGOReward?: boolean;
  popularity?: number;
}

export interface Category {
  id: string;
  name: string;
  displayName: string;
  icon: string;
}

export interface RedemptionResponse {
  success: boolean;
  code?: string;
  message?: string;
  userPoints?: number;
}

export const rewardsApi = {
  // Get all rewards
  getRewards: async (): Promise<Reward[]> => {
    const response = await axios.get(`${API_BASE_URL}/rewards`);
    return response.data;
  },

  // Get reward by ID
  getRewardById: async (id: string): Promise<Reward> => {
    const response = await axios.get(`${API_BASE_URL}/rewards/${id}`);
    return response.data;
  },

  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const response = await axios.get(`${API_BASE_URL}/rewards/categories`);
    return response.data;
  },

  // Redeem a reward
  redeemReward: async (rewardId: string, userId: string): Promise<RedemptionResponse> => {
    const response = await axios.post(`${API_BASE_URL}/rewards/redeem`, {
      rewardId,
      userId
    });
    return response.data;
  },

  // Get user's redeemed rewards
  getUserRewards: async (userId: string): Promise<Reward[]> => {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/rewards`);
    return response.data;
  },

  // Get NGO products
  getNGOProducts: async (): Promise<Reward[]> => {
    try {
      console.log('Fetching NGO products from:', `${API_BASE_URL}/rewards/ngo`);
      const response = await axios.get(`${API_BASE_URL}/rewards/ngo`);
      console.log('NGO products response:', response.data);
      return response.data.map((product: any) => ({
        id: product._id || product.id,
        title: product.name,
        description: product.description,
        points: product.pointsRequired,
        category: product.category,
        image: product.imageUrl || product.image || '🎁',
        stock: product.quantity || 0,
        brand: product.ngoName || 'NGO Product',
        price: product.price || 0,
        isActive: product.isActive !== false, // Default to true if not specified
        createdAt: product.createdAt,
        isNGOReward: true,
        postedBy: {
          id: product.ngoId,
          name: product.ngoName || 'NGO',
          type: 'ngo'
        }
      }));
    } catch (error) {
      console.error('Error fetching NGO products:', error);
      throw error;
    }
  }
};
