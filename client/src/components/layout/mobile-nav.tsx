import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import pathakLogo from '@assets/project_20250528_0859055-02.png';
import { useState, useEffect } from 'react';

export default function MobileNav() {
  const [location] = useLocation();
  const { summary, openCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show at top
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show nav
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide nav after scrolling past 100px
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Search', href: '/products?search=true' },
    { icon: 'logo', label: 'Categories', href: '/products' },
    { icon: ShoppingCart, label: 'Cart', href: '/cart' },
    { icon: User, label: 'Account', href: isAuthenticated ? '/account' : '/login' },
  ];

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openCart();
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') return location === '/';
    if (href === '/products?search=true') return location.includes('/products') && location.includes('search');
    if (href === '/products') return location === '/products' || location.startsWith('/products/category');
    if (href === '/cart') return location === '/cart';
    if (href === '/account' || href === '/login') return location === '/account' || location.startsWith('/customer/') || location === '/login';
    return location === href;
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-amber-50/95 backdrop-blur-sm border-t border-amber-200 md:hidden z-40 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);
          const isCart = item.label === 'Cart';
          const isLogo = item.icon === 'logo';
          const isAccount = item.label === 'Account';

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={isCart ? handleCartClick : undefined}
              className={`flex flex-col items-center justify-center py-2 relative transition-all duration-200 ${
                isActive 
                  ? 'text-amber-800 bg-amber-200/40 rounded-lg mx-1' 
                  : 'text-amber-700/80 hover:text-amber-800 hover:bg-amber-200/20 rounded-lg mx-1'
              }`}
            >
              {isLogo ? (
                <div className={`relative transition-all duration-200 ${isActive ? '-top-1' : '-top-2'}`}>
                  <img 
                    src={`/api/logo?v=${Date.now()}`} 
                    alt="KB Logo" 
                    className={`object-contain transition-all duration-200 animate-pulse-logo ${isActive ? 'h-9 w-9' : 'h-8 w-8'}`}
                    style={{ 
                      filter: isActive 
                        ? 'brightness(0) saturate(100%) invert(23%) sepia(45%) saturate(2000%) hue-rotate(26deg) brightness(87%) contrast(93%)' 
                        : 'brightness(0) saturate(100%) invert(23%) sepia(45%) saturate(2000%) hue-rotate(26deg) brightness(87%) contrast(93%) opacity(0.8)'
                    }}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-800 rounded-full"></div>
                  )}
                </div>
              ) : isAccount && isAuthenticated ? (
                <div className="relative">
                  <Avatar className={`transition-all duration-200 ${isActive ? 'h-6 w-6' : 'h-5 w-5'}`}>
                    <AvatarImage src={(user as any)?.profileImageUrl} alt={(user as any)?.firstName || user?.username || 'Profile'} />
                    <AvatarFallback className="bg-amber-800 text-amber-50 text-[10px] font-semibold">
                      {((user as any)?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-800 rounded-full"></div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Icon className={`transition-all duration-200 ${isActive ? 'h-6 w-6' : 'h-5 w-5'} ${isActive ? 'text-amber-800' : 'text-amber-700/80'}`} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-800 rounded-full"></div>
                  )}
                </div>
              )}
              <span className={`text-xs mt-1 transition-all duration-200 ${isActive ? 'text-amber-800 font-medium' : 'text-amber-700/80'}`}>
                {item.label}
              </span>
              {isCart && summary.itemCount > 0 && (
                <div className="absolute -top-1 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{summary.itemCount > 9 ? '9+' : summary.itemCount}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
