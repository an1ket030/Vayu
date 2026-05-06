import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { Wind, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      a: Math.random() * 0.45 + 0.1,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x = (p.x + p.vx + canvas.width) % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${p.a})`; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
        if (d < 110) { ctx.beginPath(); ctx.strokeStyle = `rgba(56,189,248,${0.07 * (1 - d / 110)})`; ctx.lineWidth = 0.5; ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />;
};

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  const clear = () => { setError(null); setSuccess(null); };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault(); clear();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate('/');
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName || email.split('@')[0] } } });
        if (err) throw err;
        setSuccess('Account created! Check your email, then sign in.');
        setMode('login');
      }
    } catch (err: any) {
      const m = err.message || '';
      if (m.includes('Invalid login credentials')) setError('Incorrect email or password.');
      else if (m.includes('User already registered')) setError('Account exists — sign in instead.');
      else if (m.includes('Email not confirmed')) setError('Please verify your email first.');
      else setError(m || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    clear(); setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } });
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Enable Google provider in Supabase.'); setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); clear();
    if (!email) { setError('Enter your email address.'); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
      if (err) throw err;
      setSuccess('Reset link sent! Check your inbox.');
    } catch (err: any) { setError(err.message || 'Failed to send.'); }
    finally { setLoading(false); }
  };

  const inp = 'w-full pl-9 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all font-mono placeholder:text-muted-foreground/50 text-foreground';

  return (
    <div className="min-h-screen bg-[#0a0f12] flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleBackground />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 38% at 50% 60%, rgba(56,189,248,0.09) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <div className="bg-primary/15 p-3.5 rounded-2xl border border-primary/25" style={{ boxShadow: '0 0 24px rgba(56,189,248,0.3)' }}>
              <Wind className="text-primary" size={26} />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Vayu</h1>
          <p className="text-muted-foreground text-sm font-mono mt-2">
            {mode === 'login' && 'Sign in to your air quality intelligence dashboard'}
            {mode === 'signup' && 'Create your free account to start tracking'}
            {mode === 'forgot' && "We'll send a reset link to your inbox"}
          </p>
        </div>

        {/* Glass card */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(27,32,36,0.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

          {/* Tabs */}
          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-black/30 border border-white/5 p-1 mb-6">
              {(['login', 'signup'] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); clear(); }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === m ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-3 mb-5 text-sm font-mono">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl p-3 mb-5 text-sm font-mono">{success}</div>
          )}

          <form onSubmit={mode === 'forgot' ? handleForgot : handleEmail} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Display Name</label>
                <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className={inp} /></div>
              </div>
            )}
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inp} /></div>
            </div>
            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Password</label>
                  {mode === 'login' && <button type="button" onClick={() => { setMode('forgot'); clear(); }} className="text-[11px] text-primary hover:underline font-mono">Forgot?</button>}
                </div>
                <div className="relative"><Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={`${inp} pr-10`} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} id="auth-submit-btn"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mt-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#38bdf8,#0284c7)', color: '#001e2c', boxShadow: loading ? 'none' : '0 0 20px rgba(56,189,248,0.35)' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Please wait…</> : <>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}<ArrowRight size={15} /></>}
            </button>
          </form>

          {mode !== 'forgot' && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/8" /></div>
                <div className="relative flex justify-center"><span className="bg-[#1b2024] px-3 text-xs text-muted-foreground font-mono">or continue with</span></div>
              </div>
              <button onClick={handleGoogle} disabled={loading} id="google-auth-btn"
                className="w-full flex items-center justify-center gap-3 border border-white/10 bg-white/5 rounded-xl py-3 text-sm font-medium hover:bg-white/10 disabled:opacity-60 transition-all font-mono">
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <button type="button" onClick={() => { setMode('login'); clear(); }} className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground text-center font-mono transition-colors">
              ← Back to sign in
            </button>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground/50 mt-6 font-mono">By continuing, you agree to Vayu's Terms of Service.</p>
      </div>
    </div>
  );
};

export default Auth;
