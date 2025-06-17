import { Link } from 'wouter';
import { ArrowRight, Truck, Smartphone, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';
import ProductCard from '@/components/product/product-card';
import BannerSlideshow from '@/components/banner-slideshow';
import CategoryShowcase from '@/components/category-showcase';
import { MiniBannerSlideshow } from '@/components/mini-banner-slideshow';
import { useAuth } from '@/hooks/use-auth';
import { CATEGORIES } from '@/lib/constants';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  
  // Fetch all products
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Filter featured products or show all if none are featured
  const featuredProducts = (allProducts as any[]).filter((product: any) => product.featured).length > 0
    ? (allProducts as any[]).filter((product: any) => product.featured)
    : (allProducts as any[]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Welcome Message for Logged In Users */}
      {isAuthenticated && user && (
        <section className="py-3 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cream to-almond">
          <div className="max-w-7xl mx-auto text-left">
            <p className="text-sm text-navy font-serif">
              Namaste <span className="text-xl font-bold">{user.username}</span> ji,<br />
              aapka Pathak Bhandar mein swagat hai
            </p>
          </div>
        </section>
      )}
      
      {/* Banner Slideshow */}
      <section className="py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <BannerSlideshow />
        </div>
      </section>

      {/* Category Showcase - Automatic Moving Carousel */}
      <CategoryShowcase />

      {/* Featured Products - Product Catalogue */}
      <section className="pt-2 pb-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Featured Products</h2>
              <p className="text-lg text-gray-600">Our most popular and loved items</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="hidden md:flex text-champagne font-semibold hover:text-navy">
                View All Products <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {productsLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 12).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No products available at the moment.</p>
                <p className="text-gray-400 text-sm mt-2">Please check back later or contact support.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/products">
              <Button variant="ghost" className="text-champagne font-semibold">
                View All Products <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mini Banner Slideshow */}
      <div className="pt-2 pb-3 bg-background">
        <div className="max-w-7xl mx-auto">
          <MiniBannerSlideshow />
        </div>
      </div>

      {/* Trust Indicators */}
<section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-almond rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-champagne" />
              </div>
              <h3 className="font-semibold text-navy mb-2">Free Delivery</h3>
              <p className="text-gray-600 text-sm">Free delivery on orders above ₹500 in Prayagraj</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-almond rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-champagne" />
              </div>
              <h3 className="font-semibold text-navy mb-2">Easy Payments</h3>
              <p className="text-gray-600 text-sm">UPI, Cards, Net Banking, and Cash on Delivery</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-almond rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-champagne" />
              </div>
              <h3 className="font-semibold text-navy mb-2">Quality Guarantee</h3>
              <p className="text-gray-600 text-sm">Fresh products with satisfaction guarantee</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileNav />
      <CartSidebar />
    </div>
  );
}
