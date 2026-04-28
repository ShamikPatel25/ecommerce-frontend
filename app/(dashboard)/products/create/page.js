'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, categoryAPI, attributeAPI } from '@/lib/api';
import { useFormDraft } from '@/hooks/useFormDraft';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, Info, ImageIcon, ChevronDown,
  CloudUpload, Plus, Loader2, Sliders, Package, Trash2, Star,
} from 'lucide-react';

const INPUT_CLS =
  'w-full rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 py-3 text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-[#ff6600] ' +
  'focus:ring-2 focus:ring-[#ff6600]/20 transition-all ' +
  'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500';

const SELECT_CLS = INPUT_CLS + ' appearance-none pr-10';

/* ── Pure utility helpers (outside component) ────────────── */

const comboKey = (values) =>
  values.map((v) => v.valId).sort((a, b) => a - b).join('-');

const appendToCombo = (combo, arr) =>
  arr.map((val) => [...combo, val]);

const cartesian = (...arrays) =>
  arrays.reduce((acc, arr) => acc.flatMap((combo) => appendToCombo(combo, arr)), [[]]);

const findBestAttrMatch = (base, filteredAttrs) => {
  let bestMatch = null;
  let bestLen = 0;
  for (const a of filteredAttrs) {
    for (const v of (a.values || [])) {
      const valLower = v.value.toLowerCase();
      const valNorm = valLower.replaceAll(/[-\s().+,]/g, '_');
      if ((base.includes(valNorm) || base.includes(valLower)) && valNorm.length > bestLen) {
        bestMatch = v.id;
        bestLen = valNorm.length;
      }
    }
  }
  return bestMatch;
};

const detectAttrFromFilename = (filename, selAttrs, attrs) => {
  if (!selAttrs || selAttrs.length === 0 || !attrs || attrs.length === 0) return null;
  const base = filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replaceAll(/[-\s().+,]/g, '_');
  const filteredAttrs = attrs.filter((a) => selAttrs.includes(a.id));
  return findBestAttrMatch(base, filteredAttrs);
};

const mapValuesToEntries = (attr, selIds) =>
  selIds.map((vid) => {
    const val = attr.values.find((v) => String(v.id) === String(vid));
    return { attrId: attr.id, attrName: attr.name, valId: val.id, valName: val.value };
  });

const buildMediaFormData = (img, index) => {
  const fd = new FormData();
  fd.append('file', img.file);
  fd.append('media_type', 'image');
  fd.append('alt_text', img.file.name || '');
  fd.append('order', String(img.isMain ? 0 : index + 1));
  if (img.isMain) fd.append('is_thumbnail', 'true');
  if (img.attribute_value_id) fd.append('attribute_value_id', img.attribute_value_id);
  return fd;
};

const selectThumbnail = async (productId, thumbnailMediaId, firstUploadedId) => {
  const thumbId = thumbnailMediaId || firstUploadedId;
  if (thumbId) {
    try { await productAPI.setThumbnail(productId, thumbId); } catch { /* best-effort */ }
  }
};

const groupImagesByAttribute = (images, getAttrValueLabel) => {
  const generalImages = images
    .map((img, idx) => ({ ...img, _idx: idx }))
    .filter((img) => !img.attribute_value_id);

  const byValue = {};
  images.forEach((img, idx) => {
    if (!img.attribute_value_id) return;
    if (!byValue[img.attribute_value_id]) {
      byValue[img.attribute_value_id] = { label: getAttrValueLabel(img.attribute_value_id), items: [] };
    }
    byValue[img.attribute_value_id].items.push({ ...img, _idx: idx });
  });

  return { generalImages, byValue };
};

const reclassifyImages = (prevImages, selAttrs, allAttrs) => {
  if (prevImages.length === 0) return prevImages;
  let changed = false;
  let reclassified = 0;
  const updated = prevImages.map((img) => {
    if (img.manualAttr) return img;
    const detected = detectAttrFromFilename(img.file?.name || '', selAttrs, allAttrs);
    if (detected !== img.attribute_value_id) {
      changed = true;
      if (detected) reclassified++;
      return { ...img, attribute_value_id: detected };
    }
    return img;
  });
  if (!changed) return prevImages;
  if (reclassified > 0) {
    setTimeout(() => toast.success(`${reclassified} image(s) auto-classified by filename`), 0);
  }
  return updated;
};

const validateCatalogFields = (formData, selectedAttributes, attributes) => {
  if (!formData.name.trim() || !formData.sku.trim() || !formData.price) {
    return 'Please fill in Product Name, SKU and Price first';
  }
  if (!formData.category) {
    return 'Please select a category for catalog products';
  }
  if (selectedAttributes.length === 0) {
    return attributes.length === 0
      ? 'This category has no attributes. Create attributes first.'
      : 'Please select at least one attribute';
  }
  return null;
};

const removeImageAtIndex = (images, idx) => {
  const removed = images[idx];
  const next = images.filter((_, i) => i !== idx);
  if (removed?.isMain && next.length > 0) {
    return next.map((img, i) => (i === 0 ? { ...img, isMain: true } : img));
  }
  return next;
};

const renderStep1ActionButton = (productType, submitting, attributes, selectedAttributes, onGenerateCatalog) => {
  if (productType === 'catalog') {
    return (
      <button
        type="button"
        onClick={onGenerateCatalog}
        disabled={attributes.length === 0 || selectedAttributes.length === 0}
        className="px-12 py-3 rounded-lg font-bold bg-[#ff6600] text-white shadow-lg shadow-orange-500/30 hover:bg-[#ff6600]/90 active:scale-95 transition-all disabled:opacity-50"
      >
        Generate Catalog
      </button>
    );
  }
  return (
    <button
      type="submit"
      disabled={submitting}
      className="px-12 py-3 rounded-lg font-bold bg-[#ff6600] text-white shadow-lg shadow-orange-500/30 hover:bg-[#ff6600]/90 active:scale-95 transition-all disabled:opacity-50"
    >
      {submitting ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Creating&hellip;
        </span>
      ) : 'Create Product'}
    </button>
  );
};

/* ── Component ───────────────────────────────────────────── */

export default function CreateProductPage() {
  const router = useRouter();

  const [categories,          setCategories]          = useState([]);
  const [attributes,          setAttributes]          = useState([]);
  const [selectedAttributes,  setSelectedAttributes, clearSelAttrDraft]  = useFormDraft('product-create-selattr', []);
  const [loading,             setLoading]             = useState(true);
  const [submitting,          setSubmitting]          = useState(false);
  const [images,              setImages]              = useState([]);
  const imagesRef = useRef([]);
  const fileInputRef = useRef(null);

  // Step 2: catalog variant builder
  const [step, setStep, clearStepDraft]                       = useFormDraft('product-create-step', 1);
  const [singleMode, setSingleMode]           = useState(true);
  const [catalogCombos, setCatalogCombos, clearCombosDraft]     = useFormDraft('product-create-combos', []);
  const [comboSelections, setComboSelections, clearComboSelDraft] = useFormDraft('product-create-combosel', {});

  const [formData, setFormData, clearFormDraft] = useFormDraft('product-create', {
    name:             '',
    sku:              '',
    price:            '',
    compare_at_price: '',
    stock:            '',
    description:      '',
    category:         '',
    product_type:     'single',
    is_active:        true,
  });
  const [skuError, setSkuError] = useState('');

  /* ── fetch categories ── */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryAPI.list();
      setCategories(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* ── fetch attributes when category changes ── */
  const fetchAttributes = async (categoryId) => {
    try {
      const res  = await attributeAPI.byCategory(categoryId);
      setAttributes(res.data?.attributes || []);
    } catch {
      setAttributes([]);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
    if (categoryId) fetchAttributes(categoryId);
    else setAttributes([]);
  };

  /* ── image handling ── */
  useEffect(() => { imagesRef.current = images; }, [images]);

  const [selectedUploadAttr, setSelectedUploadAttr] = useState('');

  // Re-classify existing images when attributes are selected/changed
  useEffect(() => {
    if (formData.product_type !== 'catalog' || selectedAttributes.length === 0 || attributes.length === 0) return;
    setImages((prev) => reclassifyImages(prev, selectedAttributes, attributes));
  }, [selectedAttributes, attributes, formData.product_type]);

  const addImageEntry = (result, file) => {
    const manual = selectedUploadAttr || null;
    const attrId = manual || detectAttrFromFilename(file.name, selectedAttributes, attributes) || null;
    setImages((prev) => [
      ...prev,
      { preview: result, file, isMain: prev.length === 0, attribute_value_id: attrId, manualAttr: !!manual },
    ]);
  };

  const addFiles = (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => addImageEntry(e.target.result, file);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    setImages((prev) => removeImageAtIndex(prev, idx));
  };

  const setMain = (idx) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isMain: i === idx })));
  };

  /* ── Step 1 → Step 2 (Generate Catalog clicked) ── */
  const handleGenerateCatalog = async () => {
    const validationError = validateCatalogFields(formData, selectedAttributes, attributes);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const res = await productAPI.checkSku(formData.sku.trim());
      if (res.data?.exists) {
        setSkuError('A product with this SKU already exists.');
        toast.error('A product with this SKU already exists.');
        return;
      }
    } catch {
      /* SKU check failed, will be validated on submit */
    }

    setSkuError('');
    resetSelections();
    setCatalogCombos([]);
    setStep(2);
  };

  const resetSelections = () => {
    const initial = {};
    selectedAttributes.forEach((id) => {
      initial[id] = singleMode ? '' : [];
    });
    setComboSelections(initial);
  };

  const handleToggleMode = () => {
    const newMode = !singleMode;
    setSingleMode(newMode);
    const initial = {};
    selectedAttributes.forEach((id) => {
      initial[id] = newMode ? '' : [];
    });
    setComboSelections(initial);
  };

  /* ── Combo builders (extracted to reduce cognitive complexity) ── */

  const buildSingleCombo = (selectedAttrs) => {
    for (const attr of selectedAttrs) {
      if (!comboSelections[attr.id]) {
        toast.error(`Please select a value for "${attr.name}"`);
        return null;
      }
    }

    const values = selectedAttrs.map((attr) => {
      const val = attr.values.find((v) => String(v.id) === String(comboSelections[attr.id]));
      return { attrId: attr.id, attrName: attr.name, valId: val.id, valName: val.value };
    });

    const key = comboKey(values);
    if (catalogCombos.some((c) => comboKey(c.values) === key)) {
      toast.error('This combination already exists');
      return null;
    }

    return { values, stock: '', price: '' };
  };

  const buildMultiCombos = (selectedAttrs) => {
    for (const attr of selectedAttrs) {
      const sel = comboSelections[attr.id] || [];
      if (sel.length === 0) {
        toast.error(`Please select at least one value for "${attr.name}"`);
        return null;
      }
    }

    const perAttr = selectedAttrs.map((attr) =>
      mapValuesToEntries(attr, comboSelections[attr.id] || [])
    );
    return cartesian(...perAttr);
  };

  const addMultiCombinations = (allCombinations) => {
    let added = 0;
    let skipped = 0;

    setCatalogCombos((prev) => {
      const next = [...prev];
      for (const combo of allCombinations) {
        const key = comboKey(combo);
        if (next.some((c) => comboKey(c.values) === key)) {
          skipped++;
        } else {
          next.push({ values: combo, stock: '', price: '' });
          added++;
        }
      }
      return next;
    });

    if (skipped > 0) toast.info(`${added} added, ${skipped} duplicates skipped`);
    else if (added > 0) toast.success(`${added} combination${added > 1 ? 's' : ''} added`);
  };

  const handleAddCombo = () => {
    const selectedAttrs = attributes.filter((a) => selectedAttributes.includes(a.id));

    if (singleMode) {
      const combo = buildSingleCombo(selectedAttrs);
      if (!combo) return;
      setCatalogCombos((prev) => [...prev, combo]);
    } else {
      const allCombinations = buildMultiCombos(selectedAttrs);
      if (!allCombinations) return;
      addMultiCombinations(allCombinations);
    }

    const reset = {};
    selectedAttributes.forEach((id) => { reset[id] = singleMode ? '' : []; });
    setComboSelections(reset);
  };

  const handleCheckboxToggle = (attrId, valIdStr, currentSel, isChecked) => {
    const updated = isChecked
      ? currentSel.filter((x) => x !== valIdStr)
      : [...currentSel, valIdStr];
    setComboSelections({ ...comboSelections, [attrId]: updated });
  };

  const removeCombo = (idx) => {
    setCatalogCombos((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateComboField = (idx, field, value) => {
    setCatalogCombos((prev) =>
      prev.map((c, i) => i === idx ? { ...c, [field]: value } : c)
    );
  };

  /* ── Submit helpers (extracted to reduce cognitive complexity) ── */

  const validateForm = async () => {
    if (formData.product_type === 'catalog') {
      if (step === 1) { handleGenerateCatalog(); return false; }
      if (catalogCombos.length === 0) {
        toast.error('Please add at least one catalog combination');
        return false;
      }
    }

    if (formData.product_type === 'single') {
      try {
        const res = await productAPI.checkSku(formData.sku.trim());
        if (res.data?.exists) {
          setSkuError('A product with this SKU already exists.');
          toast.error('A product with this SKU already exists.');
          return false;
        }
      } catch {
        /* variant duplicate check failed, will be validated on submit */
      }
      setSkuError('');
    }

    return true;
  };

  const prepareProductData = () => ({
    name:             formData.name.trim(),
    sku:              formData.sku.trim().toUpperCase(),
    price:            Number.parseFloat(formData.price).toFixed(2),
    compare_at_price: formData.compare_at_price ? Number.parseFloat(formData.compare_at_price).toFixed(2) : null,
    category:         formData.category || null,
    product_type:     formData.product_type,
    stock:            formData.product_type === 'single' ? Number.parseInt(formData.stock, 10) || 0 : 0,
    description:      formData.description.trim() || '',
    is_active:        formData.is_active,
    is_featured:      false,
  });

  const resolveProductId = async (data) => {
    const response = await productAPI.create(data);
    let productId = response.data?.id;

    if (!productId) {
      const allProducts = await productAPI.list();
      const created = (allProducts.data?.results || allProducts.data || []).find(
        (p) => p.sku === data.sku
      );
      productId = created?.id;
    }

    return productId;
  };

  const uploadMediaFiles = async (productId) => {
    const currentImages = imagesRef.current.length > 0 ? imagesRef.current : images;
    if (currentImages.length === 0) return;

    let failedCount = 0;
    let thumbnailMediaId = null;
    let firstUploadedId = null;

    for (let i = 0; i < currentImages.length; i++) {
      const img = currentImages[i];
      if (!img.file) { failedCount++; continue; }
      try {
        const fd = buildMediaFormData(img, i);
        const uploadRes = await productAPI.uploadMedia(productId, fd);
        const mediaId = uploadRes.data?.id;
        if (!firstUploadedId && mediaId) firstUploadedId = mediaId;
        if (img.isMain && mediaId) thumbnailMediaId = mediaId;
      } catch {
        failedCount++;
      }
    }

    await selectThumbnail(productId, thumbnailMediaId, firstUploadedId);
    if (failedCount > 0) {
      toast.error(`${failedCount} image(s) failed to upload. You can add them from the edit page.`);
    }
  };

  const createVariants = async (productId) => {
    try {
      await productAPI.selectAttributes(productId, selectedAttributes);
    } catch {
      toast.error('Product created but failed to attach attributes.');
      return false;
    }

    try {
      const combinations = catalogCombos.map((c) => ({
        attribute_values: c.values.map((v) => v.valId),
        price: c.price ? Number.parseFloat(c.price).toFixed(2) : null,
        stock: Number.parseInt(c.stock, 10) || 0,
      }));
      await productAPI.generateCatalog(productId, {
        single_catalog_mode: false,
        selected_combinations: combinations,
      });
      toast.success('Product & catalog variants created!');
    } catch {
      toast.error('Product created but catalog generation failed.');
    }

    return true;
  };

  /* ── Final submit (Create Product) ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    setSubmitting(true);

    try {
      const data = prepareProductData();
      const productId = await resolveProductId(data);

      if (!productId) {
        toast.error('Product created but ID not found. Check the products list.');
        router.push('/products');
        setSubmitting(false);
        return;
      }

      await uploadMediaFiles(productId);

      if (formData.product_type === 'catalog') {
        const success = await createVariants(productId);
        if (!success) {
          router.push('/products');
          setSubmitting(false);
          return;
        }
      } else {
        toast.success('Product created!');
      }

      clearFormDraft(); clearSelAttrDraft(); clearStepDraft(); clearCombosDraft(); clearComboSelDraft();
      router.push('/products');
    } catch (error) {
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        const first = Object.values(errData)[0];
        toast.error(Array.isArray(first) ? first[0] : 'Failed to create product');
      } else {
        toast.error('Failed to create product');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Image gallery render helpers ── */

  const getAttrValueLabel = (attrValueId) => {
    const attr = attributes.find((a) => a.values?.some((v) => String(v.id) === String(attrValueId)));
    const val = attr?.values?.find((v) => String(v.id) === String(attrValueId));
    return attr && val ? `${attr.name}: ${val.value}` : `Attribute #${attrValueId}`;
  };

  const renderImageCard = (img) => (
    <div
      key={img._idx}
      onClick={() => setMain(img._idx)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMain(img._idx); } }}
      role="button"
      tabIndex={0}
      className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
        img.isMain ? 'border-[#ff6600] ring-2 ring-[#ff6600]/20' : 'border-slate-200 dark:border-gray-600 hover:border-[#ff6600]/40'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.preview} alt="" className="w-full h-full object-cover" />
      {img.isMain && (
        <span className="absolute top-2 left-2 bg-[#ff6600] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3 fill-white" /> THUMBNAIL
        </span>
      )}
      {!img.isMain && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMain(img._idx); }}
          className="absolute top-2 left-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full text-[#ff6600] shadow-sm hover:bg-[#ff6600]/10 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Set as Thumbnail"
        >
          <Star className="w-4 h-4" />
        </button>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); removeImage(img._idx); }}
        className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full text-red-500 shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded truncate">
        {img.file?.name || ''}
      </span>
    </div>
  );

  const renderImageGallery = () => {
    if (images.length === 0) return null;

    const { generalImages, byValue } = groupImagesByAttribute(images, getAttrValueLabel);

    return (
      <div className="mt-4 space-y-6">
        {generalImages.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">General Product Images</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {generalImages.map(renderImageCard)}
              <button
                type="button"
                onClick={() => { setSelectedUploadAttr(''); fileInputRef.current?.click(); }}
                className="aspect-square rounded-xl border-2 border-dashed border-[#ff6600]/20 bg-slate-50 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:border-[#ff6600]/40 hover:bg-[#ff6600]/5 transition-colors appearance-none p-0 m-0"
              >
                <Plus className="w-6 h-6 text-slate-300 dark:text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {Object.entries(byValue).map(([valueId, group]) => (
          <div key={valueId}>
            <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">{group.label}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {group.items.map(renderImageCard)}
              <button
                type="button"
                onClick={() => { setSelectedUploadAttr(valueId); fileInputRef.current?.click(); }}
                className="aspect-square rounded-xl border-2 border-dashed border-[#ff6600]/20 bg-slate-50 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:border-[#ff6600]/40 hover:bg-[#ff6600]/5 transition-colors appearance-none p-0 m-0"
              >
                <Plus className="w-6 h-6 text-slate-300 dark:text-gray-500" />
              </button>
            </div>
          </div>
        ))}

        {generalImages.length === 0 && Object.keys(byValue).length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img, idx) => renderImageCard({ ...img, _idx: idx }))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin" />
    </div>
  );

  const selectedAttrObjects = attributes.filter((a) => selectedAttributes.includes(a.id));

  /* ════════════════════════════════════════════════════════════════ */
  /*  STEP 2: Select Attribute Values                                */
  /* ════════════════════════════════════════════════════════════════ */
  if (step === 2 && formData.product_type === 'catalog') {
    return (
      <div className="p-4 md:p-8 max-w-5xl">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
          <button onClick={() => router.push('/products')} className="hover:text-[#ff6600] transition-colors">
            Products
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => setStep(1)} className="hover:text-[#ff6600] transition-colors">
            Create Product
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-900 dark:text-white">Select Attribute Values</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Select Attribute Values</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Build variant combinations for <span className="font-semibold text-slate-700 dark:text-gray-300">{formData.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 dark:border-gray-600 hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Select Values Card */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm mb-8">
          {/* Header + Toggle */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#ff6600]" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Attribute Value</h2>
            </div>

            {/* Single Catalog Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Single Catalog</span>
              <button
                type="button"
                onClick={handleToggleMode}
                className={`relative w-11 h-6 rounded-full transition-colors ${singleMode ? 'bg-[#ff6600]' : 'bg-slate-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${singleMode ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Attribute value selectors */}
          <div className="divide-y divide-slate-100 dark:divide-gray-700">
            {selectedAttrObjects.map((attr, attrIdx) => (
              <div key={attr.id} className={`${attrIdx > 0 ? 'pt-5' : ''} ${attrIdx < selectedAttrObjects.length - 1 ? 'pb-5' : ''}`}>
                <label className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-3 block">
                  {attr.name}
                </label>

                {singleMode ? (
                  /* ── Radio buttons ── */
                  <div className="flex flex-wrap gap-3">
                    {attr.values?.map((v) => {
                      const isSelected = String(comboSelections[attr.id]) === String(v.id);
                      return (
                        <label
                          key={v.id}
                          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full cursor-pointer transition-all border ${
                            isSelected ? 'border-[#ff6600] bg-[#ff6600]/5' : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <span className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'border-[#ff6600]' : 'border-slate-300 dark:border-gray-500'
                          }`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-[#ff6600]" />}
                          </span>
                          <input
                            type="radio"
                            name={`attr-${attr.id}`}
                            value={v.id}
                            checked={isSelected}
                            onChange={() => setComboSelections({ ...comboSelections, [attr.id]: String(v.id) })}
                            className="sr-only"
                          />
                          <span className="text-sm text-slate-700 dark:text-gray-300">{v.value}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  /* ── Checkboxes ── */
                  <div className="flex flex-wrap gap-3">
                    {attr.values?.map((v) => {
                      const currentSel = comboSelections[attr.id] || [];
                      const isChecked = currentSel.includes(String(v.id));
                      return (
                        <label
                          key={v.id}
                          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full cursor-pointer transition-all border ${
                            isChecked ? 'border-[#ff6600] bg-[#ff6600]/5' : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <span className={`w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 transition-colors border ${
                            isChecked ? 'border-[#ff6600] bg-[#ff6600]' : 'border-slate-300 dark:border-gray-500'
                          }`}>
                            {isChecked && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxToggle(attr.id, String(v.id), currentSel, isChecked)}
                            className="sr-only"
                          />
                          <span className="text-sm text-slate-700 dark:text-gray-300">{v.value}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add button */}
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-100 dark:border-gray-700">
            <button
              type="button"
              onClick={handleAddCombo}
              className="px-6 py-2.5 rounded-lg font-semibold border border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600]/5 active:scale-95 transition-all text-sm"
            >
              Add
            </button>
          </div>
        </section>

        {/* Added Combinations Table */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
            <Package className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Added Catalogs
              {catalogCombos.length > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-400 dark:text-gray-500">({catalogCombos.length})</span>
              )}
            </h2>
          </div>

          {catalogCombos.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-10 h-10 text-slate-200 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 dark:text-gray-500">No combinations added yet. Select values above and click Add.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-gray-700">
                    <th className="py-3 px-3 text-left font-semibold text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">#</th>
                    {selectedAttrObjects.map((attr) => (
                      <th key={attr.id} className="py-3 px-3 text-left font-semibold text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                        {attr.name}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-left font-semibold text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">Price</th>
                    <th className="py-3 px-3 text-left font-semibold text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">Stock</th>
                    <th className="py-3 px-3 text-right font-semibold text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogCombos.map((combo, idx) => (
                    <tr key={comboKey(combo.values)} className="border-b border-slate-50 dark:border-gray-700 hover:bg-[#ff6600]/5 transition-colors">
                      <td className="py-3 px-3 text-slate-400 dark:text-gray-500 font-mono">{idx + 1}</td>
                      {selectedAttrObjects.map((attr) => {
                        const val = combo.values.find((v) => v.attrId === attr.id);
                        return (
                          <td key={attr.id} className="py-3 px-3">
                            <span className="px-2.5 py-1 bg-[#ff6600]/10 text-[#ff6600] rounded-md font-semibold text-xs">
                              {val?.valName}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={formData.price || '0.00'}
                          value={combo.price}
                          onChange={(e) => updateComboField(idx, 'price', e.target.value)}
                          className="w-24 px-2 py-1.5 rounded-md border border-[#ff6600]/20 bg-[#ff6600]/5 text-sm focus:outline-none focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={combo.stock}
                          onChange={(e) => updateComboField(idx, 'stock', e.target.value)}
                          className="w-20 px-2 py-1.5 rounded-md border border-[#ff6600]/20 bg-[#ff6600]/5 text-sm focus:outline-none focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeCombo(idx)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              clearCombosDraft(); clearComboSelDraft(); clearStepDraft();
              setStep(1);
            }}
            className="px-8 py-3 rounded-lg font-bold border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || catalogCombos.length === 0}
            className="px-12 py-3 rounded-lg font-bold bg-[#ff6600] text-white shadow-lg shadow-orange-500/30 hover:bg-[#ff6600]/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating&hellip;
              </span>
            ) : 'Create Product'}
          </button>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════ */
  /*  STEP 1: Product Info + Select Attributes                       */
  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/products')} className="hover:text-[#ff6600] transition-colors">
          Products
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Create New Product</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create New Product</h1>
        <button
          type="button"
          onClick={() => router.push('/products')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/20 bg-white dark:bg-gray-800 dark:border-gray-600 hover:bg-[#ff6600]/5 transition-colors text-sm font-bold self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
      </div>

      <form id="create-product-form" onSubmit={handleSubmit} className="space-y-8">

        {/* ── Section 1: Basic Information ────────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
            <Info className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="product-name" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Product Name <span className="text-[#ff6600]">*</span>
              </label>
              <input
                id="product-name"
                type="text" required
                placeholder="e.g. Wireless Noise Cancelling Headphones"
                className={INPUT_CLS}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="product-sku" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                SKU <span className="text-[#ff6600]">*</span>
              </label>
              <input
                id="product-sku"
                type="text" required
                placeholder="barcode-123-xyz"
                className={`${INPUT_CLS} ${skuError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                value={formData.sku}
                onChange={(e) => { setFormData({ ...formData, sku: e.target.value }); setSkuError(''); }}
              />
              {skuError && <p className="text-xs text-red-500 font-medium">{skuError}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="product-price" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Price (USD) <span className="text-[#ff6600]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-medium">$</span>
                <input
                  id="product-price"
                  type="number" step="0.01" min="0" required
                  placeholder="0.00"
                  className={INPUT_CLS + ' pl-8'}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="product-compare-price" className="text-sm font-semibold text-slate-700 dark:text-gray-300">Compare at Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-medium">$</span>
                <input
                  id="product-compare-price"
                  type="number" step="0.01" min="0"
                  placeholder="Original price (optional)"
                  className={INPUT_CLS + ' pl-8'}
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="product-category" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Category {formData.product_type === 'catalog' && <span className="text-[#ff6600]">*</span>}
              </label>
              <div className="relative">
                <select
                  id="product-category"
                  className={SELECT_CLS}
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required={formData.product_type === 'catalog'}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="product-type" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Product Type <span className="text-[#ff6600]">*</span>
              </label>
              <div className="relative">
                <select
                  id="product-type"
                  className={SELECT_CLS}
                  value={formData.product_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData({ ...formData, product_type: newType });
                    setSelectedAttributes([]);
                    if (newType === 'catalog' && formData.category) fetchAttributes(formData.category);
                  }}
                >
                  <option value="single">Single Product</option>
                  <option value="catalog">Catalog (with variants)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
              </div>
            </div>

            {formData.product_type === 'single' && (
              <div className="space-y-1.5">
                <label htmlFor="product-stock" className="text-sm font-semibold text-slate-700 dark:text-gray-300">Stock</label>
                <input
                  id="product-stock"
                  type="number" min="0"
                  placeholder="0"
                  className={INPUT_CLS}
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            )}

            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="product-description" className="text-sm font-semibold text-slate-700 dark:text-gray-300">Description</label>
              <textarea
                id="product-description"
                rows={4}
                placeholder="Describe your product in detail..."
                className={INPUT_CLS + ' resize-none'}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* ── Section 2: Product Media ─────────────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
            <ImageIcon className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Media</h2>
          </div>

          <div className="space-y-5">
            {/* Attribute Value Selector + Upload Button */}
            <div className="flex flex-wrap items-end gap-4">
              {formData.product_type === 'catalog' && selectedAttributes.length > 0 && (
                <div>
                  <label htmlFor="upload-attr-select" className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5 block">
                    Upload images for:
                  </label>
                  <div className="relative w-64">
                    <select
                      id="upload-attr-select"
                      value={selectedUploadAttr}
                      onChange={(e) => setSelectedUploadAttr(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 transition-all font-medium truncate"
                    >
                      <option value="">General (Product Main)</option>
                      {attributes
                        .filter((a) => selectedAttributes.includes(a.id))
                        .flatMap((a) =>
                          (a.values || []).map((v) => (
                            <option key={v.id} value={v.id}>
                              {a.name}: {v.value}
                            </option>
                          ))
                        )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 cursor-pointer rounded-lg h-11 px-6 bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
              >
                <CloudUpload className="w-5 h-5" />
                <span>Upload Images</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />

            {renderImageGallery()}

            {images.length > 0 && (
              <p className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600] inline-block" />
                Click the <Star className="w-3 h-3 text-[#ff6600] inline" /> star to set an image as thumbnail.
              </p>
            )}
          </div>
        </section>

        {/* ── Section 3: Attributes (Catalog only) ────────────── */}
        {formData.product_type === 'catalog' && formData.category && (
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
              <Sliders className="w-5 h-5 text-[#ff6600]" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Attributes</h2>
            </div>

            {attributes.length === 0 ? (
              <div className="text-center py-8">
                <Sliders className="w-10 h-10 text-slate-300 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">No attributes found for this category</p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mb-4">Create attributes for this category first.</p>
                <button
                  type="button"
                  onClick={() => router.push('/attributes/create')}
                  className="px-6 py-2.5 rounded-lg font-bold bg-[#ff6600] text-white shadow-lg shadow-orange-500/20 hover:bg-[#ff6600]/90 transition-all text-sm"
                >
                  + Create Attribute
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
                  Choose attributes to generate variant combinations.
                </p>
                <div className="space-y-3">
                  {attributes.map((attr) => (
                    <label
                      key={attr.id}
                      htmlFor={`attr-select-${attr.id}`}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAttributes.includes(attr.id)
                          ? 'border-[#ff6600]/30 bg-[#ff6600]/5'
                          : 'border-slate-200 dark:border-gray-600 hover:border-[#ff6600]/20 hover:bg-slate-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        id={`attr-select-${attr.id}`}
                        type="checkbox"
                        aria-label={`Select ${attr.name} attribute`}
                        checked={selectedAttributes.includes(attr.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedAttributes([...selectedAttributes, attr.id]);
                          else setSelectedAttributes(selectedAttributes.filter((id) => id !== attr.id));
                        }}
                        className="w-5 h-5 rounded accent-[#ff6600]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">{attr.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {attr.values?.slice(0, 5).map((val) => (
                            <span key={val.id ?? val.value} className="px-2 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded text-xs">{val.value}</span>
                          ))}
                          {attr.values?.length > 5 && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 rounded text-xs">+{attr.values.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              clearFormDraft(); clearSelAttrDraft(); clearStepDraft(); clearCombosDraft(); clearComboSelDraft();
              router.push('/products');
            }}
            className="px-8 py-3 rounded-lg font-bold border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>

          {renderStep1ActionButton(formData.product_type, submitting, attributes, selectedAttributes, handleGenerateCatalog)}
        </div>

      </form>
    </div>
  );
}
