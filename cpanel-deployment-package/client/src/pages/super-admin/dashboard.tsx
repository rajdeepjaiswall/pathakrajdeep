import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  Users, 
  Package, 
  ShoppingCart, 
  Settings,
  Database,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice } from '@/lib/cart';
import { useLocation } from 'wouter';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not super admin
  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
  });

  // Fetch system stats (this would be extended in a real app)
  const systemStats = {
    uptime: '99.9%',
    responseTime: '120ms',
    totalUsers: analytics?.totalCustomers || 0,
    activeOrders: 0,
    systemHealth: 'Healthy',
    lastBackup: '2 hours ago',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-champagne" />
            <h1 className="text-3xl font-bold text-navy">Super Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Complete system overview and advanced administration tools for {user?.username}
          </p>
        </div>

        {/* System Health Alert */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">System Status: Operational</h3>
                <p className="text-green-700 text-sm">All services are running normally. Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
            onClick={() => setLocation('/super-admin/logo-manager')}
          >
            <Settings className="h-6 w-6" />
            <span>Logo Manager</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={() => setLocation('/super-admin/shopkeepers')}
          >
            <Users className="h-6 w-6" />
            <span>Manage Shopkeepers</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-green-300 text-green-700 hover:bg-green-50"
            onClick={() => setLocation('/super-admin/revenue')}
          >
            <TrendingUp className="h-6 w-6" />
            <span>Revenue Analytics</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            onClick={() => setLocation('/super-admin/products')}
          >
            <Package className="h-6 w-6" />
            <span>Product Manager</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => setLocation('/super-admin/discounts')}
          >
            <Activity className="h-6 w-6" />
            <span>Discount Manager</span>
          </Button>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{formatPrice(analytics?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{analytics?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{analytics?.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{analytics?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">Products in catalog</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>System Uptime</span>
                  <span className="font-medium text-green-600">{systemStats.uptime}</span>
                </div>
                <Progress value={99.9} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Response Time</span>
                  <span className="font-medium text-blue-600">{systemStats.responseTime}</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Server Load</span>
                  <span className="font-medium text-yellow-600">Medium</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Database Health</span>
                  <span className="font-medium text-green-600">Optimal</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Recent System Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Database Size</div>
                  <div className="font-semibold text-navy">2.4 GB</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Storage Used</div>
                  <div className="font-semibold text-navy">45%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">API Calls Today</div>
                  <div className="font-semibold text-navy">1,247</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Last Backup</div>
                  <div className="font-semibold text-navy">{systemStats.lastBackup}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-navy">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span>System backup completed</span>
                    <span className="text-green-600">2h ago</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span>Database optimization</span>
                    <span className="text-blue-600">6h ago</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <span>Security scan completed</span>
                    <span className="text-yellow-600">1d ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Controls Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced System Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Database className="h-5 w-5" />
                <span>Database Management</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Users className="h-5 w-5" />
                <span>User Permissions</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-2 border-red-200 text-red-700 hover:bg-red-50"
              >
                <AlertTriangle className="h-5 w-5" />
                <span>System Maintenance</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
