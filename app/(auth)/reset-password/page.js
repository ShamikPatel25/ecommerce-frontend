'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Lock, ShieldCheck, Loader2, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ new_password: '', new_password2: '' });

  // Verify token on mount
  useEffect(() => {
    if (!uid || !token) {
      setVerifying(false);
      return;
    }
    authAPI.verifyResetToken(uid, token)
      .then((res) => setValid(res.data.valid === true))
      .catch(() => setValid(false))
      .finally(() => setVerifying(false));
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.new_password !== formData.new_password2) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({
        uid,
        token,
        new_password: formData.new_password,
        new_password2: formData.new_password2,
      });
      setSuccess(true);
    } catch (error) {
      const msg = error.response?.data?.error
        || error.response?.data?.new_password?.[0]
        || 'Failed to reset password. The link may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="flex flex-col items-center text-center">
        <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin mb-4" />
        <p className="text-slate-500 text-sm">Verifying your reset link...</p>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h1>
        <p className="text-slate-500 text-sm mb-8">
          Your password has been changed successfully. You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="w-full bg-[#ff6600] hover:bg-[#ff6600]/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // Invalid/expired token
  if (!valid || !uid || !token) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h1>
        <p className="text-slate-500 text-sm mb-8">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="w-full bg-[#ff6600] hover:bg-[#ff6600]/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 mb-4"
        >
          Request New Link
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-slate-600 text-sm hover:text-[#ff6600] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    );
  }

  // Password form
  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-[#ff6600]/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-[#ff6600]" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h1>
        <p className="text-slate-500 mt-2 text-sm">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              required
              minLength={8}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all"
              value={formData.new_password2}
              onChange={(e) => setFormData({ ...formData, new_password2: e.target.value })}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#ff6600] hover:bg-[#ff6600]/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              Resetting...
              <Loader2 className="w-5 h-5 animate-spin" />
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-slate-600 text-sm hover:text-[#ff6600] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-2xl p-8 md:p-10 border border-slate-100">
        <Suspense fallback={
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
