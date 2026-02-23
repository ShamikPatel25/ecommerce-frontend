'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function EditCategoryPage() {
    const router = useRouter();
    const params = useParams();
    const user = useAuthStore((state) => state.user);
    const categoryId = params.id;

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', slug: '', parent: '' });

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        fetchData();
    }, [user, categoryId]);

    const fetchData = async () => {
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
    };

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

    if (!user || loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    const parentOptions = categories.filter(c => String(c.id) !== categoryId && c.level < 2);

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
                        <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
                        <p className="text-gray-500 mt-1">{formData.name}</p>
                    </div>

                    <form id="edit-category-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">Category Information</h2>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Parent */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    value={formData.parent}
                                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                                >
                                    <option value="">None (Main Category)</option>
                                    {parentOptions.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {'→'.repeat(c.level)} {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
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
                            form="edit-category-form"
                            disabled={saving}
                            className="px-8 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50 shadow-sm"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
