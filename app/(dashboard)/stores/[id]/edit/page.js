'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { storeAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function EditStorePage() {
    const router = useRouter();
    const params = useParams();
    const user = useAuthStore((state) => state.user);
    const storeId = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        description: '',
        currency: 'USD',
        is_active: true,
    });

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        fetchStore();
    }, [user, storeId]);

    const fetchStore = async () => {
        try {
            const res = await storeAPI.get(storeId);
            const s = res.data;
            setFormData({
                name: s.name || '',
                subdomain: s.subdomain || '',
                description: s.description || '',
                currency: s.currency || 'USD',
                is_active: s.is_active ?? true,
            });
        } catch {
            toast.error('Failed to load store');
            router.push('/stores');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await storeAPI.update(storeId, formData);
            toast.success('Store updated!');
            router.push('/stores');
        } catch (error) {
            toast.error(error.response?.data?.subdomain?.[0] || 'Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    if (!user || loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 pb-28">
                <div className="max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push('/stores')}
                            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
                        >
                            ← Back to Stores
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Store</h1>
                        <p className="text-gray-500 mt-1">{formData.name}</p>
                    </div>

                    <form id="edit-store-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">Store Information</h2>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Name *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Currency */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        <option value="USD">USD — US Dollar</option>
                                        <option value="EUR">EUR — Euro</option>
                                        <option value="GBP">GBP — British Pound</option>
                                        <option value="INR">INR — Indian Rupee</option>
                                    </select>
                                </div>
                            </div>

                            {/* Subdomain (read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subdomain</label>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                    <span className="flex-1 px-4 py-2.5 text-gray-500">{formData.subdomain}</span>
                                    <span className="px-4 py-2.5 text-gray-400 text-sm border-l">.myplatform.com</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Subdomain cannot be changed after creation</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    rows={4}
                                    placeholder="Describe your store..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Active toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-orange-500 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Active</span>
                            </label>
                        </div>

                    </form>

                    {/* ── STICKY BOTTOM ACTION BAR ── */}
                    <div className="fixed bottom-0 left-64 right-0 z-50 bg-white border-t border-gray-200 px-8 py-4 flex justify-end gap-3 shadow-lg">
                        <button
                            type="button"
                            onClick={() => router.push('/stores')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="edit-store-form"
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
