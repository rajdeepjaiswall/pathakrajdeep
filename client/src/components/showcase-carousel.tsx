import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'wouter';
import LoadingSkeleton from './LoadingSkeleton';
import OptimizedImage from './OptimizedImage';
import type { ShowcasePoster } from '@shared/schema';

interface ShowcaseCarouselProps {
  className?: string;
}

export default function ShowcaseCarousel({ className }: ShowcaseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<ShowcasePoster | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch showcase posters
  const { data: allPosters = [], isLoading } = useQuery({
    queryKey: ['/api/showcase-posters'],
  });

  // Filter active posters
  const activePosters = (allPosters as ShowcasePoster[]).filter((poster) => {
    if (!poster.isVisible) return false;
    
    const now = new Date();
    if (poster.startAt && new Date(poster.startAt) > now) return false;
    if (poster.endAt && new Date(poster.endAt) < now) return false;
    
    return true;
  }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || activePosters.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activePosters.length);
    }, 10000); // 10 seconds

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, activePosters.length]);

  // Pause auto-play on interaction
  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 30000); // Resume after 30 seconds
  };

  // Handle poster click (single click for full-screen)
  const handlePosterClick = (poster: ShowcasePoster) => {
    setSelectedPoster(poster);
    setIsModalOpen(true);
    pauseAutoPlay();

    // Auto-close modal after 10 seconds
    modalTimeoutRef.current = setTimeout(() => {
      setIsModalOpen(false);
    }, 10000);
  };

  // Handle poster double-click (navigate to product)
  const handlePosterDoubleClick = (poster: ShowcasePoster) => {
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
    }
    setIsModalOpen(false);
    
    if (poster.productUrl) {
      window.location.href = poster.productUrl;
    } else if (poster.productId) {
      window.location.href = `/product/${poster.productId}`;
    }
  };

  // Navigation functions
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % activePosters.length);
    pauseAutoPlay();
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + activePosters.length) % activePosters.length);
    pauseAutoPlay();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isModalOpen) {
        switch (event.key) {
          case 'Escape':
            setIsModalOpen(false);
            if (modalTimeoutRef.current) {
              clearTimeout(modalTimeoutRef.current);
            }
            break;
          case 'Enter':
            if (selectedPoster) {
              handlePosterDoubleClick(selectedPoster);
            }
            break;
        }
      } else {
        switch (event.key) {
          case 'ArrowLeft':
            prevSlide();
            break;
          case 'ArrowRight':
            nextSlide();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedPoster]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      if (modalTimeoutRef.current) clearTimeout(modalTimeoutRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">Showcase</h2>
          <LoadingSkeleton type="showcase" className="h-64" />
        </div>
      </div>
    );
  }

  if (activePosters.length === 0) {
    return null; // Don't show section if no active posters
  }

  return (
    <div className={`py-8 bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">Showcase</h2>
        
        <div className="relative">
          {/* Carousel Container */}
          <div 
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {activePosters.map((poster, index) => (
              <div
                key={poster.id}
                className="flex-shrink-0 w-64 md:w-72 cursor-pointer group"
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => handlePosterClick(poster)}
                onDoubleClick={() => handlePosterDoubleClick(poster)}
              >
                {/* A4 Poster Card */}
                <div className="relative bg-gray-900 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                  <div 
                    className="relative"
                    style={{ aspectRatio: '1 / 1.414' }} // A4 aspect ratio
                  >
                    <OptimizedImage
                      src={poster.imageUrl}
                      alt={poster.title}
                      className="w-full h-full object-cover"
                      width={300}
                      height={424}
                      priority={index < 3}
                    />
                    
                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Hover overlay with title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="font-semibold text-lg mb-1">{poster.title}</h3>
                        {poster.caption && (
                          <p className="text-sm text-gray-200 line-clamp-2">{poster.caption}</p>
                        )}
                        <div className="flex items-center mt-2 text-xs text-gray-300">
                          <span>Click to view • Double-click for product</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {activePosters.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white/90 hover:bg-white shadow-md"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white/90 hover:bg-white shadow-md"
                onClick={nextSlide}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Progress Indicators */}
          {activePosters.length > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {activePosters.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-navy' : 'bg-gray-300'
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    pauseAutoPlay();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 bg-black/95">
          {selectedPoster && (
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
                onClick={() => {
                  setIsModalOpen(false);
                  if (modalTimeoutRef.current) {
                    clearTimeout(modalTimeoutRef.current);
                  }
                }}
              >
                <X className="h-8 w-8" />
              </button>

              {/* Full-screen poster */}
              <div className="max-w-full max-h-full p-8">
                <OptimizedImage
                  src={selectedPoster.imageUrl}
                  alt={selectedPoster.title}
                  className="max-w-full max-h-full object-contain"
                  width={800}
                  height={1131}
                />
              </div>

              {/* Toolbar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                <div className="text-center text-white">
                  <h3 className="text-xl font-bold mb-2">{selectedPoster.title}</h3>
                  {selectedPoster.caption && (
                    <p className="text-gray-200 mb-4">{selectedPoster.caption}</p>
                  )}
                  {(selectedPoster.productUrl || selectedPoster.productId) && (
                    <Button
                      variant="secondary"
                      onClick={() => handlePosterDoubleClick(selectedPoster)}
                      className="bg-white/90 text-black hover:bg-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Product
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}