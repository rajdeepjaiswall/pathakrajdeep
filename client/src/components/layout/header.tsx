import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { COMPANY_INFO } from '@/lib/constants';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { summary, openCart } = useCart();
  const [location] = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Categories', href: '/products?category=all' },
    { name: 'About', href: '/#about' },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <header className="bg-cream shadow-lg sticky top-0 z-50 border-b border-almond">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Combined Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/attached_assets/project_20250530_0051420-02.png"
              alt="Pathak Bhandar Logo" 
              className="h-12 object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`font-semibold transition-all duration-300 py-2 px-3 rounded-lg ${
                  location === item.href
                    ? 'text-navy bg-champagne shadow-sm'
                    : 'text-navy hover:text-champagne hover:bg-almond/30'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Profile */}
          <div className="flex items-center space-x-4">

            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-navy">Hello, {user?.username}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-navy border-champagne hover:bg-champagne rounded-lg px-4 py-2 font-semibold transition-all duration-300"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="hidden md:flex bg-champagne text-navy hover:bg-champagne/90 rounded-lg px-4 py-2 font-semibold transition-all duration-300 shadow-sm">
                  <User className="h-4 w-4 mr-2 text-navy" />
                  Login
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-navy hover:bg-almond/30 rounded-xl p-3 transition-all duration-300"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6 text-navy" /> : <Menu className="h-6 w-6 text-navy" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-navy font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Hello, {user?.username}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-navy border-champagne hover:bg-champagne"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button 
                  className="w-full bg-champagne text-navy hover:bg-champagne/90 mt-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
