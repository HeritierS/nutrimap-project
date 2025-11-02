import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function RegisterAdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  // Only allow access if current user is admin or there is no session (initial registration)
  const session = storage.getSession();
  const canRegister = !session || session?.user == null || session.user?.role === 'admin' || user?.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegister) {
      toast({ title: 'Forbidden', description: 'Only admins can create new admin accounts', variant: 'destructive' });
      return;
    }
    if (form.password !== form.confirm) {
      toast({ title: 'Password mismatch', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'Weak password', description: 'Password should be at least 6 characters', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.registerAdmin(form.name, form.email, form.password);
      // If backend returns token and user, prompt to login (we don't auto-login here)
      toast({ title: 'Admin created', description: 'Admin account created — please login', });
      navigate('/login');
    } catch (err: any) {
      const message = err?.message || 'Failed to create admin';
      toast({ title: 'Create failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canRegister) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Admin signup</CardTitle>
            <CardDescription>Only administrators may create new admin accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You are not authorized to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Admin Account</CardTitle>
          <CardDescription>Register an administrator for NutriMap.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>

            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Admin'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
