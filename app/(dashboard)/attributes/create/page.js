'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, ChevronDown, Info, List, PlusCircle, X, Loader2,
} from 'lucide-react';

const INPUT_CLS =
  'w-full rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 py-3 text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-[#ff6600] ' +
  'focus:ring-2 focus:ring-[#ff6600]/20 transition-all ' +
  'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500';

const SELECT_CLS = INPUT_CLS + ' appearance-none pr-10';

export default function CreateAttributePage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [addingValue, setAddingValue] = useState(false);
  const [formData, setFormData] = useState({ category: '', name: '' });
  const [values, setValues] = useState([]);
  const [newValue, setNewValue] = useState('');

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
    if (!formData.category) { toast.error('Please select a category'); return; }
    setSubmitting(true);
    try {
      const res = await attributeAPI.create(formData);
      const attributeId = res.data?.id;
      if (attributeId && values.length > 0) {
        setAddingValue(true);
        try {
          await attributeAPI.addBulkValues(attributeId, values);
        } catch {
          for (const v of values) {
            try { await attributeAPI.addValue(attributeId, v); } catch { }
          }
        }
      }
      toast.success('Attribute created!');
      router.push('/attributes');
    } catch (error) {
      toast.error(error.response?.data?.name?.[0] || 'Something went wrong');
    } finally {
      setSubmitting(false);
      setAddingValue(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/attributes')} className="hover:text-[#ff6600] transition-colors">
          Attributes
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Create Attribute</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create Attribute</h1>
        <button
          type="button"
          onClick={() => router.push('/attributes')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attributes
        </button>
      </div>

      <form id="create-attribute-form" onSubmit={handleSubmit} className="space-y-8">

        {/* Card 1: Attribute Information */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
            <Info className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attribute Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attribute Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Attribute Name <span className="text-[#ff6600]">*</span>
              </label>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="e.g. Size, Color, Material"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Category <span className="text-[#ff6600]">*</span>
              </label>
              <div className="relative">
                <select
                  className={SELECT_CLS}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Attribute Values */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
            <List className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attribute Values</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Add all possible values for this attribute (e.g. for Size: S, M, L, XL)</p>

          {/* Input row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
              <input
                type="text"
                className="w-full h-12 rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500"
                placeholder="Type a value and press Enter or Add"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              type="button"
              onClick={addValue}
              className="h-12 px-8 rounded-lg bg-[#ff6600] text-white font-bold hover:bg-[#ff6600]/90 transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap"
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
                  className="group flex items-center gap-2 rounded-lg bg-[#ff6600] px-4 py-2 text-white shadow-sm hover:shadow-md transition-all"
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
            onClick={() => router.push('/attributes')}
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
            ) : 'Create Attribute'}
          </button>
        </div>

      </form>
    </div>
  );
}
