import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { TrendingUp, ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/product/product-card';

export default function TrendingSection() {
  const { data: trendingProducts = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/products/trending'],
  });

  if (isLoading) return null;
  if (!trendingProducts || trendingProducts.length === 0) return null;

  return (
    <section className="py-10 bg-gradient-to-b from-amber-50 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-navy">Trending in Prayagraj</h2>
              <p className="text-sm text-gray-500 mt-0.5">What everyone's ordering right now</p>
            </div>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="hidden md:flex text-champagne font-semibold hover:text-navy text-sm">
              See All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {trendingProducts.slice(0, 10).map((product: any, index: number) => (
            <div key={product.id} className="relative">
              {index < 3 && (
                <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  #{index + 1}
                </div>
              )}
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="text-center mt-6 md:hidden">
          <Link href="/products">
            <Button variant="ghost" className="text-champagne font-semibold text-sm">
              See All Trending <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
