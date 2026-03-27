'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, ChevronDown, Info, Loader2, FolderTree,
} from 'lucide-react';

const INPUT_CLS =
  'w-full rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#ff6600] ' +
  'focus:ring-2 focus:ring-[#ff6600]/20 transition-all dark:bg-gray-700 dark:border-gray-600';

const SELECT_CLS = INPUT_CLS + ' appearance-none pr-10';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', parent: '' });

  const fetchData = useCallback(async () => {
    try {
      const [catRes, allRes] = await Promise.all([
        categoryAPI.get(categoryId),
        categoryAPI.list(),
      ]);
      const c = catRes.data;
      setFormData({
        name: c.name || '',
        slug: c.slug || '',
        parent: c.parent ? String(c.parent) : '',
      });
      const all = allRes.data;
      setCategories(Array.isArray(all) ? all : (all?.results || []));
    } catch {
      toast.error('Failed to load category');
      router.push('/categories');
    } finally {
      setLoading(false);
    }
  }, [categoryId, router]);

  useEffect(() => {
    fetchData();
  }, [categoryId, fetchData]);

  const generateSlug = (name) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await categoryAPI.update(categoryId, { ...formData, parent: formData.parent || null });
      toast.success('Category updated!');
      router.push('/categories');
    } catch (error) {
      toast.error(error.response?.data?.name?.[0] || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin" />
    </div>
  );

  const parentOptions = categories.filter(c => String(c.id) !== categoryId && c.level < 2);

  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/categories')} className="hover:text-[#ff6600] transition-colors">
          Categories
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">{formData.name}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Edit Category</h1>
        <button
          type="button"
          onClick={() => router.push('/categories')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Categories
        </button>
      </div>

      <form id="edit-category-form" onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
            <Info className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Category Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Name <span className="text-[#ff6600]">*</span>
              </label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Slug <span className="text-[#ff6600]">*</span>
              </label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
              <p className="text-xs text-slate-400 dark:text-gray-500">Auto-generated from name</p>
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
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'  '.repeat(c.level)} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500">Leave empty to make this a top-level category</p>
          </div>

          {/* Level preview */}
          {formData.parent && (
            <div className="mt-4 p-4 bg-[#ff6600]/5 border border-[#ff6600]/20 rounded-xl flex items-start gap-2">
              <FolderTree className="w-4 h-4 text-[#ff6600] mt-0.5 shrink-0" />
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
            onClick={() => router.push('/categories')}
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
