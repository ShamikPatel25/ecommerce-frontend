'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storeAPI } from '@/lib/api';
import { useStoreStore } from '@/store/storeStore';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, ChevronDown, Loader2, Store,
} from 'lucide-react';
import { getStoreUrl } from '@/lib/subdomain';

const INPUT_CLS =
  'w-full rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 py-3 text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-[#ff6600] ' +
  'focus:ring-2 focus:ring-[#ff6600]/20 transition-all ' +
  'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500';

const SELECT_CLS = INPUT_CLS + ' appearance-none pr-10';

export default function CreateStorePage() {
  const router = useRouter();
  const { setActiveStore, setStores } = useStoreStore();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: '',
    currency: 'USD',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await storeAPI.create(formData);
      const newStore = res.data?.store || res.data;
      toast.success('Store created!');
      // Set as active store and refresh stores list
      if (newStore?.id) {
        const storesRes = await storeAPI.myStores();
        const storeList = storesRes.data?.stores || storesRes.data || [];
        setStores(storeList);
        setActiveStore(newStore);
      }
      // Stay in admin panel — go to dashboard
      router.push('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.subdomain?.[0] || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/stores')} className="hover:text-[#ff6600] transition-colors">
          Stores
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Create Store</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create Store</h1>
        <button
          type="button"
          onClick={() => router.push('/stores')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stores
        </button>
      </div>

      <form id="create-store-form" onSubmit={handleSubmit} className="space-y-8">
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

          {/* Subdomain */}
          <div className="mt-6 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
              Subdomain <span className="text-[#ff6600]">*</span>
            </label>
            <div className="flex items-center rounded-lg border border-[#ff6600]/20 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-[#ff6600]/20 focus-within:border-[#ff6600]">
              <input
                type="text"
                className="flex-1 px-4 py-3 bg-[#ff6600]/5 dark:bg-gray-700 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 min-w-0"
                placeholder="mystore"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                required
              />
              <span className="px-4 py-3 bg-slate-50 dark:bg-gray-700/50 text-slate-400 dark:text-gray-500 text-sm border-l border-[#ff6600]/10 dark:border-gray-600 whitespace-nowrap">.localhost:3000</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500">Only lowercase letters, numbers and hyphens</p>
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
            disabled={submitting}
            className="px-12 py-3 rounded-lg font-bold bg-[#ff6600] text-white shadow-lg shadow-orange-500/30 hover:bg-[#ff6600]/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </span>
            ) : 'Create Store'}
          </button>
        </div>
      </form>
    </div>
  );
}
