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
import { MessageSquare } from 'lucide-react';
import { RWANDA_REGIONS } from '@/lib/rwanda';

// All 30 districts of Rwanda. lat/lng are optional; when missing we fall back to Kigali center.
// The RWANDA_REGIONS array is now imported from '@/lib/rwanda'.

export default function NewChildPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdChildId, setCreatedChildId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    motherName: '',
    motherNationalId: '',
    motherMaritalStatus: 'single' as 'married' | 'divorced' | 'single' | 'teen',
    motherAge: '',
    dob: '',
    sex: 'male' as 'male' | 'female',
    address: '',
    complications: '',
    weightKg: '',
    heightCm: '',
    headCircumferenceCm: '',
    fatherName: '',
    fatherNationalId: '',
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

      const DEFAULT_LAT = -1.9441; // Kigali center fallback
      const DEFAULT_LNG = 30.0820;

      // If the current user is a CHW with a district affiliation, force the selected district
      const selectedName = user && user.role === 'chw' && (user as any).district ? (user as any).district : formData.address;

      const region = RWANDA_REGIONS.find((r) => r.name === selectedName) || RWANDA_REGIONS[0];

      const baseLat = (region as any).lat ?? DEFAULT_LAT;
      const baseLng = (region as any).lng ?? DEFAULT_LNG;

      const geo = {
        lat: baseLat + (Math.random() - 0.5) * 0.05,
        lng: baseLng + (Math.random() - 0.5) * 0.05,
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
        motherNationalId: formData.motherNationalId || undefined,
        motherMaritalStatus: formData.motherMaritalStatus || undefined,
        motherAge: formData.motherAge ? parseInt(formData.motherAge, 10) : undefined,
        dob: formData.dob,
        sex: formData.sex,
        address: selectedName || formData.address,
        region: undefined,
        district: selectedName || undefined,
        geo,
        complications: formData.complications || undefined,
        fatherName: formData.fatherName || undefined,
        fatherNationalId: formData.fatherNationalId || undefined,
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

      const created: any = await api.createChild(payload);
      const childId = created?.id ?? null;
      setCreatedChildId(childId);

      toast({
        title: 'Child registered successfully',
        description: `${formData.name} has been added to the system`,
      });
    } catch (error: any) {
      const message = error?.message || JSON.stringify(error) || 'There was an error registering the child';
      toast({ title: 'Registration failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limit selectable districts for CHW users to their assigned district
  const allowedRegions = user && user.role === 'chw' && (user as any).district
    ? RWANDA_REGIONS.filter(r => r.name === (user as any).district)
    : RWANDA_REGIONS;

  // If logged-in user is a CHW, default the address field to their district
  React.useEffect(() => {
    if (user && user.role === 'chw' && (user as any).district) {
      setFormData((f) => ({ ...f, address: (user as any).district }));
    }
  }, [user]);

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
                <Label htmlFor="motherNationalId">Mother's National ID</Label>
                <Input
                  id="motherNationalId"
                  value={formData.motherNationalId}
                  onChange={(e) => setFormData({ ...formData, motherNationalId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherMaritalStatus">Mother's Marital Status</Label>
                <Select
                  value={formData.motherMaritalStatus}
                  onValueChange={(value: 'married' | 'divorced' | 'single' | 'teen') => setFormData({ ...formData, motherMaritalStatus: value })}
                >
                  <SelectTrigger id="motherMaritalStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="single">Single mother</SelectItem>
                    <SelectItem value="teen">Teen mother</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherAge">Mother's Age</Label>
                <Input
                  id="motherAge"
                  type="number"
                  min="0"
                  value={formData.motherAge}
                  onChange={(e) => setFormData({ ...formData, motherAge: e.target.value })}
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
                    {allowedRegions.map((region) => (
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

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Father Information (optional)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input
                    id="fatherName"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherNationalId">Father's National ID</Label>
                  <Input
                    id="fatherNationalId"
                    value={formData.fatherNationalId}
                    onChange={(e) => setFormData({ ...formData, fatherNationalId: e.target.value })}
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
              {createdChildId && (
                <Button size="sm" variant="ghost" onClick={async () => {
                  try {
                    if (!createdChildId) return;
                    const conv: any = await api.createConversation({ childId: createdChildId, title: `Discussion for ${formData.name}` });
                    navigate(`/conversations?childId=${createdChildId}&openId=${conv.id}`);
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to start discussion', err);
                    toast({ title: 'Failed to start discussion', description: (err as any)?.message || 'Could not start discussion', variant: 'destructive' });
                  }
                }}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Discussion
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
