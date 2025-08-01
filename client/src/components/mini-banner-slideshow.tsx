import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MINI_BANNERS = [
  {
    id: 1,
    title: "Fresh Daily Bakes",
    description: "Freshly baked goods delivered daily to your doorstep",
    image: "https://images.unsplash.com/photo-1550628204-e2041ba2d3ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
  },
  {
    id: 2,
    title: "Premium Ingredients",
    description: "Made with the finest quality ingredients for authentic taste",
    image: "https://images.unsplash.com/photo-1568747097-e7ebf3fac9e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
  },
  {
    id: 3,
    title: "Traditional Recipes",
    description: "Time-honored recipes passed down through generations",
    image: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
  }
];

export function MiniBannerSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MINI_BANNERS.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % MINI_BANNERS.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + MINI_BANNERS.length) % MINI_BANNERS.length);
  };

  return (
    <section className="relative w-full h-32 md:h-36 bg-background overflow-hidden rounded-lg mx-4 sm:mx-6 lg:mx-8">
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {MINI_BANNERS.map((banner) => (
          <div key={banner.id} className="w-full h-full flex-shrink-0 relative">
            <img 
              src={banner.image} 
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full bg-gradient-to-br from-almond to-champagne/20 flex flex-col items-center justify-center';
                fallback.innerHTML = `
                  <div class="text-center">
                    <div class="w-12 h-12 mx-auto mb-2 bg-navy rounded-lg flex items-center justify-center shadow-lg">
                      <span class="text-champagne font-bold text-lg">PB</span>
                    </div>
                    <div class="text-navy font-semibold text-sm mb-1">Working on it!!</div>
                    <div class="text-navy/70 text-xs">Banner loading...</div>
                  </div>
                `;
                target.parentNode?.appendChild(fallback);
              }}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h3 className="text-lg md:text-xl font-bold mb-1">{banner.title}</h3>
                <p className="text-xs md:text-sm opacity-90">{banner.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-navy p-2 rounded-full transition-all duration-200"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-navy p-2 rounded-full transition-all duration-200"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {MINI_BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentSlide 
                ? 'bg-white' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </section>
  );
}