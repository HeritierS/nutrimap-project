import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Child } from '@/lib/types';
import { classifyNutritionalStatus, calculateAgeInMonths } from '@/lib/zscore';
import { DashboardCard } from '@/components/DashboardCard';
import { Users, AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
            let data: any[] = [];
            if (user?.role === 'chw') {
              data = await api.getMyChildren();
            } else {
              data = await api.getChildren();
            }
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
  
  const stats = children.reduce(
    (acc, child) => {
      // defensive: followUps may be undefined or empty, and backend field names vary
      const followUps = Array.isArray((child as any).followUps) ? (child as any).followUps : [];

      const latest = followUps.length > 0 ? followUps[followUps.length - 1] : (child as any).initialAnthro || (child as any);

      // extract weight/height from possible field names coming from backend
      const weight = latest?.weightKg ?? latest?.initialWeightKg ?? (child as any).initialWeightKg ?? null;
      const height = latest?.heightCm ?? latest?.initialHeightCm ?? (child as any).initialHeightCm ?? null;

      // If we don't have numeric anthropometry, skip this child in stats
      if (typeof weight !== 'number' || typeof height !== 'number') return acc;

      const ageMonths = calculateAgeInMonths(child.dob);
      const status = classifyNutritionalStatus(weight, height, ageMonths as number);

      acc.total++;
      if (status === 'severe') acc.sam++;
      if (status === 'moderate') acc.mam++;
      if (status === 'normal') acc.normal++;

      return acc;
    },
    { total: 0, sam: 0, mam: 0, normal: 0 }
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin' && 'Overview of all nutrition data'}
          {user?.role === 'chw' && 'Your registered children'}
          {user?.role === 'nutritionist' && 'Population nutrition analytics'}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Children"
          value={stats.total}
          icon={Users}
          description="Registered in system"
        />
        <DashboardCard
          title="Normal Status"
          value={stats.normal}
          icon={TrendingUp}
          variant="success"
          description="Well nourished"
        />
        <DashboardCard
          title="MAM Cases"
          value={stats.mam}
          icon={AlertTriangle}
          variant="warning"
          description="Moderate malnutrition"
        />
        <DashboardCard
          title="SAM Cases"
          value={stats.sam}
          icon={AlertCircle}
          variant="danger"
          description="Severe malnutrition"
        />
      </div>
      
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Welcome to NutriMap</h2>
          <p className="text-sm text-muted-foreground">
            Data shown is fetched from the backend. Ensure the backend server is running and reachable for real data.
          </p>
        </div>
    </div>
  );
}
