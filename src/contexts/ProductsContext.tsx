import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, type User } from '@/lib/auth';
import { toast } from 'sonner';

export interface Product {
  _id?: string;
  id?: string; // For backward compatibility
  name: string;
  description: string;
  pointsRequired: number;
  quantity: number;
  image?: string;
  imageUrl?: string; // For backward compatibility
  category: string;
  ngoId: string;
  ngoName: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductInput = Omit<Product, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'ngoId' | 'ngoName'> & {
  ngoId: string;
  ngoName: string;
};

interface ProductsContextType {
  products: Product[];
  addProduct: (product: ProductInput) => Promise<Product>;
  updateProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  user?: User | null;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch from an API here
        // For now, we'll use local storage
        const savedProducts = localStorage.getItem('ngoProducts');
        if (savedProducts) {
          setProducts(JSON.parse(savedProducts));
        }
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Save products to local storage whenever they change
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('ngoProducts', JSON.stringify(products));
    }
  }, [products]);

  const addProduct = async (productData: ProductInput): Promise<Product> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('User must be logged in to add a product');
      }
      
      if (user.role !== 'ngo') {
        throw new Error('Only NGOs can add products');
      }
      
      const newProduct: Product = {
        ...productData,
        _id: `product-${Date.now()}`,
        id: `product-${Date.now()}`,
        image: productData.image || productData.imageUrl || '',
        imageUrl: productData.image || productData.imageUrl || '',
        isActive: true,
        ngoId: user.id,
        ngoName: user.name || user.email || 'Unknown NGO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setProducts(prev => [...prev, newProduct]);
      toast.success('Product added successfully');
      return newProduct;
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Failed to add product');
      toast.error('Failed to add product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productData: Product): Promise<Product> => {
    try {
      setLoading(true);
      if (!productData._id) {
        throw new Error('Product ID is required for update');
      }
      
      const updatedProduct: Product = {
        ...productData,
        updatedAt: new Date().toISOString(),
        image: productData.image || productData.imageUrl || '',
        imageUrl: productData.image || productData.imageUrl || '',
      };
      
      setProducts(prev => 
        prev.map(p => p._id === productData._id ? updatedProduct : p)
      );
      
      toast.success('Product updated successfully');
      return updatedProduct;
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
      toast.error('Failed to update product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deleted successfully');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      toast.error('Failed to delete product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        loading,
        error,
        user,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
