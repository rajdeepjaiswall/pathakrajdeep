import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, Plus, Key, Trash2, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { User } from '@shared/schema';

export default function AdminManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '', role: 'admin' });

  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  const { data: admins, isLoading } = useQuery<User[]>({
    queryKey: ['/api/super-admin/admins'],
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: typeof newAdmin) => {
      return apiRequest('/api/super-admin/admins', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      setIsCreateOpen(false);
      setNewAdmin({ username: '', email: '', password: '', role: 'admin' });
      toast({ title: 'Admin created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      return apiRequest(`/api/super-admin/admins/${id}/password`, { method: 'PUT', body: JSON.stringify({ newPassword }) });
    },
    onSuccess: () => {
      setIsPasswordOpen(false);
      setNewPassword('');
      setSelectedAdmin(null);
      toast({ title: 'Password updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      return apiRequest(`/api/super-admin/admins/${id}`, { method: 'PUT', body: JSON.stringify({ role }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      toast({ title: 'Role updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <UserCog className="h-8 w-8 text-champagne" />
            <h1 className="text-3xl font-bold text-navy">Admin Management</h1>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-admin" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Username</Label>
                  <Input
                    data-testid="input-admin-username"
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    data-testid="input-admin-email"
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    data-testid="input-admin-password"
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={newAdmin.role} onValueChange={(v) => setNewAdmin({ ...newAdmin, role: v })}>
                    <SelectTrigger data-testid="select-admin-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  data-testid="button-submit-admin"
                  className="w-full"
                  onClick={() => createAdminMutation.mutate(newAdmin)}
                  disabled={createAdminMutation.isPending}
                >
                  {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {admins?.map((admin) => (
                <div
                  key={admin.id}
                  data-testid={`card-admin-${admin.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-navy">{admin.username || admin.email}</p>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </Badge>
                    <Select
                      value={admin.role}
                      onValueChange={(role) => updateRoleMutation.mutate({ id: admin.id, role })}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-role-${admin.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-change-password-${admin.id}`}
                      onClick={() => {
                        setSelectedAdmin(admin);
                        setIsPasswordOpen(true);
                      }}
                    >
                      <Key className="h-4 w-4 mr-1" />
                      Change Password
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password for {selectedAdmin?.username || selectedAdmin?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>New Password</Label>
                <Input
                  data-testid="input-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <Button
                data-testid="button-update-password"
                className="w-full"
                onClick={() => selectedAdmin && updatePasswordMutation.mutate({ id: selectedAdmin.id, newPassword })}
                disabled={updatePasswordMutation.isPending || newPassword.length < 6}
              >
                {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
