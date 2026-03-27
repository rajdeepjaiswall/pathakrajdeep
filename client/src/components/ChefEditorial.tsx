import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ChefHat, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/product/product-card';

export default function ChefEditorial() {
  const { data: chefSpecials = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/products/chef-specials'],
  });

  if (isLoading) return null;
  if (!chefSpecials || chefSpecials.length === 0) return null;

  return (
    <section className="py-12 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-amber-900 rounded-full flex items-center justify-center shadow-lg">
              <ChefHat className="h-7 w-7 text-amber-100" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-navy mb-2">Chef's Editorial Picks</h2>
          <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">
            Our master baker's personal recommendations — crafted with generations of expertise and the finest ingredients
          </p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">Handcrafted</Badge>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">Chef Recommended</Badge>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">Premium Quality</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {chefSpecials.slice(0, 8).map((product: any) => (
            <div key={product.id} className="relative">
              <div className="absolute top-2 right-2 z-10">
                <div className="w-7 h-7 bg-amber-800 rounded-full flex items-center justify-center shadow">
                  <ChefHat className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/products">
            <Button className="bg-amber-900 hover:bg-amber-800 text-white font-semibold px-8">
              Explore All Products <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
