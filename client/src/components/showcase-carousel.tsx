import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X, ExternalLink, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LoadingSkeleton from './LoadingSkeleton';
import OptimizedImage from './OptimizedImage';

interface ShowcasePoster {
  id: number;
  title: string;
  imageUrl: string;
  productUrl?: string;
  productId?: number | null;
  caption?: string;
  displayOrder?: number;
  isVisible: boolean;
  startAt?: string | null;
  endAt?: string | null;
}

interface ShowcaseCarouselProps {
  className?: string;
}

export default function ShowcaseCarousel({ className }: ShowcaseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPoster, setSelectedPoster] = useState<ShowcasePoster | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [modalImageLoaded, setModalImageLoaded] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch showcase posters
  const { data: allPosters = [], isLoading: postersLoading } = useQuery({
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

  // Auto-scroll every 5 seconds (left-to-right)
  useEffect(() => {
    if (activePosters.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activePosters.length);
    }, 5000); // 5 seconds

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [activePosters.length]);

  // Detect orientation
  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };
    
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  // Handle poster tap (single tap shows overlay)
  const handlePosterTap = (poster: ShowcasePoster, index: number) => {
    setShowOverlay(index);
    setTimeout(() => setShowOverlay(null), 3000); // Hide overlay after 3 seconds
  };

  // Open full screen with loading
  const handleViewFullScreen = (poster: ShowcasePoster, index: number) => {
    setSelectedPoster(poster);
    setFullScreenIndex(index);
    setIsLoading(true);
    setModalImageLoaded(false);
    setIsModalOpen(true);
    
    // Simulate loading time for orientation detection
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Navigate to product
  const handleViewProduct = (poster: ShowcasePoster) => {
    if (poster.productUrl) {
      window.location.href = poster.productUrl;
    } else if (poster.productId) {
      window.location.href = `/product/${poster.productId}`;
    }
  };

  // Instagram-style navigation in full screen
  const navigateFullScreen = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (fullScreenIndex + 1) % activePosters.length
      : (fullScreenIndex - 1 + activePosters.length) % activePosters.length;
    
    setFullScreenIndex(newIndex);
    setSelectedPoster(activePosters[newIndex]);
    setModalImageLoaded(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isModalOpen && !isLoading) {
        switch (event.key) {
          case 'Escape':
            setIsModalOpen(false);
            break;
          case 'ArrowLeft':
            navigateFullScreen('prev');
            break;
          case 'ArrowRight':
            navigateFullScreen('next');
            break;
          case 'Enter':
            if (selectedPoster) {
              handleViewProduct(selectedPoster);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isLoading, selectedPoster, fullScreenIndex]);

  // Get visible cards (center focus with size variations)
  const getVisibleCards = () => {
    const cards = [];
    const centerIndex = currentIndex;
    
    // Show 3 cards: previous, current (center), next
    for (let i = -1; i <= 1; i++) {
      const index = (centerIndex + i + activePosters.length) % activePosters.length;
      const poster = activePosters[index];
      const isCenterCard = i === 0;
      
      cards.push({
        poster,
        index,
        isCenterCard,
        position: i
      });
    }
    
    return cards;
  };

  if (postersLoading) {
    return (
      <div className={`py-8 bg-background ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">Showcase</h2>
          <LoadingSkeleton type="showcase" className="h-64" />
        </div>
      </div>
    );
  }

  if (activePosters.length === 0) {
    return null;
  }

  const visibleCards = getVisibleCards();

  return (
    <div className={`py-8 bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">Showcase</h2>
        
        <div className="relative">
          {/* Carousel Container with Center Focus */}
          <div className="flex justify-center items-center gap-4 h-80 overflow-hidden">
            {visibleCards.map(({ poster, index, isCenterCard, position }) => (
              <div
                key={poster.id}
                className={`relative cursor-pointer transition-all duration-500 ${
                  isCenterCard 
                    ? 'w-64 md:w-80 scale-125 z-10' // Center card 25% bigger
                    : 'w-48 md:w-60 scale-75 opacity-75' // Side cards 25% smaller
                }`}
                onClick={() => handlePosterTap(poster, index)}
              >
                {/* A4 Poster Card */}
                <div className="relative bg-gray-900 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:shadow-xl">
                  <div 
                    className="relative"
                    style={{ aspectRatio: '1 / 1.414' }} // A4 aspect ratio
                  >
                    <OptimizedImage
                      src={poster.imageUrl}
                      alt={poster.title}
                      className="w-full h-full object-cover"
                      width={320}
                      height={452}
                      priority={isCenterCard}
                    />
                    
                    {/* Tap Overlay */}
                    {showOverlay === index && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center text-white animate-in fade-in duration-300">
                        <div className="text-center space-y-4">
                          <h3 className="font-bold text-lg">{poster.title}</h3>
                          {poster.caption && (
                            <p className="text-sm text-gray-200 px-4">{poster.caption}</p>
                          )}
                          <div className="flex flex-col space-y-2">
                            {(poster.productUrl || poster.productId) && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProduct(poster);
                                }}
                                className="bg-white/90 text-black hover:bg-white"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Product
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewFullScreen(poster, index);
                              }}
                              className="border-white text-white hover:bg-white hover:text-black"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Full Screen
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Indicators */}
          {activePosters.length > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {activePosters.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-navy' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instagram-Style Full-Screen Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-none w-full h-screen p-0 bg-black border-0">
          {selectedPoster && (
            <div className="relative w-full h-full">
              {/* Loading Screen */}
              {isLoading && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-sm">Loading...</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Detecting {orientation} orientation
                    </p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                className="absolute top-4 right-4 z-30 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation Areas (Instagram style) */}
              <button
                className="absolute left-0 top-0 w-1/3 h-full z-20 flex items-center justify-start pl-4"
                onClick={() => navigateFullScreen('prev')}
              >
                <ChevronLeft className="h-8 w-8 text-white/70 hover:text-white transition-colors" />
              </button>

              <button
                className="absolute right-0 top-0 w-1/3 h-full z-20 flex items-center justify-end pr-4"
                onClick={() => navigateFullScreen('next')}
              >
                <ChevronRight className="h-8 w-8 text-white/70 hover:text-white transition-colors" />
              </button>

              {/* Full-screen Image */}
              <div className="w-full h-full flex items-center justify-center p-4">
                <OptimizedImage
                  src={selectedPoster.imageUrl}
                  alt={selectedPoster.title}
                  className={`max-w-full max-h-full object-contain ${
                    modalImageLoaded ? 'opacity-100' : 'opacity-0'
                  } transition-opacity duration-300`}
                  width={orientation === 'landscape' ? 1200 : 800}
                  height={orientation === 'landscape' ? 849 : 1131}
                  onLoad={() => setModalImageLoaded(true)}
                />
              </div>

              {/* Bottom Toolbar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                <div className="text-center text-white">
                  <h3 className="text-lg font-bold mb-2">{selectedPoster.title}</h3>
                  {selectedPoster.caption && (
                    <p className="text-sm text-gray-200 mb-4">{selectedPoster.caption}</p>
                  )}
                  {(selectedPoster.productUrl || selectedPoster.productId) && (
                    <Button
                      variant="secondary"
                      onClick={() => handleViewProduct(selectedPoster)}
                      className="bg-white/90 text-black hover:bg-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Product
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Indicators (Instagram style) */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-1 z-30">
                {activePosters.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === fullScreenIndex 
                        ? 'bg-white w-8' 
                        : 'bg-white/40 w-4'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}