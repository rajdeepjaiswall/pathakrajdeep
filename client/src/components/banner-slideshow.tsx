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

  const BannerContent = ({ banner, index }: { banner: Banner; index: number }) => (
    <div className="relative h-[450px] md:h-[600px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Background Image with geometric styling */}
      {banner.imageUrl && (
        <div className="absolute top-0 right-0 w-3/5 h-3/5 md:w-1/2 md:h-4/5">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${banner.imageUrl})`,
              clipPath: 'polygon(15% 0%, 100% 0%, 100% 85%, 0% 100%)'
            }}
          />
        </div>
      )}

      {/* Decorative geometric elements */}
      <div className="absolute top-16 right-8 w-16 h-16 bg-navy/10 transform rotate-45"></div>
      <div className="absolute bottom-20 right-20 w-8 h-8 bg-champagne/20 rounded-full"></div>

      {/* Content Section */}
      <div className="relative h-full flex items-end justify-center p-8 md:p-12">
        <div className="text-center max-w-4xl">
          {/* Large Sample Number */}
          <div className="text-7xl md:text-9xl font-black text-navy/15 leading-none mb-4">
            SAMPLE {index + 1}
          </div>
          
          {/* Main Heading */}
          <h1 className="text-3xl md:text-5xl font-bold text-navy mb-4 uppercase tracking-wider">
            {banner.title.replace('Premium Bakery Since 1957', 'EXCEPTEUR OCCAECAT')}
          </h1>
          
          {/* Description */}
          {banner.description && (
            <p className="text-sm md:text-base text-gray-500 leading-relaxed mb-8 max-w-3xl mx-auto px-4">
              {banner.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-[450px] md:h-[600px] bg-gray-200 animate-pulse flex items-center justify-center rounded-lg">
        <div className="text-gray-500 text-lg">Loading banners...</div>
      </div>
    );
  }

  if (activeBanners.length === 0) {
    return (
      <div className="h-[450px] md:h-[600px] bg-gradient-to-br from-almond to-cream flex items-center justify-center rounded-lg">
        <div className="text-center text-navy p-8">
          <div className="text-7xl md:text-9xl font-black text-navy/15 mb-4">SAMPLE 1</div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 uppercase tracking-wider">EXCEPTEUR OCCAECAT</h2>
          <p className="text-gray-500 max-w-3xl mx-auto">Experience authentic traditional sweets and modern confectionery from Prayagraj's most trusted bakery. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin tristique in tortor et dignissim.</p>
        </div>
      </div>
    );
  }

  if (activeBanners.length === 1) {
    return <BannerContent banner={activeBanners[0]} index={0} />;
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg">
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {activeBanners.map((banner: Banner, index: number) => (
            <div key={banner.id} className="w-full flex-shrink-0">
              <BannerContent banner={banner} index={index} />
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