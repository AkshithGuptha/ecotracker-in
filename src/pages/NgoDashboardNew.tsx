import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon, 
  X,
  Pencil,
  Package,
  Upload,
  Loader2
} from 'lucide-react';
import { 
  getNgoProfile, 
  getNgoProducts, 
  addNgoProduct, 
  updateNgoProduct, 
  deleteNgoProduct,
  uploadProductImage,
  NgoProduct,
  NgoProfile
} from '@/lib/api/ngo';

const NgoDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<NgoProfile | null>(null);
  const [products, setProducts] = useState<NgoProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState<NgoProduct | null>(null);
  
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

  // Fetch NGO profile and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [profileData, productsData] = await Promise.all([
          getNgoProfile(),
          getNgoProducts()
        ]);
        setProfile(profileData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load NGO dashboard data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const { url } = await uploadProductImage(file);
      setFormData(prev => ({
        ...prev,
        image: url
      }));
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
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
    setEditingProduct(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (editingProduct) {
        // Update existing product
        const updatedProduct = await updateNgoProduct(editingProduct._id, formData);
        setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        // Add new product
        const newProduct = await addNgoProduct({
          ...formData,
          isActive: true
        });
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
    setIsDialogOpen(true);
  };

  // Handle delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteNgoProduct(productId);
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
  const toggleProductStatus = async (product: NgoProduct) => {
    try {
      const updatedProduct = await updateNgoProduct(product._id, {
        isActive: !product.isActive
      });
      setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      toast({
        title: 'Success',
        description: `Product ${updatedProduct.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product status',
        variant: 'destructive'
      });
    }
  };

  // Open dialog for adding new product
  const openAddProductDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">NGO Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.organizationName || 'NGO Admin'}
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
              <CardTitle>Your Products</CardTitle>
              <CardDescription>
                Manage the products available for redemption through your NGO
              </CardDescription>
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
                <div className="rounded-md border
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>
                Update your organization's information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Organization Details</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Organization Name</Label>
                        <Input value={profile.organizationName} disabled />
                      </div>
                      <div>
                        <Label>Registration Number</Label>
                        <Input value={profile.registrationNumber || 'Not provided'} disabled />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          value={profile.description || 'No description provided'} 
                          disabled 
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Contact Person</Label>
                        <Input value={profile.contactPerson || 'Not provided'} disabled />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={profile.email} disabled />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={profile.phone || 'Not provided'} disabled />
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Textarea 
                          value={[
                            profile.address,
                            profile.city,
                            profile.state,
                            profile.pincode
                          ].filter(Boolean).join(', ') || 'Not provided'} 
                          disabled 
                          className="min-h-[80px]"
                        />
                      </div>
                      {profile.website && (
                        <div>
                          <Label>Website</Label>
                          <Input value={profile.website} disabled />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Unable to load profile information</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button disabled>Edit Profile (Coming Soon)</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
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
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
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
                        <SelectItem value="food">Food & Beverages</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product Image</Label>
                    {formData.image ? (
                      <div className="relative group">
                        <img
                          src={formData.image}
                          alt="Product preview"
                          className="w-full h-48 object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove image</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Upload className="h-10 w-10 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">
                            <Label
                              htmlFor="image-upload"
                              className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/90"
                            >
                              Upload an image
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              or drag and drop
                            </p>
                          </div>
                          <Input
                            id="image-upload"
                            name="image"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageUpload}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isActive: checked }))
                      }
                    />
                    <Label htmlFor="isActive">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Label>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formData.isActive 
                        ? 'This product will be visible to users.'
                        : 'This product will be hidden from users.'}
                    </span>
                  </div>
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

export default NgoDashboard;
