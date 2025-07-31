import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, Clock, X, Eye, Phone, User, ArrowLeft, Home, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/cart';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

export default function CustomerOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Fetch customer orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      return response.json();
    },
    enabled: !!user,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest('PUT', `/api/orders/${orderId}/cancel`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel order',
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'order_received': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'dispatched': return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery': return 'bg-cyan-100 text-cyan-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'order_received': return <CheckCircle className="h-3 w-3" />;
      case 'preparing': return <Package className="h-3 w-3" />;
      case 'dispatched': return <Truck className="h-3 w-3" />;
      case 'out_for_delivery': return <Truck className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'order_received': return 'Order Received';
      case 'preparing': return 'Preparing';
      case 'dispatched': return 'Dispatched';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const canCancelOrder = (status: string) => {
    return ['pending'].includes(status);
  };

  const getOrderProgress = (status: string) => {
    const steps = ['pending', 'order_received', 'preparing', 'dispatched', 'out_for_delivery', 'delivered'];
    const currentIndex = steps.indexOf(status);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">Please Login</h2>
            <p className="text-gray-600 mb-6">You need to login to view your orders</p>
            <Button className="bg-navy text-white hover:bg-navy/90">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation Bar */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Go to Cart
            </Button>
          </Link>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">My Orders</h1>
          <p className="text-gray-600">Track your orders and view order history</p>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-6">When you place orders, they'll appear here</p>
                <Button className="bg-navy text-white hover:bg-navy/90">
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order: any) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-semibold text-navy">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {new Date(order.orderDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusDisplay(order.status)}</span>
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold text-navy text-lg">{formatPrice(parseFloat(order.total))}</p>
                        <p className="text-sm text-gray-500">{order.paymentMethod.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Order Progress */}
                  {order.status !== 'cancelled' && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Order Progress</span>
                        <span>{Math.round(getOrderProgress(order.status))}% Complete</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-navy rounded-full h-2 transition-all duration-300"
                          style={{ width: `${getOrderProgress(order.status)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium">{order.deliveryAddress?.name}</p>
                        <p>{order.deliveryAddress?.addressLine1}</p>
                        {order.deliveryAddress?.addressLine2 && (
                          <p>{order.deliveryAddress.addressLine2}</p>
                        )}
                        <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.pincode}</p>
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.deliveryAddress?.phone}
                        </p>
                      </div>
                    </div>

                    {/* Rider Information */}
                    {order.riderName && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Delivery Partner</h4>
                        <div className="flex items-center gap-3">
                          {order.riderImage && (
                            <img
                              src={order.riderImage}
                              alt={order.riderName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          )}
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{order.riderName}</span>
                            </p>
                            {order.riderPhone && (
                              <p className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {order.riderPhone}
                              </p>
                            )}
                          </div>
                        </div>
                        {order.estimatedDelivery && (
                          <div className="mt-2 text-sm text-gray-600">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Estimated delivery: {new Date(order.estimatedDelivery).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details - #{order.orderNumber}</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                          <div className="space-y-6">
                            {/* Order Items */}
                            <div>
                              <h4 className="font-medium mb-3">Order Items</h4>
                              <div className="space-y-3">
                                {selectedOrder.orderItems?.map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                    {item.product?.imageUrl && (
                                      <img 
                                        src={item.product.imageUrl} 
                                        alt={item.product.name}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <h5 className="font-medium">{item.product?.name}</h5>
                                      <p className="text-sm text-gray-600">
                                        Quantity: {item.quantity} × {formatPrice(parseFloat(item.price))}
                                      </p>
                                    </div>
                                    <div className="font-medium">
                                      {formatPrice(parseFloat(item.price) * item.quantity)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border-t pt-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Subtotal</span>
                                  <span>{formatPrice(parseFloat(selectedOrder.subtotal))}</span>
                                </div>
                                {parseFloat(selectedOrder.gstAmount) > 0 && (
                                  <div className="flex justify-between">
                                    <span>GST</span>
                                    <span>{formatPrice(parseFloat(selectedOrder.gstAmount))}</span>
                                  </div>
                                )}
                                {parseFloat(selectedOrder.deliveryCharge) > 0 && (
                                  <div className="flex justify-between">
                                    <span>Delivery Charge</span>
                                    <span>{formatPrice(parseFloat(selectedOrder.deliveryCharge))}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                  <span>Total</span>
                                  <span>{formatPrice(parseFloat(selectedOrder.total))}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {canCancelOrder(order.status) ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="md:w-auto">
                            <X className="h-4 w-4 mr-2" />
                            Cancel Order
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this order? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Order</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => cancelOrderMutation.mutate(order.id)}
                            >
                              Cancel Order
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : order.riderName && order.riderPhone ? (
                      <div className="md:w-auto">
                        <Button 
                          variant="outline" 
                          className="w-full border-green-500 text-green-700 hover:bg-green-50"
                          onClick={() => window.open(`tel:${order.riderPhone}`, '_self')}
                        >
                          <PhoneCall className="h-4 w-4 mr-2" />
                          Call {order.riderName}
                        </Button>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Order can't be cancelled. Rejection charges may apply.
                        </p>
                      </div>
                    ) : !canCancelOrder(order.status) && (
                      <div className="md:w-auto">
                        <Button variant="outline" disabled className="w-full">
                          <Clock className="h-4 w-4 mr-2" />
                          In Progress
                        </Button>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Order can't be cancelled. Rejection charges may apply.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}