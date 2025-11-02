import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Sidebar is fixed so it stays visible while content scrolls */}
      <div className="fixed top-0 left-0 h-screen">
        <Sidebar />
      </div>

      {/* Main content has left margin equal to sidebar width (w-64) */}
      <div className="ml-64 flex min-h-screen flex-col">
        <Topbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
