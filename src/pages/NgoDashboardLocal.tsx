import * as React from 'react';
const { useState, useEffect } = React;
// Simple ID generator function
const generateId = () => Math.random().toString(36).substr(2, 9);
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
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  X,
  Pencil,
  Package,
  Upload,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";

// Types
type NgoProduct = {
  _id: string;
  name: string;
  description: string;
  pointsRequired: number;
  quantity: number;
  category: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type NgoProfile = {
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
};

// Sample data
const sampleProducts: NgoProduct[] = [
  {
    _id: '1',
    name: 'Eco-Friendly Tote Bag',
    description: 'Reusable cotton tote bag with NGO logo',
    pointsRequired: 500,
    quantity: 50,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Stainless Steel Water Bottle',
    description: 'Eco-friendly water bottle to reduce plastic waste',
    pointsRequired: 750,
    quantity: 30,
    category: 'eco-friendly',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'Bamboo Toothbrush Set',
    description: 'Set of 4 biodegradable bamboo toothbrushes',
    pointsRequired: 300,
    quantity: 100,
    category: 'personal-care',
    image: 'https://images.unsplash.com/photo-1584308666744-5f34a8b9fdee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const sampleProfile: NgoProfile = {
  organizationName: 'Green Earth Foundation',
  email: 'contact@greenearth.org',
  contactPerson: 'Sarah Johnson',
  phone: '+1 (555) 123-4567',
  address: '123 Eco Street',
  city: 'San Francisco',
  state: 'California',
  pincode: '94103',
  registrationNumber: 'NGO-2023-12345',
  website: 'https://greenearth.org',
  logo: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  description: 'Dedicated to preserving our planet through sustainable practices and community engagement. We work on reforestation, waste reduction, and environmental education programs.',
  isVerified: true
};

// Local storage keys
const LOCAL_STORAGE_KEYS = {
  NGO_PRODUCTS: 'ngo_products',
  NGO_PROFILE: 'ngo_profile'
};

// Helper functions for local storage
const getLocalStorageItem = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setLocalStorageItem = <T,>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const NgoDashboardLocal: React.FC = () => {
  // State
  const [products, setProducts] = useState<NgoProduct[]>(() => 
    getLocalStorageItem(LOCAL_STORAGE_KEYS.NGO_PRODUCTS, sampleProducts)
  );
  const [profile, setProfile] = useState<NgoProfile>(() =>
    getLocalStorageItem(LOCAL_STORAGE_KEYS.NGO_PROFILE, sampleProfile)
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState<NgoProduct | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsRequired: 100,
    quantity: 1,
    category: 'eco-friendly',
    isActive: true,
    image: ''
  });

  // Save to local storage when data changes
  useEffect(() => {
    setLocalStorageItem(LOCAL_STORAGE_KEYS.NGO_PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    setLocalStorageItem(LOCAL_STORAGE_KEYS.NGO_PROFILE, profile);
  }, [profile]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pointsRequired' || name === 'quantity' 
        ? Math.max(0, parseInt(value) || 0)
        : value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload (simulated)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, you would upload the file to a server
    // For demo purposes, we'll just create a local URL for preview
    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
    
    // Simulate upload delay
    setIsSubmitting(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        image: imageUrl
      }));
      setIsSubmitting(false);
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    }, 1000);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pointsRequired: 100,
      quantity: 1,
      category: 'eco-friendly',
      isActive: true,
      image: ''
    });
    setImagePreview(null);
    setEditingProduct(null);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (editingProduct) {
        // Update existing product
        const updatedProduct = {
          ...editingProduct,
          ...formData,
          updatedAt: new Date().toISOString()
        };
        
        setProducts(products.map(p => 
          p._id === editingProduct._id ? updatedProduct : p
        ));
        
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        // Add new product
        const newProduct: NgoProduct = {
          _id: generateId(),
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setProducts([...products, newProduct]);
        
        toast({
          title: 'Success',
          description: 'Product added successfully',
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: NgoProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      pointsRequired: product.pointsRequired,
      quantity: product.quantity,
      category: product.category,
      isActive: product.isActive,
      image: product.image
    });
    setImagePreview(product.image || null);
    setIsDialogOpen(true);
  };

  // Handle delete product
  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setProducts(products.filter(p => p._id !== productId));
      
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive'
      });
    }
  };

  // Toggle product status
  const toggleProductStatus = (product: NgoProduct) => {
    const updatedProduct = {
      ...product,
      isActive: !product.isActive,
      updatedAt: new Date().toISOString()
    };
    
    setProducts(products.map(p => 
      p._id === updatedProduct._id ? updatedProduct : p
    ));
    
    toast({
      title: 'Success',
      description: `Product ${updatedProduct.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  };

  // Open dialog for adding new product
  const openAddProductDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Get product count by status
  const activeProductsCount = products.filter(p => p.isActive).length;
  const inactiveProductsCount = products.length - activeProductsCount;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">NGO Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile.organizationName}
          </p>
        </div>
        <Button 
          onClick={openAddProductDialog}
          className="mt-4 md:mt-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <CardDescription className="text-2xl font-bold">{products.length}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
            <CardDescription className="text-2xl font-bold text-green-600">
              {activeProductsCount}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Products</CardTitle>
            <CardDescription className="text-2xl font-bold text-amber-600">
              {inactiveProductsCount}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly CO₂ Saved</CardTitle>
            <CardDescription className="text-2xl font-bold text-blue-600">
              1,245 kg
              <span className="text-sm text-green-600 ml-2">+12%</span>
            </CardDescription>
            <CardDescription className="text-xs text-muted-foreground">
              vs last week
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Your Products</CardTitle>
                  <CardDescription>
                    Manage the products available for redemption through your NGO
                  </CardDescription>
                </div>
                <div className="mt-4 md:mt-0">
                  <Input 
                    placeholder="Search products..." 
                    className="w-full md:w-64"
                    // Add search functionality if needed
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No products yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by adding a new product.
                  </p>
                  <Button 
                    onClick={openAddProductDialog}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {product.category}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.pointsRequired}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Switch
                                checked={product.isActive}
                                onCheckedChange={() => toggleProductStatus(product)}
                                className="mr-2"
                              />
                              <Badge variant={product.isActive ? 'default' : 'outline'}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteProduct(product._id)}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>
                View and manage your organization's information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                          {profile.logo ? (
                            <img 
                              src={profile.logo} 
                              alt={profile.organizationName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-16 w-16 text-muted-foreground" />
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                          disabled
                          title="Change logo (demo disabled)"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Change logo</span>
                        </Button>
                      </div>
                      <h2 className="mt-4 text-xl font-bold">{profile.organizationName}</h2>
                      <Badge className="mt-2" variant={profile.isVerified ? 'default' : 'outline'}>
                        {profile.isVerified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        <a href={`mailto:${profile.email}`} className="hover:underline">
                          {profile.email}
                        </a>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`} className="hover:underline">
                          {profile.phone}
                        </a>
                      </div>
                      <div className="flex items-start text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                          {[profile.address, profile.city, profile.state, profile.pincode]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                      {profile.website && (
                        <div className="flex items-center text-muted-foreground">
                          <Globe className="h-4 w-4 mr-2" />
                          <a 
                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {profile.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Registration Number</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile.registrationNumber || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">About Us</h3>
                      <div className="prose max-w-none">
                        <p className="text-muted-foreground">
                          {profile.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Organization Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Total Products
                            </CardTitle>
                            <CardDescription className="text-2xl font-bold">
                              {products.length}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Active Products
                            </CardTitle>
                            <CardDescription className="text-2xl font-bold text-green-600">
                              {activeProductsCount}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Member Since
                            </CardTitle>
                            <CardDescription className="text-lg font-medium">
                              {new Date('2023-01-15').toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long' 
                              })}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Account Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <h4 className="font-medium">Email Notifications</h4>
                            <p className="text-sm text-muted-foreground">
                              Receive email notifications about your account
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <h4 className="font-medium">Two-Factor Authentication</h4>
                            <p className="text-sm text-muted-foreground">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Button disabled>Edit Profile (Demo)</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update the product details below.'
                : 'Fill in the details below to add a new product for redemption.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Eco-friendly water bottle"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your product in detail..."
                    rows={4}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pointsRequired">Points Required *</Label>
                    <Input
                      id="pointsRequired"
                      name="pointsRequired"
                      type="number"
                      min="1"
                      value={formData.pointsRequired}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleInputChange}
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
                      <SelectItem value="eco-friendly">Eco-friendly</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="home">Home & Living</SelectItem>
                      <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingProduct ? 'Updating...' : 'Adding...'}
                  </>
                ) : editingProduct ? (
                  'Update Product'
                ) : (
                  'Add Product'
                )}
              </Button>
            </DialogFooter>
          </form>
            </DialogContent>
          </Dialog>
        </div>
      
    );
  };
  
  export default NgoDashboardLocal;
