'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Lock, Loader2, Eye, EyeOff, ArrowLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const INPUT_CLS =
  'w-full rounded-lg border border-orange-500/20 bg-orange-500/5 dark:bg-gray-700 dark:border-gray-600 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-orange-500 ' +
  'focus:ring-2 focus:ring-orange-500/20 transition-all';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordErrors({});

    if (passwordData.new_password !== passwordData.new_password2) {
      setPasswordErrors({ new_password2: ['Passwords do not match'] });
      toast.error('Passwords do not match');
      setSavingPassword(false);
      return;
    }

    try {
      const res = await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        new_password2: passwordData.new_password2,
      });

      toast.success(res.data?.message || 'Password changed successfully');
      setPasswordData({ old_password: '', new_password: '', new_password2: '' });
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        setPasswordErrors(errData);
        const firstKey = Object.keys(errData)[0];
        const firstMsg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey];
        toast.error(typeof firstMsg === 'string' ? firstMsg : 'Failed to change password');
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const FieldError = ({ errors, field }) => {
    const msgs = errors[field];
    if (!msgs) return null;
    const list = Array.isArray(msgs) ? msgs : [msgs];
    return (
      <div className="mt-1">
        {list.map((msg, i) => (
          <p key={i} className="text-xs text-red-500">{msg}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/dashboard')} className="hover:text-orange-500 transition-colors">
          Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Change Password</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Change Password</h1>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/20 bg-white dark:bg-gray-800 hover:bg-orange-500/5 transition-colors text-sm font-bold self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword}>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Password */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter current password"
                      className={INPUT_CLS + ' pr-12'}
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:text-gray-300 transition-colors"
                    >
                      {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <FieldError errors={passwordErrors} field="old_password" />
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password"
                      className={INPUT_CLS + ' pr-12'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:text-gray-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <FieldError errors={passwordErrors} field="new_password" />
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      className={INPUT_CLS + ' pr-12'}
                      value={passwordData.new_password2}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password2: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <FieldError errors={passwordErrors} field="new_password2" />
                </div>
              </div>

              {/* Non-field errors */}
              {passwordErrors.detail && (
                <p className="text-sm text-red-500 mt-4">{passwordErrors.detail}</p>
              )}
              {passwordErrors.non_field_errors && (
                <div className="mt-4">
                  {(Array.isArray(passwordErrors.non_field_errors)
                    ? passwordErrors.non_field_errors
                    : [passwordErrors.non_field_errors]
                  ).map((msg, i) => (
                    <p key={i} className="text-sm text-red-500">{msg}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex items-center gap-2 bg-orange-500 text-white font-bold rounded-lg px-8 py-3 shadow-lg shadow-orange-500/30 hover:bg-orange-500/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
