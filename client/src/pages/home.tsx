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
import CartReminder from '@/components/CartReminder';
import FreshSection from '@/components/FreshSection';
import TrendingSection from '@/components/TrendingSection';
import ProductOfDay from '@/components/ProductOfDay';
import ChefEditorial from '@/components/ChefEditorial';
import Testimonials from '@/components/Testimonials';

import { useAuth } from '@/hooks/use-auth';
import { CATEGORIES } from '@/lib/constants';
import { preloadImages } from '@/lib/image-cache';
import { useEffect } from 'react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  useEffect(() => {
    const products = allProducts as any[];
    if (products && products.length > 0) {
      const imagesToPreload = products
        .slice(0, 8)
        .flatMap((product: any) => product.images || [])
        .filter((img: string) => img && !img.startsWith('data:'));
      
      if (imagesToPreload.length > 0) {
        preloadImages(imagesToPreload, 'high').catch(console.warn);
      }
    }
  }, [allProducts]);

  const featuredProducts = (allProducts as any[]).filter((product: any) => product.featured).length > 0
    ? (allProducts as any[]).filter((product: any) => product.featured)
    : (allProducts as any[]);

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: previouslyOrderedProducts = [] } = useQuery({
    queryKey: ['/api/previously-ordered'],
    enabled: isAuthenticated,
  });

  if (productsLoading && (allProducts as any[]).length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 pb-32">
          <LoadingSpinner size="lg" className="h-64" />
        </div>
        <MobileNav />
        <CartSidebar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Welcome Message for Logged In Users */}
      {isAuthenticated && user && (
        <section className="py-3 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cream to-almond">
          <div className="max-w-7xl mx-auto text-left">
            <p className="text-sm text-navy font-serif">
              Namaste <span className="text-xl font-bold">{(user as any)?.firstName ? `${(user as any).firstName} ${(user as any)?.lastName || ''}`.trim() : user.username}</span> ji,<br />
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

      {/* Dynamic Fresh Section - Latest products with rotating title */}
      <FreshSection />

      {/* Cart Reminder Section */}
      <CartReminder />

      {/* Featured Products - above Trending section */}
      <section className="pt-2 pb-10 lg:py-12 bg-[#F8F4F1]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 lg:mb-8">
            <div>
              <h2 className="text-2xl lg:text-4xl font-bold text-navy">Featured Products</h2>
              <p className="text-sm lg:text-base text-gray-500 mt-1">Our most popular and loved items</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="hidden md:flex text-champagne font-semibold hover:text-navy">
                View All Products <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Mobile: 2 cols | Tablet+Desktop: exactly 3 rectangle cards per row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {productsLoading ? (
              <LoadingSkeleton type="product" count={6} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6" />
            ) : featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 9).map((product: any) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  isPreviouslyOrdered={Array.isArray(previouslyOrderedProducts) ? previouslyOrderedProducts.includes(product.id) : false}
                />
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

      {/* Trending in Prayagraj — below Featured Products */}
      <TrendingSection />

      {/* Mini Banner Slideshow */}
      <div className="pt-2 pb-3 bg-background">
        <div className="max-w-7xl mx-auto">
          <MiniBannerSlideshow />
        </div>
      </div>

      {/* Deal of the Day */}
      <ProductOfDay />

      {/* Chef Editorial Picks */}
      <ChefEditorial />

      {/* Customer Testimonials */}
      <Testimonials />

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
