import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X, ShoppingCart, Heart, Send, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
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
  const [modalImageLoaded, setModalImageLoaded] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

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

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (productId: number) => 
      apiRequest('/api/cart', 'POST', { productId, quantity: 1 }),
    onSuccess: () => {
      toast({ title: "Added to cart", description: "Product added to cart successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add to cart", variant: "destructive" });
    }
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: (productId: number) => 
      apiRequest('/api/wishlist', 'POST', { productId }),
    onSuccess: () => {
      toast({ title: "Added to wishlist", description: "Product saved to your wishlist!" });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add to wishlist", variant: "destructive" });
    }
  });

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

  // Add to cart
  const handleAddToCart = (poster: ShowcasePoster) => {
    if (!poster.productId) {
      toast({ title: "Error", description: "Product not available", variant: "destructive" });
      return;
    }
    addToCartMutation.mutate(poster.productId);
  };

  // Add to wishlist
  const handleAddToWishlist = (poster: ShowcasePoster) => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in", description: "Sign in to add items to wishlist", variant: "destructive" });
      return;
    }
    if (!poster.productId) {
      toast({ title: "Error", description: "Product not available", variant: "destructive" });
      return;
    }
    addToWishlistMutation.mutate(poster.productId);
  };

  // Share poster functionality
  const handleSharePoster = async (poster: ShowcasePoster) => {
    setIsDownloading(true);
    
    try {
      // Create canvas to draw image with footer
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Set canvas size (rectangle ratio with footer space)
        canvas.width = 800;
        canvas.height = isAuthenticated ? 1069 : 1000; // Extra space for footer if signed in
        
        // Draw image
        ctx!.drawImage(img, 0, 0, 800, 1000);
        
        // Draw footer if user is signed in
        if (isAuthenticated && user) {
          // Footer background
          ctx!.fillStyle = '#000000';
          ctx!.fillRect(0, 1000, 800, 69);
          
          // Footer text
          ctx!.fillStyle = '#FFFFFF';
          ctx!.font = '16px Arial';
          const userName = (user as any)?.firstName ? 
            `${(user as any).firstName} ${(user as any)?.lastName || ''}`.trim() : 
            user.username;
          ctx!.fillText(`Downloaded by ${userName}`, 20, 1035);
          
          // Add small DP placeholder (circle)
          ctx!.beginPath();
          ctx!.arc(750, 1035, 15, 0, 2 * Math.PI);
          ctx!.fillStyle = '#4A5568';
          ctx!.fill();
          ctx!.fillStyle = '#FFFFFF';
          ctx!.font = '12px Arial';
          ctx!.textAlign = 'center';
          ctx!.fillText(userName.charAt(0).toUpperCase(), 750, 1040);
        }
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob!);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${poster.title.replace(/\s+/g, '_')}_poster.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Share functionality
          const shareData = {
            title: poster.title,
            text: poster.caption || `Check out this amazing poster: ${poster.title}`,
            url: poster.productId ? `${window.location.origin}/product/${poster.productId}` : window.location.href
          };
          
          if (navigator.share) {
            navigator.share(shareData);
          } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareData.url).then(() => {
              toast({ title: "Link copied", description: "Product link copied to clipboard!" });
            });
          }
          
          setIsDownloading(false);
          toast({ title: "Downloaded", description: "Poster downloaded successfully!" });
        }, 'image/png');
      };
      
      img.src = poster.imageUrl;
    } catch (error) {
      setIsDownloading(false);
      toast({ title: "Error", description: "Failed to download poster", variant: "destructive" });
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

  return (
    <div className={`py-8 bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">Showcase</h2>
        
        <div className="relative">
          {/* Horizontal Scrolling Rectangle Cards */}
          <div className="relative overflow-hidden h-72">
            <div 
              className="flex gap-6 transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentIndex * (280 + 24)}px)` }}
            >
              {activePosters.map((poster, index) => (
                <div
                  key={poster.id}
                  className={`relative cursor-pointer transition-all duration-500 flex-shrink-0 ${
                    index === currentIndex 
                      ? 'w-80 scale-110 z-10' // Center card bigger
                      : 'w-64 scale-95 opacity-80' // Side cards smaller
                  }`}
                  onClick={() => handlePosterTap(poster, index)}
                >
                  {/* Rectangle Poster Card */}
                  <div className="relative bg-gray-900 rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:shadow-xl h-full">
                    <div className="relative w-full h-full">
                      <OptimizedImage
                        src={poster.imageUrl}
                        alt={poster.title}
                        className="w-full h-full object-cover"
                        width={320}
                        height={272}
                        priority={index === currentIndex}
                      />
                      
                      {/* Tap Overlay */}
                      {showOverlay === index && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center text-white animate-in fade-in duration-300 z-20">
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
                                  <Package className="h-4 w-4 mr-2" />
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
                                View Full Screen
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Card title overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                        <h3 className="text-white font-semibold text-sm">{poster.title}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-sm">Loading...</p>
                    <p className="text-xs text-gray-400 mt-1">Preparing full screen view</p>
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

              {/* Navigation Areas (Instagram style) - Fixed positioning */}
              <button
                className="absolute left-0 top-0 w-1/4 h-3/4 z-20 flex items-center justify-start pl-4"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateFullScreen('prev');
                }}
              >
                <ChevronLeft className="h-8 w-8 text-white/70 hover:text-white transition-colors bg-black/30 rounded-full p-1" />
              </button>

              <button
                className="absolute right-0 top-0 w-1/4 h-3/4 z-20 flex items-center justify-end pr-4"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateFullScreen('next');
                }}
              >
                <ChevronRight className="h-8 w-8 text-white/70 hover:text-white transition-colors bg-black/30 rounded-full p-1" />
              </button>

              {/* Full-screen Image - Perfect fit */}
              <div className="w-full h-full flex items-center justify-center p-8">
                <OptimizedImage
                  src={selectedPoster.imageUrl}
                  alt={selectedPoster.title}
                  className={`max-w-[85%] max-h-[65%] object-contain ${
                    modalImageLoaded ? 'opacity-100' : 'opacity-0'
                  } transition-opacity duration-300`}
                  width={800}
                  height={600}
                  onLoad={() => setModalImageLoaded(true)}
                />
              </div>

              {/* Bottom Action Buttons */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6">
                <div className="text-center text-white mb-4">
                  <h3 className="text-lg font-bold mb-1">{selectedPoster.title}</h3>
                  {selectedPoster.caption && (
                    <p className="text-sm text-gray-200 mb-3">{selectedPoster.caption}</p>
                  )}
                </div>
                
                {/* 4 Action Buttons */}
                <div className="flex justify-center gap-3">
                  {/* Product Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewProduct(selectedPoster)}
                    className="bg-white/90 text-black hover:bg-white flex items-center gap-2"
                    disabled={!selectedPoster.productId && !selectedPoster.productUrl}
                  >
                    <Package className="h-4 w-4" />
                    Product
                  </Button>

                  {/* Add to Cart Button - Longer */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddToCart(selectedPoster)}
                    className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 px-6"
                    disabled={!selectedPoster.productId || addToCartMutation.isPending}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                  </Button>

                  {/* Wishlist Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddToWishlist(selectedPoster)}
                    className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                    disabled={!selectedPoster.productId || addToWishlistMutation.isPending}
                  >
                    <Heart className="h-4 w-4" />
                    Save
                  </Button>

                  {/* Share Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSharePoster(selectedPoster)}
                    className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                    disabled={isDownloading}
                  >
                    <Send className="h-4 w-4" />
                    {isDownloading ? 'Sharing...' : 'Share'}
                  </Button>
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