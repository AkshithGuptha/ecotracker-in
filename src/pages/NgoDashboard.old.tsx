import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Tag, 
  ListChecks, 
  Link as LinkIcon,
  FileText,
  X,
  Eye,
  EyeOff,
  Pencil,
  ArrowLeft,
  ArrowRight,
  Check,
  Package
} from 'lucide-react';
import { authFetch } from "@/lib/auth";

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
  quantity: number;
  category: string;
  condition: string;
  isAvailable: boolean;
  image: string;
  additionalImages: string[];
  tags: string[];
  specifications: Specification[];
  createdAt?: string;
  updatedAt?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  pointsRequired: number;
  quantity: number;
  category: string;
  condition: string;
  isAvailable: boolean;
  image: string;
  additionalImages: string[];
  tags: string[];
  specifications: Specification[];
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const NgoDashboard = () => {
  // Navigation
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
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
    quantity: 1,
    category: '',
    condition: 'new',
    isAvailable: true,
    image: '',
    additionalImages: [],
    tags: [],
    specifications: []
  });
  
  const [newTag, setNewTag] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newSpecification, setNewSpecification] = useState<Specification>({ 
    key: '', 
    value: '' 
  });

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
        quantity: product.quantity,
        category: product.category,
        condition: product.condition,
        isAvailable: product.isAvailable,
        image: product.image,
        additionalImages: [...product.additionalImages],
        tags: [...product.tags],
        specifications: [...product.specifications]
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        pointsRequired: 0,
        quantity: 1,
        category: '',
        condition: 'new',
        isAvailable: true,
        image: '',
        additionalImages: [],
        tags: [],
        specifications: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addImage = () => {
    if (newImage.trim() && !formData.additionalImages.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        additionalImages: [...prev.additionalImages, newImage.trim()]
      }));
      setNewImage('');
    }
  };

  const removeImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter(img => img !== imageToRemove)
    }));
  };

  const addSpecification = () => {
    if (newSpecification.key.trim() && newSpecification.value.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: [...prev.specifications, { ...newSpecification }]
      }));
      setNewSpecification({ key: '', value: '' });
    }
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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
      
      const result = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData)
      });
      
      const updatedProduct = result.data || result;
      
      if (editingProduct) {
        setProducts(prev => 
          prev.map(p => p._id === editingProduct._id ? updatedProduct : p)
        );
      } else {
        setProducts(prev => [...prev, updatedProduct]);
      }
      
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

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      throw new Error('Authentication required');
    }

    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `/api/ngo${normalizedEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Request failed' };
        }
        throw new Error(errorData.message || 'Request failed');
      }

      if (response.status === 204) {
        return {};
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return {};
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('/products');
        const products = Array.isArray(response) ? response : (response?.data || []);
        setProducts(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load products. Please try again later.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addImage = () => {
    if (newImage.trim() && !formData.additionalImages.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        additionalImages: [...prev.additionalImages, newImage.trim()]
      }));
      setNewImage('');
    }
  };

  const removeImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter(img => img !== imageToRemove)
    }));
  };

  const addSpecification = () => {
    if (newSpecification.key.trim() && newSpecification.value.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: [...prev.specifications, { ...newSpecification }]
      }));
      setNewSpecification({ key: '', value: '' });
    }
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const endpoint = editingProduct 
        ? `/products/${editingProduct._id}`
        : '/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const result = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData)
      });
      
      const updatedProduct = result.data || result;
      
      if (editingProduct) {
        setProducts(prev => 
          prev.map(p => p._id === editingProduct._id ? updatedProduct : p)
        );
      } else {
        setProducts(prev => [...prev, updatedProduct]);
      }
      
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

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      throw new Error('Authentication required');
    }

    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `/api/ngo${normalizedEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Request failed' };
        }
        throw new Error(errorData.message || 'Request failed');
      }

      // For DELETE requests that might not return content
      if (response.status === 204) {
        return {};
      }

      // Only try to parse JSON if there's content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return {};
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('/products');
        const products = Array.isArray(response) ? response : (response?.data || []);
        setProducts(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load products. Please try again later.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      const response = await apiRequest(`/api/ngo/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      // Remove the product from the list
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
      
      const result = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData)
      });
      
      if (editingProduct) {
        setProducts(prev => 
          prev.map(p => p._id === editingProduct._id ? result.data : p)
        );
      } else {
        setProducts(prev => [...prev, result.data]);
      }
      
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

  // API utility function
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      throw new Error('Authentication required');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const response = await fetch(`/api/ngo${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Request failed');
      }

      // For DELETE requests that might not return content
      if (response.status === 204) {
        return {};
      }

      return await response.json();
    } catch (error) {
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NGO Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and track redemptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="mt-6">
          {products.length === 0 ? (
            <Card className="text-center p-8">
              <div className="flex justify-center mb-4">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No products added yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first product
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product._id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm p-0"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm p-0"
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                        {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
                        {product.pointsRequired} pts
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <Badge variant="outline" className="text-xs">
                        Qty: {product.quantity}
                      </Badge>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenDialog(product)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(product._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update the product details below.'
                : 'Fill in the details to add a new product.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Electronics, Clothing"
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
                  placeholder="Enter points"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  name="condition"
                  value={formData.condition}
                  onValueChange={(value) => handleSelectChange('condition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isAvailable: checked }))
                    }
                  />
                  <Label htmlFor="isAvailable">Available for redemption</Label>
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Main Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.image}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, image: e.target.value }))
                    }
                    placeholder="Enter image URL"
                  />
                </div>
                {formData.image && (
                  <div className="mt-2">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="h-32 w-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Additional Images</Label>
                <div className="space-y-2">
                  {formData.additionalImages.map((img, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={img}
                        onChange={(e) => {
                          const newImages = [...formData.additionalImages];
                          newImages[index] = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            additionalImages: newImages
                          }));
                        }}
                        placeholder="Enter image URL"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeImage(img)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="Add another image URL"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={addImage}
                      disabled={!newImage.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="opacity-70 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={addTag}
                    disabled={!newTag.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Specifications</Label>
                <div className="space-y-2">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={spec.key}
                        onChange={(e) => {
                          const newSpecs = [...formData.specifications];
                          newSpecs[index] = { ...spec, key: e.target.value };
                          setFormData(prev => ({
                            ...prev,
                            specifications: newSpecs
                          }));
                        }}
                        placeholder="Key (e.g., Color)"
                      />
                      <Input
                        value={spec.value}
                        onChange={(e) => {
                          const newSpecs = [...formData.specifications];
                          newSpecs[index] = { ...spec, value: e.target.value };
                          setFormData(prev => ({
                            ...prev,
                            specifications: newSpecs
                          }));
                        }}
                        placeholder="Value (e.g., Red)"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpecification(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newSpecification.key}
                      onChange={(e) => 
                        setNewSpecification(prev => ({ ...prev, key: e.target.value }))
                      }
                      placeholder="Key (e.g., Weight)"
                    />
                    <Input
                      value={newSpecification.value}
                      onChange={(e) => 
                        setNewSpecification(prev => ({ ...prev, value: e.target.value }))
                      }
                      placeholder="Value (e.g., 1kg)"
                      onKeyDown={(e) => 
                        e.key === 'Enter' && (e.preventDefault(), addSpecification())
                      }
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={addSpecification}
                      disabled={!newSpecification.key.trim() || !newSpecification.value.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-background border-t p-4">
              <Button 
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
            className={`px-4 py-2 rounded-md ${
              snackbar.severity === 'error' 
                ? 'bg-destructive text-destructive-foreground' 
                : snackbar.severity === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-primary text-primary-foreground'
            } shadow-lg flex items-center gap-2`}
          >
            {snackbar.message}
            <button 
              onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
              className="opacity-80 hover:opacity-100"
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
