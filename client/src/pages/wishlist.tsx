import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, ShoppingCart, Clock, Repeat, ArrowLeft } from 'lucide-react';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { ProductCardWithWishlist } from '@/components/product-card-with-wishlist';
import { QuoteCard } from '@/components/QuoteCard';
import { getRandomFoodQuote } from '@/data/foodQuotes';
import { useLocation } from 'wouter';
import { OptimizedImage } from '@/components/ui/optimized-image';

export default function WishlistPage() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { wishlistItems, previousOrders, isLoading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('wishlist');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <div className="max-w-md mx-auto text-center space-y-6 pt-20">
          <Heart className="w-16 h-16 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold text-navy">Your Wishlist Awaits!</h1>
          <p className="text-gray-600">Please log in to view your saved favorites and order history.</p>
          <Button 
            onClick={() => setLocation('/login')}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Log In to Continue
          </Button>
          <QuoteCard 
            text={getRandomFoodQuote('love').text}
            movie={getRandomFoodQuote('love').movie}
          />
        </div>
      </div>
    );
  }

  const handleOrderAgain = (productId: number) => {
    addToCart(productId, 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="text-amber-600 hover:text-amber-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                My Favorites
              </h1>
              <p className="text-gray-600">Your saved items and order history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Wishlist ({wishlistItems.length})
            </TabsTrigger>
            <TabsTrigger value="order-again" className="flex items-center gap-2">
              <Repeat className="w-4 h-4" />
              Order Again ({previousOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Your Wishlist
                </CardTitle>
                <p className="text-gray-600">
                  Double-tap any product card to instantly add it to your wishlist!
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Your wishlist is empty
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Start browsing and double-tap products to add them to your favorites!
                    </p>
                    <Button 
                      onClick={() => setLocation('/products')}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Browse Products
                    </Button>
                    <div className="mt-8">
                      <QuoteCard 
                        text={getRandomFoodQuote('happiness').text}
                        movie={getRandomFoodQuote('happiness').movie}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="relative group">
                        <ProductCardWithWishlist
                          product={item.product}
                          onClick={() => setLocation(`/products/${item.product.id}`)}
                        />
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                          <Clock className="w-3 h-3 mr-1" />
                          Added {new Date(item.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Again Tab */}
          <TabsContent value="order-again">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-amber-500" />
                  Order Again
                </CardTitle>
                <p className="text-gray-600">
                  Reorder your favorite items from previous purchases
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : previousOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No previous orders
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Place your first order to see your order history here!
                    </p>
                    <Button 
                      onClick={() => setLocation('/products')}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Start Shopping
                    </Button>
                    <div className="mt-8">
                      <QuoteCard 
                        text={getRandomFoodQuote('food_love').text}
                        movie={getRandomFoodQuote('food_love').movie}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {previousOrders.map((product) => (
                      <Card 
                        key={product.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow border-amber-100 hover:border-amber-300"
                        onClick={() => setLocation(`/products/${product.id}`)}
                      >
                        <CardContent className="p-4">
                          {/* Product Image */}
                          <div className="relative mb-3">
                            {product.images && product.images.length > 0 ? (
                              <OptimizedImage
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No image</span>
                              </div>
                            )}
                            
                            {/* Order History Badge */}
                            <Badge className="absolute top-2 right-2 bg-blue-500 text-white">
                              {product.orderCount}x ordered
                            </Badge>
                          </div>

                          {/* Product Info */}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-navy line-clamp-2 flex-1">{product.name}</h3>
                              <span className="text-amber-600 font-bold ml-2">₹{product.price}</span>
                            </div>

                            <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Last ordered: {product.lastOrderDate.toLocaleDateString()}</span>
                            </div>

                            {/* Order Again Button */}
                            <Button 
                              className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOrderAgain(product.id);
                              }}
                            >
                              <Repeat className="w-4 h-4 mr-1" />
                              Order Again
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}