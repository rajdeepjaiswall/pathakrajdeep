import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice } from '@/lib/cart';
import { ORDER_STATUSES } from '@/lib/constants';
import { Link, useLocation } from 'wouter';

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

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: any[];
    topProducts: any[];
  }>({
    queryKey: ['/api/admin/analytics'],
  });

  // Fetch recent orders
  const { data: recentOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/orders'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'confirmed': return <CheckCircle className="h-3 w-3" />;
      case 'processing': return <Package className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (authLoading || analyticsLoading) {
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <Link href="/admin/orders">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy">
                <ShoppingCart className="h-6 w-6" />
                <span>Orders</span>
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy">
                <Package className="h-6 w-6" />
                <span>Products</span>
              </Button>
            </Link>
            <Link href="/admin/customers">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy">
                <Users className="h-6 w-6" />
                <span>Customers</span>
              </Button>
            </Link>
            <Link href="/admin/banners">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy">
                <TrendingUp className="h-6 w-6" />
                <span>Banners</span>
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy">
                <Package className="h-6 w-6" />
                <span>Categories</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-20 flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy">
              <TrendingUp className="h-6 w-6" />
              <span>Reports</span>
            </Button>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="text-champagne hover:text-navy">
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-navy">#{order.orderNumber}</span>
                          <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || order.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-navy">{formatPrice(parseFloat(order.total))}</p>
                        <p className="text-xs text-gray-500">{order.paymentMethod.toUpperCase()}</p>
                      </div>
                    </div>
                  ))}
                  {recentOrders.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No orders yet</p>
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
        </div>
      </div>
    </div>
  );
}
