import { Star, Plus, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { formatPrice } from '@/lib/cart';
import { Link } from 'wouter';
import { Product } from '@shared/schema';
import { useState, useEffect } from 'react';
import { ProductBadge } from '@/components/ui/product-badge';
import OptimizedImage from '@/components/OptimizedImage';

interface ProductCardProps {
  product: Product;
  isPreviouslyOrdered?: boolean;
}

export default function ProductCard({ product, isPreviouslyOrdered = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist, isAdding, isRemoving } = useWishlist();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Create media array from actual product images and videos
  const createMediaItems = () => {
    const items = [];
    
    // Add product images
    if (product.images && product.images.length > 0) {
      product.images.forEach(url => {
        if (url) items.push({ type: 'image' as const, url });
      });
    }
    
    // Add product videos
    if (product.videos && product.videos.length > 0) {
      product.videos.forEach(url => {
        if (url) items.push({ type: 'video' as const, url });
      });
    }
    
    // If no media, show a placeholder
    if (items.length === 0) {
      items.push({ type: 'image' as const, url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80' });
    }
    
    return items;
  };

  const mediaItems = createMediaItems();

  // Auto-advance slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [mediaItems.length]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const rating = 4.5;
  const reviewCount = 24;

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="bg-white hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer max-w-xs">
        <div className="relative">
          <div className="relative w-full h-40 overflow-hidden border-2 border-champagne rounded-t-lg">
            {mediaItems[currentImageIndex].type === 'video' ? (
              <video 
                src={mediaItems[currentImageIndex].url}
                autoPlay
                muted
                loop
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <OptimizedImage
                src={mediaItems[currentImageIndex].url} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                width={320}
                height={160}
                placeholder="blur"
              />
            )}
            
            {/* Navigation arrows */}
            <button
              onClick={prevImage}
              className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-navy p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-navy p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-3 w-3" />
            </button>

            {/* Media indicators */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {mediaItems.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-champagne' 
                      : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {product.featured && (
            <Badge className="absolute top-2 left-2 bg-champagne/90 text-navy text-xs">
              Bestseller
            </Badge>
          )}

          {/* Previously Ordered Badge */}
          <ProductBadge isPreviouslyOrdered={isPreviouslyOrdered} />

          {/* Wishlist heart icon */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            disabled={isAdding || isRemoving}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${
                isInWishlist(product.id) 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-gray-600 hover:text-red-500'
              }`} 
            />
          </button>
        </div>
        
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            {product.featured && (
              <Badge variant="secondary" className="bg-champagne/20 text-champagne text-xs">
                Featured
              </Badge>
            )}
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-2.5 w-2.5 ${i < Math.floor(rating) ? 'fill-current' : ''}`} 
                />
              ))}
              <span className="text-gray-500 text-xs ml-1">({reviewCount})</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-navy mb-1 text-sm">{product.name}</h3>
          <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-navy">
                {formatPrice(parseFloat(product.price))}
              </span>
              {product.weight && (
                <span className="text-xs text-gray-500 ml-1">/ {product.weight}</span>
              )}
              <div className="text-xs text-green-600">
                + {formatPrice(parseFloat(product.price) * parseFloat(product.gstRate || '0') / 100)} GST
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-champagne text-navy hover:bg-champagne/90 transition-all text-xs px-2 py-1"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
