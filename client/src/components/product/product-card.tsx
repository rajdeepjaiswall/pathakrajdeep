import { Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/cart';
import { Link } from 'wouter';
import { Product } from '@shared/schema';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  const rating = 4.5; // In a real app, this would come from reviews
  const reviewCount = 24;

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="bg-white hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer">
        <div className="relative">
          <img 
            src={product.images[0] || '/placeholder-product.jpg'} 
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.featured && (
            <Badge className="absolute top-2 left-2 bg-champagne/90 text-navy">
              Bestseller
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            {product.featured && (
              <Badge variant="secondary" className="bg-champagne/20 text-champagne text-xs">
                Featured
              </Badge>
            )}
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-current' : ''}`} 
                />
              ))}
              <span className="text-gray-500 text-xs ml-1">({reviewCount})</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-navy mb-2">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-navy">
                {formatPrice(parseFloat(product.price))}
              </span>
              {product.weight && (
                <span className="text-sm text-gray-500 ml-1">/ {product.weight}</span>
              )}
              <div className="text-xs text-green-600">
                + {formatPrice(parseFloat(product.price) * parseFloat(product.gstRate) / 100)} GST
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-champagne text-navy hover:bg-champagne/90 transition-all"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
