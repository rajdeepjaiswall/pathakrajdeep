import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

export default function CategoryShowcase() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Use active categories from database and create multiple copies for seamless infinite scroll
  const activeCategories = (categories || []).filter(cat => cat.isActive);
  const infiniteCategories = [
    ...activeCategories,
    ...activeCategories,
    ...activeCategories,
    ...activeCategories
  ].map((category, index) => ({
    id: category.id,
    name: category.name,
    image: category.imageUrl || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop',
    link: `/categories`,
  }));

  if (isLoading) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-full mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-6">
            Our Specialties
          </h2>
          <div className="flex space-x-6 animate-pulse overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex-shrink-0">
                <div className="w-28 h-28 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 bg-gradient-to-b from-white to-almond/20 overflow-hidden">
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-6">
          Our Specialties
        </h2>
        
        {/* Infinite Scrolling Carousel */}
        <div className="relative">
          <div className="overflow-hidden">
            <div className="flex space-x-8 animate-scroll">
              {infiniteCategories.map((category, index) => (
                <Link key={`${category.id}-${index}`} href={category.link}>
                  <div className="flex-shrink-0 text-center group cursor-pointer">
                    <div className="relative w-28 h-28 mx-auto mb-3 overflow-hidden rounded-full bg-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-sm font-medium text-navy group-hover:text-champagne transition-colors duration-300 whitespace-nowrap">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}