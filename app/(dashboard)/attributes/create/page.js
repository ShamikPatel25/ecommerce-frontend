'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function CreateAttributePage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
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
        if (!user) { router.push('/login'); return; }
        fetchCategories();
    }, [user, router, fetchCategories]);

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
            // Add all values if any
            if (attributeId && values.length > 0) {
                setAddingValue(true);
                try {
                    await attributeAPI.addBulkValues(attributeId, values);
                } catch {
                    // Try adding one by one as fallback
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

    if (!user) return null;

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
                        <h1 className="text-3xl font-bold text-gray-900">Add Attribute</h1>
                        <p className="text-gray-500 mt-1">Define a new product attribute with values</p>
                    </div>

                    <form id="create-attribute-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Basic Info */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">Attribute Information</h2>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Attribute Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Attribute Name *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="e.g. Size, Color, Material"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Values */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">Attribute Values</h2>
                            <p className="text-sm text-gray-500">Add all possible values for this attribute (e.g. for Size: S, M, L, XL)</p>

                            {/* Input */}
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
                                    onClick={addValue}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                                >
                                    + Add
                                </button>
                            </div>

                            {/* Values list */}
                            {values.length > 0 ? (
                                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg min-h-12">
                                    {values.map((v) => (
                                        <span
                                            key={v}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                                        >
                                            {v}
                                            <button
                                                type="button"
                                                onClick={() => removeValue(v)}
                                                className="text-orange-400 hover:text-red-600 font-bold leading-none"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-400 text-sm">
                                    No values added yet — you can also add them later from the Attributes list
                                </div>
                            )}
                        </div>

                    </form>

                    {/* ── STICKY BOTTOM ACTION BAR ── */}
                    <div className="fixed bottom-0 left-64 right-0 z-50 bg-white border-t border-gray-200 px-8 py-4 flex justify-end gap-3 shadow-lg">
                        <button
                            type="button"
                            onClick={() => router.push('/attributes')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="create-attribute-form"
                            disabled={submitting}
                            className="px-8 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50 shadow-sm"
                        >
                            {submitting ? (addingValue ? 'Adding Values...' : 'Creating...') : 'Create Attribute'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
