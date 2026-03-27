'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { Store, User, Mail, Lock, ShieldCheck, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    is_store_owner: true,
  });
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.email.includes(' ')) {
      toast.error('Email must not contain spaces');
      return;
    }
    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      toast.error('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      const { user, tokens } = response.data;
      setAuth(user, tokens);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(
        error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0] ||
        'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#ff6600]/5 via-slate-50 to-[#ff6600]/10" />

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-slate-100">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#ff6600] rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/30">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Account</h1>
            <p className="text-slate-500 text-sm font-medium">Join us to start managing your online store.</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/\s/g, '') })}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.replace(/\s/g, '').toLowerCase() })}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all"
                  value={formData.password2}
                  onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 py-1">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 rounded border-slate-300 text-[#ff6600] focus:ring-[#ff6600]"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="text-xs text-slate-500 leading-normal">
                By creating an account, you agree to our{' '}
                <span className="text-[#ff6600] hover:underline font-semibold cursor-pointer">Terms of Service</span> and{' '}
                <span className="text-[#ff6600] hover:underline font-semibold cursor-pointer">Privacy Policy</span>.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#ff6600] text-white font-bold rounded-lg shadow-lg shadow-orange-500/20 hover:bg-[#ff6600]/90 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  Creating account...
                  <Loader2 className="w-5 h-5 animate-spin" />
                </>
              ) : (
                'Create My Account'
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account?
              <Link href="/login" className="text-[#ff6600] font-bold hover:underline ml-1">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Branding / Footer */}
        <div className="mt-8 text-center text-slate-400 text-xs">
          <p>&copy; 2024 Admin Dashboard Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
