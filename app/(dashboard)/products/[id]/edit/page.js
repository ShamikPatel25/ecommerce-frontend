'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productAPI, categoryAPI } from '@/lib/api';
import { useFormDraft } from '@/hooks/useFormDraft';
import MediaUploader from '@/components/MediaUploader';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import {
  ChevronLeft, ChevronRight, Info, Sliders, Package,
  Loader2, Undo2, Trash2,
} from 'lucide-react';
import { useStoreStore } from '@/store/storeStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useSharedDataStore } from '@/store/sharedDataStore';

const INPUT_CLS =
  'w-full rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-violet-500 ' +
  'focus:ring-2 focus:ring-violet-500/20 transition-all ' +
  'dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-500';

const INPUT_ERROR_CLS =
  'w-full rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-slate-900 dark:text-white ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-red-500 ' +
  'focus:ring-2 focus:ring-red-500/20 transition-all ' +
  'dark:bg-red-900/20 dark:border-red-500 dark:placeholder:text-gray-500';

const SELECT_CLS = INPUT_CLS + ' appearance-none pr-10';

const MAX_NAME_LENGTH = 100;
const MAX_SKU_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 500;

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const appendToCombo = (combo, arr) =>
  arr.map((c) => [...combo, c]);

const cartesian = (...arrays) =>
  arrays.reduce((acc, curr) => acc.flatMap((combo) => appendToCombo(combo, curr)), [[]]);

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { activeStore } = useStoreStore();
  const invalidateDashboard = useDashboardStore((s) => s.invalidate);
  const { fetchCategories, categories, invalidateProducts } = useSharedDataStore();

  const [formData, setFormData, clearDraft] = useFormDraft(`product-edit-${productId}`, {
    name: '', sku: '', price: '', compare_at_price: '',
    stock: '', description: '', category: '', product_type: 'single',
    is_active: true, is_featured: false,
  });
  const [originalData, setOriginalData] = useState(null);

  const [singleCatalogMode, setSingleCatalogMode] = useState(true);
  const [selections, setSelections] = useState({});
  const [catalogs, setCatalogs] = useState([]);
  const [media, setMedia] = useState([]);

  const [pendingVariantDeletes, setPendingVariantDeletes] = useState(new Set());
  const [confirmVariantDialog, setConfirmVariantDialog] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchProduct = useCallback(async () => {
    try {
      const productRes = await productAPI.get(productId);
      const p = productRes.data;
      setProduct(p);
      setFormData({
        name: p.name || '', sku: p.sku || '', price: p.price || '',
        compare_at_price: p.compare_at_price || '', stock: p.stock ?? '',
        description: p.description || '',
        category: p.category || '', product_type: p.product_type || 'single',
        is_active: p.is_active ?? true, is_featured: p.is_featured ?? false,
      });
      const attrs = p.selected_attributes || [];
      setAttributes(attrs);
      setCatalogs(p.variants || []);
      setMedia(p.media || []);
      const initialSelections = {};
      attrs.forEach(attr => { initialSelections[attr.attribute] = []; });
      setSelections(initialSelections);
    } catch {
      toast.error('Failed to reload product');
    }
  }, [productId, setFormData]);

  const fetchData = useCallback(async () => {
    try {
      const [productRes] = await Promise.all([
        productAPI.get(productId),
        fetchCategories(), // reads from cache if fresh
      ]);

      const p = productRes.data;
      setProduct(p);

      const initialFormData = {
        name: p.name || '', sku: p.sku || '', price: p.price || '',
        compare_at_price: p.compare_at_price || '', stock: p.stock ?? '',
        description: p.description || '',
        category: p.category || '', product_type: p.product_type || 'single',
        is_active: p.is_active ?? true, is_featured: p.is_featured ?? false,
      };
      setFormData(initialFormData);
      setOriginalData(initialFormData);

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
  }, [productId, router, setFormData, fetchCategories]);

  useEffect(() => {
    fetchData();
  }, [productId, fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Product name is required' });
      toast.error('Product name is required');
      return;
    }
    if (!formData.sku.trim()) {
      setErrors({ sku: 'SKU is required' });
      toast.error('SKU is required');
      return;
    }
    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      setErrors({ price: 'Price is required' });
      toast.error('Price is required');
      return;
    }
    if (formData.price.split('.')[0].replace(/\D/g, '').length > 8) {
      setErrors({ price: 'Please enter a valid price (maximum 8 digits allowed).' });
      toast.error('Please enter a valid price (maximum 8 digits allowed).');
      return;
    }
    if (formData.compare_at_price && formData.compare_at_price.split('.')[0].replace(/\D/g, '').length > 8) {
      setErrors({ compare_at_price: 'Please enter a valid price (maximum 8 digits allowed).' });
      toast.error('Please enter a valid price (maximum 8 digits allowed).');
      return;
    }
    if (formData.compare_at_price && Number.parseFloat(formData.compare_at_price) <= Number.parseFloat(formData.price)) {
      setErrors({ compare_at_price: 'Compare price must be higher than selling price' });
      toast.error('Compare price must be higher than selling price');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(), sku: formData.sku.trim().toUpperCase(),
        price: Number.parseFloat(formData.price).toFixed(2),
        compare_at_price: formData.compare_at_price ? Number.parseFloat(formData.compare_at_price).toFixed(2) : null,
        stock: formData.product_type === 'single' ? Number.parseInt(formData.stock) || 0 : undefined,
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

      // Save dirty variants
      const dirtyVariants = catalogs.filter(c => !c.is_new && c.isDirty && !pendingVariantDeletes.has(c.id));
      if (dirtyVariants.length > 0) {
        await Promise.all(
          dirtyVariants.map(v => productAPI.updateVariant(productId, v.id, {
            stock: Number.parseInt(v.stock) || 0,
            price: v.price ? Number.parseFloat(v.price) : null,
          }).catch(() => null))
        );
        setCatalogs(prev => prev.map(c => dirtyVariants.find(d => d.id === c.id) ? { ...c, isDirty: false } : c));
      }

      toast.success('Product saved!');
      clearDraft();
      invalidateDashboard(activeStore?.id);
      invalidateProducts();
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
      } else if (current.includes(valueId)) {
          return { ...prev, [attributeId]: current.filter(id => id !== valueId) };
        } else {
          return { ...prev, [attributeId]: [...current, valueId] };
        }
    });
  };

  const generateCombinations = () => {
    const attributeValues = Object.entries(selections)
      .map(([attrId, valueIds]) => ({ attributeId: Number.parseInt(attrId), values: valueIds }))
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
      const combinations = cartesian(...valueSets);
      return combinations.map(combo => ({ attribute_values: combo }));
    }
  };

  const updateCatalogField = (catalogId, field, value) => {
    setCatalogs(prev => prev.map(c => c.id === catalogId ? { ...c, [field]: value } : c));
  };

  const getComboKey = (attrValues) => {
    if (!attrValues) return '';
    return attrValues
      .map(val => typeof val === 'object' ? val.value_id : val)
      .map(String)
      .sort()
      .join('-');
  };

  const handleAddCatalog = () => {
    const combinations = generateCombinations();
    if (combinations.length === 0) return;

    let added = 0;
    let skipped = 0;
    const currentKeys = new Set(catalogs.map(c => getComboKey(c.attribute_values)));
    const newCatalogs = [];

    combinations.forEach((combo, idx) => {
      const key = getComboKey(combo.attribute_values);
      if (currentKeys.has(key)) {
        skipped++;
      } else {
        newCatalogs.push({
          id: `temp-${Date.now()}-${idx}`,
          attribute_values: combo.attribute_values,
          price: product.price, stock: 0, is_new: true,
        });
        currentKeys.add(key);
        added++;
      }
    });

    if (newCatalogs.length > 0) {
      setCatalogs([...catalogs, ...newCatalogs]);
    }

    if (skipped > 0) {
      if (added === 0 && singleCatalogMode) {
        toast.error('This combination already exists');
      } else {
        toast.info(`${added} added, ${skipped} duplicates skipped`);
      }
    } else if (added > 0) {
      toast.success(`${added} catalog(s) added`);
    }

    const resetSelections = {};
    attributes.forEach(attr => { resetSelections[attr.attribute] = []; });
    setSelections(resetSelections);
  };

  const handleGenerateCatalog = async () => {
    const newCatalogs = catalogs.filter(c => c.is_new);
    if (newCatalogs.length === 0) { toast.error('No new catalogs to generate'); return; }

    for (let i = 0; i < newCatalogs.length; i++) {
      const c = newCatalogs[i];
      if (c.price && String(c.price).split('.')[0].replace(/\D/g, '').length > 8) {
        toast.error('Catalog variant price cannot exceed 8 digits');
        return;
      }
      if (c.stock && String(c.stock).replace(/\D/g, '').length > 5) {
        toast.error('Please enter a valid stock (maximum 5 digits allowed).');
        return;
      }
    }

    setSubmitting(true);
    try {
      const selectedCombinations = newCatalogs.map(c => ({
        attribute_values: c.attribute_values,
        price: Number.parseFloat(c.price) || Number.parseFloat(product.price),
        stock: Number.parseInt(c.stock) || 0,
      }));
      await productAPI.generateCatalog(productId, {
        single_catalog_mode: selectedCombinations.length === 1,
        selected_combinations: selectedCombinations,
      });
      toast.success(`Generated ${newCatalogs.length} variant(s)!`);
      fetchProduct(); // only product data changed, no need to re-fetch categories
    } catch (err) {
      const errData = err?.response?.data;
      let msg = 'Failed to generate catalog';
      if (errData?.error) {
        msg = errData.error;
      } else if (errData?.selected_combinations && Array.isArray(errData.selected_combinations)) {
        const firstComboErr = errData.selected_combinations.find(e => e && Object.keys(e).length > 0);
        if (firstComboErr) {
           const firstField = Object.values(firstComboErr)[0];
           msg = Array.isArray(firstField) ? firstField[0] : firstField;
        }
      } else if (errData && typeof errData === 'object') {
        const firstField = Object.values(errData)[0];
        msg = Array.isArray(firstField) ? firstField[0] : JSON.stringify(errData);
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const removeCatalog = (catalogId) => {
    setCatalogs(catalogs.filter(c => c.id !== catalogId));
  };

  const handleSaveVariant = async (catalog) => {
    if (catalog.price && String(catalog.price).split('.')[0].replace(/\D/g, '').length > 8) {
      toast.error('Please enter a valid price (maximum 8 digits allowed).');
      return;
    }
    if (catalog.stock && String(catalog.stock).replace(/\D/g, '').length > 5) {
      toast.error('Please enter a valid stock (maximum 5 digits allowed).');
      return;
    }

    try {
      await productAPI.updateVariant(productId, catalog.id, {
        stock: Number.parseInt(catalog.stock) || 0,
        price: catalog.price ? Number.parseFloat(catalog.price) : null,
      });
      toast.success('Variant updated!');
      setCatalogs(prev => prev.map(c => c.id === catalog.id ? { ...c, isDirty: false } : c));
    } catch (err) {
      const errData = err?.response?.data;
      let msg = 'Failed to update variant';
      if (errData?.error) {
        msg = errData.error;
      } else if (errData && typeof errData === 'object') {
        const firstField = Object.values(errData)[0];
        msg = Array.isArray(firstField) ? firstField[0] : JSON.stringify(errData);
      }
      toast.error(msg);
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
      <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
    </div>
  );

  if (!product) return null;

  const variantPlural = pendingVariantDeletes.size > 1 ? 's' : '';
  const saveButtonLabel = pendingVariantDeletes.size > 0
    ? `Save & Delete ${pendingVariantDeletes.size} Variant${variantPlural}`
    : 'Save Changes';

  const hasFormChanges = originalData && (
    formData.name !== originalData.name ||
    formData.sku !== originalData.sku ||
    Number.parseFloat(formData.price || 0) !== Number.parseFloat(originalData.price || 0) ||
    Number.parseFloat(formData.compare_at_price || 0) !== Number.parseFloat(originalData.compare_at_price || 0) ||
    formData.stock !== originalData.stock ||
    formData.description !== originalData.description ||
    formData.is_active !== originalData.is_active ||
    formData.is_featured !== originalData.is_featured
  );
  const hasVariantChanges = pendingVariantDeletes.size > 0 ||
    catalogs.some(c => c.is_new) ||
    catalogs.some(c => c.isDirty);
  const hasChanges = hasFormChanges || hasVariantChanges;

  return (
    <div className="admin-page">
      <div className="admin-container">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/products')} className="hover:text-violet-500 transition-colors">
          Products
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">{product.name}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push('/products')}
            className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 hover:text-violet-500 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-7 h-7 text-slate-900 dark:text-white" strokeWidth={2.5} />
          </button>
          <h1 className="admin-title">Edit Product</h1>
        </div>
      </div>

      {/* ── PRODUCT DETAILS FORM ── */}
      <form id="edit-product-form" onSubmit={handleSave} noValidate className="space-y-8 mb-8">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-violet-500/10 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-violet-500/5">
            <Info className="w-5 h-5 text-violet-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="product-name" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Product Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input id="product-name" type="text" className={(errors.name ? INPUT_ERROR_CLS : INPUT_CLS) + ' pr-16'}
                  value={formData.name}
                  maxLength={MAX_NAME_LENGTH}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9- ]/g, '');
                    if (value.length <= MAX_NAME_LENGTH) {
                      setFormData({ ...formData, name: value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }
                  }}
                />
                <span className="absolute right-3 bottom-1 text-xs text-slate-400 dark:text-gray-500 pointer-events-none">{formData.name.length}/{MAX_NAME_LENGTH}</span>
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <label htmlFor="product-sku" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                SKU <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input id="product-sku" type="text" className={(errors.sku ? INPUT_ERROR_CLS : INPUT_CLS) + ' pr-14'}
                  value={formData.sku}
                  maxLength={MAX_SKU_LENGTH}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                    if (value.length <= MAX_SKU_LENGTH) {
                      setFormData({ ...formData, sku: value });
                      if (errors.sku) setErrors({ ...errors, sku: null });
                    }
                  }}
                />
                <span className="absolute right-3 bottom-1 text-xs text-slate-400 dark:text-gray-500 pointer-events-none">{formData.sku.length}/{MAX_SKU_LENGTH}</span>
              </div>
              {errors.sku && <p className="text-xs text-red-500">{errors.sku}</p>}
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label htmlFor="product-price" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Price ({activeStore?.currency || 'USD'}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-medium">{CURRENCY_SYMBOLS[activeStore?.currency] || '$'}</span>
                <input id="product-price" type="text" inputMode="numeric" pattern="[0-9]*"
                  className={(errors.price ? INPUT_ERROR_CLS : INPUT_CLS) + ' pl-8'}
                  value={formData.price}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, price: val });
                    if (errors.price) setErrors({ ...errors, price: null });
                  }}
                  onFocus={() => {
                    if (formData.price && String(formData.price).endsWith('.00')) {
                      setFormData({ ...formData, price: String(formData.price).replace(/\.00$/, '') });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val && !isNaN(val)) {
                      setFormData({ ...formData, price: Number.parseFloat(val).toFixed(2) });
                    }
                  }}
                />
              </div>
              {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
            </div>

            {/* Compare at Price */}
            <div className="space-y-1.5">
              <label htmlFor="compare-at-price" className="text-sm font-semibold text-slate-700 dark:text-gray-300">Compare at Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-medium">{CURRENCY_SYMBOLS[activeStore?.currency] || '$'}</span>
                <input id="compare-at-price" type="text" inputMode="numeric" pattern="[0-9]*"
                  placeholder="Original price (optional)"
                  className={(errors.compare_at_price ? INPUT_ERROR_CLS : INPUT_CLS) + ' pl-8'}
                  value={formData.compare_at_price}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, compare_at_price: val });
                    if (errors.compare_at_price) setErrors({ ...errors, compare_at_price: null });
                  }}
                  onFocus={() => {
                    if (formData.compare_at_price && String(formData.compare_at_price).endsWith('.00')) {
                      setFormData({ ...formData, compare_at_price: String(formData.compare_at_price).replace(/\.00$/, '') });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val && !isNaN(val)) {
                      setFormData({ ...formData, compare_at_price: Number.parseFloat(val).toFixed(2) });
                    }
                  }}
                />
              </div>
              {errors.compare_at_price && <p className="text-xs text-red-500">{errors.compare_at_price}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="product-category" className="text-sm font-semibold text-slate-700 dark:text-gray-300">Category</label>
              <div className="relative">
                <select id="product-category" className={SELECT_CLS + ' opacity-60 cursor-not-allowed'}
                  value={formData.category}
                  disabled
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stock — single only */}
            {formData.product_type === 'single' && (
              <div className="space-y-1.5">
                <label htmlFor="product-stock" className="text-sm font-semibold text-slate-700 dark:text-gray-300">Stock</label>
                <input id="product-stock" type="text" inputMode="numeric" className={INPUT_CLS}
                  value={formData.stock}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, stock: val });
                  }}
                />
                {(product?.reserved ?? 0) > 0 && (
                  <p className="text-xs text-violet-500 mt-1">{product.reserved} reserved</p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="product-description" className="text-sm font-semibold text-slate-700 dark:text-gray-300">Description</label>
              <div className="relative">
                <textarea
                  id="product-description"
                  rows={4}
                  placeholder="Describe your product in detail..."
                  className={INPUT_CLS + ' resize-none pr-16'}
                  value={formData.description}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= MAX_DESCRIPTION_LENGTH) {
                      setFormData({ ...formData, description: value });
                    }
                  }}
                />
                <span className="absolute right-3 bottom-1 text-xs text-slate-400 dark:text-gray-500 pointer-events-none">{formData.description.length}/{MAX_DESCRIPTION_LENGTH}</span>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6 pt-4 mt-4 border-t border-violet-500/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded accent-violet-500"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-5 h-5 rounded accent-violet-500"
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
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-violet-500/10 p-6 md:p-8 shadow-sm">
            <div className="mb-6 pb-4 border-b border-violet-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="w-5 h-5 text-violet-500" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Select Attribute Value</h2>
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Single Catalog</span>
                <button
                  type="button"
                  onClick={() => setSingleCatalogMode(!singleCatalogMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${singleCatalogMode ? 'bg-violet-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow transition-transform ${singleCatalogMode ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-gray-700">
              {attributes.map((attr, attrIdx) => (
                <div key={attr.id} className={`${attrIdx > 0 ? 'pt-5' : ''} ${attrIdx < attributes.length - 1 ? 'pb-5' : ''}`}>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-3">{attr.attribute_name}</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {attr.attribute_values?.map((val) => {
                      const isSelected = selections[attr.attribute]?.includes(val.id);
                      return (
                        <label
                          key={val.id}
                          className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full cursor-pointer transition-all border ${
                            isSelected ? 'border-violet-500 bg-violet-500/5' : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-slate-300'
                          }`}
                        >
                          {singleCatalogMode ? (
                            /* Radio circle */
                            <span className={`w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'border-violet-500' : 'border-slate-300'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-violet-500" />}
                            </span>
                          ) : (
                            /* Checkbox square */
                            <span className={`w-4 h-4 sm:w-[18px] sm:h-[18px] rounded flex items-center justify-center flex-shrink-0 transition-colors border ${
                              isSelected ? 'border-violet-500 bg-violet-500' : 'border-slate-300'
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
                className="w-full sm:w-auto px-8 py-3 rounded-lg font-bold border-2 border-violet-500 text-violet-500 hover:bg-violet-500/5 active:scale-95 transition-all"
              >
                Add
              </button>
            </div>
          </section>

          {/* Added Catalogs */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-violet-500/10 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-violet-500/5">
              <Package className="w-5 h-5 text-violet-500" />
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
                  <thead className="bg-slate-50 dark:bg-gray-700/50 border-b border-violet-500/5">
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

                      let rowBg = '';
                      if (isPendingDelete) rowBg = 'bg-red-50 opacity-60';
                      else if (isNew) rowBg = 'bg-violet-500/5';
                      else if (isOutOfStock) rowBg = 'bg-red-50';

                      return (
                        <tr
                          key={catalog.id}
                          className={`transition-all ${rowBg}`}
                        >
                          <td className="px-4 py-3">
                            <div className={`flex flex-wrap gap-1 ${isPendingDelete ? 'line-through' : ''}`}>
                              {catalog.attribute_values?.map((val) => (
                                <span key={typeof val === 'object' ? val.id : val} className="px-2 py-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded text-xs">
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
                              isNew ? <span className="text-violet-500 text-xs italic">New</span> : '—'
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="text" inputMode="numeric"
                              value={catalog.stock ?? 0}
                              disabled={isPendingDelete}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                updateCatalogField(catalog.id, 'stock', val);
                                if (!isNew) updateCatalogField(catalog.id, 'isDirty', true);
                              }}
                              className="w-24 h-10 px-2 border border-violet-500/20 bg-violet-500/5 rounded-lg text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              placeholder="0"
                            />
                            {(catalog.reserved ?? 0) > 0 && (
                              <p className="text-xs text-violet-500 mt-1">{catalog.reserved} reserved</p>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="text" inputMode="decimal"
                              value={catalog.price ?? ''}
                              disabled={isPendingDelete}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                updateCatalogField(catalog.id, 'price', val);
                                if (!isNew) updateCatalogField(catalog.id, 'isDirty', true);
                              }}
                              onFocus={() => {
                                if (catalog.price && String(catalog.price).endsWith('.00')) {
                                  updateCatalogField(catalog.id, 'price', String(catalog.price).replace(/\.00$/, ''));
                                }
                              }}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val && !isNaN(val)) {
                                  updateCatalogField(catalog.id, 'price', Number.parseFloat(val).toFixed(2));
                                }
                              }}
                              className="w-28 h-10 px-2 border border-violet-500/20 bg-violet-500/5 rounded-lg text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              placeholder={product.price}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex gap-2 items-center">
                              {isNew && (
                                <button
                                  onClick={() => removeCatalog(catalog.id)}
                                  className="px-3 py-1 text-red-500 hover:text-red-700 dark:text-red-400 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              )}
                              {!isNew && isPendingDelete && (
                                <button
                                  onClick={() => undoPendingVariantDelete(catalog.id)}
                                  title="Restore this variant"
                                  className="flex items-center gap-1 px-3 py-1 text-violet-500 hover:text-violet-500/80 text-sm font-medium border border-violet-500/20 rounded-lg hover:bg-violet-500/5"
                                >
                                  <Undo2 className="w-3.5 h-3.5" /> Restore
                                </button>
                              )}
                              {!isNew && !isPendingDelete && (
                                <>
                                  {catalog.isDirty && (
                                    <button
                                      onClick={() => handleSaveVariant(catalog)}
                                      className="px-3 py-1 text-white bg-violet-500 hover:bg-violet-500/90 text-sm font-bold rounded-lg shadow-sm"
                                    >
                                      Save
                                    </button>
                                  )}
                                  <button
                                    onClick={() => requestDeleteVariant(catalog.id, variantLabel)}
                                    className="h-10 px-3 text-red-500 hover:text-red-700 dark:text-red-400 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50"
                                  >
                                    <Trash2 className="w-5 h-5" />
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

            {catalogs.some(c => c.is_new) && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleGenerateCatalog}
                  disabled={submitting}
                  className="px-8 py-3 bg-violet-500 text-white font-bold rounded-lg shadow-lg shadow-violet-500/20 hover:bg-violet-500/90 active:scale-95 transition-all disabled:opacity-50"
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
        attributeValues={
          product.product_type === 'catalog'
            ? (attributes || []).flatMap(attr =>
                (attr.attribute_values || []).map(v => ({
                  id: v.id,
                  value: v.value,
                  attribute_name: attr.attribute_name,
                  attribute_id: attr.attribute,
                }))
              )
            : []
        }
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
          className="flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-lg font-bold border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
        >
          {pendingVariantDeletes.size > 0 ? 'Restore Deletions' : 'Cancel'}
        </button>
        <button
          type="submit"
          form="edit-product-form"
          disabled={saving || !hasChanges}
          className="flex-1 sm:flex-none px-4 sm:px-12 py-3 rounded-lg font-bold bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </span>
          ) : saveButtonLabel}
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
    </div>
  );
}
