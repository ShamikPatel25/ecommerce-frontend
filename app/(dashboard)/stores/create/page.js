'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storeAPI } from '@/lib/api';
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
const MAX_SUBDOMAIN_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 300;
const MIN_LENGTH = 3;

export default function CreateStorePage() {
  const router = useRouter();
  const { setActiveStore, setStores } = useStoreStore();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: '',
    currency: 'INR',
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

  const validateSubdomain = (subdomain) => {
    if (!subdomain || !subdomain.trim()) {
      return 'Subdomain is required';
    }
    // Count only letters and numbers (not underscores)
    const alphanumericCount = subdomain.replace(/_/g, '').length;
    if (alphanumericCount < MIN_LENGTH) {
      return `Subdomain must have at least ${MIN_LENGTH} letters or numbers`;
    }
    if (subdomain.length > MAX_SUBDOMAIN_LENGTH) {
      return `Subdomain cannot exceed ${MAX_SUBDOMAIN_LENGTH} characters`;
    }
    if (!/^[a-z0-9_]+$/.test(subdomain)) {
      return 'Subdomain can only contain lowercase letters, numbers, and underscores';
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

  const handleSubdomainChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (value.length <= MAX_SUBDOMAIN_LENGTH) {
      setFormData({ ...formData, subdomain: value });
      if (errors.subdomain) {
        setErrors({ ...errors, subdomain: null });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (submitting) return;

    const nameError = validateStoreName(formData.name);
    const subdomainError = !nameError ? validateSubdomain(formData.subdomain) : null;

    if (nameError) {
      setErrors({ name: nameError });
      toast.error(nameError);
      return;
    }

    if (subdomainError) {
      setErrors({ subdomain: subdomainError });
      toast.error(subdomainError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await storeAPI.create(formData);
      const newStore = res.data?.store || res.data;
      toast.success('Store created successfully!');
      if (newStore?.id) {
        const storesRes = await storeAPI.myStores();
        const storeList = storesRes.data?.stores || storesRes.data || [];
        setStores(storeList);
        setActiveStore(newStore);
      }
      router.push('/stores');
    } catch (error) {
      const errData = error.response?.data;
      let errorMsg = 'Failed to create store. Please try again.';

      if (errData) {
        if (errData.subdomain?.[0]) {
          errorMsg = errData.subdomain[0];
          setErrors({ subdomain: errData.subdomain[0] });
        } else if (errData.name?.[0]) {
          errorMsg = errData.name[0];
          setErrors({ name: errData.name[0] });
        } else if (errData.detail) {
          errorMsg = errData.detail;
        } else if (errData.non_field_errors?.[0]) {
          errorMsg = errData.non_field_errors[0];
        }
      }
      toast.error(errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/stores')} className="hover:text-violet-500 transition-colors">
          Stores
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Create Store</span>
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
          <h1 className="admin-title">Create Store</h1>
        </div>
      </div>

      <form id="create-store-form" onSubmit={handleSubmit} className="space-y-8">
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
              <input
                type="text"
                className={errors.name ? INPUT_ERROR_CLS : INPUT_CLS}
                placeholder="My Awesome Store"
                value={formData.name}
                onChange={handleNameChange}
                maxLength={MAX_NAME_LENGTH}
              />
              <div className="flex items-center justify-between">
                {errors.name ? (
                  <p className="text-xs text-red-500">{errors.name}</p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-gray-500">Min {MIN_LENGTH} characters, no special characters</p>
                )}
                <span className="text-xs text-slate-400 dark:text-gray-500">{formData.name.length}/{MAX_NAME_LENGTH}</span>
              </div>
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

          {/* Subdomain */}
          <div className="mt-6 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
              Subdomain <span className="text-red-500">*</span>
            </label>
            <div className={`flex items-center rounded-lg border overflow-hidden focus-within:ring-2 transition-all ${
              errors.subdomain
                ? 'border-red-500 focus-within:ring-red-500/20 focus-within:border-red-500'
                : 'border-violet-500/20 dark:border-gray-600 focus-within:ring-violet-500/20 focus-within:border-violet-500'
            }`}>
              <input
                type="text"
                className={`flex-1 px-4 py-3 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 min-w-0 ${
                  errors.subdomain
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-violet-500/5 dark:bg-gray-700'
                }`}
                placeholder="mystore"
                value={formData.subdomain}
                onChange={handleSubdomainChange}
                maxLength={MAX_SUBDOMAIN_LENGTH}
              />
              <span className="px-4 py-3 bg-slate-50 dark:bg-gray-700/50 text-slate-400 dark:text-gray-500 text-sm border-l border-violet-500/10 dark:border-gray-600 whitespace-nowrap">.localhost:3000</span>
            </div>
            <div className="flex items-center justify-between">
              {errors.subdomain ? (
                <p className="text-xs text-red-500">{errors.subdomain}</p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-gray-500">Lowercase letters, numbers and underscores only</p>
              )}
              <span className="text-xs text-slate-400 dark:text-gray-500">{formData.subdomain.length}/{MAX_SUBDOMAIN_LENGTH}</span>
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
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                  setFormData({ ...formData, description: e.target.value });
                }
              }}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <div className="flex justify-end">
              <span className="text-xs text-slate-400 dark:text-gray-500">{formData.description.length}/{MAX_DESCRIPTION_LENGTH}</span>
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
            disabled={submitting}
            className="flex-1 sm:flex-none px-4 sm:px-12 py-3 rounded-lg font-bold bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </span>
            ) : 'Create Store'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
