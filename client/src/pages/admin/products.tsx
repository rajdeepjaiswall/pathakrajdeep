import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package, Star, Eye, Upload, X, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/cart';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertProductSchema } from '@shared/schema';
import { z } from 'zod';
import { useLocation } from 'wouter';

const productFormSchema = insertProductSchema.extend({
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
});

export default function AdminProducts() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Redirect if not admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Product form
  const productForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '0',
      weight: '',
      category_id: undefined,
      images: [],
      videos: [],
      stock: 0,
      isActive: true,
      hsnCode: '',
      gstRate: '5.00',
      tags: [],
      featured: false,
    },
  });

  // Add/Update product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productFormSchema>) => {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const response = await apiRequest(url, method, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAddingProduct(false);
      setEditingProduct(null);
      productForm.reset();
      toast({
        title: editingProduct ? 'Product updated' : 'Product added',
        description: `Product has been ${editingProduct ? 'updated' : 'added'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingProduct ? 'update' : 'add'} product`,
        variant: 'destructive',
      });
    },
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, stock }: { productId: number; stock: number }) => {
      const response = await apiRequest(`/api/products/${productId}`, 'PUT', { stock });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Stock updated',
        description: 'Product stock has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update stock',
        variant: 'destructive',
      });
    },
  });

  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description || '',
      price: product.price,
      weight: product.weight || '',
      category_id: product.category_id,
      images: product.images || [],
      videos: product.videos || [],
      stock: product.stock,
      isActive: product.isActive,
      hsnCode: product.hsnCode || '',
      gstRate: product.gstRate,
      tags: product.tags || [],
      featured: product.featured,
    });
    setIsAddingProduct(true);
  };

  const handleStockUpdate = (productId: number, newStock: number) => {
    updateStockMutation.mutate({ productId, stock: newStock });
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Products Management</h1>
            <p className="text-gray-600">Manage your bakery products and inventory</p>
          </div>
          <Dialog open={isAddingProduct} onOpenChange={(open) => {
            setIsAddingProduct(open);
            if (!open) {
              setEditingProduct(null);
              productForm.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-champagne text-navy hover:bg-champagne/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit((data) => saveProductMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={productForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={productForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight/Size</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. 500g" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="hsnCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HSN Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="gstRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Rate (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Photo Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Image className="h-5 w-5 text-navy" />
                      <h3 className="text-lg font-semibold text-navy">Product Photos (Up to 4)</h3>
                    </div>
                    <FormField
                      control={productForm.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[...Array(4)].map((_, index) => (
                                <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                  {field.value[index] ? (
                                    <div className="relative">
                                      <img 
                                        src={field.value[index]} 
                                        alt={`Product ${index + 1}`}
                                        className="w-full h-24 object-cover rounded"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                        onClick={() => {
                                          const newImages = [...field.value];
                                          newImages.splice(index, 1);
                                          field.onChange(newImages);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <label 
                                      htmlFor={`image-${index}`}
                                      className="cursor-pointer block w-full h-full"
                                    >
                                      <div className="space-y-2 flex flex-col items-center justify-center h-full">
                                        <Upload className="h-8 w-8 text-gray-400" />
                                        <span className="text-sm text-champagne hover:text-champagne/80">
                                          Click to upload photo
                                        </span>
                                      </div>
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id={`image-${index}`}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            // Convert file to base64 data URL for persistence
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              const imageUrl = event.target?.result as string;
                                              const newImages = [...field.value];
                                              newImages[index] = imageUrl;
                                              field.onChange(newImages);
                                              
                                              toast({
                                                title: "Photo uploaded",
                                                description: `Photo ${index + 1} has been added successfully`,
                                              });
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Video Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-navy" />
                      <h3 className="text-lg font-semibold text-navy">Product Videos (Up to 3)</h3>
                    </div>
                    <FormField
                      control={productForm.control}
                      name="videos"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[...Array(3)].map((_, index) => (
                                <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                  {field.value[index] ? (
                                    <div className="relative">
                                      <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                                        <Video className="h-8 w-8 text-gray-400" />
                                        <span className="ml-2 text-sm text-gray-600">Video {index + 1}</span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                        onClick={() => {
                                          const newVideos = [...field.value];
                                          newVideos.splice(index, 1);
                                          field.onChange(newVideos);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <label 
                                      htmlFor={`video-${index}`}
                                      className="cursor-pointer block w-full h-full"
                                    >
                                      <div className="space-y-2 flex flex-col items-center justify-center h-full">
                                        <Upload className="h-8 w-8 text-gray-400" />
                                        <span className="text-sm text-champagne hover:text-champagne/80">
                                          Click to upload video
                                        </span>
                                      </div>
                                      <Input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        id={`video-${index}`}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            // Convert video file to data URL for persistence
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              const videoUrl = event.target?.result as string;
                                              const newVideos = [...field.value];
                                              newVideos[index] = videoUrl;
                                              field.onChange(newVideos);
                                              
                                              toast({
                                                title: "Video uploaded",
                                                description: `Video ${index + 1} has been added successfully`,
                                              });
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <FormField
                      control={productForm.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Featured Product</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Active</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-champagne text-navy hover:bg-champagne/90"
                    disabled={saveProductMutation.isPending}
                  >
                    {saveProductMutation.isPending ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400">Add some products to get started</p>
            </div>
          ) : (
            filteredProducts.map((product: any) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full bg-gradient-to-br from-almond to-champagne/20 flex items-center justify-center p-2';
                      fallback.innerHTML = `<img src="/api/logo" alt="Pathak Bhandar Logo" class="max-w-[80%] max-h-[80%] object-contain opacity-90" />`;
                      target.parentNode?.appendChild(fallback);
                    }}
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {product.featured && (
                      <Badge className="bg-champagne text-navy">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {!product.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-navy mb-2 truncate">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-navy text-lg">{formatPrice(parseFloat(product.price))}</p>
                      {product.weight && (
                        <p className="text-xs text-gray-500">{product.weight}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {product.stock} in stock
                      </p>
                      <p className="text-xs text-gray-500">GST: {product.gstRate}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Input
                      type="number"
                      value={product.stock}
                      onChange={(e) => handleStockUpdate(product.id, parseInt(e.target.value) || 0)}
                      className="w-20 h-8 text-xs"
                      min="0"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
