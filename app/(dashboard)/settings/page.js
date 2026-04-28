'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { User, Loader2, Save, ArrowLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const INPUT_CLS =
  'w-full rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 dark:bg-gray-700 dark:border-gray-600 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#ff6600] ' +
  'focus:ring-2 focus:ring-[#ff6600]/20 transition-all';

export default function SettingsPage() {
  const { user, setAuth } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData, clearProfileDraft] = useFormDraft('settings-profile', {
    first_name: '',
    last_name: '',
    username: '',
    phone: '',
    email: '',
  });
  const [profileErrors, setProfileErrors] = useState({});

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authAPI.getProfile();
      const p = res.data;
      setProfileData({
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        username: p.username || '',
        phone: p.phone || '',
        email: p.email || '',
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [setProfileData]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileErrors({});

    try {
      const res = await authAPI.updateProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        username: profileData.username,
        phone: profileData.phone,
      });

      if (user) {
        const updatedUser = { ...user, ...res.data };
        const access = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        if (access && refresh) {
          setAuth(updatedUser, { access, refresh });
        }
      }

      toast.success('Profile updated successfully');
      clearProfileDraft();
    } catch (error) {
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        setProfileErrors(errData);
        const firstKey = Object.keys(errData)[0];
        const firstMsg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey];
        toast.error(typeof firstMsg === 'string' ? firstMsg : 'Failed to update profile');
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setSavingProfile(false);
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/dashboard')} className="hover:text-[#ff6600] transition-colors">
          Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Edit Profile</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Edit Profile</h1>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <User className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Information</h2>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">First Name</label>
                  <input
                    type="text"
                    placeholder="John"
                    className={INPUT_CLS}
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  />
                  <FieldError errors={profileErrors} field="first_name" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className={INPUT_CLS}
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  />
                  <FieldError errors={profileErrors} field="last_name" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Username</label>
                  <input
                    type="text"
                    placeholder="johndoe"
                    className={INPUT_CLS}
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  />
                  <FieldError errors={profileErrors} field="username" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    className={INPUT_CLS}
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                  <FieldError errors={profileErrors} field="phone" />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    disabled
                    className={INPUT_CLS + ' opacity-60 cursor-not-allowed'}
                    value={profileData.email}
                  />
                  <p className="text-xs text-slate-400 dark:text-gray-500">Email cannot be changed</p>
                </div>
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 bg-[#ff6600] text-white font-bold rounded-lg px-8 py-3 shadow-lg shadow-orange-500/30 hover:bg-[#ff6600]/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
    </div>
  );
}
