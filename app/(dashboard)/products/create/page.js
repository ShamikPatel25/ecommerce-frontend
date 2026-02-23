'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { productAPI, categoryAPI, attributeAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function CreateProductPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    compare_at_price: '',
    stock: '',
    description: '',
    category: '',
    product_type: 'single',
    is_active: true,
  });


  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.list();
      setCategories(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttributes = async (categoryId) => {
    try {
      const res = await attributeAPI.byCategory(categoryId);
      const attrs = res.data?.attributes || [];
      setAttributes(attrs);
    } catch {
      setAttributes([]);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
    if (categoryId) {
      fetchAttributes(categoryId);
    } else {
      setAttributes([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.product_type === 'catalog' && !formData.category) {
      toast.error('Please select a category for catalog products');
      return;
    }

    setSubmitting(true);

    // ── Step 1: Create the product ──
    let productId = null;
    try {
      const data = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        price: parseFloat(formData.price).toFixed(2),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price).toFixed(2) : null,
        category: formData.category || null,
        product_type: formData.product_type,
        stock: formData.product_type === 'single' ? parseInt(formData.stock) || 0 : 0,
        description: formData.description.trim() || '',
        is_active: formData.is_active,
        is_featured: false,
      };

      const response = await productAPI.create(data);
      productId = response.data?.id;

      // Fallback: search by SKU if API didn't return id
      if (!productId) {
        const allProducts = await productAPI.list();
        const created = (allProducts.data?.results || allProducts.data || []).find(
          p => p.sku === data.sku
        );
        productId = created?.id;
      }

      if (!productId) {
        toast.error('Product created but ID not found. Please check the products list.');
        router.push('/products');
        setSubmitting(false);
        return;
      }
    } catch (error) {
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        const firstError = Object.values(errData)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : 'Failed to create product');
      } else {
        toast.error('Failed to create product');
      }
      setSubmitting(false);
      return;
    }

    // ── Step 2: Attach attributes (catalog only) ──
    if (formData.product_type === 'catalog' && selectedAttributes.length > 0) {
      try {
        await productAPI.selectAttributes(productId, selectedAttributes);
      } catch {
        toast.error('Product created but failed to attach attributes. You can select them on the next page.');
      }
      toast.success('Product created! Build your catalog variants now.');
      router.push(`/products/${productId}/edit`);
    } else {
      toast.success('Product created!');
      router.push('/products');
    }

    setSubmitting(false);
  };

  if (!user || loading) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 pb-28">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/products')}
              className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
            >
              ← Back to Products
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
          </div>

          <form id="create-product-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compare at Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Original price (optional)"
                    value={formData.compare_at_price}
                    onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category {formData.product_type === 'catalog' && '*'}
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required={formData.product_type === 'catalog'}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Product Type dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type *
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.product_type}
                    onChange={(e) => {
                      setFormData({ ...formData, product_type: e.target.value });
                      setSelectedAttributes([]);
                    }}
                  >
                    <option value="single">Single Product</option>
                    <option value="catalog">Catalog (with variants)</option>
                  </select>
                </div>

                {/* Stock — single products only */}
                {formData.product_type === 'single' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe this product..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Attributes Selection (Only for Catalog) */}
            {formData.product_type === 'catalog' && formData.category && attributes.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Attributes</h2>
                <p className="text-sm text-gray-600 mb-4">Select your product attributes</p>

                <div className="space-y-3">
                  {attributes.map((attr) => (
                    <label
                      key={attr.id}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAttributes.includes(attr.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAttributes([...selectedAttributes, attr.id]);
                          } else {
                            setSelectedAttributes(selectedAttributes.filter(id => id !== attr.id));
                          }
                        }}
                        className="w-5 h-5 text-orange-500 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{attr.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {attr.values?.slice(0, 5).map((val, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {val.value}
                            </span>
                          ))}
                          {attr.values?.length > 5 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{attr.values.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedAttributes.length > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      ℹ️ Catalog name will be generated in the following sequence: {
                        selectedAttributes.map(id =>
                          attributes.find(a => a.id === id)?.name
                        ).join(' | ')
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* end of form body */}
          </form>

          {/* ── STICKY BOTTOM ACTION BAR ── */}
          <div className="fixed bottom-0 left-64 right-0 z-50 bg-white border-t border-gray-200 px-8 py-4 flex justify-end gap-3 shadow-lg">
            <button
              type="button"
              onClick={() => router.push('/products')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-product-form"
              disabled={submitting}
              className="px-8 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50 shadow-sm"
            >
              {submitting
                ? 'Creating...'
                : formData.product_type === 'catalog'
                  ? '→ Generate Catalog'
                  : 'Create Product'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}