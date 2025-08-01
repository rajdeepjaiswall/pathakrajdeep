import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Plus } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { Product } from '@shared/schema';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  className?: string;
  showAddToCart?: boolean;
}

export function ProductCardWithWishlist({ 
  product, 
  onClick, 
  className,
  showAddToCart = true 
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  // Double tap detection for wishlist
  const handleCardClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTap;

    if (timeDiff < 300) { // Double tap within 300ms
      e.preventDefault();
      e.stopPropagation();
      
      // Add to wishlist on double tap
      toggleWishlist(product.id);
      
      // Show heart animation
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
      
      setTapCount(0);
    } else {
      setTapCount(1);
      setTimeout(() => {
        if (tapCount === 1) {
          // Single tap - open product details
          onClick?.();
        }
        setTapCount(0);
      }, 300);
    }

    setLastTap(now);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all duration-300 border-amber-100 hover:border-amber-300 relative overflow-hidden",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Heart Animation Overlay */}
      {showHeartAnimation && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <Heart 
            className="w-16 h-16 text-red-500 fill-red-500 animate-ping" 
            style={{
              animation: 'heartPulse 1s ease-out'
            }}
          />
        </div>
      )}

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
          
          {/* Wishlist Heart Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all duration-200",
              isWishlisted 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-white/80 hover:bg-white text-gray-600 hover:text-red-500"
            )}
            onClick={handleWishlistClick}
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-all duration-200",
                isWishlisted && "fill-current"
              )} 
            />
          </Button>

          {/* Featured Badge */}
          {product.featured && (
            <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
              Featured
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-navy line-clamp-2 flex-1">{product.name}</h3>
            <span className="text-amber-600 font-bold ml-2">₹{product.price}</span>
          </div>

          <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>

          {/* Weight and Stock Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {product.weight && <span>{product.weight}</span>}
            <span>Stock: {product.stock}</span>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Add to Cart Button */}
          {showAddToCart && (
            <Button 
              className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleAddToCart}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add to Cart
            </Button>
          )}
        </div>
      </CardContent>

      {/* Double Tap Hint */}
      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Badge variant="outline" className="text-xs bg-white/90">
          Double tap to ♥
        </Badge>
      </div>


    </Card>
  );
}