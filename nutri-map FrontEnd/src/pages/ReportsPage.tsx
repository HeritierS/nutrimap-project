import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Child } from '@/lib/types';
import { classifyNutritionalStatus, calculateAgeInMonths } from '@/lib/zscore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function ReportsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [maritalStats, setMaritalStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const params: any = {};
        if (user?.role === 'chw') params.collectorId = user.id;
        const data = await api.getChildren(params);
        setChildren(data || []);
        // load marital status analytics
        try {
          const m = await api.getMotherMaritalStats();
          setMaritalStats(m);
        } catch (e) {
          // ignore non-critical analytics failures
          // eslint-disable-next-line no-console
          console.warn('Failed to load marital stats', e);
        }
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
  
  // Calculate statistics
  const statusByRegion = children.reduce((acc, child) => {
    const latestData = Array.isArray((child as any).followUps) && (child as any).followUps.length > 0
      ? (child as any).followUps[(child as any).followUps.length - 1]
      : (child as any).initialAnthro ?? null;
    const ageMonths = calculateAgeInMonths(child.dob || '');
    const weight = latestData?.weightKg ?? null;
    const height = latestData?.heightCm ?? null;
    const status = (typeof weight === 'number' && typeof height === 'number' && Number.isFinite(ageMonths))
      ? classifyNutritionalStatus(weight, height, ageMonths)
      : 'normal';
    
    if (!acc[child.address]) {
      acc[child.address] = { normal: 0, moderate: 0, severe: 0 };
    }
    acc[child.address][status]++;
    
    return acc;
  }, {} as Record<string, { normal: number; moderate: number; severe: number }>);
  
  const barChartData = Object.entries(statusByRegion).map(([region, stats]) => ({
    region,
    Normal: stats.normal,
    MAM: stats.moderate,
    SAM: stats.severe,
  }));
  
  const totalStats = children.reduce((acc, child) => {
    const latestData = Array.isArray((child as any).followUps) && (child as any).followUps.length > 0
      ? (child as any).followUps[(child as any).followUps.length - 1]
      : (child as any).initialAnthro ?? null;
    const ageMonths = calculateAgeInMonths(child.dob || '');
    const weight = latestData?.weightKg ?? null;
    const height = latestData?.heightCm ?? null;
    const status = (typeof weight === 'number' && typeof height === 'number' && Number.isFinite(ageMonths))
      ? classifyNutritionalStatus(weight, height, ageMonths)
      : 'normal';
    
    if (status === 'normal') acc.normal++;
    if (status === 'moderate') acc.moderate++;
    if (status === 'severe') acc.severe++;
    
    return acc;
  }, { normal: 0, moderate: 0, severe: 0 });
  
  const pieChartData = [
    { name: 'Normal', value: totalStats.normal, color: 'hsl(var(--success))' },
    { name: 'MAM', value: totalStats.moderate, color: 'hsl(var(--warning))' },
    { name: 'SAM', value: totalStats.severe, color: 'hsl(var(--danger))' },
  ];
  
  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented with jsPDF library');
  };
  
  const handleExportExcel = () => {
    alert('Excel export functionality would be implemented with SheetJS (xlsx) library');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Nutrition data analysis and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Table className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Malnutrition Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => {
                    const percent = entry.percent || 0;
                    return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {maritalStats && (
          <Card>
            <CardHeader>
              <CardTitle>Mother marital status & malnutrition breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium">Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(maritalStats.breakdown).map(([k,v]: any) => ({ name: k, value: v.total }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={(entry: any) => `${entry.name}: ${entry.value}`}
                      >
                        {Object.entries(maritalStats.breakdown).map(([k], idx) => (
                          <Cell key={k} fill={['hsl(var(--primary))','hsl(var(--success))','hsl(var(--warning))','hsl(var(--muted))','hsl(var(--danger))'][idx % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Malnutrition by marital status</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(maritalStats.breakdown).map(([k,v]: any) => ({ status: k, normal: v.byStatus.normal, moderate: v.byStatus.moderate, severe: v.byStatus.severe }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="normal" stackId="a" fill="hsl(var(--success))" />
                      <Bar dataKey="moderate" stackId="a" fill="hsl(var(--warning))" />
                      <Bar dataKey="severe" stackId="a" fill="hsl(var(--danger))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Children</p>
                <p className="text-3xl font-bold">{children.length}</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <p className="text-sm text-success">Normal</p>
                <p className="text-3xl font-bold text-success">{totalStats.normal}</p>
              </div>
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <p className="text-sm text-warning">MAM Cases</p>
                <p className="text-3xl font-bold text-warning">{totalStats.moderate}</p>
              </div>
              <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
                <p className="text-sm text-danger">SAM Cases</p>
                <p className="text-3xl font-bold text-danger">{totalStats.severe}</p>
              </div>
            </div>
            
              <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">Malnutrition Rate</p>
              <div className="w-full bg-muted rounded-full h-4">
                <div 
                  className="h-4 rounded-full bg-gradient-to-r from-warning to-danger"
                  style={{ 
                    width: `${children.length > 0 ? ((totalStats.moderate + totalStats.severe) / children.length * 100).toFixed(1) : 0}%` 
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {children.length > 0 ? ((totalStats.moderate + totalStats.severe) / children.length * 100).toFixed(1) : 0}% of children affected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Cases by Region</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Normal" fill="hsl(var(--success))" />
              <Bar dataKey="MAM" fill="hsl(var(--warning))" />
              <Bar dataKey="SAM" fill="hsl(var(--danger))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium mb-1">Export Data</p>
              <p className="text-sm text-muted-foreground">
                Export comprehensive reports in PDF or Excel format for sharing with stakeholders, 
                generating official documents, or conducting further analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
