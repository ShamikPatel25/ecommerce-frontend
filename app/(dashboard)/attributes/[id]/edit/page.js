'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { useFormDraft } from '@/hooks/useFormDraft';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import {
  ChevronLeft, ChevronRight, Info, List, PlusCircle,
  ChevronDown, X, Undo2, Loader2,
} from 'lucide-react';
import { useSharedDataStore } from '@/store/sharedDataStore';

const INPUT_CLS =
  'w-full h-12 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 text-slate-900 ' +
  'focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all ' +
  'dark:bg-gray-700 dark:border-gray-600 dark:text-white';

const INPUT_ERROR_CLS =
  'w-full h-12 rounded-lg border border-red-500 bg-red-50 px-4 text-slate-900 ' +
  'focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all ' +
  'dark:bg-red-900/20 dark:border-red-500 dark:text-white';

const SELECT_CLS = INPUT_CLS + ' pr-10 appearance-none';
const SELECT_ERROR_CLS = INPUT_ERROR_CLS + ' pr-10 appearance-none';

const MAX_NAME_LENGTH = 50;

export default function EditAttributePage() {
  const router      = useRouter();
  const params      = useParams();
  const attributeId = params.id;

  const [loading,      setLoading]      = useState(true);
  const [attribute,    setAttribute]    = useState(null);
  const [saving,       setSaving]       = useState(false);
  const { fetchCategories, categories } = useSharedDataStore();
  const [newValue,     setNewValue]     = useState('');
  const [formData,     setFormData, clearDraft]     = useFormDraft(`attribute-edit-${attributeId}`, { name: '', category: '' });
  const [originalData, setOriginalData] = useState(null);
  const [pendingDeletes, setPendingDeletes] = useState(new Set());
  const [pendingAdds,    setPendingAdds]    = useState([]);
  const [confirmDialog,  setConfirmDialog]  = useState(null);
  const [errors, setErrors] = useState({});  

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    try {
      const [attrRes] = await Promise.all([
        attributeAPI.get(attributeId),
        fetchCategories(), // reads from cache if fresh, no extra network call
      ]);
      const a = attrRes.data;
      setAttribute(a);
      const initialData = { name: a.name || '', category: String(a.category || '') };
      setFormData(initialData);
      setOriginalData(initialData);
    } catch {
      toast.error('Failed to load attribute');
      router.push('/attributes');
    } finally {
      setLoading(false);
    }
  }, [attributeId, router, setFormData, fetchCategories]);

  useEffect(() => {
    fetchData();
  }, [attributeId, fetchData]);

  /* ── deletion staging ── */
  const requestDeleteValue = (id, name, isNew = false) => setConfirmDialog({ id, name, isNew });

  const confirmDeleteValue = () => {
    if (!confirmDialog) return;
    if (confirmDialog.isNew) {
      setPendingAdds((prev) => prev.filter((a) => a.tempId !== confirmDialog.id));
    } else {
      setPendingDeletes((prev) => new Set([...prev, confirmDialog.id]));
    }
    setConfirmDialog(null);
  };

  const undoPendingDelete = (id) => {
    setPendingDeletes((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /* ── save ── */
  const handleSave = async (e) => {
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

    setSaving(true);
    try {
      await attributeAPI.update(attributeId, formData);

      let deleteErrors = [];
      let addErrors = [];

      // Delete pending values
      if (pendingDeletes.size > 0) {
        const deletePromises = [...pendingDeletes].map(async (valueId) => {
          try {
            await attributeAPI.deleteValue(attributeId, valueId);
            return { success: true, valueId };
          } catch (err) {
            return { success: false, valueId, error: err.response?.data?.detail || err.response?.data?.error || 'Delete failed' };
          }
        });
        const deleteResults = await Promise.all(deletePromises);
        deleteErrors = deleteResults.filter(r => !r.success);
      }

      // Add pending new values
      if (pendingAdds.length > 0) {
        const addPromises = pendingAdds.map(async (item) => {
          try {
            await attributeAPI.addValue(attributeId, item.value);
            return { success: true, value: item.value };
          } catch (err) {
            return { success: false, value: item.value, error: err.response?.data?.detail || 'Add failed' };
          }
        });
        const addResults = await Promise.all(addPromises);
        addErrors = addResults.filter(r => !r.success);
      }

      // Show errors if any
      if (deleteErrors.length > 0) {
        toast.error(deleteErrors[0].error);
      }
      if (addErrors.length > 0) {
        toast.error(addErrors[0].error);
      }

      // Clear pending states
      setPendingDeletes(new Set());
      setPendingAdds([]);

      if (deleteErrors.length === 0 && addErrors.length === 0) {
        toast.success('Attribute saved!');
      }

      clearDraft();
      // Refresh attribute data
      const res = await attributeAPI.get(attributeId);
      setAttribute(res.data);
      const updatedData = { name: res.data.name || '', category: String(res.data.category || '') };
      setFormData(updatedData);
      setOriginalData(updatedData);
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
        toast.error('Failed to save attribute');
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── add value (local only, saved on Save Changes) ── */
  const handleAddValue = () => {
    const v = newValue.trim();
    if (!v) return;
    // Check for duplicates in existing values and pending adds
    const existingValues = (attribute?.values || []).map((val) => val.value.toLowerCase());
    const pendingValues = pendingAdds.map((a) => a.value.toLowerCase());
    if (existingValues.includes(v.toLowerCase()) || pendingValues.includes(v.toLowerCase())) {
      toast.error(`"${v}" already exists`);
      return;
    }
    setPendingAdds((prev) => [...prev, { tempId: `new-${Date.now()}`, value: v }]);
    setNewValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddValue(); }
  };

  /* ── cancel ── */
  const handleCancel = () => {
    setPendingDeletes(new Set());
    setPendingAdds([]);
    router.push('/attributes');
  };

  /* ── loading ── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
    </div>
  );

  if (!attribute) return null;

  const rootCategories = categories.filter((c) => !c.parent);
  const pendingCount = pendingDeletes.size;
  const pendingAddCount = pendingAdds.length;
  const hasChanges = originalData && (
    formData.name !== originalData.name ||
    formData.category !== originalData.category ||
    pendingCount > 0 ||
    pendingAddCount > 0
  );

  /* ──────────────────────────────────────────────────────────────── */
  return (
    <div className="admin-page">
      <div className="admin-container">

      {/* ── Breadcrumbs ─────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-6">
        <button
          onClick={() => router.push('/attributes')}
          className="hover:text-violet-500 transition-colors"
        >
          Attributes
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">{attribute.name}</span>
      </nav>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push('/attributes')}
            className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 hover:text-violet-500 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-7 h-7 text-slate-900 dark:text-white" strokeWidth={2.5} />
          </button>
          <h1 className="admin-title">Edit Attribute</h1>
        </div>
      </div>

      {/* ── Attribute Information ────────────────────────────────── */}
      <section className="rounded-xl border border-violet-500/10 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-violet-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attribute Information</h2>
        </div>

        <form id="edit-attribute-form" onSubmit={handleSave} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Attribute Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={(errors.name ? INPUT_ERROR_CLS : INPUT_CLS) + ' pr-14'}
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
                  {rootCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
              </div>
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
            </div>
          </div>
        </form>
      </section>

      {/* ── Attribute Values ─────────────────────────────────────── */}
      <section className="rounded-xl border border-violet-500/10 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm">

        {/* Section header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attribute Values</h2>
          </div>
        </div>

        {/* Add value */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Add value (e.g. XL, Red, 10oz)"
              className="w-full h-12 rounded-lg border border-violet-500/20 bg-violet-500/5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value.replace(/[^a-zA-Z0-9- ]/g, ''))}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            type="button"
            disabled={!newValue.trim()}
            onClick={handleAddValue}
            className="h-12 px-8 rounded-lg bg-violet-500 text-white font-bold hover:bg-violet-500/90 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20 whitespace-nowrap"
          >
            Add Value
          </button>
        </div>

        {/* Current values */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
            Current Values
          </label>

          {(attribute.values?.length > 0 || pendingAdds.length > 0) ? (
            <>
              <div className="flex flex-wrap gap-3">
                {attribute.values.map((v) => {
                  const isPending = pendingDeletes.has(v.id);
                  return isPending ? (
                    /* Pending deletion chip */
                    <div
                      key={v.id}
                      className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-500 line-through italic"
                    >
                      <span className="font-medium text-sm">{v.value}</span>
                      <button
                        type="button"
                        onClick={() => undoPendingDelete(v.id)}
                        title="Undo deletion"
                        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-red-500/20 transition-colors"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Active chip */
                    <div
                      key={v.id}
                      className="group flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-white shadow-sm hover:shadow-md transition-all"
                    >
                      <span className="font-medium text-sm">{v.value}</span>
                      <button
                        type="button"
                        onClick={() => requestDeleteValue(v.id, v.value)}
                        title="Mark for deletion"
                        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {/* Pending add chips */}
                {pendingAdds.map((a) => (
                  <div
                    key={a.tempId}
                    className="group flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white shadow-sm hover:shadow-md transition-all"
                  >
                    <span className="font-medium text-sm">{a.value}</span>
                    <button
                      type="button"
                      onClick={() => requestDeleteValue(a.tempId, a.value, true)}
                      title="Remove"
                      className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Status line */}
              <p className="text-xs text-slate-400 dark:text-gray-500 pt-1">
                <span className="text-slate-600 dark:text-gray-300 font-medium">
                  {(attribute.values?.length ?? 0) - pendingCount}
                </span> active
                {pendingAddCount > 0 && (
                  <>
                    {' · '}
                    <span className="text-green-600 dark:text-green-400 font-medium">{pendingAddCount}</span> new (unsaved)
                  </>
                )}
                {pendingCount > 0 && (
                  <>
                    {' · '}
                    <span className="text-red-500 dark:text-red-400 font-medium">{pendingCount}</span> pending deletion
                  </>
                )}
                {(pendingCount > 0 || pendingAddCount > 0) && (
                  <>
                    {' · '}
                    <span className="text-slate-500 dark:text-gray-400">click Save Changes to apply</span>
                  </>
                )}
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center py-10 rounded-lg bg-slate-50 dark:bg-gray-700/50 border border-dashed border-slate-200 dark:border-gray-700 text-slate-400 dark:text-gray-500 text-sm">
              No values yet — add the first one above
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom Action Buttons ─────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-lg font-bold border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="edit-attribute-form"
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

      {/* ── Deletion Confirm Modal ───────────────────────────────── */}
      <ConfirmDeleteModal
        open={!!confirmDialog}
        title="Delete Value?"
        itemName={confirmDialog?.name}
        description="The value won't be permanently removed until you click Save Changes."
        onCancel={() => setConfirmDialog(null)}
        onConfirm={confirmDeleteValue}
      />
      </div>
    </div>
  );
}
