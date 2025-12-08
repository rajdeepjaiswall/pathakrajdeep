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
  ingredients: z.array(z.string()).default([]),
});

export default function AdminProducts() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

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
  const productForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '0',
      weight: '',
      category_id: undefined,
      images: [] as string[],
      videos: [] as string[],
      ingredients: [] as string[],
      stock: 0,
      isActive: true,
      hsnCode: '',
      gstRate: '5.00',
      tags: [] as string[],
      featured: false,
    },
  });

  // Add/Update product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productFormSchema>) => {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      // Filter out videos (too large) but keep images
      // Only exclude very large base64 images (over 500KB) to avoid 413 errors
      const filteredImages = (data.images || []).filter(img => {
        if (!img) return false;
        // Allow URL-based images (Unsplash, etc.)
        if (!img.startsWith('data:')) return true;
        // For base64, check size - limit to 500KB
        const base64Data = img.split(',')[1] || '';
        const sizeInBytes = Math.ceil(base64Data.length * 0.75);
        return sizeInBytes < 500 * 1024;
      });
      
      const submitData = {
        ...data,
        images: filteredImages,
        videos: [], // Videos are too large, exclude them
      };
      
      const response = await apiRequest(method, url, submitData);
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
      const response = await apiRequest('PUT', `/api/products/${productId}`, { stock });
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
      ingredients: product.ingredients || [],
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
                                      {uploadProgress[`image-${index}`] !== undefined ? (
                                        <div className="flex flex-col items-center justify-center h-full space-y-2">
                                          <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-champagne animate-spin" />
                                          <span className="text-xs text-navy font-semibold">{uploadProgress[`image-${index}`]}%</span>
                                          <span className="text-xs text-gray-600">Uploading...</span>
                                        </div>
                                      ) : (
                                        <div className="space-y-2 flex flex-col items-center justify-center h-full">
                                          <Upload className="h-8 w-8 text-gray-400" />
                                          <span className="text-sm text-champagne hover:text-champagne/80">
                                            Click to upload photo
                                          </span>
                                        </div>
                                      )}
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id={`image-${index}`}
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const progressKey = `image-${index}`;
                                            setUploadProgress(prev => ({ ...prev, [progressKey]: 10 }));
                                            
                                            try {
                                              const reader = new FileReader();
                                              
                                              reader.onprogress = (event) => {
                                                if (event.lengthComputable) {
                                                  const progress = Math.round((event.loaded / event.total) * 50);
                                                  setUploadProgress(prev => ({ ...prev, [progressKey]: progress }));
                                                }
                                              };
                                              
                                              reader.onload = async (readerEvent) => {
                                                try {
                                                  setUploadProgress(prev => ({ ...prev, [progressKey]: 60 }));
                                                  const dataUrl = readerEvent.target?.result as string;
                                                  
                                                  const img = document.createElement('img');
                                                  img.src = dataUrl;
                                                  
                                                  await new Promise<void>((resolve, reject) => {
                                                    img.onload = () => resolve();
                                                    img.onerror = () => reject(new Error('Image load failed'));
                                                    setTimeout(() => resolve(), 3000);
                                                  });
                                                  
                                                  setUploadProgress(prev => ({ ...prev, [progressKey]: 80 }));
                                                  
                                                  const canvas = document.createElement('canvas');
                                                  const maxWidth = 800;
                                                  let { width, height } = img;
                                                  
                                                  if (width > maxWidth) {
                                                    height = (height * maxWidth) / width;
                                                    width = maxWidth;
                                                  }
                                                  
                                                  canvas.width = width || 800;
                                                  canvas.height = height || 600;
                                                  const ctx = canvas.getContext('2d');
                                                  
                                                  if (ctx && img.complete && img.naturalWidth > 0) {
                                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                                    
                                                    const newImages = [...field.value];
                                                    newImages[index] = compressedDataUrl;
                                                    field.onChange(newImages);
                                                  } else {
                                                    const newImages = [...field.value];
                                                    newImages[index] = dataUrl;
                                                    field.onChange(newImages);
                                                  }
                                                  
                                                  setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
                                                  
                                                  setTimeout(() => {
                                                    setUploadProgress(prev => {
                                                      const { [progressKey]: _, ...rest } = prev;
                                                      return rest;
                                                    });
                                                  }, 500);
                                                  
                                                  toast({
                                                    title: "Photo uploaded",
                                                    description: `Photo ${index + 1} has been added`,
                                                  });
                                                } catch (error) {
                                                  console.error('Image processing error:', error);
                                                  const dataUrl = readerEvent.target?.result as string;
                                                  const newImages = [...field.value];
                                                  newImages[index] = dataUrl;
                                                  field.onChange(newImages);
                                                  
                                                  setUploadProgress(prev => {
                                                    const { [progressKey]: _, ...rest } = prev;
                                                    return rest;
                                                  });
                                                  
                                                  toast({
                                                    title: "Photo uploaded",
                                                    description: `Photo ${index + 1} added (original size)`,
                                                  });
                                                }
                                              };
                                              
                                              reader.onerror = () => {
                                                setUploadProgress(prev => {
                                                  const { [progressKey]: _, ...rest } = prev;
                                                  return rest;
                                                });
                                                toast({
                                                  title: "Error",
                                                  description: "Failed to read file",
                                                  variant: "destructive",
                                                });
                                              };
                                              
                                              reader.readAsDataURL(file);
                                            } catch (error) {
                                              console.error('Upload error:', error);
                                              setUploadProgress(prev => {
                                                const { [progressKey]: _, ...rest } = prev;
                                                return rest;
                                              });
                                              toast({
                                                title: "Error",
                                                description: "Failed to upload image",
                                                variant: "destructive",
                                              });
                                            }
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

                  {/* Ingredients Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-navy">Ingredients</h3>
                    </div>
                    <FormField
                      control={productForm.control}
                      name="ingredients"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-2">
                              {field.value.map((ingredient, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={ingredient}
                                    onChange={(e) => {
                                      const newIngredients = [...field.value];
                                      newIngredients[index] = e.target.value;
                                      field.onChange(newIngredients);
                                    }}
                                    placeholder={`Ingredient ${index + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      const newIngredients = field.value.filter((_, i) => i !== index);
                                      field.onChange(newIngredients);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => field.onChange([...field.value, ''])}
                              >
                                Add Ingredient
                              </Button>
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
                                      <video 
                                        src={field.value[index]} 
                                        className="w-full h-24 bg-gray-100 rounded object-cover"
                                        controls
                                        preload="metadata"
                                      />
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
                                      {uploadProgress[`video-${index}`] !== undefined ? (
                                        <div className="flex flex-col items-center justify-center h-full space-y-2">
                                          <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-champagne animate-spin" />
                                          <span className="text-xs text-navy font-semibold">{uploadProgress[`video-${index}`]}%</span>
                                          <span className="text-xs text-gray-600">Uploading...</span>
                                        </div>
                                      ) : (
                                        <div className="space-y-2 flex flex-col items-center justify-center h-full">
                                          <Upload className="h-8 w-8 text-gray-400" />
                                          <span className="text-sm text-champagne hover:text-champagne/80">
                                            Click to upload video
                                          </span>
                                        </div>
                                      )}
                                      <Input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        id={`video-${index}`}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const progressKey = `video-${index}`;
                                            setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
                                            
                                            const reader = new FileReader();
                                            reader.onprogress = (event) => {
                                              if (event.lengthComputable) {
                                                const percent = Math.round((event.loaded / event.total) * 100);
                                                setUploadProgress(prev => ({ ...prev, [progressKey]: percent }));
                                              }
                                            };
                                            reader.onload = (event) => {
                                              const videoUrl = event.target?.result as string;
                                              const newVideos = [...field.value];
                                              newVideos[index] = videoUrl;
                                              field.onChange(newVideos);
                                              
                                              setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
                                              setTimeout(() => {
                                                setUploadProgress(prev => {
                                                  const { [progressKey]: _, ...rest } = prev;
                                                  return rest;
                                                });
                                              }, 500);
                                              
                                              toast({
                                                title: "Video uploaded",
                                                description: `Video ${index + 1} has been added successfully`,
                                              });
                                            };
                                            reader.onerror = () => {
                                              setUploadProgress(prev => {
                                                const { [progressKey]: _, ...rest } = prev;
                                                return rest;
                                              });
                                              toast({
                                                title: "Error",
                                                description: "Failed to upload video",
                                                variant: "destructive",
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
