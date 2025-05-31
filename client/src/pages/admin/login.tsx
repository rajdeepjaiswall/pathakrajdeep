import { useState } from 'react';
import { useLocation } from 'wouter';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { login } from '@/lib/auth';
import { ADMIN_CREDENTIALS } from '@/lib/constants';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login: authLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate admin credentials
    if (username !== ADMIN_CREDENTIALS.shopkeeper.username || password !== ADMIN_CREDENTIALS.shopkeeper.password) {
      toast({
        title: 'Invalid Credentials',
        description: 'Please check your username and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({ username, password });
      
      if (response.user.role !== 'admin' && response.user.role !== 'super_admin') {
        throw new Error('Unauthorized access');
      }

      authLogin(response.user, response.token);
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in to admin dashboard',
      });
      setLocation('/admin');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="bg-white shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">PB</span>
            </div>
            <CardTitle className="text-2xl font-bold text-navy">Admin Dashboard</CardTitle>
            <CardDescription>
              Sign in to access the shopkeeper dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-navy font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="pathakji"
                  className="border-gray-200 focus:ring-champagne focus:border-champagne"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-navy font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-gray-200 focus:ring-champagne focus:border-champagne pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-champagne text-navy hover:bg-champagne/90 font-semibold py-3"
              >
                {isLoading ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Dashboard
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Need higher privileges?</p>
              <Button
                variant="link"
                onClick={() => setLocation('/super-admin/login')}
                className="text-champagne hover:text-navy text-sm"
              >
                Super Admin Login →
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Demo Credentials:</strong></p>
                <p>Username: pathakji</p>
                <p>Password: bhandar123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
