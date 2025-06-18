import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { Link } from 'wouter';

export default function CustomerWishlist() {
  const { addToCart } = useCart();
  const { wishlistItems, removeFromWishlist, isLoading } = useWishlist();

  const handleAddToCart = (productId: number) => {
    addToCart(productId, 1);
  };

  const handleRemoveFromWishlist = (productId: number) => {
    removeFromWishlist(productId);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">My Wishlist</h1>
          <p className="text-gray-600">Your saved favorites</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-8 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Add products you love to keep track of them</p>
            <Link href="/products">
              <Button className="bg-champagne text-navy hover:bg-champagne/90">
                Explore Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {wishlistItems.map((item: any) => (
              <Card key={item.product.id} className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={item.product.images[0] || '/placeholder-product.jpg'}
                    alt={item.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => handleRemoveFromWishlist(item.product.id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-navy mb-1 line-clamp-2">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                    {item.product.weight}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-champagne">
                      ₹{parseFloat(item.product.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddToCart(item.product.id)}
                      className="flex-1 bg-champagne text-navy hover:bg-champagne/90"
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Link href={`/products/${item.product.id}`}>
                      <Button variant="outline" size="sm" className="border-champagne text-navy hover:bg-champagne/10">
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <MobileNav />
      <CartSidebar />
    </div>
  );
}