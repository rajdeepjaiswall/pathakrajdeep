import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, User, Menu, X, Heart, Settings, LogOut, BarChart3, Package, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useQuery } from '@tanstack/react-query';
import { Category, Product } from '@shared/schema';
import pathakLogo from '@assets/project_20250528_0859055-02.png';
import bakeryPattern from '@assets/project_20250607_1604012-01_1749292781428.png';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { summary, openCart } = useCart();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const handleInstallApp = () => {
    const event = new CustomEvent('showInstallPrompt');
    window.dispatchEvent(event);
    setIsMobileMenuOpen(false);
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    productCount: allProducts.filter(p => p.category_id === cat.id).length
  }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="bg-cream shadow-lg sticky top-0 z-50 border-b border-almond">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-18">
          {/* Left Side: Search & Menu */}
          <div className="flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-navy hover:bg-almond/30">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-cream p-0 overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `url(${bakeryPattern})`,
                    backgroundSize: '200px 200px',
                    backgroundRepeat: 'repeat'
                  }}
                />
                <div className="relative h-full flex flex-col p-6">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-navy font-bold text-xl">Menu</SheetTitle>
                  </SheetHeader>

                  {/* Search bar inside menu */}
                  <form onSubmit={handleSearch} className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 border-almond focus:border-champagne rounded-full"
                    />
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    <h4 className="text-sm font-bold text-navy/60 uppercase tracking-wider px-2 mb-2">Categories</h4>
                    {filteredCategories.map((category) => (
                      <Link 
                        key={category.id} 
                        href={`/products?category=${category.id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-almond/30 transition-colors group"
                      >
                        <span className="text-navy font-medium group-hover:text-amber-900">{category.name}</span>
                        <span className="bg-champagne/30 text-navy text-xs px-2 py-1 rounded-full font-bold">
                          {category.productCount}
                        </span>
                      </Link>
                    ))}
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-6 pt-6 border-t border-almond space-y-2">
                    {isAuthenticated ? (
                      <>
                        <Link href="/customer/profile" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-almond/20">
                          <User className="h-5 w-5 text-navy" />
                          <span className="text-navy font-medium">Profile</span>
                        </Link>
                        <Link href="/customer/orders" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-almond/20">
                          <Package className="h-5 w-5 text-navy" />
                          <span className="text-navy font-medium">Orders</span>
                        </Link>
                        <Button 
                          variant="ghost" 
                          onClick={() => logout()}
                          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <Link href="/login">
                        <Button className="w-full bg-champagne text-navy hover:bg-champagne/90 font-bold">
                          Login / Register
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center: Logo */}
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <img 
                src={pathakLogo}
                alt="Pathak Bhandar Logo" 
                className="h-14 object-contain"
              />
            </Link>
          </div>

          {/* Right Side: Cart & Account */}
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openCart()}
              className="relative text-navy hover:bg-almond/30"
            >
              <ShoppingCart className="h-6 w-6" />
              {summary.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {summary.itemCount}
                </span>
              )}
            </Button>
            
            <div className="hidden sm:block">
              {isAuthenticated ? (
                <Link href="/customer/profile">
                  <Avatar className="h-8 w-8 cursor-pointer border border-almond">
                    <AvatarImage src={(user as any)?.profileImageUrl} />
                    <AvatarFallback className="bg-champagne text-navy text-xs font-bold">
                      {((user as any)?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" size="icon" className="text-navy">
                    <User className="h-6 w-6" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
