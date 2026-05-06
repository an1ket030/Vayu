import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, AlertTriangle, Info, CheckCircle, Zap, X, Check } from 'lucide-react';
import { useNotificationStore, type Notification, type NotificationType } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '@/utils/cn';

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  emergency: { icon: Zap, color: 'text-red-500' },
  warning: { icon: AlertTriangle, color: 'text-orange-500' },
  info: { icon: Info, color: 'text-blue-500' },
  success: { icon: CheckCircle, color: 'text-green-500' },
};

const NotificationItem = ({ notif }: { notif: Notification }) => {
  const { markRead, dismiss } = useNotificationStore();
  const { icon: Icon, color } = typeConfig[notif.type];

  const timeAgo = (date: Date): string => {
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors group relative',
        notif.read ? 'opacity-70' : 'bg-muted/40',
      )}
    >
      <div className={cn('mt-0.5 shrink-0', color)}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{notif.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{notif.message}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(notif.timestamp)}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notif.read && (
          <button
            onClick={() => markRead(notif.id)}
            title="Mark as read"
            className="p-1 hover:bg-muted rounded"
          >
            <Check size={12} className="text-muted-foreground" />
          </button>
        )}
        <button
          onClick={() => dismiss(notif.id)}
          title="Dismiss"
          className="p-1 hover:bg-muted rounded"
        >
          <X size={12} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isPanelOpen, togglePanel, closePanel, markAllRead } = useNotificationStore();
  const { user, isAuthenticated } = useAuthStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const [searchVal, setSearchVal] = useState('');

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    if (isPanelOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isPanelOpen, closePanel]);

  // Request browser notification permission on first open
  useEffect(() => {
    if (isPanelOpen && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isPanelOpen]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Guest';

  return (
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0 relative z-50">
      {/* Search */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (searchVal.trim()) {
            navigate(`/?city=${encodeURIComponent(searchVal.trim())}`);
            setSearchVal('');
            closePanel();
          }
        }}
        className="flex items-center gap-4 bg-surface-bright/50 border border-border px-3 py-1.5 rounded-md w-80 focus-within:border-primary focus-within:glow-primary transition-all"
      >
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search for a city or station..."
          className="bg-transparent border-none outline-none text-sm w-full font-sans text-foreground placeholder:text-muted-foreground"
        />
      </form>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={togglePanel}
            id="notification-bell"
            className="p-2 hover:bg-white/5 rounded-full relative transition-colors"
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell size={20} className={unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {isPanelOpen && (
            <div className="absolute right-0 top-12 w-80 bg-surface-dim border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
                <h3 className="font-display font-semibold text-sm">Notifications</h3>
                <div className="flex items-center gap-2">
                  {notifications.some((n) => !n.read) && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={closePanel} className="p-1 hover:bg-white/5 rounded">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Bell size={24} className="mb-2 opacity-40" />
                    <p className="text-sm font-medium">No notifications yet</p>
                    <p className="text-xs mt-1 opacity-70">AQI alerts will appear here</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <NotificationItem key={notif.id} notif={notif} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <button
          onClick={() => navigate(isAuthenticated ? '/profile' : '/auth')}
          className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity"
          id="user-avatar-btn"
        >
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-bold ring-1 ring-primary/30">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              displayName[0].toUpperCase()
            )}
          </div>
          <span className="text-sm font-medium text-foreground">{displayName}</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
