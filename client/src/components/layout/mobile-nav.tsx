import { Home, Search, Grid3X3, ShoppingCart, User } from 'lucide-react';
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
    { icon: Grid3X3, label: 'Categories', href: '/products' },
    { icon: ShoppingCart, label: 'Cart', href: '/cart' },
    { icon: User, label: 'Account', href: isAuthenticated ? '/account' : '/login' },
  ];

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openCart();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          const isCart = item.label === 'Cart';

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={isCart ? handleCartClick : undefined}
              className={`flex flex-col items-center justify-center py-2 relative ${
                isActive ? 'text-navy' : 'text-gray-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
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
