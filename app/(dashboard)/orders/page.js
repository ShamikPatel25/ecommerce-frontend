'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { orderAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';

const STATUS_TABS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-orange-100 text-orange-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
};

export default function OrdersPage() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await orderAPI.list(activeStatus);
            const data = res.data;
            setOrders(Array.isArray(data) ? data : data?.results || []);
        } catch {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [activeStatus]);

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        fetchOrders();
    }, [user, activeStatus, router, fetchOrders]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this order?')) return;
        try {
            await orderAPI.delete(id);
            toast.success('Order deleted');
            fetchOrders();
        } catch {
            toast.error('Failed to delete order');
        }
    };

    const filtered = orders.filter((o) =>
        o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(o.id).includes(searchQuery)
    );

    const columns = [
        {
            header: 'ORDER #',
            accessor: 'id',
            cell: (row) => (
                <span className="font-mono font-bold text-gray-800">#{row.id}</span>
            ),
        },
        {
            header: 'CUSTOMER',
            accessor: 'customer_name',
            sortable: true,
            cell: (row) => (
                <div>
                    <p className="font-semibold text-gray-900">{row.customer_name}</p>
                    {row.customer_email && (
                        <p className="text-xs text-gray-500">{row.customer_email}</p>
                    )}
                </div>
            ),
        },
        {
            header: 'ITEMS',
            accessor: 'items_count',
            cell: (row) => (
                <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
                    {row.items_count ?? 0}
                </span>
            ),
        },
        {
            header: 'TOTAL',
            accessor: 'total_amount',
            sortable: true,
            cell: (row) => (
                <span className="font-semibold text-gray-900">
                    {parseFloat(row.total_amount || 0).toLocaleString()}
                </span>
            ),
        },
        {
            header: 'STATUS',
            accessor: 'status',
            cell: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[row.status] || 'bg-gray-100 text-gray-600'}`}>
                    {row.status}
                </span>
            ),
        },
        {
            header: 'DATE',
            accessor: 'created_at',
            cell: (row) => (
                <span className="text-sm text-gray-500">
                    {new Date(row.created_at).toLocaleDateString()}
                </span>
            ),
        },
        {
            header: '',
            accessor: 'actions',
            cell: (row) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                    >
                        🗑️
                    </button>
                </div>
            ),
        },
    ];

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveStatus(tab.value)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeStatus === tab.value
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <SearchBar placeholder="Search by customer name or order #" onSearch={setSearchQuery} />

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={filtered}
                    onRowClick={(row) => router.push(`/orders/${row.id}`)}
                    loading={loading}
                />
            </main>
        </div>
    );
}
