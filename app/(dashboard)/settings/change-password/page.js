'use client';

import { useState, useRef } from 'react';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Lock, Loader2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const INPUT_CLS =
  'w-full rounded-lg border border-violet-500/20 bg-violet-500/5 dark:bg-gray-700 dark:border-gray-600 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500 ' +
  'focus:ring-2 focus:ring-violet-500/20 transition-all';

const INPUT_ERROR_CLS =
  'w-full rounded-lg border border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-red-500 ' +
  'focus:ring-2 focus:ring-red-500/20 transition-all';

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

  const oldPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const hasAllFields = passwordData.old_password && passwordData.new_password && passwordData.new_password2;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!passwordData.old_password) {
      errors.old_password = ['Current password is required'];
    }
    if (!passwordData.new_password) {
      errors.new_password = ['New password is required'];
    }
    if (!passwordData.new_password2) {
      errors.new_password2 = ['Confirm password is required'];
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      const firstError = Object.keys(errors)[0];
      const refMap = { old_password: oldPasswordRef, new_password: newPasswordRef, new_password2: confirmPasswordRef };
      refMap[firstError]?.current?.focus();
      toast.error(errors[firstError][0]);
      return;
    }

    if (passwordData.new_password.trim() !== passwordData.new_password2.trim()) {
      setPasswordErrors({ new_password2: ['Passwords do not match'] });
      confirmPasswordRef.current?.focus();
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    setPasswordErrors({});

    try {
      const res = await authAPI.changePassword({
        old_password: passwordData.old_password.trim(),
        new_password: passwordData.new_password.trim(),
        new_password2: passwordData.new_password2.trim(),
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

  const getInputClass = (field) => {
    return passwordErrors[field] ? INPUT_ERROR_CLS : INPUT_CLS;
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/dashboard')} className="hover:text-violet-500 transition-colors">
          Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Change Password</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 hover:text-violet-500 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-7 h-7 text-slate-900 dark:text-white" strokeWidth={2.5} />
          </button>
          <h1 className="admin-title">Change Password</h1>
        </div>
      </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} noValidate>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Password */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={oldPasswordRef}
                      type={showOldPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      className={getInputClass('old_password') + ' pr-12'}
                      value={passwordData.old_password}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, old_password: e.target.value.replace(/\s/g, '') });
                        if (passwordErrors.old_password) setPasswordErrors(prev => ({ ...prev, old_password: null }));
                      }}
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
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={newPasswordRef}
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className={getInputClass('new_password') + ' pr-12'}
                      value={passwordData.new_password}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, new_password: e.target.value.replace(/\s/g, '') });
                        if (passwordErrors.new_password) setPasswordErrors(prev => ({ ...prev, new_password: null }));
                      }}
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
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={confirmPasswordRef}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      className={getInputClass('new_password2') + ' pr-12'}
                      value={passwordData.new_password2}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, new_password2: e.target.value.replace(/\s/g, '') });
                        if (passwordErrors.new_password2) setPasswordErrors(prev => ({ ...prev, new_password2: null }));
                      }}
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
                  disabled={savingPassword || !hasAllFields}
                  className="flex items-center gap-2 bg-violet-500 text-white font-bold rounded-lg px-8 py-3 shadow-lg shadow-violet-500/30 hover:bg-violet-500/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
