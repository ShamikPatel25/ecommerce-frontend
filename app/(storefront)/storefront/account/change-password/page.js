'use client';

import { useState, useEffect } from 'react';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { useRouter } from 'next/navigation';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { Shield, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const customer = useStorefrontAuthStore((s) => s.customer);
  const accessToken = useStorefrontAuthStore((s) => s.accessToken);
  const isLoggedIn = !!(customer && accessToken);
  const router = useRouter();
  const { href } = useStorefrontPath();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push(href('/'));
    }
  }, [isMounted, isLoggedIn, router, href]);

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-green-500' };
    return { score: 5, label: 'Very Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(form.new_password);
  const passwordsMatch = form.new_password && form.new_password2 && form.new_password === form.new_password2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    if (form.new_password.trim() !== form.new_password2.trim()) {
      setErrors({ new_password2: ['Passwords do not match'] });
      toast.error('Passwords do not match');
      setSaving(false);
      return;
    }

    try {
      const res = await storefrontAPI.changePassword({
        old_password: form.old_password.trim(),
        new_password: form.new_password.trim(),
        new_password2: form.new_password2.trim(),
      });

      toast.success(res.data?.message || 'Password changed successfully');
      router.push(href('/'));
    } catch (error) {
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        setErrors(errData);
        const firstKey = Object.keys(errData)[0];
        const firstMsg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey];
        toast.error(typeof firstMsg === 'string' ? firstMsg : 'Failed to change password');
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setSaving(false);
    }
  };

  const FieldError = ({ field }) => {
    const msgs = errors[field];
    if (!msgs) return null;
    const list = Array.isArray(msgs) ? msgs : [msgs];
    return (
      <div className="mt-1.5">
        {list.map((msg, i) => (
          <p key={i} className="text-xs text-red-500">{msg}</p>
        ))}
      </div>
    );
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Change Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Keep your account secure</p>
        </div>

        {/* Card */}
        <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Current Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  placeholder="Enter your current password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10 text-sm text-foreground transition-all placeholder:text-muted-foreground/50 outline-none"
                  value={form.old_password}
                  onChange={(e) => setForm({ ...form, old_password: e.target.value.replace(/\s/g, '') })}
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError field="old_password" />
            </div>

            <hr className="border-border" />

            {/* New Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  placeholder="Create a new password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10 text-sm text-foreground transition-all placeholder:text-muted-foreground/50 outline-none"
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value.replace(/\s/g, '') })}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.new_password && (
                <div className="mt-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-colors ${
                            i <= passwordStrength.score ? passwordStrength.color : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 1 ? 'text-red-500' :
                      passwordStrength.score <= 2 ? 'text-orange-500' :
                      passwordStrength.score <= 3 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              <FieldError field="new_password" />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Confirm your new password"
                  className={`w-full px-4 py-3 pr-11 rounded-xl bg-muted/50 border transition-all text-sm text-foreground placeholder:text-muted-foreground/50 outline-none ${
                    form.new_password2
                      ? passwordsMatch
                        ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/10'
                        : 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                      : 'border-transparent focus:border-primary focus:ring-2 focus:ring-primary/10'
                  } focus:bg-background`}
                  value={form.new_password2}
                  onChange={(e) => setForm({ ...form, new_password2: e.target.value.replace(/\s/g, '') })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.new_password2 && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordsMatch ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Passwords match
                    </>
                  ) : (
                    'Passwords do not match'
                  )}
                </p>
              )}
              <FieldError field="new_password2" />
            </div>

            {errors.detail && (
              <p className="text-sm text-red-500">{errors.detail}</p>
            )}
            {errors.non_field_errors && (
              <div>
                {(Array.isArray(errors.non_field_errors)
                  ? errors.non_field_errors
                  : [errors.non_field_errors]
                ).map((msg, i) => (
                  <p key={i} className="text-sm text-red-500">{msg}</p>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving || !passwordsMatch || !form.old_password}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
