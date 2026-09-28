import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  Gift, 
  ShoppingBag, 
  Coffee, 
  Leaf, 
  Star, 
  Package, 
  QrCode, 
  Search, 
  Filter, 
  ArrowUpDown,
  Heart,
  Share2,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { getPoints, POINTS_EVENT } from "@/lib/carbon";
import { toast } from "@/hooks/use-toast";
import { rewardsApi } from "@/services/rewards";

type Reward = {
  id: string;
  title: string;
  description: string;
  points: number;
  stock: number;
  price: number;
  brand?: string;
  image?: string;
  category?: string;
  terms?: string;
  popularity?: number;
  createdAt?: string | Date;
};

type Category = {
  id: string;
  name: string;
  displayName: string;
  icon: string;
};

type SortOption = 'points-asc' | 'points-desc' | 'popularity' | 'newest';
type PriceRange = [number, number];

// Default categories if API fails
const defaultCategories: Category[] = [
  { id: 'all', name: 'All', displayName: 'All Rewards', icon: 'gift' },
  { id: 'lifestyle', name: 'Lifestyle', displayName: 'Lifestyle', icon: 'shopping-bag' },
  { id: 'food', name: 'Food & Drinks', displayName: 'Food & Drinks', icon: 'coffee' },
  { id: 'eco', name: 'Eco', displayName: 'Eco-Friendly', icon: 'leaf' },
  { id: 'premium', name: 'Premium', displayName: 'Premium', icon: 'star' },
];

const Rewards = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<number>(getPoints());
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [ngoProducts, setNGOProducts] = useState<Reward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNGOProducts, setShowNGOProducts] = useState<boolean>(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [redemptionCode, setRedemptionCode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('points-asc');
  const [priceRange, setPriceRange] = useState<PriceRange>([0, 1000]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(9);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Calculate discount percentage based on points (1% per 200 points)
  const discountPercent = Math.floor(userPoints / 200);

  // Fetch rewards, NGO products, and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [rewardsData, categoriesData] = await Promise.all([
          rewardsApi.getRewards(),
          rewardsApi.getCategories()
        ]);

        setRewards(rewardsData);
        setCategories(categoriesData);

        // Try to fetch NGO products, but don't fail if they don't exist yet
        try {
          console.log('Attempting to fetch NGO products...');
          const ngoProductsData = await rewardsApi.getNGOProducts();
          console.log('NGO products fetched successfully:', ngoProductsData.length, 'products');
          setNGOProducts(ngoProductsData);
        } catch (ngoError) {
          console.warn('NGO products not available yet:', ngoError);
          setNGOProducts([]);
        }

        setUserPoints(getPoints());
      } catch (error) {
        console.error('Error fetching rewards:', error);
        toast({
          title: 'Error',
          description: 'Failed to load rewards. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Listen for points updates
    const handlePointsUpdate = () => setUserPoints(getPoints());
    window.addEventListener(POINTS_EVENT, handlePointsUpdate);
    return () => window.removeEventListener(POINTS_EVENT, handlePointsUpdate);
  }, []);

  // Apply all filters and sorting
  useEffect(() => {
    // Combine regular rewards and NGO products
    const allRewards = [...rewards, ...ngoProducts];
    console.log('Combining rewards:', {
      regular: rewards.length,
      ngo: ngoProducts.length,
      total: allRewards.length
    });

    let result = allRewards;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(reward => reward.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        reward => 
          reward.title.toLowerCase().includes(query) ||
          reward.description.toLowerCase().includes(query) ||
          reward.brand?.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    result = result.filter(
      reward => reward.points >= priceRange[0] && reward.points <= priceRange[1]
    );

    // Sort results
    result.sort((a, b) => {
      switch (sortBy) {
        case 'points-asc':
          return a.points - b.points;
        case 'points-desc':
          return b.points - a.points;
        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'newest':
          return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
        default:
          return 0;
      }
    });

    setFilteredRewards(result);
  }, [rewards, ngoProducts, selectedCategory, searchQuery, sortBy, priceRange, showNGOProducts]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRewards.length / itemsPerPage);
  const paginatedRewards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRewards.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRewards, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy, priceRange]);

  // Toggle favorite
  const toggleFavorite = useCallback((rewardId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(rewardId)) {
        newFavorites.delete(rewardId);
      } else {
        newFavorites.add(rewardId);
      }
      return newFavorites;
    });
  }, []);

  // Share reward
  const shareReward = useCallback(async (reward: Reward) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: reward.title,
          text: `Check out this reward: ${reward.description}`,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied to clipboard',
          description: 'Share this reward with others!',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, []);

  // Get icon component for category
  const getIconComponent = useCallback((iconName: string) => {
    const iconMap = {
      'gift': <Gift className="h-5 w-5" />,
      'shopping-bag': <ShoppingBag className="h-5 w-5" />,
      'coffee': <Coffee className="h-5 w-5" />,
      'leaf': <Leaf className="h-5 w-5" />,
      'star': <Star className="h-5 w-5" />,
      'package': <Package className="h-5 w-5" />,
      'award': <Award className="h-5 w-5" />,
    } as const;
    
    return iconMap[iconName as keyof typeof iconMap] || <Gift className="h-5 w-5" />;
  }, []);

  // Handle reward redemption
  const handleRedeem = useCallback((reward: Reward) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to redeem rewards.',
        variant: 'destructive',
      });
      return;
    }

    if (userPoints < reward.points) {
      toast({
        title: 'Not enough points',
        description: `You need ${reward.points - userPoints} more points to redeem this reward.`,
        variant: 'destructive',
      });
      return;
    }

    if (reward.stock <= 0) {
      toast({
        title: 'Out of stock',
        description: 'This reward is currently out of stock. Please check back later!',
        variant: 'destructive',
      });
      return;
    }

    setSelectedReward(reward);
  }, [user, userPoints]);

  // Confirm redemption
  const confirmRedeem = useCallback(async () => {
    if (!selectedReward || !user) return;

    try {
      setIsRedeeming(true);
      const response = await rewardsApi.redeemReward(selectedReward.id, user.id);
      
      if (response.success) {
        setRedemptionCode(response.code || '');
        setUserPoints(prevPoints => response.userPoints ?? prevPoints - selectedReward.points);
        
        // Update rewards list
        setRewards(prevRewards => 
          prevRewards.map(r => 
            r.id === selectedReward.id 
              ? { ...r, stock: Math.max(0, r.stock - 1) } 
              : r
          )
        );
        
        toast({
          title: 'Success!',
          description: 'Your reward has been redeemed successfully!',
        });
      } else {
        throw new Error(response.message || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to redeem reward. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRedeeming(false);
    }
  }, [selectedReward, user, rewards]);

  // Loading skeleton
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Rewards Marketplace</h1>
              <p className="text-muted-foreground">
                Redeem your points for exclusive rewards and discounts
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Skeleton className="h-10 w-full pl-10" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
          
          {/* Rewards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
                <Skeleton className="h-48 w-full" />
                <CardHeader className="relative">
                  <div className="absolute right-4 top-4">
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center justify-between mt-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          {/* Pagination Skeleton */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-md" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Main component render
  return (
    <>
      <DashboardLayout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Award className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rewards</h1>
              <p className="text-gray-600">Redeem your eco-points for sustainable products</p>
            </div>
          </div>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userPoints}</div>
              <div className="text-sm text-gray-600">Available Points</div>
              <div className="mt-2 text-xs text-gray-600">
                Discount: <span className="font-semibold">{discountPercent}%</span> (every 200 coins = 1%)
              </div>
            </div>
          </Card>
        </div>

        {/* Categories and Filters */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              All Rewards ({filteredRewards.length} available)
            </Button>
            <div className="text-sm text-muted-foreground">
              {ngoProducts.length > 0 && (
                <span>Including {ngoProducts.length} NGO product{ngoProducts.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          
          {!showNGOProducts && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="shrink-0"
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="shrink-0"
                >
                  {getIconComponent(category.icon)}
                  <span className="ml-2">{category.name}</span>
                </Button>
              ))}
            </div>
          )}

        {/* Rewards Grid */}
        {filteredRewards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => (
              <Card key={reward.id} className={`overflow-hidden transition-all hover:shadow-md ${reward.isNGOReward ? 'border-l-4 border-l-green-500' : ''}`}>
                <div className="h-48 bg-muted/50 flex items-center justify-center text-6xl">
                  {reward.image || '🎁'}
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                    <div className="flex flex-col items-end gap-1">
                      {reward.isNGOReward && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          NGO Product
                        </Badge>
                      )}
                      <Badge variant="secondary" className="shrink-0">
                        {reward.points} pts
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {reward.description}
                  </CardDescription>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <span className="font-medium">{reward.brand}</span>
                    <span className="mx-2">•</span>
                    <span>${(reward.price / 100).toFixed(2)}</span>
                  </div>
                </CardHeader>
                <CardFooter className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {reward.stock > 0 ? (
                      <span className="text-green-500">In Stock ({reward.stock})</span>
                    ) : (
                      <span className="text-red-500">Out of Stock</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    disabled={reward.stock <= 0 || userPoints < reward.points}
                    onClick={() => handleRedeem(reward)}
                  >
                    Redeem
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No rewards found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedCategory === 'all' 
                ? 'Check back later for new rewards!' 
                : 'No rewards available in this category.'}
            </p>
          </div>
        )}
      </div>
      
        </div>
      </DashboardLayout>

      {/* Reward Details & Redemption Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={(open) => !open && setSelectedReward(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedReward && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {redemptionCode ? 'Reward Redeemed!' : selectedReward.title}
                </DialogTitle>
                <DialogDescription>
                  {redemptionCode 
                    ? 'Here\'s your redemption code. Show it to claim your reward.'
                    : `Redeem this reward for ${selectedReward.points.toLocaleString()} points`
                  }
                </DialogDescription>
              </DialogHeader>
              
              {redemptionCode ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg text-center">
                    <div className="mx-auto w-48 h-48 bg-white rounded-lg border-2 border-dashed border-green-300 flex flex-col items-center justify-center p-4">
                      <QrCode className="w-24 h-24 text-green-500 mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm font-mono bg-white px-3 py-2 rounded border border-green-200">
                          {redemptionCode}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valid until {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>How to use your reward</AlertTitle>
                      <AlertDescription className="mt-2">
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Show this code at checkout or to the cashier</li>
                          <li>One-time use only</li>
                          <li>Valid for 30 days</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(redemptionCode);
                          toast({
                            title: 'Copied to clipboard!',
                            description: 'Share your code with the merchant.',
                          });
                        }}
                      >
                        Copy Code
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => shareReward(selectedReward)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-muted/50 rounded-lg overflow-hidden">
                    <div className="h-48 w-full bg-muted/30 flex items-center justify-center text-6xl">
                      {selectedReward.image || '🎁'}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{selectedReward.title}</h3>
                          <p className="text-sm text-muted-foreground">{selectedReward.brand}</p>
                        </div>
                        <Badge variant="secondary" className="text-base px-3 py-1.5">
                          {selectedReward.points.toLocaleString()} pts
                        </Badge>
                      </div>
                      
                      <div className="mt-4 space-y-4">
                        <Separator />
                        
                        <div className="space-y-3">
                          <h4 className="font-medium">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedReward.description}
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium">Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Expires in 30 days</span>
                            </div>
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{selectedReward.stock} available</span>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Your points</span>
                            <span className="font-medium">{userPoints.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Cost</span>
                            <span className="text-amber-500 font-medium">-{selectedReward.points.toLocaleString()}</span>
                          </div>
                          <div className="h-px bg-border my-1" />
                          <div className="flex justify-between font-medium">
                            <span>Remaining balance</span>
                            <span className={userPoints - selectedReward.points < 0 ? 'text-red-500' : 'text-green-600'}>
                              {(userPoints - selectedReward.points).toLocaleString()} points
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedReward.terms && (
                    <div className="bg-muted/30 p-4 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Terms & Conditions</h4>
                      <p className="text-xs text-muted-foreground">{selectedReward.terms}</p>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter className="sm:flex sm:flex-row-reverse sm:justify-between">
                {redemptionCode ? (
                  <Button 
                    onClick={() => {
                      setSelectedReward(null);
                      setRedemptionCode('');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Done
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedReward(null)}
                      disabled={isRedeeming}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={confirmRedeem}
                      disabled={
                        isRedeeming || 
                        !selectedReward || 
                        userPoints < selectedReward.points ||
                        selectedReward.stock <= 0
                      }
                      className="w-full sm:w-auto"
                    >
                      {isRedeeming ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : userPoints < selectedReward.points ? (
                        `Need ${(selectedReward.points - userPoints).toLocaleString()} more points`
                      ) : selectedReward.stock <= 0 ? (
                        'Out of Stock'
                      ) : (
                        'Confirm Redemption'
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Rewards;
