import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, User, Menu, X, Heart, Settings, LogOut, BarChart3, Package, Download, Search, ChevronDown, ChevronRight, Home, ClipboardList, Phone, Info, Shield } from 'lucide-react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
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

  const filteredCategories = categories.map(cat => ({
    ...cat,
    productCount: allProducts.filter(p => p.category_id === cat.id).length
  }));

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.description?.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [searchTerm, allProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleMenuClose = () => setIsMenuSheetOpen(false);

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    setLocation('/');
  };

  return (
    <header className="bg-cream shadow-lg sticky top-0 z-50 border-b border-almond">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-18">
          {/* Left Side: Search */}
          <div className="flex items-center justify-start">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-navy hover:bg-almond/30">
                  <Search className="h-6 w-6" />
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
                    <SheetTitle className="text-navy font-bold text-xl text-center">Search Products</SheetTitle>
                  </SheetHeader>

                  <form onSubmit={handleSearch} className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50" />
                    <Input
                      autoFocus
                      placeholder="What are you looking for?"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 border-almond focus:border-champagne rounded-full"
                    />
                  </form>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {searchTerm.trim() ? (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-navy/60 uppercase tracking-wider px-2">Search Results</h4>
                        {searchResults.length > 0 ? (
                          <div className="space-y-2">
                            {searchResults.map((product) => (
                              <Link 
                                key={product.id} 
                                href={`/products/${product.id}`}
                                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/30 transition-colors group bg-white/40 border border-almond/20"
                              >
                                {product.images && product.images.length > 0 && (
                                  <img src={product.images[0]} alt={product.name} className="h-10 w-10 object-cover rounded-lg" />
                                )}
                                <div className="flex flex-col">
                                  <span className="text-navy font-medium group-hover:text-amber-900 line-clamp-1">{product.name}</span>
                                  <span className="text-xs text-navy/60">₹{Number(product.price).toFixed(2)}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-navy/60 py-10">No products found for "{searchTerm}"</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-navy/60 uppercase tracking-wider px-2 mb-2">Categories</h4>
                        <Accordion type="single" collapsible className="w-full space-y-2">
                          {filteredCategories.map((category) => (
                            <AccordionItem key={category.id} value={`cat-${category.id}`} className="border-none">
                              <AccordionTrigger className="flex items-center justify-between p-3 rounded-xl hover:bg-almond/30 transition-colors group hover:no-underline py-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-navy font-medium group-hover:text-amber-900">{category.name}</span>
                                  <span className="bg-champagne/30 text-navy text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {category.productCount}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-1 pb-2 px-2">
                                <div className="grid grid-cols-1 gap-1">
                                  {allProducts
                                    .filter(p => p.category_id === category.id)
                                    .map(product => (
                                      <Link 
                                        key={product.id} 
                                        href={`/products/${product.id}`}
                                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-champagne/20 transition-colors group"
                                      >
                                        <div className="h-8 w-8 rounded bg-white flex items-center justify-center overflow-hidden border border-almond/20">
                                          {product.images && product.images.length > 0 ? (
                                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                          ) : (
                                            <Package className="h-4 w-4 text-navy/20" />
                                          )}
                                        </div>
                                        <span className="text-sm text-navy/80 group-hover:text-navy truncate font-medium">
                                          {product.name}
                                        </span>
                                      </Link>
                                    ))
                                  }
                                  <Link 
                                    href={`/products?category=${category.id}`}
                                    className="text-center text-xs text-amber-800 font-bold py-2 mt-1 hover:underline"
                                  >
                                    View All {category.name}
                                  </Link>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
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
                className="h-10 sm:h-14 object-contain"
              />
            </Link>
          </div>

          {/* Right Side: Hamburger Menu */}
          <div className="flex items-center justify-end">
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-navy hover:bg-almond/30">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-cream p-0 overflow-hidden flex flex-col">
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `url(${bakeryPattern})`,
                    backgroundSize: '200px 200px',
                    backgroundRepeat: 'repeat'
                  }}
                />
                <div className="relative h-full flex flex-col">
                  {/* Header */}
                  <div className="p-6 pb-4 border-b border-almond/50">
                    <SheetTitle className="text-navy font-bold text-xl mb-4">Menu</SheetTitle>
                    {isAuthenticated && user ? (
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 border-2 border-champagne">
                          <AvatarImage src={(user as any)?.profileImageUrl} />
                          <AvatarFallback className="bg-champagne text-navy font-bold text-lg">
                            {((user as any)?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-navy/60 text-xs">Namaste</p>
                          <p className="text-navy font-bold text-sm truncate max-w-[160px]">
                            {(user as any)?.firstName 
                              ? `${(user as any).firstName} ${(user as any)?.lastName || ''}`.trim() 
                              : user?.username}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link href="/login" onClick={handleMenuClose}>
                          <Button className="w-full bg-navy text-cream hover:bg-navy/90 font-bold rounded-xl">
                            Login to Account
                          </Button>
                        </Link>
                        <Link href="/customer/register" onClick={handleMenuClose}>
                          <Button variant="outline" className="w-full border-navy text-navy hover:bg-navy/5 font-bold rounded-xl">
                            Create New Account
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Navigation Items */}
                  <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <Link href="/" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Home className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-navy font-semibold">Home</span>
                      </div>
                    </Link>

                    <Link href="/customer/wishlist" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Heart className="h-5 w-5 text-red-500" />
                        </div>
                        <span className="text-navy font-semibold">Favorites</span>
                      </div>
                    </Link>

                    <Link href="/customer/orders" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="h-5 w-5 text-orange-600" />
                        </div>
                        <span className="text-navy font-semibold">Orders</span>
                      </div>
                    </Link>

                    <Link href="/contact-us" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-navy font-semibold">Contact Us</span>
                      </div>
                    </Link>

                    <Link href="/about-us" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Info className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="text-navy font-semibold">About Us</span>
                      </div>
                    </Link>

                    {isAuthenticated && (
                      <Link href="/customer/account" onClick={handleMenuClose}>
                        <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Settings className="h-5 w-5 text-gray-600" />
                          </div>
                          <span className="text-navy font-semibold">Account Settings</span>
                        </div>
                      </Link>
                    )}

                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                      <Link href="/admin" onClick={handleMenuClose}>
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-navy/5 hover:bg-navy/10 transition-colors group cursor-pointer border border-navy/10">
                          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="h-5 w-5 text-champagne" />
                          </div>
                          <span className="text-navy font-bold">Admin Dashboard</span>
                        </div>
                      </Link>
                    )}

                    {isAuthenticated && (
                      <div className="pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition-colors group cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <LogOut className="h-5 w-5 text-red-500" />
                          </div>
                          <span className="text-red-600 font-semibold">Logout</span>
                        </button>
                      </div>
                    )}
                  </nav>

                  {/* Admin Login Button at Bottom */}
                  <div className="p-4 border-t border-almond/50">
                    {!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin') ? (
                      <Link href="/admin/login" onClick={handleMenuClose}>
                        <button className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-navy text-cream hover:bg-navy/90 transition-colors font-bold">
                          <Shield className="h-4 w-4" />
                          <span>Admin Login</span>
                        </button>
                      </Link>
                    ) : (
                      <Link href="/admin" onClick={handleMenuClose}>
                        <button className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-champagne text-navy hover:bg-champagne/90 transition-colors font-bold">
                          <Shield className="h-4 w-4" />
                          <span>Go to Admin Panel</span>
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
