'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { useFormDraft } from '@/hooks/useFormDraft';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import {
  ArrowLeft, ChevronRight, Info, List, PlusCircle,
  ChevronDown, X, Undo2, Loader2,
} from 'lucide-react';

export default function EditAttributePage() {
  const router      = useRouter();
  const params      = useParams();
  const attributeId = params.id;

  const [loading,      setLoading]      = useState(true);
  const [attribute,    setAttribute]    = useState(null);
  const [categories,   setCategories]   = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [newValue,     setNewValue]     = useState('');
  const [formData,     setFormData, clearDraft]     = useFormDraft(`attribute-edit-${attributeId}`, { name: '', category: '' });
  const [pendingDeletes, setPendingDeletes] = useState(new Set());
  const [pendingAdds,    setPendingAdds]    = useState([]);
  const [confirmDialog,  setConfirmDialog]  = useState(null);  

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    try {
      const [attrRes, catRes] = await Promise.all([
        attributeAPI.get(attributeId),
        categoryAPI.list(),
      ]);
      const a = attrRes.data;
      setAttribute(a);
      setFormData({ name: a.name || '', category: String(a.category || '') });
      const catData = catRes.data;
      const all = Array.isArray(catData) ? catData : (catData?.results || []);
      // Only show root categories — attributes belong to root categories
      setCategories(all.filter((c) => !c.parent));
    } catch {
      toast.error('Failed to load attribute');
      router.push('/attributes');
    } finally {
      setLoading(false);
    }
  }, [attributeId, router]);

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
    setSaving(true);
    try {
      await attributeAPI.update(attributeId, formData);
      // Delete pending values
      if (pendingDeletes.size > 0) {
        const deleteResults = await Promise.allSettled(
          [...pendingDeletes].map((id) =>
            attributeAPI.deleteValue(attributeId, id)
          )
        );
        const failedDeletes = deleteResults.filter(r => r.status === 'rejected');
        if (failedDeletes.length > 0) {
          const errorMsg = failedDeletes[0].reason?.response?.data?.detail || 'Some values could not be deleted because they are in use by products.';
          toast.error(errorMsg);
        }
        setPendingDeletes(new Set());
      }
      // Add pending new values
      if (pendingAdds.length > 0) {
        await Promise.all(
          pendingAdds.map((a) =>
            attributeAPI.addValue(attributeId, a.value).catch(() => null)
          )
        );
        setPendingAdds([]);
      }
      toast.success('Attribute saved!');
      clearDraft();
      const res = await attributeAPI.get(attributeId);
      setAttribute(res.data);
    } catch (error) {
      toast.error(error.response?.data?.name?.[0] || 'Failed to save');
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

  const getCategoryName = (catId) =>
    categories.find((c) => String(c.id) === String(catId))?.name || '';

  /* ── loading ── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin" />
    </div>
  );

  if (!attribute) return null;

  const pendingCount = pendingDeletes.size;
  const pendingAddCount = pendingAdds.length;
  const hasChanges = pendingCount > 0 || pendingAddCount > 0 || formData.name !== (attribute?.name || '') || formData.category !== String(attribute?.category || '');

  /* ──────────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* ── Breadcrumbs ─────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-6">
        <button
          onClick={() => router.push('/attributes')}
          className="hover:text-[#ff6600] transition-colors"
        >
          Attributes
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">{attribute.name}</span>
      </nav>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Edit Attribute</h1>
          <p className="mt-2 text-slate-500 dark:text-gray-400 text-sm">
            Configure global product attributes like color, size, or material used across your store.
          </p>
        </div>
        <button
          onClick={() => router.push('/attributes')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attributes
        </button>
      </div>

      {/* ── Attribute Information ────────────────────────────────── */}
      <section className="rounded-xl border border-[#ff6600]/10 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-[#ff6600]" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attribute Information</h2>
        </div>

        <form id="edit-attribute-form" onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Attribute Name</label>
              <input
                type="text"
                required
                className="w-full h-12 rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 text-slate-900 focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-slate-400 dark:text-gray-500">The public label shown to customers.</p>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Category</label>
              <div className="relative">
                <select
                  className="w-full h-12 rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 pr-10 appearance-none text-slate-900 focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-500">Used for filtering and organization.</p>
            </div>
          </div>
        </form>
      </section>

      {/* ── Attribute Values ─────────────────────────────────────── */}
      <section className="rounded-xl border border-[#ff6600]/10 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm">

        {/* Section header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attribute Values</h2>
          </div>
          {(pendingCount > 0 || pendingAddCount > 0) && (
            <div className="flex items-center gap-3">
              {pendingAddCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1 text-xs font-bold text-green-600 dark:text-green-400">
                  <PlusCircle className="w-3 h-3" />
                  {pendingAddCount} NEW
                </div>
              )}
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400">
                  <X className="w-3 h-3" />
                  {pendingCount} PENDING DELETION{pendingCount > 1 ? 'S' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add value */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Add new value (e.g. XL, Red, 10oz)"
              className="w-full h-12 rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            type="button"
            disabled={!newValue.trim()}
            onClick={handleAddValue}
            className="h-12 px-8 rounded-lg bg-[#ff6600] text-white font-bold hover:bg-[#ff6600]/90 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20 whitespace-nowrap"
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
                      className="group flex items-center gap-2 rounded-lg bg-[#ff6600] px-4 py-2 text-white shadow-sm hover:shadow-md transition-all"
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
          className="px-8 py-3 rounded-lg font-bold border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="edit-attribute-form"
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
  );
}
