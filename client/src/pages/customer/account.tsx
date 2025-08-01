import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation, Link } from 'wouter';
import { 
  User, MapPin, Phone, Mail, Edit3, Save, X, Plus, Trash2, 
  AlertCircle, CheckCircle, Clock, Package, LogOut, Verified,
  ArrowLeft, Home, Store
} from 'lucide-react';

// Phone verification schema
const phoneVerificationSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

// Address schema
const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  addressLine1: z.string().min(5, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  landmark: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type PhoneVerificationForm = z.infer<typeof phoneVerificationSchema>;
type ProfileForm = z.infer<typeof profileSchema>;
type AddressForm = z.infer<typeof addressSchema>;

export default function CustomerAccount() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/customer/login');
      return;
    }
  }, [user, setLocation]);

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Forms
  const phoneForm = useForm<PhoneVerificationForm>({
    resolver: zodResolver(phoneVerificationSchema),
    defaultValues: {
      phone: user?.phone || '',
      otp: '',
    },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: false,
    },
  });

  // Queries
  const { data: addresses = [] } = useQuery({
    queryKey: ['/api/addresses'],
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders/user'],
    enabled: !!user,
  });

  // Mutations
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest('POST', '/api/auth/send-phone-otp', { phone });
      return response.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      setOtpTimer(60);
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

  const verifyPhoneMutation = useMutation({
    mutationFn: async (data: PhoneVerificationForm) => {
      const response = await apiRequest('POST', '/api/auth/verify-phone', data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setOtpSent(false);
      phoneForm.reset();
      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been verified successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP',
        variant: 'destructive',
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiRequest('PUT', '/api/auth/profile', data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setIsEditingProfile(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      const response = await apiRequest('POST', '/api/addresses', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      setIsAddingAddress(false);
      addressForm.reset();
      toast({
        title: 'Address Added',
        description: 'Your address has been added successfully',
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

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AddressForm }) => {
      const response = await apiRequest('PUT', `/api/addresses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      setEditingAddressId(null);
      toast({
        title: 'Address Updated',
        description: 'Your address has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update address',
        variant: 'destructive',
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      toast({
        title: 'Address Deleted',
        description: 'Address has been removed from your account',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete address',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleSendOtp = () => {
    const phone = phoneForm.getValues('phone');
    if (phone) {
      sendOtpMutation.mutate(phone);
    }
  };

  const handleVerifyPhone = (data: PhoneVerificationForm) => {
    verifyPhoneMutation.mutate(data);
  };

  const handleUpdateProfile = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const handleAddAddress = (data: AddressForm) => {
    if (editingAddressId) {
      updateAddressMutation.mutate({ id: editingAddressId, data });
    } else {
      addAddressMutation.mutate(data);
    }
  };

  const handleEditAddress = (address: any) => {
    addressForm.reset(address);
    setEditingAddressId(address.id);
    setIsAddingAddress(true);
  };

  const handleDeleteAddress = (id: number) => {
    if (confirm('Are you sure you want to delete this address?')) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-almond">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <Store className="h-4 w-4" />
              <span>Back to Store</span>
            </Button>
            
            <h1 className="text-2xl font-bold text-navy">My Account</h1>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4 max-w-4xl">
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
              <Store className="h-4 w-4" />
              Go to Cart
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">Account Dashboard</h2>
              <p className="text-muted-foreground">
                Welcome back, {user.firstName || user.username}!
              </p>
            </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses" className="relative">
            Addresses
            {addresses.length === 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Profile Information
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  {isEditingProfile ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">First Name</Label>
                      <p className="text-lg">{user.firstName || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Name</Label>
                      <p className="text-lg">{user.lastName || 'Not set'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-lg flex items-center gap-2">
                      {user.email || 'Not set'}
                      {user.email && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-lg flex items-center gap-2">
                      {user.phone || 'Not set'}
                      {user.phone && user.isVerified ? (
                        <Badge variant="secondary" className="text-green-600">
                          <Verified className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : user.phone ? (
                        <Badge variant="destructive">Not Verified</Badge>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Type</Label>
                    <p className="text-lg">
                      <Badge variant="outline">{user.authProvider === 'google' ? 'Google Account' : 'Regular Account'}</Badge>
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...profileForm.register('firstName')}
                        error={profileForm.formState.errors.firstName?.message}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...profileForm.register('lastName')}
                        error={profileForm.formState.errors.lastName?.message}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register('email')}
                      error={profileForm.formState.errors.email?.message}
                      disabled={user.authProvider === 'google'}
                    />
                    {user.authProvider === 'google' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Email cannot be changed for Google accounts
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Saved Addresses
                <Button onClick={() => setIsAddingAddress(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </CardTitle>
              <CardDescription>
                Manage your delivery addresses for faster checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No addresses saved yet. Add your first address to speed up checkout.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address: any) => (
                    <Card key={address.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{address.name}</h4>
                            {address.isDefault && <Badge>Default</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <Phone className="w-3 h-3 inline mr-1" />
                            {address.phone}
                          </p>
                          <p className="text-sm">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          {address.landmark && (
                            <p className="text-xs text-muted-foreground">
                              Near: {address.landmark}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add/Edit Address Form */}
              {isAddingAddress && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>
                      {editingAddressId ? 'Edit Address' : 'Add New Address'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={addressForm.handleSubmit(handleAddAddress)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            {...addressForm.register('name')}
                            error={addressForm.formState.errors.name?.message}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            {...addressForm.register('phone')}
                            error={addressForm.formState.errors.phone?.message}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          {...addressForm.register('addressLine1')}
                          placeholder="House/Flat number, Building name"
                          error={addressForm.formState.errors.addressLine1?.message}
                        />
                      </div>
                      <div>
                        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                        <Input
                          id="addressLine2"
                          {...addressForm.register('addressLine2')}
                          placeholder="Area, Street, Sector"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            {...addressForm.register('city')}
                            error={addressForm.formState.errors.city?.message}
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            {...addressForm.register('state')}
                            error={addressForm.formState.errors.state?.message}
                          />
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            {...addressForm.register('pincode')}
                            error={addressForm.formState.errors.pincode?.message}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          {...addressForm.register('landmark')}
                          placeholder="Near temple, hospital, etc."
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          {...addressForm.register('isDefault')}
                          className="rounded"
                        />
                        <Label htmlFor="isDefault">Make this my default address</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={addAddressMutation.isPending || updateAddressMutation.isPending}>
                          <Save className="w-4 h-4 mr-2" />
                          {editingAddressId ? 'Update Address' : 'Save Address'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingAddress(false);
                            setEditingAddressId(null);
                            addressForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                Track your past orders and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    No orders yet. Start shopping to see your orders here!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Order #{order.orderNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.orderDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <p className="text-sm font-medium">₹{parseFloat(order.total).toFixed(2)}</p>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="text-sm text-muted-foreground">
                        <p>{order.deliveryAddress.name}, {order.deliveryAddress.phone}</p>
                        <p>{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Phone Verification</CardTitle>
              <CardDescription>
                Verify your phone number for order updates and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.phone && user.isVerified ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your phone number {user.phone} is verified and secure.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={phoneForm.handleSubmit(handleVerifyPhone)} className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        {...phoneForm.register('phone')}
                        placeholder="Enter 10-digit mobile number"
                        error={phoneForm.formState.errors.phone?.message}
                        disabled={otpSent}
                      />
                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendOtpMutation.isPending || otpSent}
                      >
                        {otpSent ? `Resend (${otpTimer}s)` : 'Send OTP'}
                      </Button>
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        {...phoneForm.register('otp')}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        error={phoneForm.formState.errors.otp?.message}
                      />
                      <Button 
                        type="submit" 
                        className="mt-2"
                        disabled={verifyPhoneMutation.isPending}
                      >
                        Verify Phone
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}