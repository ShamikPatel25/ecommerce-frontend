'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { productAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const user = useAuthStore((state) => state.user);
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Product form fields
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    compare_at_price: '',
    stock: '',
    category: '',
    product_type: 'single',
    is_active: true,
    is_featured: false,
  });

  // Catalog section state
  const [singleCatalogMode, setSingleCatalogMode] = useState(true);
  const [selections, setSelections] = useState({});
  const [catalogs, setCatalogs] = useState([]);

  // Staged variant deletion
  const [pendingVariantDeletes, setPendingVariantDeletes] = useState(new Set());
  const [confirmVariantDialog, setConfirmVariantDialog] = useState(null); // { id, label }

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user, productId]);

  const fetchData = async () => {
    try {
      const [productRes, catRes] = await Promise.all([
        productAPI.get(productId),
        categoryAPI.list(),
      ]);

      const p = productRes.data;
      setProduct(p);

      // Pre-fill form
      setFormData({
        name: p.name || '',
        sku: p.sku || '',
        price: p.price || '',
        compare_at_price: p.compare_at_price || '',
        stock: p.stock ?? '',
        category: p.category || '',
        product_type: p.product_type || 'single',
        is_active: p.is_active ?? true,
        is_featured: p.is_featured ?? false,
      });

      // Categories
      const catData = catRes.data;
      setCategories(Array.isArray(catData) ? catData : (catData?.results || []));

      // Catalog section
      const attrs = p.selected_attributes || [];
      setAttributes(attrs);
      setCatalogs(p.variants || []);

      const initialSelections = {};
      attrs.forEach(attr => { initialSelections[attr.attribute] = []; });
      setSelections(initialSelections);

    } catch (error) {
      toast.error('Failed to load product');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  // Save basic product info + fire all staged variant deletes
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        price: parseFloat(formData.price).toFixed(2),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price).toFixed(2) : null,
        stock: formData.product_type === 'single' ? parseInt(formData.stock) || 0 : undefined,
        category: formData.category || null,
        product_type: formData.product_type,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };
      await productAPI.update(productId, data);

      // Fire all staged variant deletes
      if (pendingVariantDeletes.size > 0) {
        await Promise.all(
          [...pendingVariantDeletes].map((id) =>
            productAPI.deleteVariant(productId, id).catch(() => null)
          )
        );
        setCatalogs(prev => prev.filter(c => !pendingVariantDeletes.has(c.id)));
        setPendingVariantDeletes(new Set());
      }

      toast.success('Product saved!');
      router.push('/products');
    } catch (error) {
      const errMsg = error.response?.data;
      if (typeof errMsg === 'object') {
        const first = Object.values(errMsg)[0];
        toast.error(Array.isArray(first) ? first[0] : 'Failed to update');
      } else {
        toast.error('Failed to update product');
      }
    } finally {
      setSaving(false);
    }
  };

  // Catalog section handlers
  const handleValueToggle = (attributeId, valueId) => {
    setSelections(prev => {
      const current = prev[attributeId] || [];
      if (singleCatalogMode) {
        return { ...prev, [attributeId]: [valueId] };
      } else {
        if (current.includes(valueId)) {
          return { ...prev, [attributeId]: current.filter(id => id !== valueId) };
        } else {
          return { ...prev, [attributeId]: [...current, valueId] };
        }
      }
    });
  };

  const generateCombinations = () => {
    const attributeValues = Object.entries(selections)
      .map(([attrId, valueIds]) => ({ attributeId: parseInt(attrId), values: valueIds }))
      .filter(item => item.values.length > 0);

    if (attributeValues.length === 0) return [];

    const missingAttributes = attributes.filter(attr =>
      !selections[attr.attribute] || selections[attr.attribute].length === 0
    );

    if (missingAttributes.length > 0) {
      toast.error(`Please select values for: ${missingAttributes.map(a => a.attribute_name).join(', ')}`);
      return [];
    }

    if (singleCatalogMode) {
      const combination = attributeValues.flatMap(item => item.values);
      return [{ attribute_values: combination }];
    } else {
      const valueSets = attributeValues.map(item => item.values);
      const cartesian = (...arrays) =>
        arrays.reduce((acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])), [[]]);
      const combinations = cartesian(...valueSets);
      return combinations.map(combo => ({ attribute_values: combo }));
    }
  };

  const updateCatalogField = (catalogId, field, value) => {
    setCatalogs(prev => prev.map(c => c.id === catalogId ? { ...c, [field]: value } : c));
  };

  const handleAddCatalog = () => {
    const combinations = generateCombinations();
    if (combinations.length === 0) return;

    const newCatalogs = combinations.map((combo, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      attribute_values: combo.attribute_values,
      price: product.price,
      stock: 0,
      is_new: true,
    }));

    setCatalogs([...catalogs, ...newCatalogs]);

    const resetSelections = {};
    attributes.forEach(attr => { resetSelections[attr.attribute] = []; });
    setSelections(resetSelections);

    toast.success(`${combinations.length} catalog(s) added`);
  };

  const handleGenerateCatalog = async () => {
    const newCatalogs = catalogs.filter(c => c.is_new);
    if (newCatalogs.length === 0) {
      toast.error('No new catalogs to generate');
      return;
    }
    setSubmitting(true);
    try {
      const selectedCombinations = newCatalogs.map(c => ({
        attribute_values: c.attribute_values,
        price: parseFloat(c.price) || parseFloat(product.price),
        stock: parseInt(c.stock) || 0,
      }));

      await productAPI.generateCatalog(productId, {
        single_catalog_mode: singleCatalogMode,
        selected_combinations: selectedCombinations,
      });

      toast.success(`Generated ${newCatalogs.length} variant(s)!`);
      // Reload to show the newly created variants in the saved table
      fetchData();
    } catch {
      toast.error('Failed to generate catalog');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove a pending (unsaved) catalog row from local state
  const removeCatalog = (catalogId) => {
    setCatalogs(catalogs.filter(c => c.id !== catalogId));
  };

  // Save stock/price changes to an existing (saved) variant
  const handleSaveVariant = async (catalog) => {
    try {
      await productAPI.updateVariant(productId, catalog.id, {
        stock: parseInt(catalog.stock) || 0,
        price: catalog.price ? parseFloat(catalog.price) : null,
      });
      toast.success('Variant updated!');
      // Mark as no longer dirty
      setCatalogs(prev => prev.map(c => c.id === catalog.id ? { ...c, isDirty: false } : c));
    } catch {
      toast.error('Failed to update variant');
    }
  };

  // Stage a variant for deletion (opens confirmation dialog)
  const requestDeleteVariant = (variantId, label) => {
    setConfirmVariantDialog({ id: variantId, label });
  };

  // Confirmed → add to pending set
  const confirmVariantDelete = () => {
    if (!confirmVariantDialog) return;
    setPendingVariantDeletes(prev => new Set([...prev, confirmVariantDialog.id]));
    setConfirmVariantDialog(null);
  };

  // Undo a staged deletion
  const undoPendingVariantDelete = (id) => {
    setPendingVariantDeletes(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const getAttributeValueName = (valueId) => {
    for (const attr of attributes) {
      const valueList = attr.attribute_values || [];
      const value = valueList.find(v => v.id === valueId);
      if (value) return value.value;
    }
    return String(valueId);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!product) return null;

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
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-500 mt-1">{product.name}</p>
          </div>

          {/* ── PRODUCT DETAILS FORM ── */}
          <form id="edit-product-form" onSubmit={handleSave} className="space-y-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
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

                {/* Compare at Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compare at Price</label>
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

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock — only for single products */}
                {formData.product_type === 'single' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>
            </div>

            {/* end of form body */}
          </form>

          {/* ── CATALOG SECTION (only for catalog products) ── */}
          {product.product_type === 'catalog' && attributes.length > 0 && (
            <>
              {/* Select Attribute Value */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Select Attribute Value</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Single Catalog</span>
                    <button
                      onClick={() => setSingleCatalogMode(!singleCatalogMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${singleCatalogMode ? 'bg-orange-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${singleCatalogMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {attributes.map((attr) => (
                    <div key={attr.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">{attr.attribute_name}</h3>
                      <div className="flex flex-wrap gap-3">
                        {attr.attribute_values?.map((val) => {
                          const isSelected = selections[attr.attribute]?.includes(val.id);
                          return (
                            <label
                              key={val.id}
                              className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                              <input
                                type={singleCatalogMode ? 'radio' : 'checkbox'}
                                name={singleCatalogMode ? `attr-${attr.attribute}` : undefined}
                                checked={isSelected}
                                onChange={() => handleValueToggle(attr.attribute, val.id)}
                                className="w-4 h-4 text-orange-500"
                              />
                              <span className="text-sm font-medium text-gray-700">{val.value}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleAddCatalog}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Added Catalogs */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Added Catalogs</h2>
                <p className="text-sm text-gray-600 mb-6">
                  ℹ️ The product price will default to the catalog price if no catalog price is provided
                </p>

                {catalogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>No catalogs added yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attributes</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name / SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {catalogs.map((catalog) => {
                          const isNew = catalog.is_new;
                          const isPendingDelete = !isNew && pendingVariantDeletes.has(catalog.id);
                          const isOutOfStock = !isNew && !isPendingDelete && (catalog.stock ?? 0) === 0;
                          const variantLabel = catalog.variant_name || catalog.sku || 'this variant';
                          return (
                            <tr
                              key={catalog.id}
                              className={`transition-all ${isPendingDelete
                                ? 'bg-red-50 opacity-60'
                                : isNew
                                  ? 'bg-orange-50'
                                  : isOutOfStock
                                    ? 'bg-red-50'
                                    : ''
                                }`}
                            >
                              {/* Attributes */}
                              <td className="px-4 py-3">
                                <div className={`flex flex-wrap gap-1 ${isPendingDelete ? 'line-through' : ''}`}>
                                  {catalog.attribute_values?.map((val, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                      {typeof val === 'object'
                                        ? `${val.attribute_name}: ${val.value}`
                                        : getAttributeValueName(val)}
                                    </span>
                                  ))}
                                  {isOutOfStock && (
                                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">
                                      Out of stock
                                    </span>
                                  )}
                                  {isPendingDelete && (
                                    <span className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs font-medium">
                                      Pending deletion
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* SKU */}
                              <td className={`px-4 py-3 text-sm text-gray-900 font-mono ${isPendingDelete ? 'line-through text-gray-400' : ''}`}>
                                {catalog.variant_name || catalog.sku || (
                                  isNew ? <span className="text-orange-500 text-xs italic">New</span> : '—'
                                )}
                              </td>

                              {/* Stock */}
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={catalog.stock ?? 0}
                                  disabled={isPendingDelete}
                                  onChange={(e) => updateCatalogField(catalog.id, 'stock', e.target.value)}
                                  onFocus={() => !isNew && updateCatalogField(catalog.id, 'isDirty', true)}
                                  className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              </td>

                              {/* Price */}
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={catalog.price ?? ''}
                                  disabled={isPendingDelete}
                                  onChange={(e) => {
                                    updateCatalogField(catalog.id, 'price', e.target.value);
                                    if (!isNew) updateCatalogField(catalog.id, 'isDirty', true);
                                  }}
                                  className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                  placeholder={product.price}
                                />
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3">
                                <div className="flex gap-2 items-center">
                                  {isNew ? (
                                    <button
                                      onClick={() => removeCatalog(catalog.id)}
                                      className="px-3 py-1 text-red-500 hover:text-red-700 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50"
                                    >
                                      Remove
                                    </button>
                                  ) : isPendingDelete ? (
                                    <button
                                      onClick={() => undoPendingVariantDelete(catalog.id)}
                                      title="Restore this variant"
                                      className="px-3 py-1 text-orange-600 hover:text-orange-800 text-sm font-medium border border-orange-200 rounded-lg hover:bg-orange-50"
                                    >
                                      ↩ Restore
                                    </button>
                                  ) : (
                                    <>
                                      {catalog.isDirty && (
                                        <button
                                          onClick={() => handleSaveVariant(catalog)}
                                          className="px-3 py-1 text-white bg-orange-500 hover:bg-orange-600 text-sm font-medium rounded-lg"
                                        >
                                          Save
                                        </button>
                                      )}
                                      <button
                                        onClick={() => requestDeleteVariant(catalog.id, variantLabel)}
                                        className="px-3 py-1 text-red-500 hover:text-red-700 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50"
                                      >
                                        🗑️
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {catalogs.filter(c => c.is_new).length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleGenerateCatalog}
                      disabled={submitting}
                      className="px-8 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                    >
                      {submitting ? 'Generating...' : 'Generate Catalog'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── STICKY BOTTOM ACTION BAR ── */}
          <div className="fixed bottom-0 left-64 right-0 z-50 bg-white border-t border-gray-200 px-8 py-4 flex justify-end gap-3 shadow-lg">
            <button
              type="button"
              onClick={() => {
                if (pendingVariantDeletes.size > 0) {
                  setPendingVariantDeletes(new Set());
                  toast.info('Pending deletions restored');
                } else {
                  router.push('/products');
                }
              }}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              {pendingVariantDeletes.size > 0 ? 'Restore Deletions' : 'Cancel'}
            </button>
            <button
              type="submit"
              form="edit-product-form"
              disabled={saving}
              className="px-8 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50 shadow-sm"
            >
              {saving
                ? 'Saving...'
                : pendingVariantDeletes.size > 0
                  ? `Save & Delete ${pendingVariantDeletes.size} Variant${pendingVariantDeletes.size > 1 ? 's' : ''}`
                  : 'Save Changes'}
            </button>
          </div>

          {/* ── VARIANT DELETION CONFIRMATION DIALOG ── */}
          {confirmVariantDialog && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setConfirmVariantDialog(null)}
              />
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">
                    🗑️
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Delete Variant?</h3>
                    <p className="text-sm text-gray-500">Changes apply only after Save</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-1">
                  Delete variant <span className="font-semibold text-red-600">&ldquo;{confirmVariantDialog.label}&rdquo;</span>?
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  The variant won&apos;t be permanently removed until you click <strong>Save Changes</strong>.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmVariantDialog(null)}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmVariantDelete}
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