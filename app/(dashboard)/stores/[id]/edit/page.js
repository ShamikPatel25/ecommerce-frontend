'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { storeAPI } from '@/lib/api';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useStoreStore } from '@/store/storeStore';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, ChevronDown, Loader2, Store,
} from 'lucide-react';

const INPUT_CLS =
  'w-full rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-violet-500 ' +
  'focus:ring-2 focus:ring-violet-500/20 transition-all ' +
  'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500';

const INPUT_ERROR_CLS =
  'w-full rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-red-500 ' +
  'focus:ring-2 focus:ring-red-500/20 transition-all ' +
  'dark:bg-red-900/20 dark:border-red-500 dark:text-white dark:placeholder:text-gray-500';

const SELECT_CLS = INPUT_CLS + ' appearance-none pr-10';

const MAX_NAME_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 300;
const MIN_LENGTH = 3;

export default function EditStorePage() {
  const router  = useRouter();
  const params  = useParams();
  const storeId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [errors, setErrors] = useState({});
  const [originalData, setOriginalData] = useState(null);
  const { activeStore, setActiveStore, setStores: setGlobalStores } = useStoreStore();
  const [formData, setFormData, clearDraft] = useFormDraft(`store-edit-${storeId}`, {
    name:        '',
    subdomain:   '',
    description: '',
    currency:    'INR',
  });

  const validateStoreName = (name) => {
    if (!name || !name.trim()) {
      return 'Store name is required';
    }
    if (name.trim().length < MIN_LENGTH) {
      return `Store name must be at least ${MIN_LENGTH} characters`;
    }
    if (name.length > MAX_NAME_LENGTH) {
      return `Store name cannot exceed ${MAX_NAME_LENGTH} characters`;
    }
    if (/[-+_/\\@#$%^&*()=\[\]{}|;:'",.<>?`~!]/.test(name)) {
      return 'Store name cannot contain special characters';
    }
    return null;
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_NAME_LENGTH) {
      const filtered = value.replace(/[-+_/\\@#$%^&*()=\[\]{}|;:'",.<>?`~!]/g, '');
      setFormData({ ...formData, name: filtered });
      if (errors.name) {
        setErrors({ ...errors, name: null });
      }
    }
  };

  /* ── fetch ── */
  const fetchStore = useCallback(async () => {
    try {
      const { data: s } = await storeAPI.get(storeId);
      const storeData = {
        name:        s.name        || '',
        subdomain:   s.subdomain   || '',
        description: s.description || '',
        currency:    s.currency    || 'INR',
      };
      setFormData(storeData);
      setOriginalData(storeData);
    } catch {
      toast.error('Failed to load store');
      router.push('/stores');
    } finally {
      setLoading(false);
    }
  }, [storeId, router, setFormData]);

  const hasChanges = originalData && (
    formData.name !== originalData.name ||
    formData.description !== originalData.description ||
    formData.currency !== originalData.currency
  );

  useEffect(() => {
    fetchStore();
  }, [storeId, fetchStore]);

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameError = validateStoreName(formData.name);

    if (nameError) {
      setErrors({ name: nameError });
      toast.error(nameError);
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: formData.name,
        subdomain: formData.subdomain,
        description: formData.description,
        currency: formData.currency,
      };
      await storeAPI.update(storeId, updateData);
      toast.success(`"${formData.name}" updated successfully`);
      clearDraft();

      // Update active store if this is the active one
      if (activeStore?.id === Number(storeId)) {
        const res = await storeAPI.list();
        const data = res.data;
        const allStores = Array.isArray(data) ? data : data?.results || [];
        setGlobalStores(allStores);
        const updatedStore = allStores.find(s => s.id === Number(storeId));
        if (updatedStore) {
          setActiveStore(updatedStore);
        }
      }

      // Redirect to stores list
      router.push('/stores');
    } catch (err) {
      const errData = err.response?.data;
      let errorMsg = 'Failed to save changes. Please try again.';

      if (errData) {
        if (errData.name?.[0]) {
          errorMsg = `Store name: ${errData.name[0]}`;
        } else if (errData.description?.[0]) {
          errorMsg = `Description: ${errData.description[0]}`;
        } else if (errData.currency?.[0]) {
          errorMsg = `Currency: ${errData.currency[0]}`;
        } else if (errData.detail) {
          errorMsg = errData.detail;
        } else if (errData.non_field_errors?.[0]) {
          errorMsg = errData.non_field_errors[0];
        }
      }
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  /* ── loading ── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-container">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/stores')} className="hover:text-violet-500 transition-colors">
          Stores
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">{formData.name || 'Edit Store'}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push('/stores')}
            className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 hover:text-violet-500 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-7 h-7 text-slate-900 dark:text-white" strokeWidth={2.5} />
          </button>
          <h1 className="admin-title">Edit Store</h1>
        </div>
      </div>

      <form id="edit-store-form" onSubmit={handleSubmit} noValidate className="space-y-8">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-violet-500/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-violet-500/5 dark:border-gray-700">
            <Store className="w-5 h-5 text-violet-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Store Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Store Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={(errors.name ? INPUT_ERROR_CLS : INPUT_CLS) + ' pr-14'}
                  placeholder="My Awesome Store"
                  value={formData.name}
                  onChange={handleNameChange}
                  maxLength={MAX_NAME_LENGTH}
                />
                <span className="absolute right-3 bottom-1 text-xs text-slate-400 dark:text-gray-500 pointer-events-none">{formData.name.length}/{MAX_NAME_LENGTH}</span>
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Currency
              </label>
              <div className="relative">
                <select
                  className={SELECT_CLS}
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="GBP">GBP — British Pound (£)</option>
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
              <span className="px-4 py-3 bg-slate-50 dark:bg-gray-700/50 text-slate-400 dark:text-gray-500 text-sm border-l border-slate-200 dark:border-gray-600 whitespace-nowrap">.localhost:3000</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500">Subdomain is permanent and cannot be changed after creation.</p>
          </div>

          {/* Description */}
          <div className="mt-6 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Description</label>
            <div className="relative">
              <textarea
                className={INPUT_CLS + ' resize-none pr-16'}
                rows={4}
                placeholder="Describe your store..."
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                    setFormData({ ...formData, description: e.target.value });
                  }
                }}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <span className="absolute right-3 bottom-1 text-xs text-slate-400 dark:text-gray-500 pointer-events-none">{formData.description.length}/{MAX_DESCRIPTION_LENGTH}</span>
            </div>
          </div>
        </section>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/stores')}
            className="flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-lg font-bold border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="flex-1 sm:flex-none px-4 sm:px-12 py-3 rounded-lg font-bold bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
