import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { PopupBanner as PopupBannerType } from '@shared/schema';

export default function PopupBanner() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<PopupBannerType | null>(null);

  const { data: banners } = useQuery<PopupBannerType[]>({
    queryKey: ['/api/popup-banners/active'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!banners || banners.length === 0 || !isAuthenticated) return;

    const activeBanner = banners.find(banner => {
      if (banner.triggerType !== 'login') return false;
      
      if (banner.showOnce) {
        const dismissedBanners = JSON.parse(localStorage.getItem('dismissed_popups') || '[]');
        if (dismissedBanners.includes(banner.id)) return false;
      }
      
      const now = new Date();
      if (banner.startDate && new Date(banner.startDate) > now) return false;
      if (banner.endDate && new Date(banner.endDate) < now) return false;
      
      return true;
    });

    if (activeBanner) {
      const justLoggedIn = sessionStorage.getItem('just_logged_in');
      if (justLoggedIn === 'true') {
        setCurrentBanner(activeBanner);
        setIsOpen(true);
        sessionStorage.removeItem('just_logged_in');
      }
    }
  }, [banners, isAuthenticated]);

  const handleDismiss = () => {
    if (currentBanner && currentBanner.showOnce) {
      const dismissedBanners = JSON.parse(localStorage.getItem('dismissed_popups') || '[]');
      if (!dismissedBanners.includes(currentBanner.id)) {
        dismissedBanners.push(currentBanner.id);
        localStorage.setItem('dismissed_popups', JSON.stringify(dismissedBanners));
      }
    }
    setIsOpen(false);
    setCurrentBanner(null);
  };

  const handleBannerClick = () => {
    if (currentBanner?.linkUrl) {
      window.open(currentBanner.linkUrl, '_blank');
    }
    handleDismiss();
  };

  if (!currentBanner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-lg" data-testid="popup-banner-dialog">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 z-10 bg-white/80 hover:bg-white rounded-full w-8 h-8 p-0"
          onClick={handleDismiss}
          data-testid="button-close-popup"
        >
          <X className="h-4 w-4" />
        </Button>
        {currentBanner.imageUrl && (
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className={`w-full h-auto ${currentBanner.linkUrl ? 'cursor-pointer' : ''}`}
            onClick={currentBanner.linkUrl ? handleBannerClick : undefined}
            data-testid="img-popup-banner"
          />
        )}
        {!currentBanner.imageUrl && (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">{currentBanner.title}</h2>
            {currentBanner.linkUrl && (
              <Button onClick={handleBannerClick} data-testid="button-popup-link">
                Learn More
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
