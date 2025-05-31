import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';

export default function MobileNav() {
  const [location] = useLocation();
  const { summary, openCart } = useCart();
  const { isAuthenticated } = useAuth();

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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-cream border-t border-almond md:hidden z-40">
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          const isCart = item.label === 'Cart';
          const isLogo = item.icon === 'logo';

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={isCart ? handleCartClick : undefined}
              className={`flex flex-col items-center justify-center py-2 relative ${
                isActive ? 'text-champagne' : 'text-navy'
              }`}
            >
              {isLogo ? (
                <div className="relative -top-2">
                  <img 
                    src={`/api/logo?v=${Date.now()}`} 
                    alt="KB Logo" 
                    className="h-8 w-8 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(94%) saturate(7151%) hue-rotate(356deg) brightness(95%) contrast(112%)' }}
                  />
                </div>
              ) : (
                <Icon className="h-5 w-5 text-navy" />
              )}
              <span className="text-xs mt-1 text-navy">{item.label}</span>
              {isCart && summary.itemCount > 0 && (
                <div className="absolute -top-1 right-3 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
