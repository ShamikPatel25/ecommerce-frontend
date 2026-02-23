'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function CreateCategoryPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [categories, setCategories] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', slug: '', parent: '' });

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        fetchCategories();
    }, [user]);

    const fetchCategories = async () => {
        try {
            const res = await categoryAPI.list();
            const data = res.data;
            setCategories(Array.isArray(data) ? data : (data?.results || []));
        } catch {
            toast.error('Failed to load categories');
        }
    };

    const generateSlug = (name) =>
        name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await categoryAPI.create({ ...formData, parent: formData.parent || null });
            toast.success('Category created!');
            router.push('/categories');
        } catch (error) {
            toast.error(error.response?.data?.name?.[0] || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    const mainCategories = categories.filter(c => c.level < 2);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 pb-28">
                <div className="max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push('/categories')}
                            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
                        >
                            ← Back to Categories
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Add Category</h1>
                        <p className="text-gray-500 mt-1">Create a new product category</p>
                    </div>

                    <form id="create-category-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">Category Information</h2>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="e.g. Clothes, Electronics"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                                        required
                                    />
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="auto-generated"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Auto-generated from name</p>
                                </div>
                            </div>

                            {/* Parent Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    value={formData.parent}
                                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                                >
                                    <option value="">None (Main Category)</option>
                                    {mainCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {'→'.repeat(c.level)} {c.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Leave empty to create a top-level category</p>
                            </div>

                            {/* Level preview */}
                            {formData.parent && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        ℹ️ This will be a <strong>sub-category</strong> of <strong>{categories.find(c => String(c.id) === String(formData.parent))?.name}</strong>
                                    </p>
                                </div>
                            )}
                        </div>

                    </form>

                    {/* ── STICKY BOTTOM ACTION BAR ── */}
                    <div className="fixed bottom-0 left-64 right-0 z-50 bg-white border-t border-gray-200 px-8 py-4 flex justify-end gap-3 shadow-lg">
                        <button
                            type="button"
                            onClick={() => router.push('/categories')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="create-category-form"
                            disabled={submitting}
                            className="px-8 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50 shadow-sm"
                        >
                            {submitting ? 'Creating...' : 'Create Category'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
