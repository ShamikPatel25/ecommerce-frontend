'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/storeStore';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { Store, User, Mail, Lock, ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';

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

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { setActiveStore, setStores } = useStoreStore();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    is_store_owner: true,
  });
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const password2Ref = useRef(null);

  const getInputClass = (hasError) =>
    `w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-lg text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
      hasError
        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
        : 'border-slate-200 focus:ring-2 focus:ring-[#8b5cf6]/20 focus:border-[#8b5cf6]'
    }`;

  const getInputClassWithPadding = (hasError) =>
    `w-full pl-11 pr-12 py-3 bg-slate-50 border rounded-lg text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
      hasError
        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
        : 'border-slate-200 focus:ring-2 focus:ring-[#8b5cf6]/20 focus:border-[#8b5cf6]'
    }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) newErrors.email = emailValidation.error;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.password2) {
      newErrors.password2 = 'Confirm password is required';
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'Please agree to the Terms of Service';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      const refMap = { username: usernameRef, email: emailRef, password: passwordRef, password2: password2Ref };
      refMap[firstError]?.current?.focus();
      toast.error(newErrors[firstError]);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      const { user, tokens } = response.data;
      setActiveStore(null);
      setStores([]);
      setAuth(user, tokens);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0] ||
        error.response?.data?.password?.[0] ||
        'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#8b5cf6]/5 via-slate-50 to-[#8b5cf6]/10" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-slate-100">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#8b5cf6] rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-violet-500/30">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Account</h1>
            <p className="text-slate-500 text-sm font-medium">Join us to start managing your online store.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  ref={usernameRef}
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  className={getInputClass(errors.username)}
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value.replace(/[^a-zA-Z0-9]/g, '') });
                    if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                  }}
                />
              </div>
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
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

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  ref={password2Ref}
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  className={getInputClassWithPadding(errors.password2)}
                  value={formData.password2}
                  onChange={(e) => {
                    setFormData({ ...formData, password2: e.target.value.replace(/\s/g, '') });
                    if (errors.password2) setErrors(prev => ({ ...prev, password2: '' }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password2 && <p className="text-xs text-red-500 mt-1">{errors.password2}</p>}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 py-1">
              <input
                id="terms"
                type="checkbox"
                className={`mt-1 rounded border-slate-300 text-[#8b5cf6] focus:ring-[#8b5cf6] ${errors.terms ? 'border-red-500' : ''}`}
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                }}
              />
              <label htmlFor="terms" className="text-xs text-slate-500 leading-normal">
                By creating an account, you agree to our{' '}
                <span className="text-[#8b5cf6] hover:underline font-semibold cursor-pointer">Terms of Service</span> and{' '}
                <span className="text-[#8b5cf6] hover:underline font-semibold cursor-pointer">Privacy Policy</span>.
                <span className="text-red-500"> *</span>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-red-500 -mt-3">{errors.terms}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#8b5cf6] text-white font-bold rounded-lg shadow-lg shadow-violet-500/20 hover:bg-[#8b5cf6]/90 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account?
              <Link href="/login" className="text-[#8b5cf6] font-bold hover:underline ml-1">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-400 text-xs">
          <p>&copy; 2024 Admin Dashboard Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
