import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Child } from '@/lib/types';
import { classifyNutritionalStatus, calculateAgeInMonths, getStatusColor, getStatusLabel } from '@/lib/zscore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, MapPin, User, Weight, Ruler, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState({ name: '', motherName: '', address: '', complications: '' });
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpState, setFollowUpState] = useState({ recordedAt: '', weightKg: '', heightCm: '', headCircumferenceCm: '' });
  
  useEffect(() => {
    const loadChild = async () => {
      if (!id) return;
      try {
        const c: any = await api.getChild(id);
        if (!c) {
          setChild(null);
          return;
        }
        // Map backend fields to frontend Child shape defensively
        const safeDate = (input: any) => {
          if (!input) return '';
          const d = new Date(input);
          return isNaN(d.getTime()) ? '' : d.toISOString();
        };

        const dobIso = c.dob ? ((): string => {
          const d = new Date(c.dob);
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        })() : '';

  // `api.getChild` already returns a normalized Child shape via the central API client.
  const normalized: Child = c as Child;
  setEditState({ name: normalized.name, motherName: normalized.motherName, address: normalized.address, complications: normalized.complications ?? '' });
  setChild(normalized);
      } catch (err) {
        // No mock fallback: surface error in console and set child to null
        // This ensures the UI reflects the real backend state (Postgres) only.
        // eslint-disable-next-line no-console
        console.error('Failed to load child from backend', err);
        setChild(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadChild();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium mb-4">Child not found</p>
        <Button onClick={() => navigate('/children')}>Back to List</Button>
      </div>
    );
  }
  
  const latestData = Array.isArray((child as any).followUps) && (child as any).followUps.length > 0
    ? (child as any).followUps[(child as any).followUps.length - 1]
    : (child as any).initialAnthro ?? null;

  const ageMonths = calculateAgeInMonths(child.dob || '');
  const weight = latestData?.weightKg ?? null;
  const height = latestData?.heightCm ?? null;
  const status = (typeof weight === 'number' && typeof height === 'number' && Number.isFinite(ageMonths))
    ? classifyNutritionalStatus(weight, height, ageMonths)
    : 'normal';
  const statusColor = getStatusColor(status);
  
  // Prepare chart data (only include entries with valid dates and numeric measurements)
  const chartData: Array<{ date: string; weight: number | null; height: number | null }> = [];
  const pushEntry = (recordedAt: string | undefined | null, weight: any, height: any) => {
    if (!recordedAt) return;
    const d = new Date(recordedAt);
    if (isNaN(d.getTime())) return;
    const w = typeof weight === 'number' ? weight : null;
    const h = typeof height === 'number' ? height : null;
    chartData.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weight: w, height: h });
  };

  pushEntry(child.initialAnthro.recordedAt, child.initialAnthro.weightKg, child.initialAnthro.heightCm);
  child.followUps.forEach(fu => pushEntry(fu.recordedAt, fu.weightKg, fu.heightCm));
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/children')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{child.name}</h1>
          <p className="text-muted-foreground">Child Health Profile</p>
          {(user?.role === 'admin' || user?.role === 'nutritionist') && (
            <p className="text-sm text-muted-foreground">Collected by: {(child as any).createdByName ?? (child as any).createdBy ?? '—'}</p>
          )}
        </div>
        <Badge 
          className={cn(
            'text-sm px-3 py-1',
            statusColor === 'success' && 'bg-success text-success-foreground',
            statusColor === 'warning' && 'bg-warning text-warning-foreground',
            statusColor === 'danger' && 'bg-danger text-danger-foreground'
          )}
        >
          {getStatusLabel(status)}
        </Badge>
        {(user?.role === 'admin' || user?.id === child.createdBy) && (
          <div className="ml-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            ) : (
              <div className="flex gap-2">
                    <Button onClick={async () => {
                    try {
                      const payload = { name: editState.name, motherName: editState.motherName, address: editState.address, complications: editState.complications, geo: child.geo };
                      await api.updateChild(child.id, payload);
                      const refreshed: any = await api.getChild(child.id);
                      // api.getChild returns normalized Child
                      setChild(refreshed as Child);
                      setEditState({ name: refreshed.name, motherName: refreshed.motherName, address: refreshed.address, complications: refreshed.complications ?? '' });
                      setIsEditing(false);
                      toast({ title: 'Child updated', description: 'Child information saved successfully' });
                    } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to update child', err);
                    toast({ title: 'Update failed', description: (err as any)?.message || 'Failed to update child', variant: 'destructive' });
                  }
                }}>Save</Button>
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditState({ name: child.name, motherName: child.motherName, address: child.address, complications: child.complications ?? '' }); }}>Cancel</Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Mother:</span>
                  <span className="font-medium">{child.motherName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Age:</span>
                  <span className="font-medium">{ageMonths} months</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Sex:</span>
                  <span className="font-medium capitalize">{child.sex}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{child.address}</span>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" value={editState.name} onChange={(e) => setEditState(s => ({ ...s, name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="edit-mother">Mother Name</Label>
                  <Input id="edit-mother" value={editState.motherName} onChange={(e) => setEditState(s => ({ ...s, motherName: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Input id="edit-address" value={editState.address} onChange={(e) => setEditState(s => ({ ...s, address: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="edit-comp">Complications</Label>
                  <Input id="edit-comp" value={editState.complications} onChange={(e) => setEditState(s => ({ ...s, complications: e.target.value }))} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Measurements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Weight:</span>
              <span className="font-medium">{(latestData?.weightKg ?? '—')} kg</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Height:</span>
              <span className="font-medium">{(latestData?.heightCm ?? '—')} cm</span>
            </div>
            {latestData.headCircumferenceCm && (
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Head Circ:</span>
                <span className="font-medium">{latestData.headCircumferenceCm} cm</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Recorded: {latestData?.recordedAt ? new Date(latestData.recordedAt).toLocaleDateString() : '—'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follow-up Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{child.followUps.length}</div>
            <p className="text-sm text-muted-foreground">
              Total follow-up visits recorded
            </p>
            {((user?.role === 'admin') || (user?.id === child.createdBy)) && (
              <>
                {!showFollowUpForm ? (
                  <Button size="sm" className="w-full mt-2" onClick={() => setShowFollowUpForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Follow-up
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="fu-recorded">Date</Label>
                        <Input id="fu-recorded" type="date" value={followUpState.recordedAt} onChange={(e) => setFollowUpState(s => ({ ...s, recordedAt: e.target.value }))} />
                      </div>
                      <div>
                        <Label htmlFor="fu-weight">Weight (kg)</Label>
                        <Input id="fu-weight" type="number" step="0.1" value={followUpState.weightKg} onChange={(e) => setFollowUpState(s => ({ ...s, weightKg: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="fu-height">Height (cm)</Label>
                        <Input id="fu-height" type="number" step="0.1" value={followUpState.heightCm} onChange={(e) => setFollowUpState(s => ({ ...s, heightCm: e.target.value }))} />
                      </div>
                      <div>
                        <Label htmlFor="fu-head">Head Circ (cm)</Label>
                        <Input id="fu-head" type="number" step="0.1" value={followUpState.headCircumferenceCm} onChange={(e) => setFollowUpState(s => ({ ...s, headCircumferenceCm: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        try {
                          // basic validation
                          const w = parseFloat(followUpState.weightKg as any);
                          const h = parseFloat(followUpState.heightCm as any);
                          if (!Number.isFinite(w) || !Number.isFinite(h)) {
                            toast({ title: 'Invalid measurements', description: 'Please provide valid numeric weight and height', variant: 'destructive' });
                            return;
                          }
                          const payload = { recordedAt: followUpState.recordedAt || new Date().toISOString(), weightKg: w, heightCm: h, headCircCm: followUpState.headCircumferenceCm ? parseFloat(followUpState.headCircumferenceCm as any) : undefined };
                          // Optimistic UI: append a temporary follow-up locally, then reconcile with server
                          const tempId = `temp-${Date.now()}`;
                          const tempFu = { id: tempId, recordedAt: payload.recordedAt, weightKg: payload.weightKg, heightCm: payload.heightCm, headCircumferenceCm: payload.headCircCm } as any;
                          setChild(prev => prev ? ({ ...prev, followUps: [...prev.followUps, tempFu] }) : prev);
                          try {
                            const created: any = await api.addFollowUp(child.id, payload);
                            // replace temp entry by server entry (refresh recommended)
                            const refreshed: any = await api.getChild(child.id);
                            setChild(refreshed as Child);
                            toast({ title: 'Follow-up saved', description: 'Follow-up recorded successfully' });
                            setFollowUpState({ recordedAt: '', weightKg: '', heightCm: '', headCircumferenceCm: '' });
                            setShowFollowUpForm(false);
                          } catch (err) {
                            // rollback temp entry
                            setChild(prev => prev ? ({ ...prev, followUps: prev.followUps.filter((f: any) => f.id !== tempId) }) : prev);
                            // eslint-disable-next-line no-console
                            console.error('Failed to add follow-up', err);
                            toast({ title: 'Save failed', description: (err as any)?.message || 'Failed to add follow-up', variant: 'destructive' });
                          }
                        } catch (err) {
                          // eslint-disable-next-line no-console
                          console.error('Failed to add follow-up', err);
                          alert((err as any)?.message || 'Failed to add follow-up');
                        }
                      }}>Save Follow-up</Button>
                      <Button size="sm" variant="outline" onClick={() => { setShowFollowUpForm(false); setFollowUpState({ recordedAt: '', weightKg: '', heightCm: '', headCircumferenceCm: '' }); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Growth Chart</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Height (cm)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="weight" stroke="hsl(var(--success))" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="height" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No growth data yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add follow-up visits to see growth trends</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {child.complications && (
        <Card>
          <CardHeader>
            <CardTitle>Medical Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{child.complications}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
