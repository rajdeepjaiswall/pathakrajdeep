import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, CreditCard, Smartphone, Truck, MapPin, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, getGSTBreakdown } from '@/lib/cart';
import { apiRequest } from '@/lib/queryClient';
import { playSuccessChime, initializeAudioContext } from '@/lib/sounds';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertAddressSchema, insertOrderSchema, type Address } from '@shared/schema';
import { z } from 'zod';
import { useEffect } from 'react';
import { OTPInput } from '@/components/otp-input';

const addressFormSchema = insertAddressSchema.omit({ userId: true });
const orderFormSchema = z.object({
  paymentMethod: z.enum(['upi', 'card', 'cod', 'wallet']),
  notes: z.string().optional(),
});

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, summary, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [verifyingAddressId, setVerifyingAddressId] = useState<number | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);

  // Initialize audio context on component mount for better browser compatibility
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudioContext();
      document.removeEventListener('click', handleUserInteraction);
    };
    document.addEventListener('click', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    toast({
      title: "Authentication Required",
      description: "Please log in to proceed with checkout",
      variant: "destructive",
    });
    setLocation('/');
    return null;
  }

  // Redirect if cart is empty
  if (items.length === 0) {
    setLocation('/cart');
    return null;
  }

  // Fetch addresses
  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ['/api/addresses'],
  });

  // Address form
  const addressForm = useForm({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: 'Uttar Pradesh',
      pincode: '',
      landmark: '',
      isDefault: false,
    },
  });

  // Order form
  const orderForm = useForm({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      paymentMethod: 'cod' as const,
      notes: '',
    },
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addressFormSchema>) => {
      const response = await apiRequest('POST', '/api/addresses', data);
      return response.json();
    },
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      setSelectedAddress(newAddress.id);
      setIsAddingAddress(false);
      addressForm.reset();
      toast({
        title: 'Address added',
        description: 'New address has been saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add address',
        variant: 'destructive',
      });
    },
  });

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async ({phoneNumber, customerName}: {phoneNumber: string, customerName: string}) => {
      const response = await apiRequest('POST', '/api/otp/send-otp', {
        identifier: phoneNumber,
        type: 'whatsapp',
        customerName: customerName,
        purpose: 'verification',
      });
      return response.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      setCountdown(60);
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    },
  });

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: async ({ phoneNumber, otp }: { phoneNumber: string; otp: string }) => {
      const response = await apiRequest('POST', '/api/otp/verify-otp', {
        identifier: phoneNumber,
        otp,
        type: 'whatsapp',
      });
      return response.json();
    },
    onSuccess: async () => {
      if (verifyingAddressId) {
        await apiRequest('POST', `/api/addresses/${verifyingAddressId}/verify-phone`, {});
        queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
        toast({
          title: 'Phone Verified',
          description: 'Your phone number has been verified successfully',
        });
        setIsVerifyingPhone(false);
        setOtpValue('');
        setOtpSent(false);
        setVerifyingAddressId(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleVerifyPhone = (address: Address) => {
    setVerifyingAddressId(address.id);
    setIsVerifyingPhone(true);
    setOtpSent(false);
    setOtpValue('');
  };

  const handleSendOTP = () => {
    const address = addresses.find(a => a.id === verifyingAddressId);
    if (address) {
      sendOTPMutation.mutate({
        phoneNumber: address.phone,
        customerName: address.name || user?.username || 'Customer'
      });
    }
  };

  const handleVerifyOTP = () => {
    const address = addresses.find(a => a.id === verifyingAddressId);
    if (address && otpValue.length === 6) {
      verifyOTPMutation.mutate({ phoneNumber: address.phone, otp: otpValue });
    }
  };

  const handleResendOTP = () => {
    const address = addresses.find(a => a.id === verifyingAddressId);
    if (address && countdown === 0) {
      sendOTPMutation.mutate({
        phoneNumber: address.phone,
        customerName: address.name || user?.username || 'Customer'
      });
    }
  };

  // Place order mutation with phone verification check
  const handlePlaceOrder = (data: z.infer<typeof orderFormSchema>) => {
    const selectedAddr = addresses.find((addr) => addr.id === selectedAddress);
    if (!selectedAddr) {
      toast({
        title: 'Error',
        description: 'Please select a delivery address',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedAddr.isPhoneVerified) {
      setShowVerificationWarning(true);
      return;
    }

    placeOrderMutation.mutate(data);
  };

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof orderFormSchema>) => {
      const selectedAddr = addresses.find((addr) => addr.id === selectedAddress);
      if (!selectedAddr) throw new Error('Please select a delivery address');

      const orderData = {
        user_id: user!.id,
        orderNumber: `PB${Date.now()}`,
        status: 'pending',
        subtotal: summary.subtotal.toString(),
        gstAmount: summary.gstAmount.toString(),
        deliveryCharge: summary.deliveryCharge.toString(),
        total: summary.total.toString(),
        paymentMethod: 'cod',
        paymentStatus: 'confirmed',
        deliveryAddress: {
          name: selectedAddr.name,
          phone: selectedAddr.phone,
          addressLine1: selectedAddr.addressLine1,
          addressLine2: selectedAddr.addressLine2,
          city: selectedAddr.city,
          state: selectedAddr.state,
          pincode: selectedAddr.pincode,
          landmark: selectedAddr.landmark,
        },
        notes: data.notes,
      };

      console.log('Placing order with data:', orderData);
      const response = await apiRequest('POST', '/api/orders', orderData);
      const order = await response.json();
      console.log('Order created successfully:', order);

      // Create order items
      for (const item of items) {
        await apiRequest('POST', '/api/order-items', {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product.price,
          total: (parseFloat(item.product.price) * item.quantity).toString(),
        });
      }

      return order;
    },
    onSuccess: (order) => {
      const selectedAddr = addresses.find((addr) => addr.id === selectedAddress);
      
      // Store order details for confirmation page
      const orderDetails = {
        ...order,
        deliveryAddress: selectedAddr,
        paymentMethod: 'cod',
        total: summary.total.toString(),
        subtotal: summary.subtotal.toString(),
        gstAmount: summary.gstAmount.toString(),
        deliveryCharge: summary.deliveryCharge.toString(),
      };
      
      localStorage.setItem('lastOrderDetails', JSON.stringify(orderDetails));
      
      // Play success chime sound
      playSuccessChime();
      
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'Order placed successfully!',
        description: `Order #${order.orderNumber} has been placed`,
      });
      setLocation('/order-confirmation');
    },
    onError: (error: any) => {
      console.error('Order placement failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order',
        variant: 'destructive',
      });
    },
  });

  const gstBreakdown = getGSTBreakdown(items);

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="text-navy">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-navy">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.length === 0 ? (
                  <p className="text-gray-600 mb-4">No saved addresses. Please add a delivery address.</p>
                ) : (
                  <RadioGroup
                    value={selectedAddress?.toString()}
                    onValueChange={(value) => setSelectedAddress(parseInt(value))}
                  >
                    {addresses.map((address) => (
                      <div key={address.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value={address.id.toString()} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{address.name}</span>
                            {address.isDefault && (
                              <span className="text-xs bg-champagne text-navy px-2 py-1 rounded">Default</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm text-gray-600">{address.phone}</p>
                            {address.isPhoneVerified ? (
                              <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </span>
                            ) : (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs text-blue-600"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleVerifyPhone(address);
                                }}
                                data-testid={`verify-phone-${address.id}`}
                              >
                                Verify Phone
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          {address.landmark && (
                            <p className="text-sm text-gray-500">Landmark: {address.landmark}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Address</DialogTitle>
                    </DialogHeader>
                    <Form {...addressForm}>
                      <form onSubmit={addressForm.handleSubmit((data) => addAddressMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={addressForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name="addressLine1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name="addressLine2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 2 (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={addressForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addressForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={addressForm.control}
                          name="pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name="landmark"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Landmark (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-champagne text-navy hover:bg-champagne/90"
                          disabled={addAddressMutation.isPending}
                        >
                          {addAddressMutation.isPending ? 'Adding...' : 'Add Address'}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...orderForm}>
                  <FormField
                    control={orderForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-3"
                          >
                            <div className="flex items-center space-x-3 p-4 border-2 border-green-500 bg-green-50 rounded-lg">
                              <RadioGroupItem value="cod" checked />
                              <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-green-800">Cash on Delivery (Recommended)</span>
                              </div>
                            </div>
                            <div className="opacity-50 pointer-events-none">
                              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                                <RadioGroupItem value="upi" disabled />
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-5 w-5 text-gray-400" />
                                  <span className="text-gray-500">UPI Payment (Coming Soon)</span>
                                </div>
                              </div>
                            </div>
                            <div className="opacity-50 pointer-events-none">
                              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                                <RadioGroupItem value="card" disabled />
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-5 w-5 text-gray-400" />
                                  <span className="text-gray-500">Credit/Debit Card (Coming Soon)</span>
                                </div>
                              </div>
                            </div>
                            <div className="hidden">
                              <RadioGroupItem value="cod" />
                              <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-green-600" />
                                <span>Cash on Delivery</span>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...orderForm}>
                  <FormField
                    control={orderForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Any special instructions for your order..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.product.images[0] || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-navy truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatPrice(parseFloat(item.product.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST</span>
                    <span className="font-medium">{formatPrice(gstBreakdown.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST</span>
                    <span className="font-medium">{formatPrice(gstBreakdown.sgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium text-green-600">
                      {summary.deliveryCharge === 0 ? 'FREE' : formatPrice(summary.deliveryCharge)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-navy">{formatPrice(summary.total)}</span>
                  </div>
                </div>

                <Button
                  onClick={orderForm.handleSubmit(handlePlaceOrder)}
                  disabled={!selectedAddress || placeOrderMutation.isPending}
                  className="w-full bg-champagne text-navy hover:bg-champagne/90 py-3"
                  data-testid="button-place-order"
                >
                  {placeOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By placing your order, you agree to our Terms & Conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <Dialog open={isVerifyingPhone} onOpenChange={setIsVerifyingPhone}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              Verify Phone Number
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {!otpSent ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  We'll send a verification code to{' '}
                  <span className="font-semibold">
                    {addresses.find(a => a.id === verifyingAddressId)?.phone}
                  </span>
                </p>
                <Button
                  onClick={handleSendOTP}
                  disabled={sendOTPMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-send-otp"
                >
                  {sendOTPMutation.isPending ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="font-semibold">
                    {addresses.find(a => a.id === verifyingAddressId)?.phone}
                  </p>
                </div>

                <div>
                  <OTPInput
                    value={otpValue}
                    onChange={setOtpValue}
                    disabled={verifyOTPMutation.isPending}
                  />
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={otpValue.length !== 6 || verifyOTPMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-verify-otp"
                >
                  {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify OTP'}
                </Button>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend code in {countdown}s
                    </p>
                  ) : (
                    <Button
                      variant="link"
                      onClick={handleResendOTP}
                      disabled={sendOTPMutation.isPending}
                      className="text-sm text-blue-600"
                      data-testid="button-resend-otp"
                    >
                      {sendOTPMutation.isPending ? 'Sending...' : 'Resend OTP'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Warning Dialog */}
      <Dialog open={showVerificationWarning} onOpenChange={setShowVerificationWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Phone Verification Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Please verify your phone number to receive order updates and tracking information via SMS.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowVerificationWarning(false)}
                className="flex-1"
                data-testid="button-skip-verification"
              >
                Skip for Now
              </Button>
              <Button
                onClick={() => {
                  setShowVerificationWarning(false);
                  const selectedAddr = addresses.find((addr) => addr.id === selectedAddress);
                  if (selectedAddr) {
                    handleVerifyPhone(selectedAddr);
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-verify-now"
              >
                Verify Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      <MobileNav />
    </div>
  );
}
