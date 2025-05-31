import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import type { Banner } from '@shared/schema';

export default function BannerSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['/api/banners?active=true'],
  });

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-64 md:h-80 bg-cream animate-pulse rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-cream to-almond rounded-lg"></div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative w-full h-64 md:h-80 bg-gradient-to-r from-cream to-almond rounded-lg flex items-center justify-center">
        <div className="text-center text-navy">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">Welcome to Pathak Bhandar</h2>
          <p className="text-lg mb-6">Premium Bakery Since 1957</p>
          <Link href="/products">
            <button className="bg-champagne text-navy px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors">
              Shop Now
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentSlide];

  const getBannerLink = (banner: Banner) => {
    if (banner.linkType === 'product' && banner.linkId) {
      return `/product/${banner.linkId}`;
    } else if (banner.linkType === 'category' && banner.linkId) {
      return `/products?category=${banner.linkId}`;
    } else if (banner.linkType === 'external' && banner.linkUrl) {
      return banner.linkUrl;
    }
    return '/products';
  };

  const BannerContent = ({ banner }: { banner: Banner }) => (
    <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden group">
      {/* Background Image or Video */}
      {banner.videoUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={banner.videoUrl} type="video/mp4" />
        </video>
      ) : banner.imageUrl ? (
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-cream to-almond"></div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center text-center p-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            {banner.title}
          </h2>
          {banner.description && (
            <p className="text-lg md:text-xl text-white mb-6 drop-shadow-lg">
              {banner.description}
            </p>
          )}
          {banner.linkUrl && (
            <button className="bg-champagne text-navy px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105">
              Learn More
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full mb-8">
      {/* Main Banner */}
      {currentBanner.linkUrl ? (
        currentBanner.linkType === 'external' ? (
          <a href={getBannerLink(currentBanner)} target="_blank" rel="noopener noreferrer">
            <BannerContent banner={currentBanner} />
          </a>
        ) : (
          <Link href={getBannerLink(currentBanner)}>
            <BannerContent banner={currentBanner} />
          </Link>
        )
      ) : (
        <BannerContent banner={currentBanner} />
      )}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-navy p-2 rounded-full transition-all z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-navy p-2 rounded-full transition-all z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-champagne scale-110'
                  : 'bg-white bg-opacity-60 hover:bg-opacity-80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}