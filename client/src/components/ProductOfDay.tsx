import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Star, ShoppingCart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/cart';

export default function ProductOfDay() {
  const { data: product, isLoading } = useQuery<any>({
    queryKey: ['/api/products/product-of-day'],
  });
  const { addToCart } = useCart();

  if (isLoading) return null;
  if (!product) return null;

  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80';

  return (
    <section className="py-10 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-5 w-5 text-amber-300 fill-amber-300" />
          <span className="text-amber-300 font-semibold tracking-wider text-sm uppercase">Product of the Day</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{product.name}</h2>
            {product.description && (
              <p className="text-amber-100 text-base mb-5 leading-relaxed line-clamp-3">
                {product.description}
              </p>
            )}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-amber-300">{formatPrice(parseFloat(product.price))}</span>
              {product.weight && (
                <Badge variant="outline" className="border-amber-300 text-amber-300 text-sm">
                  {product.weight}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mb-6 text-amber-200 text-sm">
              <Clock className="h-4 w-4" />
              <span>Made fresh today — limited quantity available</span>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => addToCart(product.id, 1)}
                className="bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold px-6"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Link href={`/products/${product.id}`}>
                <Button variant="outline" className="border-amber-300 text-amber-300 hover:bg-amber-700">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <Link href={`/products/${product.id}`} className="block">
              <div className="relative w-72 h-72 md:w-80 md:h-80">
                <div className="absolute inset-0 bg-amber-300/20 rounded-full blur-2xl" />
                <img
                  src={image}
                  alt={product.name}
                  className="relative w-full h-full object-cover rounded-full border-4 border-amber-400/40 shadow-2xl hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
