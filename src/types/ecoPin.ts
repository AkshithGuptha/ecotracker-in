export interface EcoPin {
  id?: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  type: 'ewaste' | 'shops' | 'ngos' | 'other';
  userId: string;
  createdAt: any; // Firestore timestamp
  updatedAt?: any; // Optional Firestore timestamp
  rating?: number;
  address?: string;
  phone?: string;
  hours?: string;
  points?: number;
  verified?: boolean;
  visitors?: number;
}
