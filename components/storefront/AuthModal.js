'use client';

import { useState, useEffect } from 'react';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthModal({ open, onClose, initialTab = 'signin' }) {
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useStorefrontAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  // Sign In state
  const [siEmail, setSiEmail] = useState('');
  const [siPass, setSiPass] = useState('');

  // Sign Up state
  const [suFirst, setSuFirst] = useState('');
  const [suLast, setSuLast] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPass, setSuPass] = useState('');
  const [suPass2, setSuPass2] = useState('');
  const [suPhone, setSuPhone] = useState('');

  const switchTab = (t) => { setTab(t); setError(''); };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!siEmail || !siPass) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await storefrontAPI.login({ email: siEmail, password: siPass });
      const { tokens, user } = res.data;
      setAuth(user, tokens.access, tokens.refresh);
      onClose();
      setSiEmail(''); setSiPass('');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || data?.non_field_errors?.[0] || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!suFirst || !suEmail || !suPass || !suPass2) { setError('Please fill in all required fields'); return; }
    if (suPass !== suPass2) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      const username = suEmail.split('@')[0] + '_' + Date.now().toString().slice(-4);
      await storefrontAPI.register({
        email: suEmail, password: suPass, password2: suPass2,
        username, first_name: suFirst, last_name: suLast, phone: suPhone,
      });
      // Auto login after register
      const loginRes = await storefrontAPI.login({ email: suEmail, password: suPass });
      const { tokens, user } = loginRes.data;
      setAuth(user, tokens.access, tokens.refresh);
      onClose();
      setSuFirst(''); setSuLast(''); setSuEmail(''); setSuPass(''); setSuPass2(''); setSuPhone('');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.email?.[0] || data?.password?.[0] || data?.password2?.[0]
        || data?.username?.[0] || data?.non_field_errors?.[0] || data?.detail
        || (typeof data === 'object' ? JSON.stringify(data) : 'Something went wrong');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm transition-opacity pointer-events-auto"
        onClick={onClose} 
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 py-12 sm:p-6 pointer-events-none">
        <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl overflow-hidden relative pointer-events-auto max-h-full flex flex-col">
          <button 
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex border-b border-border bg-muted/40 shrink-0">
            <button 
              className={`flex-1 py-4 text-sm font-bold tracking-wider uppercase transition-colors relative ${tab === 'signin' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => switchTab('signin')}
            >
              Sign In
              {tab === 'signin' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_0_8px_rgba(212,175,55,0.8)]" />}
            </button>
            <button 
              className={`flex-1 py-4 text-sm font-bold tracking-wider uppercase transition-colors relative ${tab === 'signup' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => switchTab('signup')}
            >
              Sign Up
              {tab === 'signup' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_0_8px_rgba(212,175,55,0.8)]" />}
            </button>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                {error}
              </div>
            )}

            {tab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-black text-foreground mb-2 tracking-tight">Welcome back</h2>
                  <p className="text-muted-foreground">Sign in to your account to continue</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                      placeholder="you@example.com" 
                      value={siEmail} 
                      onChange={(e) => setSiEmail(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                      <span>Password</span>
                    </label>
                    <input 
                      type="password" 
                      className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                      placeholder="••••••••" 
                      value={siPass} 
                      onChange={(e) => setSiPass(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" size="lg" className="w-full rounded-xl font-bold" disabled={loading}>
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing In...</> : 'Sign In'}
                  </Button>
                </div>

                <div className="text-center pt-4 border-t border-border mt-6">
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <button type="button" className="text-primary font-bold hover:underline underline-offset-4" onClick={() => switchTab('signup')}>
                      Sign Up
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-black text-foreground mb-2 tracking-tight">Create account</h2>
                  <p className="text-muted-foreground">Join us for exclusive access & offers</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                    <input 
                      type="text" 
                      className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                      placeholder="First" 
                      value={suFirst} 
                      onChange={(e) => setSuFirst(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                      placeholder="Last" 
                      value={suLast} 
                      onChange={(e) => setSuLast(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="you@example.com" 
                    value={suEmail} 
                    onChange={(e) => setSuEmail(e.target.value)} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                  <input 
                    type="password" 
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="Min. 8 characters" 
                    value={suPass} 
                    onChange={(e) => setSuPass(e.target.value)} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
                  <input 
                    type="password" 
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="Confirm password" 
                    value={suPass2} 
                    onChange={(e) => setSuPass2(e.target.value)} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone (Optional)</label>
                  <input 
                    type="tel" 
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="+1 234 567 8900" 
                    value={suPhone} 
                    onChange={(e) => setSuPhone(e.target.value)} 
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="lg" className="w-full rounded-xl font-bold" disabled={loading}>
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account...</> : 'Create Account'}
                  </Button>
                </div>

                <div className="text-center pt-4 border-t border-border mt-6">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button type="button" className="text-primary font-bold hover:underline underline-offset-4" onClick={() => switchTab('signin')}>
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
