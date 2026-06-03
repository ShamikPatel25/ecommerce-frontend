'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { useFormDraft } from '@/hooks/useFormDraft';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, ChevronDown, Info, List, PlusCircle, X, Loader2,
} from 'lucide-react';
import { useSharedDataStore } from '@/store/sharedDataStore';

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
const SELECT_ERROR_CLS = INPUT_ERROR_CLS + ' appearance-none pr-10';

const MAX_NAME_LENGTH = 50;

export default function CreateAttributePage() {
  const router = useRouter();
  const { fetchCategories, categories } = useSharedDataStore();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData, clearDraft] = useFormDraft('attribute-create', { category: '', name: '' });
  const [values, setValues, clearValuesDraft] = useFormDraft('attribute-create-values', []);
  const [newValue, setNewValue] = useState('');
  const [errors, setErrors] = useState({});

  const fetchCategoriesData = useCallback(async () => {
    await fetchCategories(); // reads from cache if fresh
  }, [fetchCategories]);

  useEffect(() => {
    fetchCategoriesData();
  }, [fetchCategoriesData]);

  const handleBack = () => {
    clearDraft();
    clearValuesDraft();
    router.push('/attributes');
  };

  const addValue = () => {
    const v = newValue.trim();
    if (!v) return;
    if (values.includes(v)) { toast.error('Value already added'); return; }
    setValues([...values, v]);
    setNewValue('');
  };

  const removeValue = (val) => setValues(values.filter(v => v !== val));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addValue(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Attribute name is required' });
      toast.error('Attribute name is required');
      return;
    }
    if (!formData.category) {
      setErrors({ category: 'Please select a category' });
      toast.error('Please select a category');
      return;
    }

    setSubmitting(true);
    try {
      await attributeAPI.create({ ...formData, values });
      toast.success('Attribute created!');
      clearDraft();
      clearValuesDraft();
      router.push('/attributes');
    } catch (error) {
      const d = error.response?.data;
      const status = error.response?.status;

      if (d?.name?.[0]) {
        setErrors({ name: d.name[0] });
        toast.error(d.name[0]);
      } else if (d?.category?.[0]) {
        setErrors({ category: d.category[0] });
        toast.error(d.category[0]);
      } else if (d?.non_field_errors?.[0]) {
        const msg = d.non_field_errors[0];
        if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('already exists')) {
          toast.error('An attribute with this name already exists in this category');
        } else {
          toast.error(msg);
        }
      } else if (d?.detail) {
        const detail = typeof d.detail === 'string' ? d.detail.toLowerCase() : '';
        if (detail.includes('unique') || detail.includes('already exists') || detail.includes('duplicate')) {
          toast.error('An attribute with this name already exists in this category');
        } else {
          toast.error(d.detail);
        }
      } else if (status === 500 || status === 400) {
        const errorStr = JSON.stringify(d || '').toLowerCase();
        if (errorStr.includes('unique') || errorStr.includes('duplicate') || errorStr.includes('already exists')) {
          toast.error('An attribute with this name already exists in this category');
        } else {
          toast.error('An attribute with this name may already exist in this category');
        }
      } else {
        toast.error('Failed to create attribute');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={handleBack} className="hover:text-violet-500 transition-colors">
          Attributes
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Create Attribute</span>
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
          <h1 className="admin-title">Create Attribute</h1>
        </div>
      </div>

      <form id="create-attribute-form" onSubmit={handleSubmit} noValidate className="space-y-8">

        {/* Card 1: Attribute Information */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-violet-500/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-violet-500/5 dark:border-gray-700">
            <Info className="w-5 h-5 text-violet-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attribute Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attribute Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Attribute Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={(errors.name ? INPUT_ERROR_CLS : INPUT_CLS) + ' pr-14'}
                  placeholder="e.g. Size, Color, Material"
                  value={formData.name}
                  maxLength={MAX_NAME_LENGTH}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9- ]/g, '');
                    if (value.length <= MAX_NAME_LENGTH) {
                      setFormData({ ...formData, name: value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }
                  }}
                />
                <span className="absolute right-3 bottom-1 text-xs text-slate-400 dark:text-gray-500 pointer-events-none">{formData.name.length}/{MAX_NAME_LENGTH}</span>
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className={errors.category ? SELECT_ERROR_CLS : SELECT_CLS}
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value });
                    if (errors.category) setErrors({ ...errors, category: null });
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.filter((c) => !c.parent).map((c) => (
                    <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
              </div>
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
            </div>
          </div>
        </section>

        {/* Card 2: Attribute Values */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-violet-500/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-violet-500/5 dark:border-gray-700">
            <List className="w-5 h-5 text-violet-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attribute Values</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Add all possible values for this attribute (e.g. for Size: S, M, L, XL)</p>

          {/* Input row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
              <input
                type="text"
                className="w-full h-12 rounded-lg border border-violet-500/20 bg-violet-500/5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500"
                placeholder="Type a value and press Enter or Add"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value.replace(/[^a-zA-Z0-9- ]/g, ''))}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              type="button"
              onClick={addValue}
              className="h-12 px-8 rounded-lg bg-violet-500 text-white font-bold hover:bg-violet-500/90 transition-all shadow-lg shadow-violet-500/20 whitespace-nowrap"
            >
              Add Value
            </button>
          </div>

          {/* Values list */}
          {values.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {values.map((v) => (
                <div
                  key={v}
                  className="group flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-white shadow-sm hover:shadow-md transition-all"
                >
                  <span className="font-medium text-sm">{v}</span>
                  <button
                    type="button"
                    onClick={() => removeValue(v)}
                    className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 rounded-lg bg-slate-50 dark:bg-gray-700/50 border border-dashed border-slate-200 dark:border-gray-700 text-slate-400 dark:text-gray-500 text-sm">
              No values added yet — you can also add them later from the Attributes list
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
            ) : 'Create Attribute'}
          </button>
        </div>

      </form>
      </div>
    </div>
  );
}
