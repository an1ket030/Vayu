import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map as MapIcon,
  Navigation,
  Activity,
  Calendar,
  Wind,
  User,
  LogOut,
  LogIn,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '../../store/useAuthStore';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Hotspot Map', icon: MapIcon, href: '/map' },
    { name: 'Route Finder', icon: Navigation, href: '/route' },
    { name: 'Exposure Tracker', icon: Activity, href: '/exposure', requiresAuth: true },
    { name: '7-Day Forecast', icon: Calendar, href: '/forecast' },
  ];

  const displayName = user?.user_metadata?.display_name
    || user?.email?.split('@')[0]
    || 'User';

  const avatarLetter = displayName[0].toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="w-[240px] border-r border-border bg-surface flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Wind className="text-primary" size={24} />
        </div>
        <h1 className="text-xl font-display font-bold tracking-tight text-foreground">Vayu</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative',
                isActive
                  ? 'bg-white/5 text-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-r-sm" />
                )}
                <item.icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                <span className="flex-1">{item.name}</span>
                {item.requiresAuth && !isAuthenticated && (
                  <span className="text-[10px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded-full">
                    Auth
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — user section */}
      <div className="p-4 border-t border-border space-y-1">
        {isAuthenticated ? (
          <>
            {/* Profile link */}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium transition-colors relative',
                  isActive
                    ? 'bg-white/5 text-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-r-sm" />
                  )}
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      avatarLetter
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-foreground font-medium truncate text-xs">{displayName}</p>
                    <p className="text-muted-foreground truncate text-[10px]">{user?.email}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </>
              )}
            </NavLink>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2 w-full text-muted-foreground hover:bg-white/5 hover:text-foreground rounded-md text-sm font-medium transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-3 px-3 py-2 w-full bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-all hover:glow-primary-hover"
          >
            <LogIn size={18} />
            Sign In
          </button>
        )}

        <button className="flex items-center gap-3 px-3 py-2 w-full text-muted-foreground hover:bg-white/5 hover:text-foreground rounded-md text-sm font-medium transition-colors">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
