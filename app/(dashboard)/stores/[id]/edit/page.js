'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { storeAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, ChevronDown, Loader2, Store,
  CheckCircle2, AlertCircle,
} from 'lucide-react';

const INPUT_CLS =
  'w-full rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 py-3 text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-[#ff6600] ' +
  'focus:ring-2 focus:ring-[#ff6600]/20 transition-all ' +
  'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500';

const SELECT_CLS = INPUT_CLS + ' appearance-none pr-10';

export default function EditStorePage() {
  const router  = useRouter();
  const params  = useParams();
  const storeId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [formData, setFormData] = useState({
    name:        '',
    subdomain:   '',
    description: '',
    currency:    'USD',
    is_active:   true,
  });

  /* ── fetch ── */
  const fetchStore = useCallback(async () => {
    try {
      const { data: s } = await storeAPI.get(storeId);
      setFormData({
        name:        s.name        || '',
        subdomain:   s.subdomain   || '',
        description: s.description || '',
        currency:    s.currency    || 'USD',
        is_active:   s.is_active   ?? true,
      });
    } catch {
      toast.error('Failed to load store');
      router.push('/stores');
    } finally {
      setLoading(false);
    }
  }, [storeId, router]);

  useEffect(() => {
    fetchStore();
  }, [storeId, fetchStore]);

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storeAPI.update(storeId, formData);
      toast.success('Store settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.subdomain?.[0] || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  /* ── loading ── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/stores')} className="hover:text-[#ff6600] transition-colors">
          Stores
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">{formData.name || 'Edit Store'}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Edit Store</h1>
        <button
          type="button"
          onClick={() => router.push('/stores')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stores
        </button>
      </div>

      <form id="edit-store-form" onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
            <Store className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Store Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Store Name <span className="text-[#ff6600]">*</span>
              </label>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="My Awesome Store"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Currency <span className="text-[#ff6600]">*</span>
              </label>
              <div className="relative">
                <select
                  className={SELECT_CLS}
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="JPY">JPY — Japanese Yen</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Subdomain (read-only) */}
          <div className="mt-6 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
              Subdomain
            </label>
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-gray-600 overflow-hidden bg-slate-50 dark:bg-gray-700/50">
              <span className="flex-1 px-4 py-3 text-slate-500 dark:text-gray-400 font-mono min-w-0">
                {formData.subdomain}
              </span>
              <span className="px-4 py-3 bg-slate-50 dark:bg-gray-700/50 text-slate-400 dark:text-gray-500 text-sm border-l border-slate-200 dark:border-gray-600 whitespace-nowrap">.myplatform.com</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500">Subdomain is permanent and cannot be changed after creation.</p>
          </div>

          {/* Store Status */}
          <div className="mt-6 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
              Store Status
            </label>
            <div
              onClick={() => setFormData((p) => ({ ...p, is_active: !p.is_active }))}
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg border-2 cursor-pointer select-none transition-all ${
                formData.is_active
                  ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                  : 'border-slate-200 bg-white dark:border-gray-600 dark:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {formData.is_active ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                )}
                <span className={`text-sm font-semibold ${formData.is_active ? 'text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-gray-400'}`}>
                  {formData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  formData.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-gray-500'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white dark:bg-gray-800 shadow-sm transition-transform ${
                    formData.is_active ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Description</label>
            <textarea
              className={INPUT_CLS + ' resize-none'}
              rows={4}
              placeholder="Describe your store..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </section>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/stores')}
            className="px-8 py-3 rounded-lg font-bold border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-12 py-3 rounded-lg font-bold bg-[#ff6600] text-white shadow-lg shadow-orange-500/30 hover:bg-[#ff6600]/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
