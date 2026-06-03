'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { categoryAPI } from '@/lib/api';
import { useFormDraft } from '@/hooks/useFormDraft';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, ChevronDown, Info, Loader2, FolderTree,
} from 'lucide-react';
import { useStoreStore } from '@/store/storeStore';
import { useDashboardStore } from '@/store/dashboardStore';

const INPUT_CLS =
  'w-full rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500 ' +
  'focus:ring-2 focus:ring-violet-500/20 transition-all dark:bg-gray-700 dark:border-gray-600';

const INPUT_ERROR_CLS =
  'w-full rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-red-500 ' +
  'focus:ring-2 focus:ring-red-500/20 transition-all dark:bg-red-900/20 dark:border-red-500';

const SELECT_CLS = INPUT_CLS + ' appearance-none pr-10';
const SELECT_ERROR_CLS = INPUT_ERROR_CLS + ' appearance-none pr-10';

const MAX_NAME_LENGTH = 50;
const MAX_SLUG_LENGTH = 50;

export default function CreateCategoryPage() {
  const router = useRouter();
  const { activeStore } = useStoreStore();
  const invalidateDashboard = useDashboardStore((s) => s.invalidate);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData, clearDraft] = useFormDraft('category-create', { name: '', slug: '', parent: '' });
  const [errors, setErrors] = useState({});

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryAPI.list();
      const data = res.data;
      setCategories(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      toast.error('Failed to load categories');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleBack = () => {
    clearDraft();
    router.push('/categories');
  };

  const generateSlug = (name) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Category name is required' });
      toast.error('Category name is required');
      return;
    }
    if (/[_\-=+.,!@#$%^&*()[\]{}|\\;:'\"<>?/`~]/.test(formData.name)) {
      setErrors({ name: 'Special characters are not allowed' });
      toast.error('Special characters are not allowed in category name');
      return;
    }
    if (!formData.slug.trim()) {
      setErrors({ slug: 'Slug is required' });
      toast.error('Slug is required');
      return;
    }

    setSubmitting(true);
    try {
      await categoryAPI.create({ ...formData, parent: formData.parent || null });
      toast.success('Category created!');
      clearDraft();
      invalidateDashboard(activeStore?.id);
      router.push('/categories');
    } catch (error) {
      const d = error.response?.data;
      if (d?.name?.[0]) {
        setErrors({ name: d.name[0] });
        toast.error(d.name[0]);
      } else if (d?.slug?.[0]) {
        setErrors({ slug: d.slug[0] });
        toast.error(d.slug[0]);
      } else {
        const msg = d?.parent?.[0] || d?.non_field_errors?.[0] || 'Something went wrong';
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const mainCategories = categories.filter(c => c.level < 2);

  return (
    <div className="admin-page">
      <div className="admin-container">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={handleBack} className="hover:text-violet-500 transition-colors">
          Categories
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Create Category</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 hover:text-violet-500 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-7 h-7 text-slate-900 dark:text-white" strokeWidth={2.5} />
          </button>
          <h1 className="admin-title">Create Category</h1>
        </div>
      </div>

      <form id="create-category-form" onSubmit={handleSubmit} noValidate className="space-y-8">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-violet-500/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-violet-500/5 dark:border-gray-700">
            <Info className="w-5 h-5 text-violet-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Category Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={(errors.name ? INPUT_ERROR_CLS : INPUT_CLS) + ' pr-14'}
                  placeholder="e.g. Clothes, Electronics"
                  value={formData.name}
                  maxLength={MAX_NAME_LENGTH}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
                    if (value.length <= MAX_NAME_LENGTH) {
                      setFormData({ ...formData, name: value, slug: generateSlug(value) });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }
                  }}
                />
                <span className="absolute right-3 bottom-1 text-xs text-slate-400 dark:text-gray-500 pointer-events-none">{formData.name.length}/{MAX_NAME_LENGTH}</span>
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* URL Handle */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                URL Handle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={(errors.slug ? INPUT_ERROR_CLS : INPUT_CLS) + ' pr-14'}
                  placeholder="auto-generated"
                  value={formData.slug}
                  maxLength={MAX_SLUG_LENGTH}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= MAX_SLUG_LENGTH) {
                      setFormData({ ...formData, slug: value });
                      if (errors.slug) setErrors({ ...errors, slug: null });
                    }
                  }}
                />
                <span className="absolute right-3 bottom-1 text-xs text-slate-400 dark:text-gray-500 pointer-events-none">{formData.slug.length}/{MAX_SLUG_LENGTH}</span>
              </div>
              {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
            </div>
          </div>

          {/* Parent Category */}
          <div className="mt-6 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Parent Category</label>
            <div className="relative">
              <select
                className={SELECT_CLS}
                value={formData.parent}
                onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
              >
                <option value="">None (Main Category)</option>
                {mainCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'  '.repeat(c.level)} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500">Leave empty to create a top-level category</p>
          </div>

          {/* Level preview */}
          {formData.parent && (
            <div className="mt-4 p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl flex items-start gap-2">
              <FolderTree className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-700 dark:text-gray-300">
                This will be a <strong>sub-category</strong> of <strong>{categories.find(c => String(c.id) === String(formData.parent))?.name}</strong>
              </p>
            </div>
          )}
        </section>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-lg font-bold border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 sm:flex-none px-4 sm:px-12 py-3 rounded-lg font-bold bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </span>
            ) : 'Create Category'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
