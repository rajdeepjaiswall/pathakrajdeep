import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, Calendar, Users, ShoppingCart, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { formatPrice } from '@/lib/cart';
import type { Order, User, ManualPaymentDetails } from '@shared/schema';

export default function Reports() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('orders');
  
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  const { data: ordersData, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/super-admin/reports/orders', startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/super-admin/reports/orders?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: activeTab === 'orders'
  });

  const { data: customersData, isLoading: customersLoading } = useQuery<User[]>({
    queryKey: ['/api/super-admin/reports/customers', startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/super-admin/reports/customers?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    },
    enabled: activeTab === 'customers'
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<ManualPaymentDetails[]>({
    queryKey: ['/api/super-admin/reports/payments', startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/super-admin/reports/payments?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
    enabled: activeTab === 'payments'
  });

  const downloadCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h.toLowerCase().replace(/ /g, '')] || row[h] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${startDate}_to_${endDate}.csv`;
    link.click();
  };

  const exportOrders = () => {
    if (!ordersData) return;
    const exportData = ordersData.map(o => ({
      OrderNumber: o.orderNumber,
      Status: o.status,
      Total: o.total,
      PaymentMethod: o.paymentMethod,
      PaymentStatus: o.paymentStatus,
      Date: new Date(o.orderDate!).toLocaleDateString()
    }));
    downloadCSV(exportData, 'orders', ['OrderNumber', 'Status', 'Total', 'PaymentMethod', 'PaymentStatus', 'Date']);
  };

  const exportCustomers = () => {
    if (!customersData) return;
    const exportData = customersData.map(c => ({
      Name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.username,
      Email: c.email,
      Phone: c.phone || '',
      JoinedDate: new Date(c.createdAt!).toLocaleDateString()
    }));
    downloadCSV(exportData, 'customers', ['Name', 'Email', 'Phone', 'JoinedDate']);
  };

  const exportPayments = () => {
    if (!paymentsData) return;
    const exportData = paymentsData.map(p => ({
      OrderId: p.orderId,
      UTR: p.utrReference || '',
      Status: p.status,
      SubmittedAt: p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : '',
      VerifiedAt: p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : ''
    }));
    downloadCSV(exportData, 'payments', ['OrderId', 'UTR', 'Status', 'SubmittedAt', 'VerifiedAt']);
  };

  const totalRevenue = ordersData?.reduce((sum, o) => sum + parseFloat(o.total?.toString() || '0'), 0) || 0;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="h-8 w-8 text-champagne" />
          <h1 className="text-3xl font-bold text-navy">Reports & Analytics</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    setStartDate(d.toISOString().split('T')[0]);
                    setEndDate(new Date().toISOString().split('T')[0]);
                  }}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 30);
                    setStartDate(d.toISOString().split('T')[0]);
                    setEndDate(new Date().toISOString().split('T')[0]);
                  }}
                >
                  Last 30 Days
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="orders" data-testid="tab-orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers" className="gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Orders Report</CardTitle>
                <Button onClick={exportOrders} data-testid="button-export-orders" disabled={!ordersData?.length}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="animate-pulse h-48 bg-gray-100 rounded" />
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-navy">{ordersData?.length || 0}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-navy">{formatPrice(totalRevenue)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Avg Order Value</p>
                        <p className="text-2xl font-bold text-navy">
                          {formatPrice(ordersData?.length ? totalRevenue / ordersData.length : 0)}
                        </p>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordersData?.slice(0, 50).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.status}</TableCell>
                            <TableCell>{formatPrice(parseFloat(order.total?.toString() || '0'))}</TableCell>
                            <TableCell>{order.paymentMethod}</TableCell>
                            <TableCell>{new Date(order.orderDate!).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {ordersData && ordersData.length > 50 && (
                      <p className="text-sm text-gray-500 mt-4 text-center">
                        Showing first 50 of {ordersData.length} orders. Export to see all.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Customers Report</CardTitle>
                <Button onClick={exportCustomers} data-testid="button-export-customers" disabled={!customersData?.length}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="animate-pulse h-48 bg-gray-100 rounded" />
                ) : (
                  <>
                    <div className="bg-purple-50 rounded-lg p-4 mb-6 inline-block">
                      <p className="text-sm text-gray-600">New Customers</p>
                      <p className="text-2xl font-bold text-navy">{customersData?.length || 0}</p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customersData?.slice(0, 50).map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                              {`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.username || '-'}
                            </TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.phone || '-'}</TableCell>
                            <TableCell>{new Date(customer.createdAt!).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Payments Report</CardTitle>
                <Button onClick={exportPayments} data-testid="button-export-payments" disabled={!paymentsData?.length}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="animate-pulse h-48 bg-gray-100 rounded" />
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Successful</p>
                        <p className="text-2xl font-bold text-green-600">
                          {paymentsData?.filter(p => p.status === 'success').length || 0}
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {paymentsData?.filter(p => p.status === 'pending').length || 0}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Failed</p>
                        <p className="text-2xl font-bold text-red-600">
                          {paymentsData?.filter(p => p.status === 'failed').length || 0}
                        </p>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>UTR Reference</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Verified</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentsData?.slice(0, 50).map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.orderId}</TableCell>
                            <TableCell>{payment.utrReference || '-'}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                payment.status === 'success' ? 'bg-green-100 text-green-700' :
                                payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {payment.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {payment.submittedAt ? new Date(payment.submittedAt).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              {payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
