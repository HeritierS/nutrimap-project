import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  FileText, 
  UserPlus,
  Activity,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const getNavItems = () => {
    const common = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ];
    
    if (user?.role === 'admin') {
      return [
        ...common,
        { icon: Users, label: 'Children', path: '/children' },
        { icon: Map, label: 'Map View', path: '/map' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: UserPlus, label: 'Users', path: '/admin/users' },
      ];
    }
    
    if (user?.role === 'chw') {
      return [
        ...common,
        { icon: Users, label: 'My Children', path: '/children' },
        { icon: Activity, label: 'New Registration', path: '/children/new' },
      ];
    }
    
    if (user?.role === 'nutritionist') {
      return [
        ...common,
        { icon: Map, label: 'Map View', path: '/map' },
        { icon: FileText, label: 'Reports', path: '/reports' },
      ];
    }
    
    return common;
  };
  
  const navItems = getNavItems();
  
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div>
          <img src="/logo.png" alt="NutriMap" className="h-6 w-auto" />
          <span className="sr-only">NutriMap</span>
          <p className="text-xs text-muted-foreground">Rwanda Nutrition Data</p>
        </div>
      </div>
      
      <nav className="space-y-1 p-4 flex-1 overflow-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-6 border-t border-border">
        {user && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={async () => { await logout(); navigate('/login'); }}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
