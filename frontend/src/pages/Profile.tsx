import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Calendar, Activity, Shield, LogOut, BarChart3, Clock, TrendingUp, Wind } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useExposureStore } from '../store/useExposureStore';
import { exposureService } from '../services/api.service';
import { getColorForAQI } from '@/utils/colorMapper';

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) => (
  <div className="data-card p-5 flex flex-col items-center text-center gap-2">
    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">{icon}</div>
    <p className="text-2xl font-mono font-black" style={color ? { color } : undefined}>{value}</p>
    <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated } = useAuthStore();
  const { logs, dailyExposure } = useExposureStore();

  // Try to fetch backend exposure history if authenticated
  const { data: backendLogs } = useQuery({
    queryKey: ['exposure-history'],
    queryFn: () => exposureService.getHistory(),
    enabled: isAuthenticated,
    retry: false,
  });

  const allLogs = (backendLogs as any[]) || logs;

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  const totalReadings = allLogs.length;
  const avgAQI = totalReadings > 0 ? Math.round(allLogs.reduce((s: number, l: any) => s + (l.aqi || 0), 0) / totalReadings) : 0;
  const maxAQI = totalReadings > 0 ? Math.max(...allLogs.map((l: any) => l.aqi || 0)) : 0;
  const { color: avgColor } = getColorForAQI(avgAQI);
  const { color: maxColor } = getColorForAQI(maxAQI);

  // Most recent 5 readings
  const recentLogs = [...allLogs].reverse().slice(0, 5);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center">
        <div className="data-card p-10">
          <Wind size={36} className="mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Sign in to view your profile</h2>
          <p className="text-muted-foreground text-sm mb-6 font-mono">Track your personal air quality exposure and history.</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#0284c7)', color: '#001e2c', boxShadow: '0 0 16px rgba(56,189,248,0.35)' }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold tracking-tight">Your Profile</h2>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-surface-dim hover:bg-white/5 rounded-xl text-sm font-mono text-muted-foreground hover:text-red-400 transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Identity Card */}
      <div className="data-card p-6">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-primary text-3xl font-display font-black overflow-hidden shrink-0 border border-primary/30"
            style={{ boxShadow: '0 0 20px rgba(56,189,248,0.25)' }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              : displayName[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold">{displayName}</h3>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1.5 font-mono">
              <Mail size={13} /> {user?.email}
            </p>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1 font-mono">
              <Calendar size={13} /> Member since {memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BarChart3 size={16} />} label="Total Readings" value={totalReadings} />
        <StatCard icon={<Activity size={16} />} label="Avg AQI" value={avgAQI || '—'} color={avgAQI ? avgColor : undefined} />
        <StatCard icon={<TrendingUp size={16} />} label="Peak AQI" value={maxAQI || '—'} color={maxAQI ? maxColor : undefined} />
        <StatCard icon={<Shield size={16} />} label="Today's Dose" value={`${dailyExposure.toFixed(1)}×`} />
      </div>

      {/* Recent Exposure Logs */}
      <div className="data-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
          <Clock size={15} className="text-primary" />
          <h4 className="font-display font-semibold text-sm">Recent Exposure Readings</h4>
        </div>
        {recentLogs.length === 0 ? (
          <div className="px-6 py-10 text-center text-muted-foreground font-mono text-sm">
            No readings recorded yet. Enable location tracking in the Exposure Tracker.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentLogs.map((log: any, i: number) => {
              const { label, color } = getColorForAQI(log.aqi || 0);
              const ts = log.createdAt || log.timestamp;
              return (
                <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-white/3 transition-colors">
                  <div>
                    <p className="font-mono text-sm font-medium">{log.category || label}</p>
                    {ts && (
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold font-mono border"
                    style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
                  >
                    AQI {log.aqi}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
