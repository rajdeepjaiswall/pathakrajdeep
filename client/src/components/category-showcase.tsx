import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Category } from "@shared/schema";

export default function CategoryShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const foodCategories = [
    {
      id: 1,
      name: "Biscuits",
      image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=1"
    },
    {
      id: 2,
      name: "Snacks",
      image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=2"
    },
    {
      id: 3,
      name: "Cookies",
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=3"
    },
    {
      id: 4,
      name: "Pastries",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=4"
    },
    {
      id: 5,
      name: "Cake",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=5"
    },
    {
      id: 6,
      name: "Rolls",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=6"
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, foodCategories.length - 4));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, foodCategories.length - 4)) % Math.max(1, foodCategories.length - 4));
  };

  if (isLoading) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-8">
            What's on your mind?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-3 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 bg-gradient-to-b from-white to-almond/20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-8">
          What's on your mind?
        </h2>
        
        {/* Desktop View - Show all categories */}
        <div className="hidden md:grid md:grid-cols-6 gap-6">
          {foodCategories.map((category) => (
            <Link key={category.id} href={category.link}>
              <div className="text-center group cursor-pointer">
                <div className="relative w-32 h-32 mx-auto mb-3 overflow-hidden rounded-full bg-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-sm md:text-base font-medium text-navy group-hover:text-champagne transition-colors duration-300">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile View - Slidable */}
        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 50}%)` }}
            >
              {foodCategories.map((category) => (
                <Link key={category.id} href={category.link}>
                  <div className="w-1/2 flex-shrink-0 px-2">
                    <div className="text-center group cursor-pointer">
                      <div className="relative w-24 h-24 mx-auto mb-3 overflow-hidden rounded-full bg-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="text-sm font-medium text-navy">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Arrows for Mobile */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200"
            aria-label="Previous categories"
          >
            <ChevronLeft className="w-4 h-4 text-navy" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200"
            aria-label="Next categories"
          >
            <ChevronRight className="w-4 h-4 text-navy" />
          </button>
        </div>
      </div>
    </div>
  );
}