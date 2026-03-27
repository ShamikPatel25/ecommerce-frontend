'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productAPI, categoryAPI } from '@/lib/api';
import MediaUploader from '@/components/MediaUploader';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import {
  ArrowLeft, ChevronRight, ChevronDown, Info, Sliders, Package,
  Loader2, Undo2, Trash2,
} from 'lucide-react';

const INPUT_CLS =
  'w-full rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-[#ff6600] ' +
  'focus:ring-2 focus:ring-[#ff6600]/20 transition-all ' +
  'dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-500';

const SELECT_CLS = INPUT_CLS + ' appearance-none pr-10';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', sku: '', price: '', compare_at_price: '',
    stock: '', description: '', category: '', product_type: 'single',
    is_active: true, is_featured: false,
  });

  const [singleCatalogMode, setSingleCatalogMode] = useState(true);
  const [selections, setSelections] = useState({});
  const [catalogs, setCatalogs] = useState([]);
  const [media, setMedia] = useState([]);

  const [pendingVariantDeletes, setPendingVariantDeletes] = useState(new Set());
  const [confirmVariantDialog, setConfirmVariantDialog] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [productRes, catRes] = await Promise.all([
        productAPI.get(productId),
        categoryAPI.list(),
      ]);

      const p = productRes.data;
      setProduct(p);

      setFormData({
        name: p.name || '', sku: p.sku || '', price: p.price || '',
        compare_at_price: p.compare_at_price || '', stock: p.stock ?? '',
        description: p.description || '',
        category: p.category || '', product_type: p.product_type || 'single',
        is_active: p.is_active ?? true, is_featured: p.is_featured ?? false,
      });

      const catData = catRes.data;
      setCategories(Array.isArray(catData) ? catData : (catData?.results || []));

      const attrs = p.selected_attributes || [];
      setAttributes(attrs);
      setCatalogs(p.variants || []);
      setMedia(p.media || []);

      const initialSelections = {};
      attrs.forEach(attr => { initialSelections[attr.attribute] = []; });
      setSelections(initialSelections);
    } catch {
      toast.error('Failed to load product');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    fetchData();
  }, [productId, fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(), sku: formData.sku.trim().toUpperCase(),
        price: parseFloat(formData.price).toFixed(2),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price).toFixed(2) : null,
        stock: formData.product_type === 'single' ? parseInt(formData.stock) || 0 : undefined,
        description: formData.description?.trim() || '',
        category: formData.category || null, product_type: formData.product_type,
        is_active: formData.is_active, is_featured: formData.is_featured,
      };
      await productAPI.update(productId, data);

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
      price: product.price, stock: 0, is_new: true,
    }));
    setCatalogs([...catalogs, ...newCatalogs]);
    const resetSelections = {};
    attributes.forEach(attr => { resetSelections[attr.attribute] = []; });
    setSelections(resetSelections);
    toast.success(`${combinations.length} catalog(s) added`);
  };

  const handleGenerateCatalog = async () => {
    const newCatalogs = catalogs.filter(c => c.is_new);
    if (newCatalogs.length === 0) { toast.error('No new catalogs to generate'); return; }
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
      fetchData();
    } catch {
      toast.error('Failed to generate catalog');
    } finally {
      setSubmitting(false);
    }
  };

  const removeCatalog = (catalogId) => {
    setCatalogs(catalogs.filter(c => c.id !== catalogId));
  };

  const handleSaveVariant = async (catalog) => {
    try {
      await productAPI.updateVariant(productId, catalog.id, {
        stock: parseInt(catalog.stock) || 0,
        price: catalog.price ? parseFloat(catalog.price) : null,
      });
      toast.success('Variant updated!');
      setCatalogs(prev => prev.map(c => c.id === catalog.id ? { ...c, isDirty: false } : c));
    } catch {
      toast.error('Failed to update variant');
    }
  };

  const requestDeleteVariant = (variantId, label) => {
    setConfirmVariantDialog({ id: variantId, label });
  };

  const confirmVariantDelete = () => {
    if (!confirmVariantDialog) return;
    setPendingVariantDeletes(prev => new Set([...prev, confirmVariantDialog.id]));
    setConfirmVariantDialog(null);
  };

  const undoPendingVariantDelete = (id) => {
    setPendingVariantDeletes(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const getAttributeValueName = (valueId) => {
    for (const attr of attributes) {
      const valueList = attr.attribute_values || [];
      const value = valueList.find(v => v.id === valueId);
      if (value) return value.value;
    }
    return String(valueId);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin" />
    </div>
  );

  if (!product) return null;

  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/products')} className="hover:text-[#ff6600] transition-colors">
          Products
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">{product.name}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Edit Product</h1>
        <button
          type="button"
          onClick={() => router.push('/products')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
      </div>

      {/* ── PRODUCT DETAILS FORM ── */}
      <form id="edit-product-form" onSubmit={handleSave} className="space-y-8 mb-8">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5">
            <Info className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Product Name <span className="text-[#ff6600]">*</span>
              </label>
              <input type="text" required className={INPUT_CLS}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                SKU <span className="text-[#ff6600]">*</span>
              </label>
              <input type="text" required className={INPUT_CLS}
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Price <span className="text-[#ff6600]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-medium">$</span>
                <input type="number" step="0.01" min="0" required
                  className={INPUT_CLS + ' pl-8'}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            {/* Compare at Price */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Compare at Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-medium">$</span>
                <input type="number" step="0.01" min="0"
                  placeholder="Original price (optional)"
                  className={INPUT_CLS + ' pl-8'}
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Category</label>
              <div className="relative">
                <select className={SELECT_CLS}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Stock — single only */}
            {formData.product_type === 'single' && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Stock</label>
                <input type="number" min="0" className={INPUT_CLS}
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            )}

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">Description</label>
              <textarea
                rows={4}
                placeholder="Describe your product in detail..."
                className={INPUT_CLS + ' resize-none'}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6 pt-4 mt-4 border-t border-[#ff6600]/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded accent-[#ff6600]"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-5 h-5 rounded accent-[#ff6600]"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Featured</span>
            </label>
          </div>
        </section>
      </form>

      {/* ── CATALOG SECTION ── */}
      {product.product_type === 'catalog' && attributes.length > 0 && (
        <div className="space-y-8 mb-8">
          {/* Select Attribute Value */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#ff6600]/5">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#ff6600]" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Attribute Value</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Single Catalog</span>
                <button
                  type="button"
                  onClick={() => setSingleCatalogMode(!singleCatalogMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${singleCatalogMode ? 'bg-[#ff6600]' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow transition-transform ${singleCatalogMode ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-gray-700">
              {attributes.map((attr, attrIdx) => (
                <div key={attr.id} className={`${attrIdx > 0 ? 'pt-5' : ''} ${attrIdx < attributes.length - 1 ? 'pb-5' : ''}`}>
                  <h3 className="text-sm font-bold text-slate-800 mb-3">{attr.attribute_name}</h3>
                  <div className="flex flex-wrap gap-3">
                    {attr.attribute_values?.map((val) => {
                      const isSelected = selections[attr.attribute]?.includes(val.id);
                      return (
                        <label
                          key={val.id}
                          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full cursor-pointer transition-all border ${
                            isSelected ? 'border-[#ff6600] bg-[#ff6600]/5' : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-slate-300'
                          }`}
                        >
                          {singleCatalogMode ? (
                            /* Radio circle */
                            <span className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'border-[#ff6600]' : 'border-slate-300'
                            }`}>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-[#ff6600]" />}
                            </span>
                          ) : (
                            /* Checkbox square */
                            <span className={`w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 transition-colors border ${
                              isSelected ? 'border-[#ff6600] bg-[#ff6600]' : 'border-slate-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                          )}
                          <input
                            type={singleCatalogMode ? 'radio' : 'checkbox'}
                            name={singleCatalogMode ? `attr-${attr.attribute}` : undefined}
                            checked={isSelected}
                            onChange={() => handleValueToggle(attr.attribute, val.id)}
                            className="sr-only"
                          />
                          <span className="text-sm text-slate-700 dark:text-gray-300">{val.value}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100 dark:border-gray-700">
              <button
                onClick={handleAddCatalog}
                className="px-6 py-2.5 rounded-lg font-semibold border border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600]/5 active:scale-95 transition-all text-sm"
              >
                Add
              </button>
            </div>
          </section>

          {/* Added Catalogs */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#ff6600]/5">
              <Package className="w-5 h-5 text-[#ff6600]" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Added Catalogs</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
              The product price will default to the catalog price if no catalog price is provided.
            </p>

            {catalogs.length === 0 ? (
              <div className="flex items-center justify-center py-10 rounded-lg bg-slate-50 dark:bg-gray-700/50 border border-dashed border-slate-200 dark:border-gray-700 text-slate-400 dark:text-gray-500 text-sm">
                No catalogs added yet
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-gray-700/50 border-b border-[#ff6600]/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Attributes</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Name / SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
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
                              ? 'bg-[#ff6600]/5'
                              : isOutOfStock
                                ? 'bg-red-50'
                                : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className={`flex flex-wrap gap-1 ${isPendingDelete ? 'line-through' : ''}`}>
                              {catalog.attribute_values?.map((val, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded text-xs">
                                  {typeof val === 'object'
                                    ? `${val.attribute_name}: ${val.value}`
                                    : getAttributeValueName(val)}
                                </span>
                              ))}
                              {isOutOfStock && (
                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded text-xs font-medium">Out of stock</span>
                              )}
                              {isPendingDelete && (
                                <span className="px-2 py-1 bg-red-200 text-red-700 dark:text-red-400 rounded text-xs font-medium">Pending deletion</span>
                              )}
                            </div>
                          </td>

                          <td className={`px-4 py-3 text-sm text-slate-900 dark:text-white font-mono ${isPendingDelete ? 'line-through text-slate-400 dark:text-gray-500' : ''}`}>
                            {catalog.variant_name || catalog.sku || (
                              isNew ? <span className="text-[#ff6600] text-xs italic">New</span> : '—'
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="number" min="0"
                              value={catalog.stock ?? 0}
                              disabled={isPendingDelete}
                              onChange={(e) => updateCatalogField(catalog.id, 'stock', e.target.value)}
                              onFocus={() => !isNew && updateCatalogField(catalog.id, 'isDirty', true)}
                              className="w-24 px-2 py-1.5 border border-[#ff6600]/20 bg-[#ff6600]/5 rounded-lg text-sm focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              placeholder="0"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="number" min="0" step="0.01"
                              value={catalog.price ?? ''}
                              disabled={isPendingDelete}
                              onChange={(e) => {
                                updateCatalogField(catalog.id, 'price', e.target.value);
                                if (!isNew) updateCatalogField(catalog.id, 'isDirty', true);
                              }}
                              className="w-28 px-2 py-1.5 border border-[#ff6600]/20 bg-[#ff6600]/5 rounded-lg text-sm focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              placeholder={product.price}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex gap-2 items-center">
                              {isNew ? (
                                <button
                                  onClick={() => removeCatalog(catalog.id)}
                                  className="px-3 py-1 text-red-500 hover:text-red-700 dark:text-red-400 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              ) : isPendingDelete ? (
                                <button
                                  onClick={() => undoPendingVariantDelete(catalog.id)}
                                  title="Restore this variant"
                                  className="flex items-center gap-1 px-3 py-1 text-[#ff6600] hover:text-[#ff6600]/80 text-sm font-medium border border-[#ff6600]/20 rounded-lg hover:bg-[#ff6600]/5"
                                >
                                  <Undo2 className="w-3.5 h-3.5" /> Restore
                                </button>
                              ) : (
                                <>
                                  {catalog.isDirty && (
                                    <button
                                      onClick={() => handleSaveVariant(catalog)}
                                      className="px-3 py-1 text-white bg-[#ff6600] hover:bg-[#ff6600]/90 text-sm font-bold rounded-lg shadow-sm"
                                    >
                                      Save
                                    </button>
                                  )}
                                  <button
                                    onClick={() => requestDeleteVariant(catalog.id, variantLabel)}
                                    className="px-3 py-1 text-red-500 hover:text-red-700 dark:text-red-400 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
                  className="px-8 py-3 bg-[#ff6600] text-white font-bold rounded-lg shadow-lg shadow-orange-500/20 hover:bg-[#ff6600]/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </span>
                  ) : 'Generate Catalog'}
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── MEDIA UPLOAD ── */}
      <MediaUploader
        productId={productId}
        initialMedia={media}
        onMediaChange={setMedia}
      />

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-end gap-3 mt-8">
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
          className="px-8 py-3 rounded-lg font-bold border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
        >
          {pendingVariantDeletes.size > 0 ? 'Restore Deletions' : 'Cancel'}
        </button>
        <button
          type="submit"
          form="edit-product-form"
          disabled={saving}
          className="px-12 py-3 rounded-lg font-bold bg-[#ff6600] text-white shadow-lg shadow-orange-500/30 hover:bg-[#ff6600]/90 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </span>
          ) : pendingVariantDeletes.size > 0
            ? `Save & Delete ${pendingVariantDeletes.size} Variant${pendingVariantDeletes.size > 1 ? 's' : ''}`
            : 'Save Changes'}
        </button>
      </div>

      {/* Variant Deletion Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!confirmVariantDialog}
        title="Delete Variant?"
        itemName={confirmVariantDialog?.label}
        description="The variant won't be permanently removed until you click Save Changes."
        onCancel={() => setConfirmVariantDialog(null)}
        onConfirm={confirmVariantDelete}
      />
    </div>
  );
}
