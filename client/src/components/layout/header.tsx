import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { COMPANY_INFO } from '@/lib/constants';
import pathakLogo from '@assets/Screenshot_2025-05-30-23-52-51-45_10a3d211b678d435d51c62b8010e86c1.jpg';

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
              src={pathakLogo}
              alt="Pathak Bhandar Logo" 
              className="h-12 w-12 object-contain bg-transparent"
              style={{ backgroundColor: 'transparent' }}
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
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/customer/register">
                  <Button variant="outline" className="border-champagne text-navy hover:bg-champagne/10 rounded-lg px-4 py-2 font-semibold transition-all duration-300">
                    Sign Up
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-champagne text-navy hover:bg-champagne/90 rounded-lg px-4 py-2 font-semibold transition-all duration-300 shadow-sm">
                    <User className="h-4 w-4 mr-2 text-navy" />
                    Login
                  </Button>
                </Link>
              </div>
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
              <div className="pt-4 border-t space-y-2">
                <Link href="/customer/register">
                  <Button 
                    variant="outline"
                    className="w-full border-champagne text-navy hover:bg-champagne/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Button>
                </Link>
                <Link href="/login">
                  <Button 
                    className="w-full bg-champagne text-navy hover:bg-champagne/90"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
