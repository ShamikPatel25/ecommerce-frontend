'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function EditAttributePage() {
    const router = useRouter();
    const params = useParams();
    const user = useAuthStore((state) => state.user);
    const attributeId = params.id;

    const [loading, setLoading] = useState(true);
    const [attribute, setAttribute] = useState(null);
    const [categories, setCategories] = useState([]);
    const [saving, setSaving] = useState(false);
    const [addingValue, setAddingValue] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [formData, setFormData] = useState({ name: '', category: '' });

    // IDs of values staged for deletion (not yet sent to backend)
    const [pendingDeletes, setPendingDeletes] = useState(new Set());

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState(null); // { id, name }

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        fetchData();
    }, [user, attributeId]);

    const fetchData = async () => {
        try {
            const [attrRes, catRes] = await Promise.all([
                attributeAPI.get(attributeId),
                categoryAPI.list(),
            ]);
            const a = attrRes.data;
            setAttribute(a);
            setFormData({ name: a.name || '', category: String(a.category || '') });
            const catData = catRes.data;
            setCategories(Array.isArray(catData) ? catData : (catData?.results || []));
        } catch {
            toast.error('Failed to load attribute');
            router.push('/attributes');
        } finally {
            setLoading(false);
        }
    };

    // Step 1: click × → show confirmation dialog
    const requestDeleteValue = (id, name) => {
        setConfirmDialog({ id, name });
    };

    // Step 2: User confirmed → mark as pending (visual only, not yet deleted)
    const confirmDeleteValue = () => {
        if (!confirmDialog) return;
        setPendingDeletes((prev) => new Set([...prev, confirmDialog.id]));
        setConfirmDialog(null);
    };

    // Undo a pending delete
    const undoPendingDelete = (id) => {
        setPendingDeletes((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    // Save: update attribute info AND fire all staged deletes
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await attributeAPI.update(attributeId, formData);

            if (pendingDeletes.size > 0) {
                await Promise.all(
                    [...pendingDeletes].map((id) =>
                        attributeAPI.deleteValue(attributeId, id).catch(() => null)
                    )
                );
                setPendingDeletes(new Set());
            }

            toast.success('Attribute saved!');
            const res = await attributeAPI.get(attributeId);
            setAttribute(res.data);
        } catch (error) {
            toast.error(error.response?.data?.name?.[0] || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleAddValue = async () => {
        const v = newValue.trim();
        if (!v) return;
        setAddingValue(true);
        try {
            await attributeAPI.addValue(attributeId, v);
            toast.success(`"${v}" added!`);
            setNewValue('');
            const res = await attributeAPI.get(attributeId);
            setAttribute(res.data);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add value');
        } finally {
            setAddingValue(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleAddValue(); }
    };

    // Cancel: if pending deletes exist, restore them. Otherwise navigate back.
    const handleCancel = () => {
        if (pendingDeletes.size > 0) {
            setPendingDeletes(new Set());
            toast.info('Pending deletions restored');
        } else {
            router.push('/attributes');
        }
    };

    const getCategoryName = (catId) =>
        categories.find(c => String(c.id) === String(catId))?.name || '';

    if (!user || loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    if (!attribute) return null;

    const pendingCount = pendingDeletes.size;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 pb-28">
                <div className="max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push('/attributes')}
                            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
                        >
                            ← Back to Attributes
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Attribute</h1>
                        <p className="text-gray-500 mt-1">
                            {getCategoryName(attribute.category)} → <strong>{attribute.name}</strong>
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Basic Info Form */}
                        <form id="edit-attribute-form" onSubmit={handleSave}>
                            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900">Attribute Information</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Attribute Name *</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                        <select
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Values Section */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Attribute Values</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Manage all possible values for <strong>{attribute.name}</strong>
                                    </p>
                                </div>
                                {pendingCount > 0 && (
                                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                        {pendingCount} pending deletion{pendingCount > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {/* Add Value Input */}
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Type a value and press Enter or Add"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    type="button"
                                    disabled={addingValue || !newValue.trim()}
                                    onClick={handleAddValue}
                                    className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 font-medium"
                                >
                                    {addingValue ? 'Adding...' : '+ Add'}
                                </button>
                            </div>

                            {/* Values chips */}
                            {attribute.values?.length > 0 ? (
                                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg min-h-12">
                                    {attribute.values.map((v) => {
                                        const isPending = pendingDeletes.has(v.id);
                                        return (
                                            <span
                                                key={v.id}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isPending
                                                        ? 'bg-red-100 text-red-400 line-through opacity-60'
                                                        : 'bg-orange-100 text-orange-800'
                                                    }`}
                                            >
                                                {v.value}
                                                {isPending ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => undoPendingDelete(v.id)}
                                                        title="Restore this value"
                                                        className="text-red-400 hover:text-orange-600 font-bold leading-none text-base"
                                                    >
                                                        ↩
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => requestDeleteValue(v.id, v.value)}
                                                        title="Mark for deletion"
                                                        className="text-orange-400 hover:text-red-600 font-bold leading-none text-base"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-400 text-sm">
                                    No values yet — add the first one above
                                </div>
                            )}

                            {pendingCount > 0 && (
                                <p className="text-xs text-red-500">
                                    ⚠️ {pendingCount} value{pendingCount > 1 ? 's' : ''} will be permanently deleted when you click <strong>Save Changes</strong>. Click ↩ on a chip to restore it.
                                </p>
                            )}

                            <p className="text-xs text-gray-400">
                                {(attribute.values?.length ?? 0) - pendingCount} active · {pendingCount} pending deletion
                            </p>
                        </div>
                    </div>

                    {/* ── STICKY BOTTOM ACTION BAR ── */}
                    <div className="fixed bottom-0 left-64 right-0 z-50 bg-white border-t border-gray-200 px-8 py-4 flex justify-end gap-3 shadow-lg">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            {pendingCount > 0 ? 'Restore Deletions' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            form="edit-attribute-form"
                            disabled={saving}
                            className="px-8 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50 shadow-sm"
                        >
                            {saving
                                ? 'Saving...'
                                : pendingCount > 0
                                    ? `Save & Delete ${pendingCount} Value${pendingCount > 1 ? 's' : ''}`
                                    : 'Save Changes'}
                        </button>
                    </div>

                    {/* ── CONFIRMATION DIALOG ── */}
                    {confirmDialog && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black/40"
                                onClick={() => setConfirmDialog(null)}
                            />
                            {/* Dialog box */}
                            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">
                                        🗑️
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Delete Value?</h3>
                                        <p className="text-sm text-gray-500">Changes apply only after Save</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-1">
                                    Delete <span className="font-semibold text-red-600">&ldquo;{confirmDialog.name}&rdquo;</span>?
                                </p>
                                <p className="text-xs text-gray-400 mb-6">
                                    The value won&apos;t be permanently removed until you click <strong>Save Changes</strong>.
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDialog(null)}
                                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmDeleteValue}
                                        className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                                    >
                                        Mark for Deletion
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
