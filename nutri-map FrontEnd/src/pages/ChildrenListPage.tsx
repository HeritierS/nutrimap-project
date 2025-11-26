import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Child } from '@/lib/types';
import { classifyNutritionalStatus, calculateAgeInMonths, getStatusColor, getStatusLabel } from '@/lib/zscore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChildrenListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        setErrorMessage(null);

        let data: any[] = [];
        // If we have a logged-in CHW, use the dedicated /mine endpoint. Otherwise request all children.
        if (user?.role === 'chw') {
          data = await api.getMyChildren();
        } else {
          data = await api.getChildren();
        }

        // Map backend shape to frontend `Child` shape, be defensive about field names
        const safeDate = (input: any) => {
          if (!input) return '';
          const d = new Date(input);
          return isNaN(d.getTime()) ? '' : d.toISOString();
        };

        const mapped: Child[] = (data || []).map((c: any) => {
          const geo = c.geo ?? (c.latitude || c.longitude ? { lat: c.latitude ?? 0, lng: c.longitude ?? 0 } : { lat: 0, lng: 0 });
          const initialRecordedAt = c.initialRecordedAt ?? c.initialAnthro?.recordedAt ?? null;
          const initialWeight = typeof c.initialWeightKg === 'number' ? c.initialWeightKg : (typeof c.initialAnthro?.weightKg === 'number' ? c.initialAnthro.weightKg : null);
          const initialHeight = typeof c.initialHeightCm === 'number' ? c.initialHeightCm : (typeof c.initialAnthro?.heightCm === 'number' ? c.initialAnthro.heightCm : null);
          const initialHead = typeof c.initialHeadCircKm === 'number' ? c.initialHeadCircKm : (typeof c.initialHeadCircCm === 'number' ? c.initialHeadCircCm : (typeof c.initialAnthro?.headCircumferenceCm === 'number' ? c.initialAnthro.headCircumferenceCm : undefined));

          const rawFollowUps = Array.isArray(c.followUps) ? c.followUps : (Array.isArray(c.followups) ? c.followups : []);
          const followUps = rawFollowUps.map((f: any) => ({
            id: f.id,
            recordedAt: safeDate(f.recordedAt) || safeDate(f.createdAt),
            weightKg: typeof f.weightKg === 'number' ? f.weightKg : (typeof f.weight === 'number' ? f.weight : null),
            heightCm: typeof f.heightCm === 'number' ? f.heightCm : (typeof f.height === 'number' ? f.height : null),
            headCircumferenceCm: typeof f.headCircumferenceCm === 'number' ? f.headCircumferenceCm : (typeof f.headCirc === 'number' ? f.headCirc : undefined),
          }))
          .sort((a, b) => {
            const ta = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
            const tb = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
            return ta - tb;
          });

          const dobIso = c.dob ? (() => { const d = new Date(c.dob); return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]; })() : '';

          return {
            id: c.id,
            name: c.name,
            motherName: c.motherName ?? '',
            dob: dobIso,
            sex: c.sex ?? '',
            address: c.address ?? '',
            geo,
            complications: c.complications ?? undefined,
            createdBy: typeof c.createdBy === 'string' ? c.createdBy : (c.createdBy?.id || ''),
            initialAnthro: {
              recordedAt: safeDate(initialRecordedAt) || '',
              weightKg: initialWeight,
              heightCm: initialHeight,
              headCircumferenceCm: initialHead,
            },
            followUps,
          } as Child;
        });

        if (mounted) setChildren(mapped);
      } catch (err: any) {
        // Surface helpful message to the UI
        // eslint-disable-next-line no-console
        console.error('Failed to load children from backend', err);
        const status = err?.status || err?.statusCode || (err?.message && /401|Unauthorized/i.test(err.message) ? 401 : undefined);
        if (status === 401 || status === 403) {
          setErrorMessage('Not authenticated — please log in so you can see your children.');
        } else {
          setErrorMessage('Unable to load children from the server. Check backend or network.');
        }
        if (mounted) setChildren([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [user]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  return (
    <div>
      {errorMessage && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Children</h1>
          <p className="text-muted-foreground">
            {user?.role === 'chw' ? 'Children you have registered' : 'All registered children'}
          </p>
        </div>
        {user?.role === 'chw' && (
          <Button onClick={() => navigate('/children/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Register New Child
          </Button>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children.map(child => {
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
          
          return (
            <Card key={child.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{child.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Mother: {child.motherName}</p>
                        {(user?.role === 'admin' || user?.role === 'nutritionist') && (
                          <p className="text-xs text-muted-foreground">Collected by: {(child as any).createdByName ?? (child as any).createdBy ?? '—'}</p>
                        )}
                      </div>
                  <Badge 
                    className={cn(
                      'capitalize',
                      statusColor === 'success' && 'bg-success text-success-foreground',
                      statusColor === 'warning' && 'bg-warning text-warning-foreground',
                      statusColor === 'danger' && 'bg-danger text-danger-foreground'
                    )}
                  >
                    {getStatusLabel(status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <p className="font-medium">{ageMonths} months</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sex:</span>
                    <p className="font-medium capitalize">{child.sex}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Weight:</span>
                    <p className="font-medium">{(latestData?.weightKg ?? '—')} kg</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Height:</span>
                    <p className="font-medium">{(latestData?.heightCm ?? '—')} cm</p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium">{child.address}</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/children/${child.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {children.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No children registered yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              {user?.role === 'chw' 
                ? 'Start by registering your first child'
                : 'Waiting for CHWs to register children'}
            </p>
            {user?.role === 'chw' && (
              <Button onClick={() => navigate('/children/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Register First Child
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>

    </div>
  );
}
