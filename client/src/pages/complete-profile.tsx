import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

export default function CompleteProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pinCode: '',
  });

  const completeProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete profile');
      }
      
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast({
        title: "Profile Completed",
        description: "Your profile has been completed successfully!",
      });
      navigate('/account');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone || !formData.password || !formData.addressLine1 || !formData.city) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    completeProfileMutation.mutate({
      phone: formData.phone,
      password: formData.password,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      pinCode: formData.pinCode,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Complete Your Profile</CardTitle>
            <CardDescription>
              Welcome {user?.firstName}! Please complete your profile to continue using Pathak Bhandar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Create Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password for future logins"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Address Line 1 */}
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  placeholder="Enter your street address"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Address Line 2 */}
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  name="addressLine2"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={formData.addressLine2}
                  onChange={handleChange}
                />
              </div>

              {/* City and State */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Pin Code */}
              <div className="space-y-2">
                <Label htmlFor="pinCode">Pin Code</Label>
                <Input
                  id="pinCode"
                  name="pinCode"
                  placeholder="Pin Code"
                  value={formData.pinCode}
                  onChange={handleChange}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={completeProfileMutation.isPending}
              >
                {completeProfileMutation.isPending ? 'Completing...' : 'Complete Profile'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  // Mark profile as incomplete but allow user to continue
                  updateUser({ ...user, profileCompleted: false });
                  navigate('/account');
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}