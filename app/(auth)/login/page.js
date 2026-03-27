'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/storeStore';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { LayoutDashboard, Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { setActiveStore, setStores } = useStoreStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(formData);
      const { user, tokens } = response.data;
      // Clear previous user's store selection before setting new auth
      setActiveStore(null);
      setStores([]);
      setAuth(user, tokens);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-2xl p-8 md:p-10 border border-slate-100">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#ff6600]/10 rounded-full flex items-center justify-center mb-4">
            <LayoutDashboard className="w-8 h-8 text-[#ff6600]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 mt-2 text-sm">Please enter your admin credentials</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="admin@estore.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.replace(/\s/g, '').toLowerCase() })}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-medium text-[#ff6600] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember */}
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-[#ff6600] focus:ring-[#ff6600]"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-slate-600">
              Remember this device
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff6600] hover:bg-[#ff6600]/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                Signing in...
                <Loader2 className="w-5 h-5 animate-spin" />
              </>
            ) : (
              <>
                Sign In
                <LogIn className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-600 text-sm">
            Don&apos;t have an admin account?
            <Link href="/register" className="text-[#ff6600] font-semibold hover:underline ml-1">
              Create one now
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom Links */}
      <div className="absolute bottom-6 hidden sm:flex gap-6 text-slate-400 text-sm">
        <span className="hover:text-[#ff6600] transition-colors cursor-pointer">Privacy Policy</span>
        <span className="hover:text-[#ff6600] transition-colors cursor-pointer">Terms of Service</span>
        <span className="hover:text-[#ff6600] transition-colors cursor-pointer">Contact Support</span>
      </div>
    </div>
  );
}
