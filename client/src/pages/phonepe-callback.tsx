import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { playSuccessChime } from '@/lib/sounds';

export default function PhonePeCallback() {
  const [, setLocation] = useLocation();
  const [merchantTransactionId, setMerchantTransactionId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txnId = params.get('transactionId') || params.get('merchantTransactionId');
    
    const storedTxnId = sessionStorage.getItem('phonepe_transaction_id');
    
    if (txnId) {
      setMerchantTransactionId(txnId);
    } else if (storedTxnId) {
      setMerchantTransactionId(storedTxnId);
    }
  }, []);

  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ['/api/payments/phonepe/status', merchantTransactionId],
    queryFn: async () => {
      if (!merchantTransactionId) return null;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments/phonepe/status/${merchantTransactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }
      return response.json();
    },
    enabled: !!merchantTransactionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'success' || data?.status === 'failed' || pollCount > 30) {
        return false;
      }
      return 3000;
    },
  });

  useEffect(() => {
    if (statusData?.status === 'pending') {
      setPollCount(prev => prev + 1);
    }
    if (statusData?.status === 'success') {
      playSuccessChime();
      sessionStorage.removeItem('phonepe_transaction_id');
    }
  }, [statusData]);

  const renderContent = () => {
    if (!merchantTransactionId) {
      return (
        <div className="text-center py-12">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find your payment transaction. Please try again.
          </p>
          <Button onClick={() => setLocation('/cart')} data-testid="button-go-to-cart">
            Go to Cart
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 text-champagne animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy mb-2">Checking Payment Status</h2>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </div>
      );
    }

    if (statusData?.status === 'success') {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-2">
            Your payment has been verified and your order is confirmed.
          </p>
          {statusData.transactionId && (
            <p className="text-sm text-gray-500 mb-6">
              Transaction ID: {statusData.transactionId}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/customer/orders')}
              data-testid="button-view-orders"
            >
              View Orders
            </Button>
            <Button 
              className="bg-champagne text-navy hover:bg-champagne/90"
              onClick={() => setLocation('/')}
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      );
    }

    if (statusData?.status === 'failed') {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            Unfortunately, your payment could not be processed. Please try again.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/customer/orders')}
              data-testid="button-view-orders-failed"
            >
              View Orders
            </Button>
            <Button 
              className="bg-champagne text-navy hover:bg-champagne/90"
              onClick={() => setLocation('/cart')}
              data-testid="button-try-again"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-12 w-12 text-yellow-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">Payment Processing</h2>
        <p className="text-gray-600 mb-4">
          Your payment is being processed. This may take a few moments.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Checking status... ({pollCount}/30)
        </p>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          data-testid="button-refresh-status"
        >
          Refresh Status
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="pt-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
