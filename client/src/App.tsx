import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { CartProvider } from "./hooks/use-cart";
import PWAInstaller from "./components/PWAInstaller";
import InstallPrompt from "./components/InstallPrompt";
import GoogleOneTap from "./components/GoogleOneTap";

// Pages
import Home from "@/pages/home";
import Products from "@/pages/products";
import Categories from "@/pages/categories";
import ProductDetail from "@/pages/product-detail";
import SearchPage from "@/pages/search";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import CustomerLogin from "@/pages/customer/login";
import CustomerRegister from "@/pages/customer/register";
import CustomerProfile from "@/pages/customer/profile";
import CustomerAccount from "@/pages/customer/account";
import CustomerWishlist from "@/pages/customer/wishlist";
import CustomerOrders from "@/pages/customer/orders";
import OrderConfirmation from "@/pages/order-confirmation";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOrders from "@/pages/admin/orders";
import AdminProducts from "@/pages/admin/products";
import AdminCustomers from "@/pages/admin/customers";
import AdminBanners from "@/pages/admin/banners";
import AdminCategories from "@/pages/admin/categories";
import SuperAdminLogin from "@/pages/super-admin/login";
import SuperAdminDashboard from "@/pages/super-admin/dashboard";
import LogoManager from "@/pages/super-admin/logo-manager";
import ShopkeeperManager from "@/pages/super-admin/shopkeepers";
import ProductManager from "@/pages/super-admin/products";
import OTPTest from "@/pages/otp-test";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CompleteProfile from "@/pages/complete-profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/categories" component={Categories} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/search" component={SearchPage} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/login" component={CustomerLogin} />
      <Route path="/register" component={CustomerRegister} />
      <Route path="/account" component={CustomerAccount} />
      <Route path="/customer/login" component={CustomerLogin} />
      <Route path="/customer/register" component={CustomerRegister} />
      <Route path="/customer/profile" component={CustomerProfile} />
      <Route path="/customer/account" component={CustomerAccount} />
      <Route path="/customer/wishlist" component={CustomerWishlist} />
      <Route path="/customer/orders" component={CustomerOrders} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/banners" component={AdminBanners} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/super-admin/login" component={SuperAdminLogin} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/super-admin/logo-manager" component={LogoManager} />
      <Route path="/super-admin/shopkeepers" component={ShopkeeperManager} />
      <Route path="/super-admin/products" component={ProductManager} />
      <Route path="/otp-test" component={OTPTest} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <>
      <PWAInstaller />
      <InstallPrompt />
      <GoogleOneTap />
      <Router />
    </>
  );
}

export default App;
