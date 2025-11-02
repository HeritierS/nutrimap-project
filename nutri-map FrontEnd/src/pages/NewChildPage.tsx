import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, MapPin } from 'lucide-react';

const RWANDA_REGIONS = [
  { name: 'Kigali', lat: -1.9536, lng: 30.0606 },
  { name: 'Musanze', lat: -1.4989, lng: 29.6347 },
  { name: 'Rubavu', lat: -1.6788, lng: 29.2667 },
  { name: 'Huye', lat: -2.5952, lng: 29.7386 },
  { name: 'Rusizi', lat: -2.4844, lng: 28.9053 },
];

export default function NewChildPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    motherName: '',
    dob: '',
    sex: 'male' as 'male' | 'female',
    address: '',
    complications: '',
    weightKg: '',
    heightCm: '',
    headCircumferenceCm: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Ensure user is authenticated and allowed to create child
      if (!user) {
        toast({ title: 'Not authenticated', description: 'Please login before registering a child', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      if (user.role !== 'chw' && user.role !== 'admin') {
        toast({ title: 'Permission denied', description: 'Only CHWs or admins can register children', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      const region = RWANDA_REGIONS.find((r) => r.name === formData.address) || RWANDA_REGIONS[0];

      const geo = {
        lat: region.lat + (Math.random() - 0.5) * 0.05,
        lng: region.lng + (Math.random() - 0.5) * 0.05,
      };

      // Basic validation on numeric anthropometry values
      const weight = parseFloat(formData.weightKg as any);
      const height = parseFloat(formData.heightCm as any);
      const head = formData.headCircumferenceCm ? parseFloat(formData.headCircumferenceCm as any) : undefined;

      if (!Number.isFinite(weight) || !Number.isFinite(height)) {
        toast({ title: 'Invalid measurements', description: 'Please provide valid numeric weight and height', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: formData.name,
        motherName: formData.motherName,
        dob: formData.dob,
        sex: formData.sex,
        address: formData.address,
        geo,
        complications: formData.complications || undefined,
        // backend will derive createdBy from authenticated user; no need to send createdBy here
        initialRecordedAt: new Date().toISOString(),
        initialWeightKg: weight,
        initialHeightCm: height,
        initialHeadCircCm: head,
        followUps: [] as {
          id: string;
          recordedAt: string;
          weightKg: number;
          heightCm: number;
          headCircumferenceCm?: number;
        }[],
      };

      await api.createChild(payload);

      toast({
        title: 'Child registered successfully',
        description: `${formData.name} has been added to the system`,
      });

      navigate('/children');
    } catch (error: any) {
      const message = error?.message || JSON.stringify(error) || 'There was an error registering the child';
      toast({ title: 'Registration failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/children')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register New Child</h1>
          <p className="text-muted-foreground">Enter child's information and initial measurements</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Child Information</CardTitle>
          <CardDescription>Fill in all required fields</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Child's Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherName">Mother's Name *</Label>
                <Input
                  id="motherName"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sex *</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(value: 'male' | 'female') => setFormData({ ...formData, sex: value })}
                >
                  <SelectTrigger id="sex">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Location *</Label>
                <Select
                  value={formData.address}
                  onValueChange={(value) => setFormData({ ...formData, address: value })}
                  required
                >
                  <SelectTrigger id="address">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {RWANDA_REGIONS.map((region) => (
                      <SelectItem key={region.name} value={region.name}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {region.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Initial Anthropometric Measurements</h3>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headCirc">Head Circumference (cm)</Label>
                  <Input
                    id="headCirc"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.headCircumferenceCm}
                    onChange={(e) => setFormData({ ...formData, headCircumferenceCm: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complications">Complications / Notes</Label>
              <Textarea
                id="complications"
                value={formData.complications}
                onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                placeholder="Any health complications or special notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Register Child
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/children')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
