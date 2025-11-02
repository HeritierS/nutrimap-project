import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserCheck, UserX, Shield, Users as UsersIcon, Activity } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Load users from backend; map backend `isActive` to frontend `approved` field
      const data: any[] = await api.listUsers();
      const mapped = data.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, password: '', approved: u.isActive ?? false } as User));
      setUsers(mapped);
    } catch (err) {
      // Backend failed. Surface error and show empty list.
      // eslint-disable-next-line no-console
      console.error('Failed to load users from backend', err);
      setUsers([]);
      // Optional: show toast or other UI; keep the page usable.
      // toast({ title: 'Error', description: 'Could not load users from server', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      // Use backend update when possible
      await api.updateUser(userId, { isActive: !currentStatus });
      await loadUsers();
      toast({
        title: currentStatus ? 'User suspended' : 'User approved',
        description: 'User status updated successfully',
      });
    } catch (error) {
      // Show error; do not fall back to mock updates.
      // eslint-disable-next-line no-console
      console.error('Failed to update user status', error);
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      await api.updateUser(userId, { role });
      toast({ title: 'Role updated', description: 'User role was updated' });
      await loadUsers();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to update role', err);
      toast({ title: 'Error', description: err?.message || 'Could not update role', variant: 'destructive' });
    }
  };

  // New user form state and handler
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'chw', password: '' });
  // per-user password inputs for admin to reset passwords
  const [pwInputs, setPwInputs] = useState<Record<string, string>>({});

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({ name: newUser.name, email: newUser.email, role: newUser.role, password: newUser.password });
      toast({ title: 'User created', description: `${newUser.email} was added` });
      setNewUser({ name: '', email: '', role: 'chw', password: '' });
      await loadUsers();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to create user', err);
      toast({ title: 'Error', description: err?.message || 'Could not create user', variant: 'destructive' });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  const stats = users.reduce((acc, user) => {
    if (user.role === 'admin') acc.admins++;
    if (user.role === 'chw') acc.chws++;
    if (user.role === 'nutritionist') acc.nutritionists++;
    if ((user as any).approved || (user as any).isActive) acc.active++;
    return acc;
  }, { admins: 0, chws: 0, nutritionists: 0, active: 0 });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage CHWs, Nutritionists, and system access</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Activity className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CHWs</p>
                <p className="text-2xl font-bold">{stats.chws}</p>
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nutritionists</p>
                <p className="text-2xl font-bold">{stats.nutritionists}</p>
              </div>
              <Shield className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <UsersIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Role badge removed to avoid overlay; keep approval switch and status */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={(user as any).approved || (user as any).isActive || false}
                      onCheckedChange={() => handleToggleApproval(user.id, (user as any).approved || (user as any).isActive || false)}
                      disabled={user.role === 'admin'}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(user as any).approved || (user as any).isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="rounded-md border border-border bg-background p-1 text-sm"
                      disabled={user.role === 'admin'}
                    >
                      <option value="chw">CHW</option>
                      <option value="nutritionist">Nutritionist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="New password"
                      type="password"
                      value={pwInputs[user.id] || ''}
                      onChange={(e) => setPwInputs(s => ({ ...s, [user.id]: e.target.value }))}
                      className="w-44"
                    />
                    <Button size="sm" onClick={async () => {
                      const pw = pwInputs[user.id];
                      if (!pw || pw.length < 6) { toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
                      try {
                        await api.updateUserPassword(user.id, pw);
                        toast({ title: 'Password updated', description: `Password for ${user.email} was changed` });
                        setPwInputs(s => ({ ...s, [user.id]: '' }));
                      } catch (err: any) {
                        console.error('Failed to update password', err);
                        toast({ title: 'Error', description: err?.message || 'Could not update password', variant: 'destructive' });
                      }
                    }}>Set</Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="destructive" onClick={async () => {
                      const ok = confirm(`Delete user ${user.email}? This action cannot be undone.`);
                      if (!ok) return;
                      try {
                        await api.deleteUser(user.id);
                        toast({ title: 'User deleted', description: `${user.email} removed` });
                        await loadUsers();
                      } catch (err: any) {
                        console.error('Failed to delete user', err);
                        toast({ title: 'Error', description: err?.message || 'Could not delete user', variant: 'destructive' });
                      }
                    }}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={newUser.name} onChange={(e) => setNewUser(s => ({ ...s, name: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser(s => ({ ...s, email: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select id="role" value={newUser.role} onChange={(e) => setNewUser(s => ({ ...s, role: e.target.value }))} className="w-full rounded-md border border-border bg-background p-2">
                <option value="chw">CHW</option>
                <option value="nutritionist">Nutritionist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={newUser.password} onChange={(e) => setNewUser(s => ({ ...s, password: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-1">User Access Control</p>
              <p className="text-sm text-muted-foreground">
                Administrators can approve or suspend user accounts. CHWs can register children and add follow-ups. 
                Nutritionists have read-only access to view data and analytics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
