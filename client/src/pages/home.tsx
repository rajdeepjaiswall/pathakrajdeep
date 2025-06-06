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
  
  // Fetch featured products
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['/api/products?featured=true'],
  });

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

      {/* Category Showcase */}
      <CategoryShowcase />

      {/* Featured Categories */}
      <section className="pt-2 pb-8 bg-almond">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Our Specialties</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our premium collection of traditional and modern biscuits, cookies, and confectionery items
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
            {CATEGORIES.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <div className="group cursor-pointer">
                  <div className="bg-almond rounded-2xl p-4 text-center hover:shadow-lg transition-all duration-300 group-hover:scale-105 border border-champagne">
                    <img 
                      src={`https://images.unsplash.com/photo-1486427944299-d1955d23e34d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`} 
                      alt={category.name}
                      className="w-full h-28 object-cover rounded-lg mb-3" 
                    />
                    <h3 className="text-lg font-semibold text-navy mb-1">{category.name}</h3>
                    <p className="text-navy/70 text-sm">{category.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mini Banner Slideshow */}
      <div className="pt-2 pb-3 bg-background">
        <div className="max-w-7xl mx-auto">
          <MiniBannerSlideshow />
        </div>
      </div>

      {/* Featured Products */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
