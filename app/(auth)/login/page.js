'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/storeStore';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { LayoutDashboard, Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';

const validateEmail = (email) => {
  if (!email) return { valid: false, error: 'Email is required' };
  const parts = email.split('@');
  if (parts.length !== 2) return { valid: false, error: 'Please enter a valid email address' };
  const [localPart, domain] = parts;
  if (localPart.length < 2) return { valid: false, error: 'Minimum 2 characters required before @' };
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(localPart) && !/^[a-z0-9]{2}$/.test(localPart)) {
    return { valid: false, error: 'Invalid characters in email' };
  }
  if (domain !== 'gmail.com') return { valid: false, error: 'Only Gmail emails are allowed' };
  return { valid: true, error: null };
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { setActiveStore, setStores } = useStoreStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const getInputClass = (hasError) =>
    `w-full pl-10 pr-4 py-3 rounded-lg border bg-white text-slate-900 outline-none transition-all ${
      hasError
        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
        : 'border-slate-200 focus:ring-2 focus:ring-[#8b5cf6]/20 focus:border-[#8b5cf6]'
    }`;

  const getInputClassWithPadding = (hasError) =>
    `w-full pl-10 pr-12 py-3 rounded-lg border bg-white text-slate-900 outline-none transition-all ${
      hasError
        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
        : 'border-slate-200 focus:ring-2 focus:ring-[#8b5cf6]/20 focus:border-[#8b5cf6]'
    }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) newErrors.email = emailValidation.error;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      const refMap = { email: emailRef, password: passwordRef };
      refMap[firstError]?.current?.focus();
      toast.error(newErrors[firstError]);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      const { user, tokens } = response.data;
      setActiveStore(null);
      setStores([]);
      setAuth(user, tokens);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-2xl p-8 md:p-10 border border-slate-100">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#8b5cf6]/10 rounded-full flex items-center justify-center mb-4">
            <LayoutDashboard className="w-8 h-8 text-[#8b5cf6]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 mt-2 text-sm">Please enter your admin credentials</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                ref={emailRef}
                id="email"
                type="email"
                placeholder="you@gmail.com"
                className={getInputClass(errors.email)}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value.replace(/\s/g, '').toLowerCase() });
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <Link href="/forgot-password" className="text-xs font-medium text-[#8b5cf6] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                ref={passwordRef}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={getInputClassWithPadding(errors.password)}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value.replace(/\s/g, '') });
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Remember */}
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-[#8b5cf6] focus:ring-[#8b5cf6]"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-slate-600">
              Remember this device
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <Link href="/register" className="text-[#8b5cf6] font-semibold hover:underline ml-1">
              Create one now
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom Links */}
      <div className="absolute bottom-6 hidden sm:flex gap-6 text-slate-400 text-sm">
        <span className="hover:text-[#8b5cf6] transition-colors cursor-pointer">Privacy Policy</span>
        <span className="hover:text-[#8b5cf6] transition-colors cursor-pointer">Terms of Service</span>
        <span className="hover:text-[#8b5cf6] transition-colors cursor-pointer">Contact Support</span>
      </div>
    </div>
  );
}
