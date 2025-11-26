import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { toast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Moon, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  const handleLogoutWithToast = async () => {
    try {
      await logout();
      toast({ title: 'Logged out', description: 'You have been signed out' });
      navigate('/login');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Logout error', err);
      toast({ title: 'Error', description: 'Could not log out', variant: 'destructive' });
    }
  };
  
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          Welcome, {user?.name}
        </h2>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/profile')}
          aria-label="Profile"
        >
          <User className="h-5 w-5" />
        </Button>
        
        {/* Logout moved to the Sidebar for a persistent place in the layout */}
      </div>
    </header>
  );
}
