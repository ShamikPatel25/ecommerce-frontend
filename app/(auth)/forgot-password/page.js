'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Loader2, CheckCircle, ShieldX, UserX } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  // 'form' | 'sent'
  const [view, setView] = useState('form');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(email.trim().toLowerCase());
      if (response.data && response.data.redirect_url) {
        router.push(response.data.redirect_url);
      } else {
        setView('sent');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-2xl p-8 md:p-10 border border-slate-100">

        {/* ── Email sent successfully ── */}
        {view === 'sent' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
            <p className="text-slate-500 text-sm mb-6">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-semibold text-slate-700">{email}</span>.
              Please check your inbox and spam folder.
            </p>
            <p className="text-slate-400 text-xs mb-8">The link expires in 1 hour.</p>
            <Link
              href="/login"
              className="flex items-center gap-2 text-[#8b5cf6] font-semibold text-sm hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        )}



        {/* ── Email form ── */}
        {view === 'form' && (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-[#8b5cf6]/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-[#8b5cf6]" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h1>
              <p className="text-slate-500 mt-2 text-sm text-center">
                Enter your store owner email address to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#8b5cf6]/20 focus:border-[#8b5cf6] outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/\s/g, '').toLowerCase())}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    Verifying...
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-slate-600 text-sm hover:text-[#8b5cf6] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
