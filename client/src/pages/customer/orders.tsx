import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, Clock, X, Eye, Phone, User, ArrowLeft, Home, PhoneCall, CreditCard, AlertCircle, MessageCircle, Loader2, Star, Send, PenLine, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Header from '@/components/layout/header';
import MobileNav from '@/components/layout/mobile-nav';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/cart';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

// ETA Countdown Component
function ETACountdown({ estimatedDelivery }: { estimatedDelivery: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const deliveryTime = new Date(estimatedDelivery).getTime();
      const difference = deliveryTime - now;

      if (difference <= 0) {
        setTimeLeft('Delivery time passed');
        setIsExpired(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) {
        timeString = `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        timeString = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        timeString = `${minutes}m ${seconds}s`;
      } else {
        timeString = `${seconds}s`;
      }

      setTimeLeft(timeString);
      setIsExpired(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [estimatedDelivery]);

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${
      isExpired ? 'text-red-600' : 'text-blue-600'
    }`}>
      <Clock className="h-3 w-3" />
      <span>{timeLeft || 'Calculating...'}</span>
    </div>
  );
}

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

  const [utrInputs, setUtrInputs] = useState<{ [orderId: number]: string }>({});

  // Review form state
  const [reviewOpenOrderId, setReviewOpenOrderId] = useState<number | null>(null);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const [reviewProductName, setReviewProductName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState<{ [key: string]: boolean }>({});

  const submitReviewMutation = useMutation({
    mutationFn: async ({ orderId, productId, productName, rating, reviewText }: any) => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, productId, productName, rating, reviewText }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to submit review');
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      toast({ title: 'Review submitted!', description: 'It will appear after admin approval.' });
      setReviewSubmitted(prev => ({ ...prev, [`${vars.orderId}-${vars.productId}`]: true }));
      setReviewOpenOrderId(null);
      setReviewText('');
      setReviewRating(5);
      setReviewProductId(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const submitUTRMutation = useMutation({
    mutationFn: async ({ orderId, utr }: { orderId: number; utr: string }) => {
      const response = await apiRequest('POST', `/api/orders/${orderId}/submit-utr`, {
        utrReference: utr,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'UTR Submitted',
        description: 'Your payment is being verified. This may take a few minutes.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit UTR',
        variant: 'destructive',
      });
    },
  });

  const handleWhatsAppSupport = (orderNumber: string) => {
    const message = encodeURIComponent(`Hi, I need help with my payment for order ${orderNumber}`);
    window.open(`https://wa.me/918931014976?text=${message}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
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
      case 'pending_payment': return <CreditCard className="h-3 w-3" />;
      case 'payment_failed': return <AlertCircle className="h-3 w-3" />;
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
      case 'pending_payment': return 'Awaiting Payment';
      case 'payment_failed': return 'Payment Failed';
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
    return ['pending', 'pending_payment'].includes(status);
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
                  {/* Pending Payment Section */}
                  {order.status === 'pending_payment' && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-medium text-yellow-800">Complete Your Payment</h4>
                      </div>
                      <p className="text-sm text-yellow-700 mb-4">
                        Please complete your UPI payment and enter the UTR number below for verification.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter 12-digit UTR number"
                          value={utrInputs[order.id] || ''}
                          onChange={(e) => setUtrInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                          className="flex-1"
                          data-testid={`input-utr-${order.id}`}
                        />
                        <Button
                          onClick={() => {
                            const utr = utrInputs[order.id];
                            if (utr && utr.length >= 6) {
                              submitUTRMutation.mutate({ orderId: order.id, utr });
                            }
                          }}
                          disabled={(utrInputs[order.id]?.length || 0) < 6 || submitUTRMutation.isPending}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          data-testid={`button-submit-utr-${order.id}`}
                        >
                          {submitUTRMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Submit'
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-yellow-600 mt-2">
                        Find the UTR number in your UPI app's transaction history
                      </p>
                    </div>
                  )}

                  {/* Payment Failed Section */}
                  {order.status === 'payment_failed' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <h4 className="font-medium text-red-800">Payment Verification Failed</h4>
                      </div>
                      <p className="text-sm text-red-700 mb-4">
                        We couldn't verify your payment. Please contact support for assistance.
                      </p>
                      <Button
                        onClick={() => handleWhatsAppSupport(order.orderNumber)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`button-whatsapp-${order.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Support on WhatsApp
                      </Button>
                    </div>
                  )}

                  {/* Order Progress */}
                  {order.status !== 'cancelled' && order.status !== 'pending_payment' && order.status !== 'payment_failed' && (
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
                          <div className="mt-2 space-y-1">
                            <div className="text-sm text-gray-600">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Estimated: {new Date(order.estimatedDelivery).toLocaleString()}
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">ETA: </span>
                              <ETACountdown estimatedDelivery={order.estimatedDelivery} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Write a Review — for delivered orders */}
                  {order.status === 'delivered' && (
                    <div className="mb-4">
                      {reviewOpenOrderId === order.id ? (
                        <div className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                          <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">
                            <PenLine className="h-4 w-4" /> Write a Review
                          </h4>
                          {/* Product selector */}
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1.5 font-medium">Select product to review:</p>
                            <div className="flex flex-wrap gap-2">
                              {order.orderItems?.map((item: any) => {
                                const key = `${order.id}-${item.product_id}`;
                                const done = reviewSubmitted[key];
                                return (
                                  <button
                                    key={item.id}
                                    disabled={done}
                                    onClick={() => {
                                      setReviewProductId(item.product_id);
                                      setReviewProductName(item.product?.name || item.name || 'Product');
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                      done
                                        ? 'bg-green-100 text-green-700 border-green-300 cursor-default'
                                        : reviewProductId === item.product_id
                                        ? 'bg-amber-700 text-white border-amber-700'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
                                    }`}
                                  >
                                    {done ? '✓ ' : ''}{item.product?.name || 'Product'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {/* Star rating */}
                          {reviewProductId && (
                            <>
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1.5 font-medium">Your rating:</p>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      onMouseEnter={() => setReviewHoverRating(star)}
                                      onMouseLeave={() => setReviewHoverRating(0)}
                                      onClick={() => setReviewRating(star)}
                                    >
                                      <Star
                                        className={`h-7 w-7 transition-colors ${
                                          star <= (reviewHoverRating || reviewRating)
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <Textarea
                                placeholder="Share your experience with this product... (at least 10 characters)"
                                value={reviewText}
                                onChange={e => setReviewText(e.target.value)}
                                className="mb-3 resize-none bg-white"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-amber-700 hover:bg-amber-800 text-white"
                                  disabled={reviewText.trim().length < 10 || submitReviewMutation.isPending}
                                  onClick={() => submitReviewMutation.mutate({
                                    orderId: order.id,
                                    productId: reviewProductId,
                                    productName: reviewProductName,
                                    rating: reviewRating,
                                    reviewText,
                                  })}
                                >
                                  {submitReviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1.5" />Submit Review</>}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setReviewOpenOrderId(null); setReviewProductId(null); setReviewText(''); }}>
                                  Cancel
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-amber-300 text-amber-800 hover:bg-amber-50"
                          onClick={() => {
                            setReviewOpenOrderId(order.id);
                            setReviewProductId(null);
                            setReviewText('');
                            setReviewRating(5);
                          }}
                        >
                          <PenLine className="h-4 w-4 mr-2" />
                          Write a Review
                        </Button>
                      )}
                    </div>
                  )}

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
                                      {item.selectedWeight && (
                                        <p className="text-xs text-amber-700 font-medium">Weight: {item.selectedWeight}</p>
                                      )}
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
      <MobileNav />
    </div>
  );
}