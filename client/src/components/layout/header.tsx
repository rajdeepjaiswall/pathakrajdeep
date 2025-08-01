import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, User, Menu, X, Heart, Settings, LogOut, BarChart3, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { COMPANY_INFO } from '@/lib/constants';
import pathakLogo from '@assets/project_20250528_0859055-02.png';
import bakeryPattern from '@assets/project_20250607_1604012-01_1749292781428.png';
import OptimizedImage from '@/components/OptimizedImage';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
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

          {/* Profile & Actions */}
          <div className="flex items-center space-x-4">
            {/* Desktop Hamburger Menu */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                  className="relative text-navy hover:bg-almond/30 rounded-xl p-3 transition-all duration-300"
                >
                  <Menu className="h-6 w-6 text-navy" />
                  {summary.itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {summary.itemCount}
                    </span>
                  )}
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

            {/* Mobile hamburger menu */}
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
        <div className="md:hidden border-t shadow-lg relative bg-cream">
          {/* Background Pattern for Mobile */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url(${bakeryPattern})`,
              backgroundSize: '180px 180px',
              backgroundRepeat: 'repeat'
            }}
          />
          <div className="relative px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-navy font-medium py-2 px-3 rounded-lg hover:bg-almond/30 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <div className="pt-4 border-t border-almond space-y-3">
                <Link href="/customer/profile">
                  <div 
                    className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-almond/30 transition-colors relative"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="relative">
                      {(user as any)?.profileImageUrl ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={(user as any).profileImageUrl} alt={(user as any).firstName || user.username || 'Profile'} />
                          <AvatarFallback className="bg-champagne text-navy text-sm font-semibold">
                            {((user as any).firstName || user.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="h-8 w-8 bg-champagne">
                          <AvatarFallback className="bg-champagne text-navy text-sm font-semibold">
                            {((user as any)?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {(user as any)?.authProvider === 'google' && !(user as any)?.profileCompleted && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                    <span className="text-navy font-medium">Namaste, {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any)?.lastName || ''}`.trim() : user?.username}</span>
                  </div>
                </Link>

                {/* Admin Dashboard - Only for admin and super_admin */}
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Link href="/admin/dashboard">
                    <div 
                      className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-almond/30 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BarChart3 className="h-5 w-5 text-navy" />
                      <span className="text-navy font-medium">Dashboard</span>
                    </div>
                  </Link>
                )}
                
                <div 
                  className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-almond/30 transition-colors cursor-pointer"
                  onClick={() => {
                    openCart();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-navy" />
                    {summary.itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {summary.itemCount}
                      </span>
                    )}
                  </div>
                  <span className="text-navy font-medium">Cart ({summary.itemCount})</span>
                </div>

                <Link href="/customer/wishlist">
                  <div 
                    className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-almond/30 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Heart className="h-5 w-5 text-navy" />
                    <span className="text-navy font-medium">Wishlist</span>
                  </div>
                </Link>

                <Link href="/customer/orders">
                  <div 
                    className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-almond/30 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Package className="h-5 w-5 text-navy" />
                    <span className="text-navy font-medium">My Orders</span>
                  </div>
                </Link>

                <Link href="/customer/profile">
                  <div 
                    className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-almond/30 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 text-navy" />
                    <span className="text-navy font-medium">Account Settings</span>
                  </div>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-navy border-champagne hover:bg-champagne mt-3"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t border-almond space-y-2">
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

      {/* Desktop Sliding Menu */}
      {isDesktopMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40 hidden md:block"
            onClick={() => setIsDesktopMenuOpen(false)}
          />
          
          {/* Sliding Menu */}
          <div className="fixed top-0 right-0 h-full w-80 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out hidden md:block bg-cream">
            {/* Background Pattern */}
            <div 
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: `url(${bakeryPattern})`,
                backgroundSize: '250px 250px',
                backgroundRepeat: 'repeat'
              }}
            />
            {/* Content Overlay */}
            <div className="relative p-6 h-full">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-almond">
                <h3 className="text-lg font-semibold text-navy">Menu</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="text-navy hover:bg-almond/30 rounded-full p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User Greeting */}
              <div className="mb-6">
                <Link href="/customer/profile">
                  <div 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-almond/30 transition-colors cursor-pointer"
                    onClick={() => setIsDesktopMenuOpen(false)}
                  >
                    {(user as any)?.profileImageUrl ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={(user as any).profileImageUrl} alt={(user as any).firstName || user.username || 'Profile'} />
                        <AvatarFallback className="bg-champagne text-navy font-semibold">
                          {((user as any).firstName || user.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-10 w-10 bg-champagne">
                        <AvatarFallback className="bg-champagne text-navy font-semibold">
                          {((user as any)?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="text-sm text-navy/70">Welcome back</p>
                      <p className="font-semibold text-navy">Namaste, {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any)?.lastName || ''}`.trim() : user?.username}</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">
                {/* Admin Dashboard - Only for admin and super_admin */}
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Link href="/admin/dashboard">
                    <div 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-almond/30 transition-colors"
                      onClick={() => setIsDesktopMenuOpen(false)}
                    >
                      <BarChart3 className="h-6 w-6 text-navy" />
                      <span className="text-navy font-medium">Dashboard</span>
                    </div>
                  </Link>
                )}

                {/* Cart */}
                <div 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-almond/30 transition-colors cursor-pointer"
                  onClick={() => {
                    openCart();
                    setIsDesktopMenuOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <ShoppingCart className="h-6 w-6 text-navy" />
                      {summary.itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {summary.itemCount}
                        </span>
                      )}
                    </div>
                    <span className="text-navy font-medium">Cart</span>
                  </div>
                  {summary.itemCount > 0 && (
                    <span className="bg-champagne text-navy text-sm px-2 py-1 rounded-full font-medium">
                      {summary.itemCount} items
                    </span>
                  )}
                </div>

                {/* Wishlist */}
                <Link href="/customer/wishlist">
                  <div 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-almond/30 transition-colors"
                    onClick={() => setIsDesktopMenuOpen(false)}
                  >
                    <Heart className="h-6 w-6 text-navy" />
                    <span className="text-navy font-medium">Wishlist</span>
                  </div>
                </Link>

                {/* Account Settings */}
                <Link href="/customer/profile">
                  <div 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-almond/30 transition-colors"
                    onClick={() => setIsDesktopMenuOpen(false)}
                  >
                    <Settings className="h-6 w-6 text-navy" />
                    <span className="text-navy font-medium">Account Settings</span>
                  </div>
                </Link>
              </div>

              {/* Logout Button */}
              <div className="mt-8 pt-6 border-t border-almond">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    logout();
                    setIsDesktopMenuOpen(false);
                  }}
                  className="w-full text-navy border-champagne hover:bg-champagne/10 font-semibold flex items-center justify-center space-x-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
