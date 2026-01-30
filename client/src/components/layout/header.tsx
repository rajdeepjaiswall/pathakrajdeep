import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, User, Menu, X, Heart, Settings, LogOut, BarChart3, Package, Download, Search, ChevronDown, ChevronRight } from 'lucide-react';
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

                  {/* Search bar inside menu */}
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
                                {product.image_url && (
                                  <img src={product.image_url} alt={product.name} className="h-10 w-10 object-cover rounded-lg" />
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
                                          {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
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

          {/* Right Side: Menu */}
          <div className="flex items-center justify-end">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-navy hover:bg-almond/30">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-cream p-0 overflow-hidden">
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

                  <div className="flex-1 overflow-y-auto space-y-4">
                    <Link href="/" className="block text-navy font-semibold text-lg py-2 px-3 rounded-lg hover:bg-almond/30 transition-colors">
                      Home
                    </Link>
                    <Link href="/products" className="block text-navy font-semibold text-lg py-2 px-3 rounded-lg hover:bg-almond/30 transition-colors">
                      Products
                    </Link>
                    
                    <div className="pt-4 border-t border-almond space-y-3">
                      {isAuthenticated ? (
                        <>
                          <div className="flex items-center space-x-3 px-3 py-2">
                            <Avatar className="h-10 w-10 border border-almond">
                              <AvatarImage src={(user as any)?.profileImageUrl} />
                              <AvatarFallback className="bg-champagne text-navy font-bold">
                                {((user as any)?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-navy/60 text-xs font-medium">Namaste</span>
                              <span className="text-navy font-bold truncate max-w-[150px]">
                                {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any)?.lastName || ''}`.trim() : user?.username}
                              </span>
                            </div>
                          </div>

                          <Link href="/customer/profile" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/30 transition-colors group">
                            <User className="h-5 w-5 text-navy group-hover:scale-110 transition-transform" />
                            <span className="text-navy font-medium">My Profile</span>
                          </Link>
                          
                          <Link href="/customer/orders" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/30 transition-colors group">
                            <Package className="h-5 w-5 text-navy group-hover:scale-110 transition-transform" />
                            <span className="text-navy font-medium">My Orders</span>
                          </Link>

                          {(user?.role === 'admin' || user?.role === 'super_admin') && (
                            <Link href="/admin1" className="flex items-center space-x-3 p-3 rounded-xl bg-navy text-cream hover:bg-navy/90 transition-colors group">
                              <BarChart3 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                              <span className="font-bold">Admin Dashboard</span>
                            </Link>
                          )}

                          <div className="pt-4 mt-4 border-t border-almond">
                            <Button 
                              variant="ghost" 
                              onClick={() => logout()}
                              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                            >
                              <LogOut className="h-5 w-5 mr-3" />
                              <span className="font-bold">Logout</span>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <Link href="/login">
                            <Button className="w-full bg-navy text-cream hover:bg-navy/90 font-bold py-6 rounded-xl">
                              Login to Account
                            </Button>
                          </Link>
                          <Link href="/customer/register">
                            <Button variant="outline" className="w-full border-navy text-navy hover:bg-navy/5 font-bold py-6 rounded-xl">
                              Create New Account
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
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
