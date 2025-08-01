import React from 'react';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useWishlist } from '@/hooks/use-wishlist';
import { Product } from '@shared/schema';
import { useAllProductRatings } from '@/hooks/use-product-ratings';
import { StarRating } from '@/components/ui/star-rating';

export function TrendingProducts() {
  const [, setLocation] = useLocation();
  const { data: trendingProducts = [], isLoading } = useQuery({
    queryKey: ['/api/products/trending'],
  });
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { data: ratings = {} } = useAllProductRatings();

  const scrollLeft = () => {
    const container = document.getElementById('trending-scroll');
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('trending-scroll');
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-br from-cream to-almond/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-navy">
              🔥 Top 10 Trending Products of the Week
            </h2>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-br from-cream to-almond/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-navy">
            🔥 Top 10 Trending Products of the Week
          </h2>
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollLeft}
              className="bg-white border-champagne hover:bg-champagne/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollRight}
              className="bg-white border-champagne hover:bg-champagne/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          id="trending-scroll"
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {trendingProducts.map((product: Product, index: number) => (
            <Card
              key={product.id}
              className="flex-shrink-0 w-48 h-72 cursor-pointer group hover:shadow-lg transition-all duration-300 bg-white border-champagne/20 hover:border-champagne overflow-hidden relative"
              onClick={() => setLocation(`/products/${product.id}`)}
            >
              {/* Ranking Badge */}
              <Badge className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
                #{index + 1}
              </Badge>

              {/* Heart Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 p-1 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product.id);
                }}
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    isInWishlist(product.id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-600 hover:text-red-500'
                  }`}
                />
              </Button>

              {/* Product Image */}
              <div className="h-48 bg-gray-100 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-champagne/20 to-almond/30 flex items-center justify-center">
                    <div className="text-champagne text-4xl font-bold">PB</div>
                  </div>
                )}
              </div>

              <CardContent className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-navy text-sm leading-tight line-clamp-2 mb-2 group-hover:text-champagne transition-colors">
                    {product.name}
                  </h3>
                </div>
                
                <div className="mt-auto space-y-2">
                  {/* Star rating display */}
                  {ratings[product.id]?.hasRatings && (
                    <StarRating 
                      rating={ratings[product.id].averageRating || 0}
                      reviewCount={ratings[product.id].reviewCount}
                      size="sm"
                      className="justify-center"
                    />
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                      Trending
                    </Badge>
                    <div className="text-xs text-gray-500">
                      #{index + 1} this week
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile scroll indicators */}
        <div className="flex justify-center mt-4 md:hidden">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollLeft}
              className="bg-white border-champagne hover:bg-champagne/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollRight}
              className="bg-white border-champagne hover:bg-champagne/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}