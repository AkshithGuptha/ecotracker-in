import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth, authFetch } from '@/lib/auth';
import { toast } from 'sonner';
import { ShoppingBag, Leaf, Droplets, Recycle, Sun, ExternalLink, DollarSign } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  link?: string;
  pointsRequired: number;
  quantity: number;
  image: string;
  category: string;
  ngoName: string;
}

// Static product data for fallback
const staticProducts: Product[] = [
  {
    id: '1',
    name: 'Eco-Friendly Water Bottle',
    description: 'Stainless steel, keeps drinks cold for 24 hours and hot for 12 hours.',
    price: 25.99,
    pointsRequired: 500,
    quantity: 10,
    image: '/images/water-bottle.jpg',
    category: 'Accessories',
    ngoName: 'Green Earth NGO'
  },
  {
    id: '2',
    name: 'Reusable Shopping Bag',
    description: 'Durable, washable, and can carry up to 20kg of groceries.',
    price: 15.50,
    pointsRequired: 300,
    quantity: 20,
    image: '/images/shopping-bag.jpg',
    category: 'Accessories',
    ngoName: 'Eco Warriors'
  },
  {
    id: '3',
    name: 'Bamboo Toothbrush Set',
    description: 'Set of 4 biodegradable bamboo toothbrushes with charcoal bristles.',
    price: 12.99,
    pointsRequired: 400,
    quantity: 15,
    image: '/images/toothbrush.jpg',
    category: 'Personal Care',
    ngoName: 'Sustainable Living'
  },
  {
    id: '4',
    name: 'Solar-Powered Charger',
    description: 'Portable solar charger for your mobile devices with 10,000mAh battery.',
    price: 49.99,
    pointsRequired: 1500,
    quantity: 5,
    image: '/images/solar-charger.jpg',
    category: 'Electronics',
    ngoName: 'Renewable Energy Inc'
  },
  {
    id: '5',
    name: 'Organic Cotton Tote',
    description: 'Spacious tote bag made from 100% organic cotton, perfect for daily use.',
    price: 18.75,
    pointsRequired: 350,
    quantity: 25,
    image: '/images/cotton-tote.jpg',
    category: 'Fashion',
    ngoName: 'Organic Textiles'
  },
  {
    id: '6',
    name: 'Beeswax Food Wraps',
    description: 'Set of 3 reusable food wraps, a sustainable alternative to plastic wrap.',
    price: 22.00,
    pointsRequired: 450,
    quantity: 12,
    image: '/images/beeswax-wraps.jpg',
    category: 'Kitchen',
    ngoName: 'Zero Waste Foundation'
  }
];

const RedeemPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [registeredProducts, setRegisteredProducts] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState<{[key: string]: boolean}>({});
  
  // Fetch products from API
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/products`);
        if (response.ok) {
          const data = await response.json();
          const mappedProducts = data.map((p: any) => ({
            id: p._id || p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            link: p.link,
            pointsRequired: p.pointsRequired,
            quantity: p.quantity,
            image: p.imageUrl || p.image || '/images/placeholder-product.jpg',
            category: p.category,
            ngoName: p.ngoName
          }));
          setProducts(mappedProducts);
        } else {
          setError('Failed to load products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Load user's registered products on mount
  React.useEffect(() => {
    const fetchRegisteredProducts = async () => {
      if (!user) return;

      try {
        const response = await authFetch('/api/registrations/my-registrations');

        if (response.ok) {
          const registrations = await response.json();
          const productIds = new Set(registrations.map((r: any) => String(r.productId)));
          setRegisteredProducts(productIds);
        }
      } catch (error) {
        console.error('Error fetching registrations:', error);
      }
    };

    fetchRegisteredProducts();
  }, [user]);

  const handleRedeem = async (productId: string, pointsRequired: number) => {
    if (!user) {
      toast.error('Please log in to register for products');
      return;
    }

    if (user.points < pointsRequired) {
      toast.error('You do not have enough points to redeem this product');
      return;
    }

    setIsLoading(prev => ({ ...prev, [productId]: true }));

    try {
      const response = await authFetch('/api/registrations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register for product');
      }

      setRegisteredProducts(prev => new Set<string>([...prev, productId]));
      toast.success('Successfully registered for the product!');

    } catch (err) {
      console.error('Error registering for product:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to register. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Always include static products in the reward section
  const displayProducts = React.useMemo(() => {
    return [...products, ...staticProducts];
  }, [products]);

  // Helper function to get appropriate icon based on category
  const getProductIcon = (category: string) => {
    if (!category) return null;
    
    const normalizedCategory = category.toLowerCase().trim();
    
    switch (normalizedCategory) {
      case 'accessories':
        return <ShoppingBag className="h-16 w-16 text-blue-500" />;
      case 'personal care':
        return <Droplets className="h-16 w-16 text-blue-300" />;
      case 'electronics':
        return <Sun className="h-16 w-16 text-yellow-500" />;
      case 'fashion':
        return <Leaf className="h-16 w-16 text-green-500" />;
      case 'kitchen':
        return <Recycle className="h-16 w-16 text-green-700" />;
      default:
        return <ShoppingBag className="h-16 w-16 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <DotLottieReact
          src="https://assets.lottiefiles.com/packages/lf20_hc4fJPHsnd.json"
          loop
          autoplay
          style={{ width: '50px', height: '50px' }}
        />
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-destructive">Error loading products. Using demo data.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Eco Rewards</h1>
        <p className="text-muted-foreground">Redeem your points for sustainable products</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayProducts.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
              {getProductIcon(product.category) || (
                <ShoppingBag className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>by {product.ngoName}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{product.category}</span>
                  <span className="text-lg font-semibold text-green-600">
                    {product.pointsRequired} pts
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">${product.price}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.quantity} available
                  </span>
                </div>
                {product.link && (
                  <div className="flex items-center space-x-1">
                    <ExternalLink className="h-4 w-4 text-blue-500" />
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Product
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => handleRedeem(product.id, product.pointsRequired)}
                disabled={registeredProducts.has(product.id) || isLoading[product.id]}
              >
                {isLoading[product.id] ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : registeredProducts.has(product.id) ? (
                  'Registered'
                ) : (
                  'Register Now'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RedeemPage;
