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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { addToCart } = useCart();

  const { data: product, isLoading } = useQuery<any>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const mediaItems = (() => {
    if (!product) return [];
    const photos = (product.images || []).filter((url: string) => url && url.trim()).map((url: string) => ({ type: 'image' as const, url }));
    const videos = (product.videos || []).filter((url: string) => url && url.trim()).map((url: string) => ({ type: 'video' as const, url }));
    return [...photos, ...videos];
  })();

  useEffect(() => {
    if (mediaItems.length <= 1 || isZoomed) return;

    const currentMedia = mediaItems[currentIndex];
    
    if (currentMedia?.type === 'image') {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, mediaItems.length, isZoomed]);

  const handleVideoEnd = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

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

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-white shadow-lg group">
              {mediaItems.length > 0 ? (
                mediaItems[currentIndex].type === 'video' ? (
                  <video
                    ref={videoRef}
                    key={mediaItems[currentIndex].url}
                    src={mediaItems[currentIndex].url}
                    autoPlay
                    muted
                    onEnded={handleVideoEnd}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div 
                    className={`w-full h-full transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  >
                    <img
                      src={mediaItems[currentIndex].url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )
              ) : (
                <img
                  src="/placeholder-product.jpg"
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
                      setIsZoomed(false);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <ChevronLeft className="w-6 h-6 text-navy" />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
                      setIsZoomed(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <ChevronRight className="w-6 h-6 text-navy" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {mediaItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsZoomed(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex ? 'bg-champagne w-4' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
            {mediaItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsZoomed(false);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentIndex === index ? 'border-champagne ring-2 ring-champagne/30' : 'border-gray-200'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-navy flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" fill="white" />
                      </div>
                    ) : (
                      <img src={item.url} className="w-full h-full object-cover" alt="" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
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
                  onClick={() => addToCart(product.id, quantity)}
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
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
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
          </Tabs>
        </div>
      </div>
      <Footer />
      <MobileNav />
      <CartSidebar />
    </div>
  );
}
