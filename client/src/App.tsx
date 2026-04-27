import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { CartProvider } from "./hooks/use-cart";
import PWAInstaller from "./components/PWAInstaller";
import GoogleOneTap from "./components/GoogleOneTap";

// Pages
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
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
import AdminAbout from "@/pages/admin/about";
import AdminCategories from "@/pages/admin/categories";
import AdminSettings from "@/pages/admin/settings";
import AdminAccount from "@/pages/admin/account";
import AdminContactSettings from "@/pages/admin/contact-settings";
import AdminPayments from "@/pages/admin/payments";
import AdminPaymentGateway from "@/pages/admin/payment-gateway";
import AdminVerifiedCustomers from "@/pages/admin/verified-customers";
import AdminTestimonials from "@/pages/admin/testimonials";
import AdminLegalPages from "@/pages/admin/legal-pages";
import SuperAdminLogin from "@/pages/super-admin/login";
import SuperAdminDashboard from "@/pages/super-admin/dashboard";
import LogoManager from "@/pages/super-admin/logo-manager";
import ShopkeeperManager from "@/pages/super-admin/shopkeepers";
import ProductManager from "@/pages/super-admin/products";
import AdminManagement from "@/pages/super-admin/admin-management";
import PageEditor from "@/pages/super-admin/page-editor";
import PopupBannersManager from "@/pages/super-admin/popup-banners";
import Reports from "@/pages/super-admin/reports";
import AboutUs from "@/pages/about-us";
import ContactUs from "@/pages/contact-us";
import PopupBanner from "@/components/PopupBanner";
import OTPTest from "@/pages/otp-test";
import LegalPageView from "@/pages/legal-page";
import CompleteProfile from "@/pages/complete-profile";
import PhonePeCallback from "@/pages/phonepe-callback";
import NotFound from "@/pages/not-found";
import TrendingLocalPage from "@/pages/trending-local";
import { AddToCartPopup } from "@/components/AddToCartPopup";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
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
      <Route path="/admin/about" component={AdminAbout} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/account" component={AdminAccount} />
      <Route path="/admin/contact-settings" component={AdminContactSettings} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/payment-gateway" component={AdminPaymentGateway} />
      <Route path="/admin/verified-customers" component={AdminVerifiedCustomers} />
      <Route path="/admin/testimonials" component={AdminTestimonials} />
      <Route path="/admin/legal-pages" component={AdminLegalPages} />
      <Route path="/super-admin/login" component={SuperAdminLogin} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/super-admin/logo-manager" component={LogoManager} />
      <Route path="/super-admin/shopkeepers" component={ShopkeeperManager} />
      <Route path="/super-admin/products" component={ProductManager} />
      <Route path="/super-admin/admins" component={AdminManagement} />
      <Route path="/super-admin/pages" component={PageEditor} />
      <Route path="/super-admin/popup-banners" component={PopupBannersManager} />
      <Route path="/super-admin/reports" component={Reports} />
      <Route path="/admin/reports" component={Reports} />
      <Route path="/trending-local" component={TrendingLocalPage} />
      <Route path="/about-us" component={AboutUs} />
      <Route path="/contact-us" component={ContactUs} />
      <Route path="/otp-test" component={OTPTest} />
      <Route path="/privacy-policy">
        <LegalPageView pageType="privacy" pageTitle="Privacy Policy" />
      </Route>
      <Route path="/terms-of-service">
        <LegalPageView pageType="terms" pageTitle="Terms of Service" />
      </Route>
      <Route path="/shipping-policy">
        <LegalPageView pageType="shipping" pageTitle="Shipping Policy" />
      </Route>
      <Route path="/invoice-terms">
        <LegalPageView pageType="invoice" pageTitle="Invoice Terms" />
      </Route>
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/phonepe-callback" component={PhonePeCallback} />
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
      <GoogleOneTap />
      <PopupBanner />
      <AddToCartPopup />
      <Router />
    </>
  );
}

export default App;
