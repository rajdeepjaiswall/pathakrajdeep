import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface Banner {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  linkUrl: string | null;
  linkType: string | null;
  linkId: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function BannerSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['/api/banners'],
  });

  const activeBanners = banners.filter((banner: Banner) => banner.isActive);

  useEffect(() => {
    if (activeBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [activeBanners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const getBannerLink = (banner: Banner) => {
    if (!banner.linkUrl) return '#';
    
    switch (banner.linkType) {
      case 'product':
        return `/product/${banner.linkId}`;
      case 'category':
        return `/products?category=${banner.linkId}`;
      case 'external':
        return banner.linkUrl;
      default:
        return banner.linkUrl;
    }
  };

  const BannerContent = ({ banner }: { banner: Banner }) => {
    const content = (
      <div className="relative h-[200px] md:h-[250px] overflow-hidden rounded-lg">
        {banner.imageUrl ? (
          <div 
            className="w-full h-full bg-cover bg-center cursor-pointer transition-transform duration-300 hover:scale-105"
            style={{ backgroundImage: `url(${banner.imageUrl})` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-almond to-cream flex items-center justify-center">
            <div className="text-center text-navy/60">
              <div className="text-lg font-medium">Banner Image</div>
              <div className="text-sm">Click to upload</div>
            </div>
          </div>
        )}
      </div>
    );

    if (banner.linkUrl) {
      return (
        <Link href={getBannerLink(banner)}>
          {content}
        </Link>
      );
    }

    return content;
  };

  if (isLoading) {
    return (
      <div className="h-[200px] md:h-[250px] bg-gray-200 animate-pulse flex items-center justify-center rounded-lg">
        <div className="text-gray-500 text-lg">Loading banners...</div>
      </div>
    );
  }

  if (activeBanners.length === 0) {
    return (
      <div className="h-[200px] md:h-[250px] bg-gradient-to-br from-almond to-cream flex items-center justify-center rounded-lg">
        <div className="text-center text-navy/60 p-8">
          <div className="text-lg font-medium mb-2">No Banners Available</div>
          <div className="text-sm">Contact admin to add promotional banners</div>
        </div>
      </div>
    );
  }

  if (activeBanners.length === 1) {
    return <BannerContent banner={activeBanners[0]} />;
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg">
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {activeBanners.map((banner: Banner) => (
            <div key={banner.id} className="w-full flex-shrink-0">
              <BannerContent banner={banner} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 hover:text-navy shadow-lg w-12 h-12 rounded-full border-0"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 hover:text-navy shadow-lg w-12 h-12 rounded-full border-0"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dot Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
        {activeBanners.map((_: Banner, index: number) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-gray-600' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}