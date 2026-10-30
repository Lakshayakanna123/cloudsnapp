import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Camera, LayoutDashboard, Images, FolderOpen, Heart,
  Clock, User, LogOut, Menu, X, Upload, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import UploadModal from '../upload/UploadModal';

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/photos', icon: Images, label: 'All Photos' },
  { to: '/app/collections', icon: FolderOpen, label: 'Collections' },
  { to: '/app/favorites', icon: Heart, label: 'Favorites' },
  { to: '/app/recent', icon: Clock, label: 'Recent' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-surface-800/60">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow flex-shrink-0">
          <Camera className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-white text-lg">CloudSnap</span>
      </div>

      {/* Upload button */}
      <div className="px-3 py-4">
        <button
          onClick={() => { setUploadOpen(true); setSidebarOpen(false); }}
          id="sidebar-upload-btn"
          className="btn-primary w-full"
        >
          <Upload className="w-4 h-4" />
          Upload Photos
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => isActive ? 'nav-item-active block' : 'nav-item block'}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-surface-800/60 p-3 space-y-1">
        <NavLink
          to="/app/profile"
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) => isActive ? 'nav-item-active block' : 'nav-item block'}
        >
          <User className="w-4 h-4" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-200 truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-surface-600" />
        </NavLink>
        <button onClick={handleLogout} className="nav-item w-full text-danger-400 hover:text-danger-300 hover:bg-danger-500/10">
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-surface-800/60 bg-surface-900/40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 flex flex-col bg-surface-900 border-r border-surface-800/60 shadow-2xl animate-slide-up">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 btn-icon"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-800/60 bg-surface-900/40">
          <button
            onClick={() => setSidebarOpen(true)}
            id="mobile-menu-btn"
            className="btn-icon"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-white">CloudSnap</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setUploadOpen(true)}
            className="btn-primary btn-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Upload modal */}
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </div>
  );
}
