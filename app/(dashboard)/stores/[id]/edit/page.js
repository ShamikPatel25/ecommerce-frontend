'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { storeAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Store, ImagePlus, Globe,
  Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';

const TABS = ['General', 'Branding'];

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
];

export default function EditStorePage() {
  const router  = useRouter();
  const params  = useParams();
  const storeId = params.id;

  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [activeTab,     setActiveTab]     = useState('General');
  const [formData,      setFormData]      = useState({
    name:        '',
    subdomain:   '',
    description: '',
    currency:    'USD',
    is_active:   true,
  });
  const [logoPreview,   setLogoPreview]   = useState(null);
  const logoInputRef = useRef(null);

  const set = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  /* ── data ── */
  const fetchStore = useCallback(async () => {
    try {
      const { data: s } = await storeAPI.get(storeId);
      const snapshot = {
        name:        s.name        || '',
        subdomain:   s.subdomain   || '',
        description: s.description || '',
        currency:    s.currency    || 'USD',
        is_active:   s.is_active   ?? true,
      };
      setFormData(snapshot);
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

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  /* ── loading ── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin" />
    </div>
  );

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <form id="store-settings-form" onSubmit={handleSubmit}>

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 border-b border-[#ff6600]/10 dark:border-gray-700 px-4 md:px-10 pt-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            {/* Title block */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#ff6600]/10 flex items-center justify-center shrink-0">
                <Store className="w-6 h-6 text-[#ff6600]" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {formData.name || 'Store Settings'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                  <span className="text-sm text-slate-500 dark:text-gray-400">
                    {formData.subdomain}.myplatform.com
                  </span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      formData.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Back button */}
            <button
              type="button"
              onClick={() => router.push('/stores')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Stores
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#ff6600] text-[#ff6600]'
                    : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 hover:border-slate-300 dark:hover:border-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: General ─────────────────────────────────────────── */}
        {activeTab === 'General' && (
          <div className="max-w-5xl mx-auto px-4 md:px-10 py-8 space-y-6">

            {/* Card: Identity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ff6600]/5 dark:border-gray-700">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Store Identity</h2>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Your public-facing name and web address</p>
              </div>
              <div className="p-6 space-y-5">

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    Store Name <span className="text-[#ff6600]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Minimalist Home Decor"
                    className="w-full px-4 py-3 rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 text-slate-900 text-sm focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500"
                    value={formData.name}
                    onChange={set('name')}
                    required
                  />
                </div>

                {/* Subdomain */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    Store URL
                  </label>
                  <div className="flex items-stretch rounded-lg border border-slate-200 dark:border-gray-600 overflow-hidden bg-slate-50 dark:bg-gray-700/50">
                    <span className="flex items-center px-3 bg-slate-100 dark:bg-gray-600 border-r border-slate-200 dark:border-gray-500 text-slate-400 dark:text-gray-400 text-sm font-mono select-none">
                      https://
                    </span>
                    <span className="flex-1 px-4 py-2.5 text-slate-600 dark:text-gray-300 text-sm font-mono truncate">
                      {formData.subdomain}
                    </span>
                    <span className="flex items-center px-4 bg-slate-50 dark:bg-gray-700/50 border-l border-slate-200 dark:border-gray-500 text-slate-400 dark:text-gray-500 text-sm whitespace-nowrap">
                      .myplatform.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-1.5">
                    Subdomain is permanent and cannot be changed after creation.
                  </p>
                </div>
              </div>
            </div>

            {/* Card: Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ff6600]/5 dark:border-gray-700">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Configuration</h2>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Currency and store availability</p>
              </div>
              <div className="p-6 space-y-5">

                {/* Currency + Status row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Currency */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                      Default Currency
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 text-slate-900 text-sm focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.currency}
                      onChange={set('currency')}
                    >
                      {CURRENCIES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                      Store Status
                    </label>
                    <div
                      onClick={() =>
                        setFormData((p) => ({ ...p, is_active: !p.is_active }))
                      }
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
                      {/* Toggle pill */}
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
                </div>
              </div>
            </div>

            {/* Card: Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ff6600]/5 dark:border-gray-700">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Store Description</h2>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Shown to customers on your storefront</p>
              </div>
              <div className="p-6">
                <textarea
                  rows={5}
                  placeholder="Describe what makes your store unique — products you sell, your brand story, shipping regions, etc."
                  className="w-full px-4 py-3 rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 text-slate-900 text-sm focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] outline-none transition-all resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500"
                  value={formData.description}
                  onChange={set('description')}
                />
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1.5">
                  {formData.description.length} / 500 characters
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Branding ─────────────────────────────────────────── */}
        {activeTab === 'Branding' && (
          <div className="max-w-5xl mx-auto px-4 md:px-10 py-8 space-y-6">

            {/* Card: Store Logo */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ff6600]/5 dark:border-gray-700">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Store Logo</h2>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Appears in your storefront header and emails</p>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">

                  {/* Preview */}
                  <div className="shrink-0 w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-gray-500">
                        <ImagePlus className="w-8 h-8" />
                        <span className="text-xs">No logo</span>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Upload a logo</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500">
                        Recommended: 512×512 px square. JPG, PNG, or SVG.
                        Max file size 2 MB.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoSelect}
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-5 py-2 text-sm font-bold text-white bg-[#ff6600] rounded-lg hover:bg-[#ff6600]/90 transition-colors shadow-sm"
                      >
                        Choose file
                      </button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview(null);
                            if (logoInputRef.current) logoInputRef.current.value = '';
                          }}
                          className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-gray-700 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {logoPreview && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-sm text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        New logo selected — click Save Settings to apply.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Brand Colors (placeholder for future) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ff6600]/5 dark:border-gray-700">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Brand Color</h2>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Primary accent color used across your storefront</p>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-white shadow-md"
                    style={{ backgroundColor: '#ff6600' }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">#ff6600</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500">Platform default</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                    Coming soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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
