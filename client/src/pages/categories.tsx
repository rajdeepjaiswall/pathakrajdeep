import { useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Link } from 'wouter';
import Header from '@/components/layout/header';
import MobileNav from '@/components/layout/mobile-nav';
import SEOHead, { SEOConfigs } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import pathakLogo from '@assets/project_20250528_0859055-02.png';

interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  bannerImageUrl?: string;
  isActive: boolean;
}

export default function Categories() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const activeCategories = categories.filter(cat => cat.isActive);

  const scrollToCategory = (index: number) => {
    setSelectedIndex(index);
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 320; // Card width + margin
      const scrollPosition = index * cardWidth - (container.clientWidth / 2) + (cardWidth / 2);
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      
      // Haptic feedback (if supported)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  const handlePrevious = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : activeCategories.length - 1;
    scrollToCategory(newIndex);
  };

  const handleNext = () => {
    const newIndex = selectedIndex < activeCategories.length - 1 ? selectedIndex + 1 : 0;
    scrollToCategory(newIndex);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-navy text-lg">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <SEOHead 
        title="Shop by Categories - Pathak Bhandar"
        description="Explore our diverse range of bakery products across different categories. From traditional sweets to modern cakes, find everything you need."
        keywords="bakery categories, sweets, cakes, biscuits, namkeen, snacks, rolls"
        canonical={`${window.location.origin}/categories`}
      />
      <Header />
      
      <div className="pt-20 pb-24 px-4">
        {/* Brand Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={pathakLogo} 
            alt="Pathak Bhandar" 
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Hero Text */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4">
            Try Other Stuff
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Explore our other varieties of serving in the field of confectionery and snacking
          </p>
        </div>

        {/* Navigation Arrows (Desktop) */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrevious}
            className="text-navy hover:bg-almond/30 rounded-full p-3"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleNext}
            className="text-navy hover:bg-almond/30 rounded-full p-3"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>

        {/* Category Banners Carousel */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {activeCategories.map((category, index) => {
              const isSelected = index === selectedIndex;
              const isAdjacent = Math.abs(index - selectedIndex) === 1;
              
              return (
                <div
                  key={category.id}
                  className={`
                    flex-shrink-0 transition-all duration-500 ease-out cursor-pointer
                    ${isSelected 
                      ? 'w-80 h-96 scale-105 z-10' 
                      : isAdjacent 
                        ? 'w-72 h-80 scale-95 opacity-75' 
                        : 'w-64 h-72 scale-90 opacity-50'
                    }
                  `}
                  onClick={() => scrollToCategory(index)}
                >
                  <Link href={`/products?category=${category.id}`}>
                    <div className={`
                      relative w-full h-full rounded-3xl overflow-hidden shadow-2xl
                      transform transition-all duration-500 hover:scale-[1.02]
                      ${isSelected ? 'ring-4 ring-gold ring-opacity-60' : ''}
                    `}>
                      {/* Banner Image */}
                      <div className="absolute inset-0">
                        <img
                          src={category.bannerImageUrl || category.imageUrl || `https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80`}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      </div>

                      {/* Category Profile Image */}
                      <div className="absolute top-6 left-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/20 shadow-lg">
                          <img
                            src={category.imageUrl || `https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&auto=format&fit=crop&w=128&h=128&q=80`}
                            alt={`${category.name} icon`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className={`
                          font-bold mb-2 transition-all duration-300
                          ${isSelected ? 'text-2xl' : 'text-xl'}
                        `}>
                          {category.name}
                        </h3>
                        <p className={`
                          text-white/90 leading-relaxed transition-all duration-300
                          ${isSelected ? 'text-base opacity-100' : 'text-sm opacity-75'}
                        `}>
                          {category.description || `Discover our premium ${category.name.toLowerCase()} collection`}
                        </p>
                        
                        {isSelected && (
                          <Button
                            className="mt-4 bg-gold hover:bg-gold/90 text-navy font-semibold transition-all duration-300"
                            size="sm"
                          >
                            Explore {category.name}
                          </Button>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <div className="w-3 h-3 bg-gold rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {activeCategories.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCategory(index)}
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${index === selectedIndex 
                  ? 'bg-gold scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
                }
              `}
            />
          ))}
        </div>

        {/* Mobile Swipe Instructions */}
        <div className="md:hidden text-center mt-6">
          <p className="text-sm text-gray-500">
            👈 Swipe to explore different categories 👉
          </p>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}