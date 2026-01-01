import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Star, Plus, Minus, Heart, Share2, ShoppingCart, Play, Image, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [mediaTab, setMediaTab] = useState<'videos' | 'photos'>('videos');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
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

  // Auto-select the right tab based on available media
  useEffect(() => {
    if (product) {
      const hasVideos = product.videos && product.videos.some((v: string) => v && v.trim());
      const hasPhotos = product.images && product.images.some((p: string) => p && p.trim());
      
      if (hasVideos) {
        setMediaTab('videos');
      } else if (hasPhotos) {
        setMediaTab('photos');
      }
      setCurrentIndex(0);
    }
  }, [product]);

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
          {/* Product Media Gallery with Switch Buttons */}
          <div className="space-y-4">
            {(() => {
              const videos: string[] = (product.videos || []).filter((url: string) => url && url.trim());
              const photos: string[] = (product.images || []).filter((url: string) => url && url.trim());
              
              const hasVideos = videos.length > 0;
              const hasPhotos = photos.length > 0;
              
              const currentItems = mediaTab === 'videos' ? videos : photos;
              const safeIndex = Math.min(currentIndex, Math.max(0, currentItems.length - 1));
              
              const handleSwipe = () => {
                if (!touchStart || !touchEnd) return;
                const distance = touchStart - touchEnd;
                const minSwipeDistance = 50;
                
                if (Math.abs(distance) > minSwipeDistance) {
                  if (distance > 0 && safeIndex < currentItems.length - 1) {
                    setCurrentIndex(safeIndex + 1);
                  } else if (distance < 0 && safeIndex > 0) {
                    setCurrentIndex(safeIndex - 1);
                  }
                }
                setTouchStart(null);
                setTouchEnd(null);
              };
              
              const handleTabChange = (tab: 'videos' | 'photos') => {
                setMediaTab(tab);
                setCurrentIndex(0);
              };
              
              return (
                <>
                  {/* Small Switch Buttons */}
                  {(hasVideos || hasPhotos) && (
                    <div className="flex justify-center gap-2 mb-2">
                      {hasVideos && (
                        <button
                          onClick={() => handleTabChange('videos')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            mediaTab === 'videos' 
                              ? 'bg-navy text-white shadow-md' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          data-testid="switch-videos"
                        >
                          <Play className="w-3 h-3" />
                          Videos ({videos.length})
                        </button>
                      )}
                      {hasPhotos && (
                        <button
                          onClick={() => handleTabChange('photos')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            mediaTab === 'photos' 
                              ? 'bg-navy text-white shadow-md' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          data-testid="switch-photos"
                        >
                          <Image className="w-3 h-3" />
                          Photos ({photos.length})
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Main Media Display with Swipe */}
                  <div 
                    className="relative aspect-square rounded-lg overflow-hidden bg-white shadow-lg"
                    onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                    onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                    onTouchEnd={handleSwipe}
                  >
                    {currentItems.length > 0 ? (
                      mediaTab === 'videos' ? (
                        <video
                          key={currentItems[safeIndex]}
                          src={currentItems[safeIndex]}
                          autoPlay
                          muted
                          loop
                          controls
                          playsInline
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : (
                        <img
                          src={currentItems[safeIndex]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <img
                        src="/placeholder-product.jpg"
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Navigation Arrows */}
                    {currentItems.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentIndex(Math.max(0, safeIndex - 1))}
                          className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-md transition-opacity ${
                            safeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white'
                          }`}
                          disabled={safeIndex === 0}
                          data-testid="nav-prev"
                        >
                          <ChevronLeft className="w-5 h-5 text-navy" />
                        </button>
                        <button
                          onClick={() => setCurrentIndex(Math.min(currentItems.length - 1, safeIndex + 1))}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-md transition-opacity ${
                            safeIndex === currentItems.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white'
                          }`}
                          disabled={safeIndex === currentItems.length - 1}
                          data-testid="nav-next"
                        >
                          <ChevronRight className="w-5 h-5 text-navy" />
                        </button>
                      </>
                    )}
                    
                    {/* Dot Indicators */}
                    {currentItems.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {currentItems.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === safeIndex ? 'bg-champagne w-4' : 'bg-white/60 hover:bg-white/80'
                            }`}
                            data-testid={`dot-${index}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Strip */}
                  {currentItems.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {currentItems.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            safeIndex === index ? 'border-champagne ring-2 ring-champagne/30' : 'border-gray-200 hover:border-champagne/50'
                          }`}
                        >
                          {mediaTab === 'videos' ? (
                            <div className="w-full h-full bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center">
                              <Play className="w-5 h-5 text-white" fill="white" />
                            </div>
                          ) : (
                            <img
                              src={url}
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
            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-600">{product.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ingredients" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  {product.ingredients && product.ingredients.length > 0 ? (
                    <ul className="space-y-2">
                      {product.ingredients.map((ingredient: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-champagne font-bold mt-1">•</span>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No ingredients listed</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
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
