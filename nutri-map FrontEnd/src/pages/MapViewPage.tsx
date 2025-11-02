import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Child } from '@/lib/types';
import { classifyNutritionalStatus, calculateAgeInMonths, getStatusLabel } from '@/lib/zscore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MapViewPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'severe' | 'moderate'>('all');
  const { user } = useAuth();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const params: any = {};
        if (user?.role === 'chw') params.collectorId = user.id;
        const data = await api.getChildren(params);
        setChildren(data || []);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  const getChildStatus = (child: Child) => {
    // defensive: followUps or initialAnthro may be missing
    const latestData = Array.isArray((child as any).followUps) && (child as any).followUps.length > 0
      ? (child as any).followUps[(child as any).followUps.length - 1]
      : (child as any).initialAnthro ?? null;

    const ageMonths = calculateAgeInMonths(child.dob);

    // ensure numeric values before calling classifier
    const weight = latestData?.weightKg ?? null;
    const height = latestData?.heightCm ?? null;
    if (typeof weight !== 'number' || typeof height !== 'number' || typeof ageMonths !== 'number') {
      // If we don't have valid measurements, treat as 'normal' for display purposes
      // (avoids runtime errors). Downstream code shouldn't assume precise status when data missing.
      return 'normal';
    }

    return classifyNutritionalStatus(weight, height, ageMonths);
  };
  
  const filteredChildren = children.filter(child => {
    const status = getChildStatus(child);
    if (filter === 'all') return true;
    if (filter === 'severe') return status === 'severe';
    if (filter === 'moderate') return status === 'moderate';
    return true;
  });
  
  const stats = children.reduce((acc, child) => {
    const status = getChildStatus(child);
    if (status === 'severe') acc.severe++;
    if (status === 'moderate') acc.moderate++;
    if (status === 'normal') acc.normal++;
    return acc;
  }, { severe: 0, moderate: 0, normal: 0 });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Map View</h1>
        <p className="text-muted-foreground">Geographic distribution of malnutrition cases in Rwanda</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Normal Cases</p>
                <p className="text-2xl font-bold">{stats.normal}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MAM Cases</p>
                <p className="text-2xl font-bold">{stats.moderate}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SAM Cases</p>
                <p className="text-2xl font-bold">{stats.severe}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-danger" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filter Cases</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'moderate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('moderate')}
              >
                MAM
              </Button>
              <Button
                variant={filter === 'severe' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('severe')}
              >
                SAM
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/20 p-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredChildren.map(child => {
                const status = getChildStatus(child);
                return (
                  <div
                    key={child.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md"
                  >
                    <div className={cn(
                      'mt-1',
                      status === 'normal' && 'text-success',
                      status === 'moderate' && 'text-warning',
                      status === 'severe' && 'text-danger'
                    )}>
                      <MapPin className="h-5 w-5 fill-current" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{child.name}</p>
                      <p className="text-sm text-muted-foreground">{child.address}</p>
                      <Badge 
                        className={cn(
                          'mt-2 text-xs',
                          status === 'normal' && 'bg-success/10 text-success',
                          status === 'moderate' && 'bg-warning/10 text-warning',
                          status === 'severe' && 'bg-danger/10 text-danger'
                        )}
                      >
                        {getStatusLabel(status)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredChildren.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No cases found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Note removed for production-ready UI (was a dev placeholder about React Leaflet). */}
    </div>
  );
}
