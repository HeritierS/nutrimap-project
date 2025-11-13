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
      
      {/* Recent children list on dashboard (search, filter, CRUD actions) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Recent children</h2>
            <p className="text-sm text-muted-foreground">Most recently registered children (you can search, filter and perform actions)</p>
          </div>
        </div>

        <div className="flex gap-3 items-center mb-4">
          <input
            placeholder="Search name, mother or address..."
            className="flex-1 rounded-md border px-3 py-2"
            value={(window as any).__dashboard_q__ || ''}
            onChange={(e) => {
              (window as any).__dashboard_q__ = e.target.value;
              // force re-render by updating local state below
            }}
            onKeyUp={() => {/* handled by filtering code below */}}
          />
        </div>

        <RecentChildrenList children={children} setChildren={setChildren} userRole={user?.role} />
      </div>
    </div>
  );
}

function RecentChildrenList({ children, setChildren, userRole }: { children: any[]; setChildren: (c: any[]) => void; userRole?: string | null }) {
  const navigate = (window as any).navigate || ((p: string) => { window.location.href = p; });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'moderate' | 'severe'>('all');

  // local helper to compute status (reuse classification logic from zscore isn't exported here)
  const classify = (c: any) => (c.analysis?.classification?.wh || c.analysis?.classification?.wa || c.analysis?.classification?.ha) ? (c.analysis.classification.wh ? 'severe' : (c.analysis.classification.wa ? 'moderate' : 'normal')) : 'normal';

  // derive rows limited to most recent 10 (use createdAt or initialRecordedAt)
  const rows = (children || [])
    .slice()
    .sort((a,b) => {
      const ta = new Date(a.createdAt || a.initialRecordedAt || 0).getTime();
      const tb = new Date(b.createdAt || b.initialRecordedAt || 0).getTime();
      return tb - ta;
    })
    .filter((c: any) => {
      if (query) {
        const q = query.toLowerCase();
        if (!((c.name||'').toLowerCase().includes(q) || (c.motherName||'').toLowerCase().includes(q) || (c.address||'').toLowerCase().includes(q))) return false;
      }
      if (statusFilter !== 'all') {
        const s = classify(c);
        if (statusFilter === 'normal' && s !== 'normal') return false;
        if (statusFilter === 'moderate' && s !== 'moderate') return false;
        if (statusFilter === 'severe' && s !== 'severe') return false;
      }
      return true;
    })
    .slice(0, 10);

  // sync search input in dashboard (small shim)
  useEffect(() => {
    const q = (window as any).__dashboard_q__ || '';
    setQuery(q);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this child? This will remove all follow-up records.')) return;
    try {
      // call API
      await api.deleteChild(id);
      setChildren((prev: any[]) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete child', err);
      alert('Failed to delete child');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded border px-2 py-1">
          <option value="all">All statuses</option>
          <option value="normal">Normal</option>
          <option value="moderate">Moderate (MAM)</option>
          <option value="severe">Severe (SAM)</option>
        </select>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by name / mother / address" className="flex-1 rounded border px-2 py-1" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Mother</th>
              <th className="p-2">Age</th>
              <th className="p-2">Sex</th>
              <th className="p-2">Weight</th>
              <th className="p-2">Height</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c: any) => {
              const latest = (c.followUps && c.followUps.length) ? c.followUps[c.followUps.length -1] : c.initialAnthro || {};
              const age = c.dob ? Math.floor((Date.now() - new Date(c.dob).getTime()) / (1000*60*60*24*30)) : '—';
              const status = classify(c);
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-2 font-medium">{c.name}</td>
                  <td className="p-2">{c.motherName}</td>
                  <td className="p-2">{age} mo</td>
                  <td className="p-2 capitalize">{c.sex}</td>
                  <td className="p-2">{latest?.weightKg ?? '—'}</td>
                  <td className="p-2">{latest?.heightCm ?? '—'}</td>
                  <td className="p-2 capitalize">{status}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button onClick={() => window.location.href = `/children/${c.id}`} className="rounded bg-primary px-2 py-1 text-white">View</button>
                      <button onClick={() => window.location.href = `/children/${c.id}#followups`} className="rounded border px-2 py-1">Follow-up</button>
                      <button onClick={() => window.location.href = `/children/${c.id}?edit=1`} className="rounded border px-2 py-1">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="rounded border px-2 py-1 text-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
