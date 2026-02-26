'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { orderAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

const STATUS_OPTIONS = [
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
];

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    processing: 'bg-orange-100 text-orange-700 border-orange-200',
    shipped: 'bg-purple-100 text-purple-700 border-purple-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
};

export default function OrderDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const user = useAuthStore((s) => s.user);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newStatus, setNewStatus] = useState('');

    const fetchOrder = useCallback(async () => {
        try {
            const res = await orderAPI.get(id);
            setOrder(res.data);
            setNewStatus(res.data.status);
        } catch {
            toast.error('Failed to load order');
            router.push('/orders');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        fetchOrder();
    }, [user, id, router, fetchOrder]);

    const handleStatusSave = async () => {
        if (newStatus === order.status) return;
        setSaving(true);
        try {
            const res = await orderAPI.updateStatus(id, newStatus);
            setOrder(res.data);
            toast.success('Status updated!');
        } catch {
            toast.error('Failed to update status');
        } finally {
            setSaving(false);
        }
    };

    if (!user || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl">

                    {/* Back + Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push('/orders')}
                            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
                        >
                            ← Back to Orders
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>
                                <p className="text-gray-500 mt-1">
                                    Placed on {new Date(order.created_at).toLocaleString()}
                                </p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize border ${STATUS_STYLES[order.status] || ''}`}>
                                {order.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">

                        {/* Left column — items + total */}
                        <div className="col-span-2 space-y-6">

                            {/* Order Items */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                                {order.items?.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No items</p>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {order.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3">
                                                        <p className="font-semibold text-gray-900">{item.product_name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{item.product_sku}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.variant_attrs || <span className="text-gray-400">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {parseFloat(item.unit_price).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                        {(parseFloat(item.unit_price) * item.quantity).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {/* Total */}
                                <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Total</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {parseFloat(order.total_amount).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {order.notes && (
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                                    <p className="text-gray-600 text-sm">{order.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Right column */}
                        <div className="space-y-6">

                            {/* Customer Info */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">
                                            {order.customer_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{order.customer_name}</p>
                                        </div>
                                    </div>
                                    {order.customer_email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span>✉️</span> {order.customer_email}
                                        </div>
                                    )}
                                    {order.customer_phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span>📞</span> {order.customer_phone}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Update Status */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3 capitalize text-sm"
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s} className="capitalize">{s}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleStatusSave}
                                    disabled={saving || newStatus === order.status}
                                    className="w-full px-4 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving…' : 'Save Status'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
