import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { CartProvider } from "./hooks/use-cart";

// Pages
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import CustomerLogin from "@/pages/customer/login";
import CustomerRegister from "@/pages/customer/register";
import CustomerProfile from "@/pages/customer/profile";
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
import NotFound from "@/pages/not-found";

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
      <Route path="/account" component={CustomerProfile} />
      <Route path="/customer/register" component={CustomerRegister} />
      <Route path="/customer/profile" component={CustomerProfile} />
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
            <Router />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
