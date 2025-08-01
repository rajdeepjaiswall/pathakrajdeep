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
import { preloadImages } from '@/lib/image-cache';
import { useEffect } from 'react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { QuoteCard } from '@/components/QuoteCard';
import { getRandomFoodQuote } from '@/data/foodQuotes';
import { TrendingProducts } from '@/components/trending-products';
import { FeedbackCarousel } from '@/components/feedback-carousel';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  
  // Fetch all products
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Preload critical images when products load
  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      const imagesToPreload = allProducts
        .slice(0, 8) // First 8 products
        .flatMap((product: any) => product.images || [])
        .filter((img: string) => img && !img.startsWith('data:'));
      
      if (imagesToPreload.length > 0) {
        preloadImages(imagesToPreload, 'high').catch(console.warn);
      }
    }
  }, [allProducts]);

  // Filter featured products or show all if none are featured
  const featuredProducts = (allProducts as any[]).filter((product: any) => product.featured).length > 0
    ? (allProducts as any[]).filter((product: any) => product.featured)
    : (allProducts as any[]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch previously ordered products for authenticated users
  const { data: previouslyOrderedProducts = [] } = useQuery({
    queryKey: ['/api/previously-ordered'],
    enabled: isAuthenticated,
  });

  // Show loading screen with quote for mobile on initial load
  if (productsLoading && allProducts.length === 0) {
    const loadingQuote = getRandomFoodQuote();
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 pb-32 px-4">
          <div className="max-w-md mx-auto space-y-6">
            <LoadingSpinner size="lg" className="h-64" />
            <QuoteCard 
              text={loadingQuote.text}
              movie={loadingQuote.movie}
              className="animate-pulse"
            />
            <p className="text-center text-gray-500 text-sm">
              Loading fresh goodies for you...
            </p>
          </div>
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
              <LoadingSkeleton type="product" count={6} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6" />
            ) : featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 12).map((product: any) => (
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

      {/* Mini Banner Slideshow */}
      <div className="pt-2 pb-3 bg-background">
        <div className="max-w-7xl mx-auto">
          <MiniBannerSlideshow />
        </div>
      </div>

      {/* Trending Products Section */}
      <TrendingProducts />

      {/* Customer Feedback Carousel */}
      <FeedbackCarousel />

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
          
          {/* Inspirational Quote */}
          <div className="max-w-2xl mx-auto mt-12">
            <QuoteCard 
              text={getRandomFoodQuote('home_cooking').text}
              movie={getRandomFoodQuote('home_cooking').movie}
            />
          </div>
        </div>
      </section>

      <Footer />
      <MobileNav />
      <CartSidebar />
    </div>
  );
}
