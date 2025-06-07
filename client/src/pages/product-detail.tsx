import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Star, Plus, Minus, Heart, Share2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/cart';

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  // Fetch product reviews
  const { data: reviews = [] } = useQuery({
    queryKey: [`/api/products/${id}/reviews`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="h-96 bg-gray-200 rounded-lg" />
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-navy mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
  };

  const rating = reviews.length > 0 
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
    : 4.5;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Media Gallery */}
          <div className="space-y-4">
            {(() => {
              // Create combined media array
              const mediaItems = [];
              if (product.images && product.images.length > 0) {
                product.images.forEach((url, index) => {
                  if (url) mediaItems.push({ type: 'image', url, index });
                });
              }
              if (product.videos && product.videos.length > 0) {
                product.videos.forEach((url, index) => {
                  if (url) mediaItems.push({ type: 'video', url, index: product.images?.length + index || index });
                });
              }
              
              if (mediaItems.length === 0) {
                mediaItems.push({ type: 'image', url: '/placeholder-product.jpg', index: 0 });
              }
              
              const currentMedia = mediaItems[selectedImage] || mediaItems[0];
              
              return (
                <>
                  <div className="aspect-square rounded-lg overflow-hidden bg-white">
                    {currentMedia.type === 'video' ? (
                      <video
                        src={currentMedia.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={currentMedia.url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {mediaItems.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {mediaItems.map((media, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            selectedImage === index ? 'border-champagne' : 'border-transparent'
                          }`}
                        >
                          {media.type === 'video' ? (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-600">Video</span>
                            </div>
                          ) : (
                            <img
                              src={media.url}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.featured && (
                  <Badge className="bg-champagne text-navy">Bestseller</Badge>
                )}
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({reviews.length} reviews)</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-navy mb-4">{product.name}</h1>
              <p className="text-gray-600 text-lg">{product.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-navy">
                  {formatPrice(parseFloat(product.price))}
                </span>
                {product.weight && (
                  <span className="text-gray-500">/ {product.weight}</span>
                )}
              </div>
              <p className="text-green-600 text-sm">
                + {formatPrice(parseFloat(product.price) * parseFloat(product.gstRate) / 100)} GST included
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium text-navy">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-champagne text-navy hover:bg-champagne/90"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="sm" className="p-3">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="p-3">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product Details */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-navy">Weight:</span>
                    <p className="text-gray-600">{product.weight || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-navy">GST Rate:</span>
                    <p className="text-gray-600">{product.gstRate}%</p>
                  </div>
                  <div>
                    <span className="font-medium text-navy">HSN Code:</span>
                    <p className="text-gray-600">{product.hsnCode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-navy">Stock:</span>
                    <p className="text-gray-600">{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-600 leading-relaxed">
                    {product.description || 'No detailed description available.'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ingredients" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-600">
                    Ingredients information will be displayed here when available.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                    </CardContent>
                  </Card>
                ) : (
                  reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className="font-medium text-navy">{review.user?.username}</span>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
      <MobileNav />
      <CartSidebar />
    </div>
  );
}
