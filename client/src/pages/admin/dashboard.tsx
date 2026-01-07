import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Radio,
  Calendar,
  Truck,
  XCircle,
  Volume2,
  Bell,
  IndianRupee,
  QrCode,
  Upload,
  ToggleLeft,
  ToggleRight,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/cart';
import { ORDER_STATUSES } from '@/lib/constants';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import type { ManualPaymentConfig } from '@shared/schema';

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading while auth is being checked
  if (!user && !authLoading) {
    setLocation('/admin/login');
    return null;
  }

  // Redirect if not admin after auth is confirmed
  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    setLocation('/admin/login');
    return null;
  }

  // Live visitor counter state
  const [liveVisitors, setLiveVisitors] = useState(Math.floor(Math.random() * 5) + 1);
  const [isOnline, setIsOnline] = useState(true);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    // Create audio element for order notifications
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    
    // Generate notification sound programmatically
    const generateNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.6);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.9);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1);
    };

    const playNotification = () => {
      try {
        generateNotificationSound();
      } catch (error) {
        console.warn('Audio notification failed:', error);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('canplay', playNotification);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplay', playNotification);
      }
    };
  }, []);

  // Simulate live order updates (in production, this would be WebSocket)
  useEffect(() => {
    const checkForNewOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('/api/admin/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const orders = await response.json();
          const recentOrders = orders.slice(0, 5);
          
          if (liveOrders.length > 0 && recentOrders.length > liveOrders.length) {
            // New order detected
            setNewOrderAlert(true);
            
            // Play notification sound for 5 seconds
            const playSound = () => {
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Create ringing sound pattern
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                
                let currentTime = audioContext.currentTime;
                for (let i = 0; i < 10; i++) { // 10 rings over 5 seconds
                  oscillator.frequency.setValueAtTime(800, currentTime);
                  oscillator.frequency.setValueAtTime(600, currentTime + 0.2);
                  oscillator.frequency.setValueAtTime(800, currentTime + 0.4);
                  currentTime += 0.5;
                }
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 5);
                
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5);
              } catch (error) {
                console.warn('Audio notification failed:', error);
              }
            };
            
            playSound();
            
            setTimeout(() => setNewOrderAlert(false), 5000);
          }
          
          setLiveOrders(recentOrders);
        }
      } catch (error) {
        console.warn('Failed to check for new orders:', error);
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkForNewOrders, 10000);
    checkForNewOrders(); // Initial check

    return () => clearInterval(interval);
  }, [liveOrders.length]);

  // Update live visitors periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVisitors(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(0, Math.min(15, prev + change)); // Keep between 0-15
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    ordersReceivedToday: number;
    ordersDeliveredToday: number;
    ordersCancelledToday: number;
    recentOrders: any[];
    topProducts: any[];
  }>({
    queryKey: ['/api/admin/analytics'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Fetch recent orders
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/orders'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Payment config state and queries
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrEnabled, setQrEnabled] = useState(false);

  // Fetch manual payment config
  const { data: paymentConfig } = useQuery<ManualPaymentConfig | null>({
    queryKey: ['/api/admin/manual-payment-config'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Fetch QR payment orders (users who selected QR payment)
  const { data: qrPaymentOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/orders', { paymentMethod: 'qr' }],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders?paymentMethod=qr', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Update local state when config loads
  useEffect(() => {
    if (paymentConfig) {
      setQrImageUrl(paymentConfig.qrImageUrl || '');
      setUpiId(paymentConfig.upiId || '');
      setQrEnabled(paymentConfig.isActive || false);
    }
  }, [paymentConfig]);

  // Save payment config mutation
  const savePaymentConfigMutation = useMutation({
    mutationFn: async (data: { qrImageUrl: string; upiId: string; isActive: boolean }) => {
      const response = await apiRequest('POST', '/api/admin/manual-payment-config', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/manual-payment-config'] });
      toast({
        title: 'Payment Settings Saved',
        description: 'QR/UPI payment configuration updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payment settings',
        variant: 'destructive',
      });
    },
  });

  const handleSavePaymentConfig = () => {
    savePaymentConfigMutation.mutate({
      qrImageUrl,
      upiId,
      isActive: qrEnabled,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'payment_success': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'payment_success': return <CheckCircle className="h-3 w-3" />;
      case 'confirmed': return <CheckCircle className="h-3 w-3" />;
      case 'processing': return <Package className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      case 'payment_failed': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'payment_success': return 'Payment Successful';
      case 'confirmed': return 'Delivery Pending';
      default: return status.replace(/_/g, ' ');
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'payment_success':
      case 'confirmed':
      case 'delivered':
        return 'border-green-500 border-2';
      case 'pending':
        return 'border-yellow-400 border-2';
      case 'cancelled':
      case 'payment_failed':
        return 'border-red-500 border-2';
      default:
        return 'border-gray-200';
    }
  };

  if (authLoading || analyticsLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <AdminSidebar />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar />
      
      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.username}! Here's what's happening with your bakery.</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
            <Link href="/admin/orders">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy" data-testid="button-orders">
                <ShoppingCart className="h-6 w-6" />
                <span>Orders</span>
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy" data-testid="button-products">
                <Package className="h-6 w-6" />
                <span>Products</span>
              </Button>
            </Link>
            <Link href="/admin/customers">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy" data-testid="button-customers">
                <Users className="h-6 w-6" />
                <span>Customers</span>
              </Button>
            </Link>
            <Link href="/admin/banners">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy" data-testid="button-banners">
                <TrendingUp className="h-6 w-6" />
                <span>Banners</span>
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy" data-testid="button-categories">
                <Package className="h-6 w-6" />
                <span>Categories</span>
              </Button>
            </Link>
            <Link href="/admin/payments">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy" data-testid="button-payments">
                <IndianRupee className="h-6 w-6" />
                <span>Payments</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy" data-testid="button-reports">
              <TrendingUp className="h-6 w-6" />
              <span>Reports</span>
            </Button>
          </div>

          {/* Analytics Cards - 4x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Row 1 */}
            {/* Live Visitors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Visitors</CardTitle>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <Radio className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{liveVisitors}</div>
                <p className={`text-xs flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                  LIVE
                </p>
              </CardContent>
            </Card>

            {/* Orders Received Today */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Received Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.ordersReceivedToday || 0}</div>
                <p className="text-xs text-muted-foreground">Today's new orders</p>
              </CardContent>
            </Card>

            {/* Orders Delivered Today */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Delivered Today</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.ordersDeliveredToday || 0}</div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>

            {/* Orders Cancelled Today */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Cancelled Today</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.ordersCancelledToday || 0}</div>
                <p className="text-xs text-muted-foreground">Cancelled orders</p>
              </CardContent>
            </Card>

            {/* Row 2 */}
            {/* Total Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">All time orders</p>
              </CardContent>
            </Card>

            {/* Total Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{formatPrice(analytics?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </CardContent>
            </Card>

            {/* Total Products */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">Active products</p>
              </CardContent>
            </Card>

            {/* Total Customers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.totalCustomers || 0}</div>
                <p className="text-xs text-muted-foreground">Registered customers</p>
              </CardContent>
            </Card>
          </div>

          {/* Live Orders Section */}
          {liveOrders.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold text-navy">Live Orders</h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  newOrderAlert ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-green-100 text-green-800'
                }`}>
                  {newOrderAlert ? (
                    <>
                      <Bell className="h-3 w-3 animate-bounce" />
                      <Volume2 className="h-3 w-3" />
                      NEW ORDER!
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      LIVE
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveOrders.map((order: any) => (
                  <Card key={order.id} className={`transition-all duration-300 ${getBorderColor(order.status)} ${
                    newOrderAlert ? 'ring-2 ring-red-500 shadow-lg' : 'hover:shadow-md'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-navy">#{order.orderNumber}</span>
                        <Badge className={`${getStatusColor(order.status)} text-xs capitalize`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusLabel(order.status)}</span>
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><span className="font-medium">Customer:</span> {order.deliveryAddress?.name}</p>
                        <p><span className="font-medium">Payment Status:</span> <span className={`font-semibold ${getStatusColor(order.status)} px-1.5 py-0.5 rounded-sm`}>{getStatusLabel(order.status)}</span></p>
                        <p><span className="font-medium">Total:</span> {formatPrice(parseFloat(order.total))}</p>
                        <p><span className="font-medium">Time:</span> {new Date(order.orderDate).toLocaleTimeString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Recent Orders 
                  <Badge variant="secondary" className="text-xs">
                    {recentOrders.length} found
                  </Badge>
                </CardTitle>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="text-champagne hover:text-navy">
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders && recentOrders.length > 0 ? (
                    recentOrders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border \${getBorderColor(order.status)}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-navy">#{order.orderNumber}</span>
                            <Badge className={`text-xs capitalize \${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{getStatusLabel(order.status)}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-navy">{formatPrice(parseFloat(order.total))}</p>
                          <p className="text-xs text-gray-500">{order.paymentMethod?.toUpperCase() || 'N/A'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium mb-2">No orders yet</p>
                      <p className="text-gray-400 text-sm">Orders will appear here once customers start placing them</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topProducts?.slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={product.images[0] || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-navy">{product.name}</h4>
                        <p className="text-sm text-gray-600">{formatPrice(parseFloat(product.price))}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-champagne">{product.orderCount}</p>
                        <p className="text-xs text-gray-500">orders</p>
                      </div>
                    </div>
                  )) || []}
                  {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                    <p className="text-gray-500 text-center py-8">No sales data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Settings Widget */}
          <div className="mt-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-champagne" />
                  Payment Settings (QR/UPI)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Enable QR Payment</span>
                  <Switch
                    checked={qrEnabled}
                    onCheckedChange={setQrEnabled}
                    data-testid="switch-qr-enabled"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="qrImageUrl">QR Code Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="qrImageUrl"
                          value={qrImageUrl}
                          onChange={(e) => setQrImageUrl(e.target.value)}
                          placeholder="https://example.com/qr-code.png"
                          data-testid="input-qr-image-url"
                        />
                        <Button variant="outline" size="icon">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                      {qrImageUrl && (
                        <div className="mt-2 p-2 border rounded-lg">
                          <img
                            src={qrImageUrl}
                            alt="QR Preview"
                            className="w-32 h-32 object-contain mx-auto"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        data-testid="input-upi-id"
                      />
                    </div>

                    <Button
                      onClick={handleSavePaymentConfig}
                      disabled={savePaymentConfigMutation.isPending}
                      className="w-full bg-champagne text-navy hover:bg-champagne/90"
                      data-testid="button-save-payment-config"
                    >
                      {savePaymentConfigMutation.isPending ? 'Saving...' : 'Save Payment Settings'}
                    </Button>
                  </div>

                  {/* QR Payment Orders List */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-navy flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      QR Payment Orders ({qrPaymentOrders.length})
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {qrPaymentOrders.length > 0 ? (
                        qrPaymentOrders.slice(0, 10).map((order: any) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                            data-testid={`qr-order-${order.id}`}
                          >
                            <div>
                              <p className="font-medium text-navy">#{order.orderNumber}</p>
                              <p className="text-sm text-gray-600">
                                {order.deliveryAddress?.name || 'Customer'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {order.deliveryAddress?.phone}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-navy">{formatPrice(parseFloat(order.total))}</p>
                              <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <QrCode className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p>No QR payment orders yet</p>
                        </div>
                      )}
                    </div>
                    {qrPaymentOrders.length > 10 && (
                      <Link href="/admin/payments">
                        <Button variant="outline" className="w-full">
                          View All QR Orders ({qrPaymentOrders.length})
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
