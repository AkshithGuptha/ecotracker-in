import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface NgoProduct {
  _id: string;
  name: string;
  description: string;
  pointsRequired: number;
  quantity: number;
  category: string;
  image: string;
  isActive: boolean;
  ngo: {
    _id: string;
    organizationName: string;
    logo?: string;
  };
}

export const getNgoProducts = async (): Promise<NgoProduct[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/ngo/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.products || [];
  } catch (error) {
    console.error('Error fetching NGO products:', error);
    return [];
  }
};

export const redeemNgoProduct = async (productId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/ngo/redeem`,
      { productId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return { success: true, message: response.data.message };
  } catch (error: any) {
    console.error('Error redeeming product:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to redeem product' 
    };
  }
};
