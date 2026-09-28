import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { clearToken } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  LogOut,
  Check,
  Trash2,
  Image as ImageIcon,
  X,
  Pencil,
  Package,
  Plus,
  Leaf
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Types
interface Specification {
  key: string;
  value: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  pointsRequired: number;
  price: number;
  category: string;
  condition: 'new' | 'used';
  productLink: string;
  image: string;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  pointsRequired: number;
  price: number;
  category: string;
  condition: 'new' | 'used';
  productLink: string;
  image: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const NgoDashboard = () => {
  // Navigation
  const navigate = useNavigate();

  // Available categories for the dropdown
  const categories = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Kitchen',
    'Sports & Outdoors',
    'Toys & Games',
    'Beauty & Personal Care',
    'Other'
  ];

  // State
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [ngoProfile, setNgoProfile] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    pointsRequired: 0,
    price: 0,
    category: '',
    condition: 'new',
    productLink: '',
    image: ''
  });
  
  const [imageUrl, setImageUrl] = useState('');

  // API utility function
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      throw new Error('Authentication required');
    }

    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `/api/ngo${normalizedEndpoint}`;

    try {
      console.log('Making API request:', {
        url,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(options.headers || {})
        },
        body: options.body ? JSON.parse(options.body as string) : undefined
      });

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(options.headers || {})
        }
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        responseData = { raw: responseText };
      }

      if (!response.ok) {
        // Log the raw response text for debugging
        console.error('Raw error response:', responseText);
        
        // Log structured error details
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseData,
          timestamp: new Date().toISOString()
        };
        
        console.error('API Error Response:', JSON.stringify(errorDetails, null, 2));
        
        // Try to extract a meaningful error message
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        
        // Check different possible error message locations
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (responseData?.data?.message) {
          errorMessage = responseData.data.message;
        } else if (responseText) {
          errorMessage = `Server responded with: ${responseText.substring(0, 200)}...`;
        }
        
        // Create a more detailed error object
        const error = new Error(errorMessage);
        (error as any).response = errorDetails;
        throw error;
      }

      if (response.status === 204) {
        return {};
      }

      return responseData;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenDialog = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        pointsRequired: product.pointsRequired,
        price: product.price || 0,
        category: product.category,
        condition: product.condition as 'new' | 'used',
        productLink: product.productLink || '',
        image: product.image
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        pointsRequired: 0,
        price: 0,
        category: '',
        condition: 'new',
        productLink: '',
        image: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        image: imageUrl.trim()
      }));
      setImageUrl('');
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
  };

  // Using the handleLogout function defined later in the component

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      setLoading(true);
      await apiRequest(`/products/${productId}`, {
        method: 'DELETE'
      });
      
      setProducts(prev => prev.filter(p => p._id !== productId));
      
      setSnackbar({
        open: true,
        message: 'Product deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete product',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const endpoint = editingProduct 
        ? `/products/${editingProduct._id}`
        : '/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      // Prepare the request payload
      const payload = {
        name: formData.name,
        description: formData.description,
        pointsRequired: Number(formData.pointsRequired),
        price: Number(formData.price),
        category: formData.category,
        condition: formData.condition,
        productLink: formData.productLink || '',
        image: formData.image,
        isAvailable: true
      };
      
      console.log('Submitting product data:', JSON.stringify(payload, null, 2));
      
      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh the products list after successful submission
      await fetchProducts();
      
      setSnackbar({
        open: true,
        message: `Product ${editingProduct ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save product',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch NGO profile function
  const fetchNgoProfile = async () => {
    try {
      const profile = await apiRequest('/profile');
      setNgoProfile(profile);
    } catch (error) {
      console.error('Error fetching NGO profile:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load NGO profile',
        severity: 'error'
      });
    }
  };

  // Fetch products function
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch products for the current authenticated NGO
      const products = await apiRequest('/products');
      setProducts(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load products',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile and products on component mount
  useEffect(() => {
    fetchNgoProfile();
    fetchProducts();
  }, []);

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">NGO Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* NGO Profile Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage your profile information</CardTitle>
          <Button variant="outline" size="sm">
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {ngoProfile ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      {ngoProfile.logo ? (
                        <AvatarImage src={ngoProfile.logo} alt={ngoProfile.organizationName} />
                      ) : (
                        <AvatarFallback className="h-20 w-20 bg-green-100 text-green-600">
                          <Leaf className="h-10 w-10" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{ngoProfile.organizationName}</h3>
                    <p className="text-sm text-muted-foreground">{ngoProfile.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{ngoProfile.contactPerson}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{ngoProfile.phone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{ngoProfile.address}, {ngoProfile.city}, {ngoProfile.state} - {ngoProfile.pincode}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-medium">{ngoProfile.registrationNumber}</p>
                </div>
              </div>

              {/* Right Column - About & Stats */}
              <div className="lg:col-span-2 space-y-6">
                {/* About Section */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">About</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {ngoProfile.description || 'No description available. Add a description to tell about your organization.'}
                  </p>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{products.length}</div>
                    <div className="text-sm text-muted-foreground">Products</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {products.filter(p => p.isAvailable).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Joined {ngoProfile.createdAt ? new Date(ngoProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Account Settings */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Account Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email notifications about your account</p>
                        <p className="text-sm text-muted-foreground">Get important updates about your account via email</p>
                      </div>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-factor authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Switch id="two-factor" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <DotLottieReact
                src="https://assets.lottiefiles.com/packages/lf20_hc4fJPHsnd.json"
                loop
                autoplay
                style={{ width: '40px', height: '40px' }}
              />
              <span className="ml-2 text-muted-foreground">Loading profile...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <DotLottieReact
            src="https://assets.lottiefiles.com/packages/lf20_hc4fJPHsnd.json"
            loop
            autoplay
            style={{ width: '50px', height: '50px' }}
          />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">No products yet</h3>
          <p className="mt-1 text-muted-foreground">Get started by adding a new product.</p>
          <Button className="mt-4" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product._id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Points</p>
                    <p className="font-medium">{product.pointsRequired}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-medium">₹{product.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium capitalize">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Condition</p>
                    <p className="font-medium capitalize">{product.condition}</p>
                  </div>
                </div>
                {product.productLink && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-1">Product Link</p>
                    <a 
                      href={product.productLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {product.productLink}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <div className="fixed inset-0 bg-black/50 z-40" aria-hidden="true" />
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update the product details below.' 
                : 'Fill in the details to add a new product.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pointsRequired">Points Required *</Label>
                <Input
                  id="pointsRequired"
                  name="pointsRequired"
                  type="number"
                  min="0"
                  value={formData.pointsRequired}
                  onChange={handleChange}
                  placeholder="Enter points required"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price (INR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => handleSelectChange('condition', value as 'new' | 'used')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Product Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter detailed product description"
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productLink">Product Link (Optional)</Label>
                <Input
                  id="productLink"
                  name="productLink"
                  type="url"
                  value={formData.productLink}
                  onChange={handleChange}
                  placeholder="https://example.com/product"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Product Image *</Label>
                {formData.image ? (
                  <div className="border rounded-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[300px]">
                        {formData.image}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      placeholder="Enter image URL"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddImage}
                      disabled={!imageUrl.trim()}
                    >
                      Add
                    </Button>
                  </div>
                )}
                {!formData.image && (
                  <p className="text-sm text-muted-foreground">
                    Add a direct image URL (e.g., https://example.com/image.jpg)
                  </p>
                )}
              </div>
              
            </div>

            <DialogFooter className="sticky bottom-0 bg-background border-t p-4">
              <Button 
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editingProduct ? 'Updating...' : 'Creating...'}
                  </>
                ) : editingProduct ? (
                  'Update Product'
                ) : (
                  'Create Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      {snackbar.open && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div 
            className={`px-6 py-3 rounded-md shadow-lg flex items-center ${
              snackbar.severity === 'error' 
                ? 'bg-destructive text-destructive-foreground' 
                : snackbar.severity === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {snackbar.severity === 'success' && <Check className="h-5 w-5 mr-2" />}
            {snackbar.severity === 'error' && <X className="h-5 w-5 mr-2" />}
            <span>{snackbar.message}</span>
            <button 
              onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
              className="ml-4"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NgoDashboard;
