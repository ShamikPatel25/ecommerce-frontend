'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Loader2, ShoppingBag } from 'lucide-react';
import { PageTransition } from '@/components/storefront/animations';
import { Button } from '@/components/ui/button';

export default function StorefrontLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { href } = useStorefrontPath();
  const setAuth = useStorefrontAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const redirectTo = searchParams.get('redirect') || href('/');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;
      if (mode === 'login') {
        res = await storefrontAPI.login({ email: form.email, password: form.password });
      } else {
        res = await storefrontAPI.register({
          email: form.email,
          password: form.password,
          password2: form.password2,
          username: form.email.split('@')[0] + '_' + Date.now().toString().slice(-4),
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
        });
      }

      const { tokens, user } = res.data;
      setAuth(user, tokens.access, tokens.refresh);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully!');
      router.push(redirectTo);
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Something went wrong';
      if (data) {
        msg = data.error || data.detail || data.email?.[0] || data.password?.[0] || data.password2?.[0] || data.username?.[0] || data.non_field_errors?.[0] || JSON.stringify(data);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-3xl shadow-lg shadow-primary/25 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <ShoppingBag className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-black text-foreground">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login' ? 'Sign in to track your orders' : 'Join us for a better shopping experience'}
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-muted rounded-2xl p-1 mb-8">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                  mode === tab
                    ? 'bg-card text-card-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={form.first_name}
                        onChange={(e) => updateField('first_name', e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors"
                        required={mode === 'register'}
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={form.last_name}
                        onChange={(e) => updateField('last_name', e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors"
                        required={mode === 'register'}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value.replaceAll(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password (register only) */}
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="confirm-password"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={form.password2}
                      onChange={(e) => updateField('password2', e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors"
                      required={mode === 'register'}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full py-4 rounded-2xl font-bold text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-primary font-bold hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          <div className="text-center mt-4">
            <Link href={href('/')} className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
              Continue as Guest
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
