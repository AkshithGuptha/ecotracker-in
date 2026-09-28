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
  ngoId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NgoProfile {
  _id: string;
  organizationName: string;
  email: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  registrationNumber: string;
  website: string;
  logo: string;
  description: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get NGO profile
export const getNgoProfile = async (): Promise<NgoProfile> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/ngo/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching NGO profile:', error);
    throw error;
  }
};

// Get all NGO products
export const getNgoProducts = async (): Promise<NgoProduct[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/ngo/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data.products || [];
  } catch (error) {
    console.error('Error fetching NGO products:', error);
    return [];
  }
};

// Add new product
export const addNgoProduct = async (productData: Omit<NgoProduct, '_id' | 'ngoId' | 'createdAt' | 'updatedAt'>): Promise<NgoProduct> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/ngo/products`,
      productData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.product;
  } catch (error) {
    console.error('Error adding NGO product:', error);
    throw error;
  }
};

// Update product
export const updateNgoProduct = async (productId: string, productData: Partial<NgoProduct>): Promise<NgoProduct> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${API_URL}/ngo/products/${productId}`,
      productData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.product;
  } catch (error) {
    console.error('Error updating NGO product:', error);
    throw error;
  }
};

// Delete product
export const deleteNgoProduct = async (productId: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/ngo/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error deleting NGO product:', error);
    throw error;
  }
};

// Upload product image
export const uploadProductImage = async (file: File): Promise<{ url: string }> => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(
      `${API_URL}/ngo/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
