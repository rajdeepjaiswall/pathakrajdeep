import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Category } from '@shared/schema';
import OptimizedImage from '@/components/OptimizedImage';
import Header from '@/components/layout/header';
import MobileNav from '@/components/layout/mobile-nav';
import SEOHead from '@/components/SEOHead';
import pathakLogo from '@assets/Screenshot_2025-08-01-15-29-00-99_10a3d211b678d435d51c62b8010e86c1_1754043457983.jpg';

// Category banner images with blur effect backgrounds
const categoryBannerImages: Record<string, string> = {
  'Biscuits': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'Sweets': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'Cakes': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'Snacks': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'Breads': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
};

// Category banner component with text overlay
const CategoryBanner = ({ category, index }: { category: Category; index: number }) => {
  const backgroundImage = categoryBannerImages[category.name] || categoryBannerImages['Biscuits'];
  
  return (
    <Link href={`/products?category=${category.id}`}>
      <div 
        className="relative h-32 md:h-40 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl mb-6"
        style={{
          animationDelay: `${index * 100}ms`
        }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <OptimizedImage
            src={backgroundImage}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        
        {/* Text Overlay Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        
        {/* Category Name */}
        <div className="absolute inset-0 flex items-center justify-center md:justify-start md:pl-8">
          <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-2xl text-center md:text-left transition-all duration-300 group-hover:scale-110">
            {category.name}
          </h3>
        </div>
        
        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-champagne/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </Link>
  );
};

// No Products Component
const NoProductsMessage = ({ categoryName }: { categoryName: string }) => {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-champagne">
          <img 
            src={pathakLogo}
            alt="Pathak Bhandar Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-navy mb-2">No Products Available</h2>
        <p className="text-gray-600 mb-6">Sorry, there are no products in the {categoryName} category at the moment.</p>
        <Link href="/categories">
          <Button className="bg-champagne text-navy hover:bg-champagne/90">
            Browse Other Categories
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default function Categories() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-champagne"></div>
      </div>
    );
  }

  const activeCategories = categories.filter(cat => cat.isActive);

  return (
    <div className="min-h-screen bg-cream">
      <SEOHead 
        title="Shop by Categories - Pathak Bhandar"
        description="Explore our diverse range of bakery products across different categories. From traditional sweets to modern cakes, find everything you need."
        keywords="bakery categories, sweets, cakes, biscuits, namkeen, snacks, rolls"
        canonical={`${window.location.origin}/categories`}
      />
      
      <Header />

      <div className="pt-20 pb-24">
        {/* Logo Section */}
        <div className="py-12 text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-champagne overflow-hidden">
            <img 
              src={pathakLogo}
              alt="Pathak Bhandar Logo" 
              className="w-full h-full object-contain p-2"
            />
          </div>
        </div>

        {/* Intro Section */}
        <div className="text-center px-4 mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-navy mb-6">
            Try our other stuff also
          </h1>
          <div className="max-w-2xl mx-auto text-navy/80 text-lg leading-relaxed space-y-2">
            <p>Discover our premium collection of handcrafted delicacies and traditional treats.</p>
            <p>Each category features authentic recipes made with the finest ingredients.</p>
            <p>Experience the perfect blend of taste, quality, and tradition in every bite.</p>
          </div>
        </div>

        {/* Categories Section - Horizontal Banners */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            {activeCategories.length > 0 ? (
              activeCategories.map((category, index) => (
                <div 
                  key={category.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <CategoryBanner category={category} index={index} />
                </div>
              ))
            ) : (
              <NoProductsMessage categoryName="all categories" />
            )}
          </div>
        </div>
      </div>



      <MobileNav />

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}