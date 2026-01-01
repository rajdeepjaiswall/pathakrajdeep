import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Clock, Home, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { playSuccessChime } from '@/lib/sounds';

type PaymentStatus = 'loading' | 'success' | 'pending' | 'failed' | 'error';

export default function PhonePeCallback() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const txnId = params.get('txnId');
    const orderIdParam = params.get('orderId');
    
    if (orderIdParam) {
      setOrderId(orderIdParam);
    }

    if (!txnId) {
      setStatus('error');
      setMessage('Invalid payment callback - no transaction ID found');
      return;
    }

    verifyPayment(txnId, orderIdParam);
  }, [search, retryCount]);

  const verifyPayment = async (txnId: string, orderIdParam: string | null) => {
    try {
      setStatus('loading');
      
      const response = await fetch(`/api/phonepe/verify/${txnId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: orderIdParam }),
      });

      const data = await response.json();

      if (data.success && data.status === 'SUCCESS') {
        setStatus('success');
        setMessage('Your payment has been received successfully!');
        clearCart();
        playSuccessChime();
        
        toast({
          title: 'Payment Successful!',
          description: 'Your order has been confirmed',
        });

        if (orderIdParam) {
          localStorage.setItem('lastOrderDetails', JSON.stringify({
            id: orderIdParam,
            orderNumber: `PB${orderIdParam}`,
            paymentMethod: 'phonepe',
            status: 'confirmed',
          }));
        }
      } else if (data.status === 'PENDING') {
        setStatus('pending');
        setMessage('Your payment is being processed. Please wait...');
      } else {
        setStatus('failed');
        setMessage(data.message || 'Payment verification failed. Please contact support.');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('error');
      setMessage('Unable to verify payment. Please contact support.');
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-navy mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-6">Order ID: PB{orderId}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/customer/orders')}
                className="bg-champagne text-navy hover:bg-champagne/90"
                data-testid="button-view-orders"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                View My Orders
              </Button>
              <Button 
                onClick={() => setLocation('/')}
                variant="outline"
                data-testid="button-go-home"
              >
                <Home className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-12 w-12 text-yellow-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Payment Processing</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-6">
              This may take a few moments. Do not close this page.
            </p>
            <Button 
              onClick={handleRetry}
              variant="outline"
              data-testid="button-check-status"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status Again
            </Button>
          </div>
        );

      case 'failed':
      case 'error':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {status === 'failed' ? (
                <XCircle className="h-12 w-12 text-red-600" />
              ) : (
                <AlertCircle className="h-12 w-12 text-red-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              {status === 'failed' ? 'Payment Failed' : 'Something Went Wrong'}
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/checkout')}
                className="bg-champagne text-navy hover:bg-champagne/90"
                data-testid="button-retry-payment"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.open('https://wa.me/918931014976?text=Hi, I need help with my payment', '_blank')}
                variant="outline"
                data-testid="button-contact-support"
              >
                Contact Support
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-navy">
                PhonePe Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
