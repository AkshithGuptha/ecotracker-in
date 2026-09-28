import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth, authFetch } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { type Product } from '@/contexts/ProductsContext';

interface AddProductProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<Product>;
}

interface FormData {
  name: string;
  description: string;
  price: number | string;
  link: string;
  pointsRequired: number | string;
  quantity: number | string;
  category: string;
  image: string;
}

export default function AddProduct({ onSuccess, onCancel, initialData }: AddProductProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    link: initialData?.link || '',
    pointsRequired: initialData?.pointsRequired || '',
    quantity: initialData?.quantity || '',
    category: initialData?.category || '',
    image: initialData?.image || '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || '',
        link: initialData.link || '',
        pointsRequired: initialData.pointsRequired || '',
        quantity: initialData.quantity || '',
        category: initialData.category || '',
        image: initialData.image || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image file size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.pointsRequired || !formData.quantity || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to add a product');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        link: formData.link || '',
        pointsRequired: Number(formData.pointsRequired),
        quantity: Number(formData.quantity),
        category: formData.category,
        imageUrl: formData.image,
      };

      const response = await authFetch('/api/ngo/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add product');
      }
      
      toast.success(initialData ? 'Product updated successfully' : 'Product added successfully');
      
      if (onSuccess) {
        onSuccess();
      } else {
        setFormData({
          name: '',
          description: '',
          price: '',
          link: '',
          pointsRequired: '',
          quantity: '',
          category: '',
          image: '',
        });
      }
      
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Failed to ${initialData ? 'update' : 'add'} product. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl font-bold">
            {initialData ? 'Edit Product' : 'Add New Product'}
          </CardTitle>
          <CardDescription>
            {initialData ? 'Update the product details below.' : 'Fill in the details to add a new product.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium text-gray-800">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="font-medium text-gray-800">
                  Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="home">Home & Living</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsRequired" className="font-medium text-gray-800">
                  Points Required *
                </Label>
                <Input
                  id="pointsRequired"
                  name="pointsRequired"
                  type="number"
                  min="1"
                  value={formData.pointsRequired}
                  onChange={handleChange}
                  placeholder="Enter points required"
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="font-medium text-gray-800">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="font-medium text-gray-800">
                  Price *
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link" className="font-medium text-gray-800">
                  Product Link
                </Label>
                <Input
                  id="link"
                  name="link"
                  type="url"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="Enter product link (optional)"
                  className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image" className="font-medium text-gray-800">
                  Product Image
                </Label>
                <div
                  className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <div className="mx-auto w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">Click to upload an image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (max. 2MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="font-medium text-gray-800">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  required
                  rows={4}
                  className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {initialData ? 'Updating...' : 'Adding...'}
                  </span>
                ) : initialData ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
