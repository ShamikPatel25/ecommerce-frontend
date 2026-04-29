'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Edit, Package, Tag, Layers,
  ImageIcon, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';

const STATUS_STYLES = {
  active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  inactive: 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400',
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  // Track selected value per attribute group (e.g. { Color: 10, Size: 20 })
  const [selectedValues, setSelectedValues] = useState({});

  const fetchProduct = useCallback(async () => {
    try {
      const [productRes, storefrontRes] = await Promise.all([
        productAPI.get(productId),
        productAPI.storefrontDetail(productId).catch(() => null),
      ]);
      setProduct(productRes.data);
      if (storefrontRes?.data) {
        setStorefront(storefrontRes.data);
      }
    } catch {
      router.push('/products');
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Auto-select first value of each attribute group on load
  useEffect(() => {
    if (!storefront?.attribute_groups?.length) return;
    const initial = {};
    storefront.attribute_groups.forEach(group => {
      if (group.values.length > 0) {
        initial[group.attribute_name] = group.values[0].value_id;
      }
    });
    setSelectedValues(initial);
  }, [storefront]);

  // Derive current images based on selected primary attribute (first group = Color)
  const { currentImages, currentThumbnails } = useMemo(() => {
    if (!storefront?.attribute_groups?.length) {
      // Fallback to all media
      const allMedia = product?.media || [];
      return {
        currentImages: allMedia.filter(m => m.media_type === 'image'),
        currentThumbnails: allMedia.filter(m => m.media_type === 'image'),
      };
    }

    const primaryGroup = storefront.attribute_groups[0];
    const primaryValueId = selectedValues[primaryGroup?.attribute_name];
    const selectedValueData = primaryGroup?.values?.find(v => v.value_id === primaryValueId);

    const generalImages = storefront.general_images || [];
    const valueImages = selectedValueData?.images || [];
    const all = [...valueImages, ...generalImages];

    return {
      currentImages: all,
      currentThumbnails: all,
    };
  }, [storefront, selectedValues, product]);

  // Set first image as selected when currentImages change
  useEffect(() => {
    if (currentImages.length > 0 && !currentImages.find(img => img.id === selectedImage?.id)) {
      setSelectedImage(currentImages[0]);
    }
  }, [currentImages, selectedImage]);

  // Get available variants for secondary attributes based on primary selection
  const getAvailableSecondaryValues = useCallback((groupName) => {
    if (!storefront?.attribute_groups?.length) return [];

    const primaryGroup = storefront.attribute_groups[0];
    const primaryValueId = selectedValues[primaryGroup?.attribute_name];
    const selectedValueData = primaryGroup?.values?.find(v => v.value_id === primaryValueId);

    if (!selectedValueData?.available_variants) return [];

    const secondaryData = selectedValueData.available_variants.find(
      av => av.attribute_name === groupName
    );
    return secondaryData?.available_values || [];
  }, [storefront, selectedValues]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const isCatalog = product.product_type === 'catalog';
  const totalStock = isCatalog
    ? (product.variants || []).reduce((sum, v) => sum + (v.stock ?? 0), 0)
    : product.stock ?? 0;

  const stockColor = totalStock === 0
    ? 'text-rose-600 bg-rose-50'
    : totalStock <= 10
      ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
      : 'text-emerald-600 bg-emerald-50';

  const hasStorefrontData = storefront?.attribute_groups?.length > 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <Link href="/products" className="hover:text-orange-500 transition-colors">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{product.name}</h1>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${product.is_active ? STATUS_STYLES.active : STATUS_STYLES.inactive}`}>
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
          {product.is_featured && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-700">Featured</span>
          )}
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button onClick={() => router.push('/products')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-sm font-bold">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Link href={`/products/${productId}/edit`} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-500/90 transition-colors text-sm font-bold shadow-sm">
            <Edit className="w-4 h-4" /> Edit Product
          </Link>
        </div>
      </div>

      {/* ── Amazon-style Product View ── */}
      {isCatalog && hasStorefrontData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center shadow-sm">
              {selectedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedImage.file_url || selectedImage.file}
                  alt={selectedImage.alt_text || product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon size={64} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">No image available</p>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {currentThumbnails.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {currentThumbnails.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage?.id === img.id
                        ? 'border-orange-500 ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-gray-700 hover:border-orange-500/40'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.file_url || img.file}
                      alt={img.alt_text}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info + Variant Selectors */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{product.name}</h2>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl font-black text-orange-500">${parseFloat(product.price).toFixed(2)}</span>
                {product.compare_at_price && (
                  <span className="text-lg text-slate-400 line-through">${parseFloat(product.compare_at_price).toFixed(2)}</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Package className="w-4 h-4" /> SKU: <span className="font-mono font-bold text-slate-700 dark:text-gray-300">{product.sku}</span></span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${stockColor}`}>
                  {totalStock === 0 ? 'Out of stock' : `${totalStock} total units`}
                </span>
              </div>
              {product.category_name && (
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-500" /> {product.category_name}
                </p>
              )}
              {product.description && (
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-4 whitespace-pre-line">{product.description}</p>
              )}
            </div>

            {/* Attribute Selectors */}
            {storefront.attribute_groups.map((group, groupIdx) => {
              const isPrimary = groupIdx === 0;
              const values = isPrimary
                ? group.values
                : getAvailableSecondaryValues(group.attribute_name);

              // Deduplicate secondary values by value_id
              const uniqueValues = isPrimary
                ? values
                : values.filter((v, i, arr) => arr.findIndex(x => x.value_id === v.value_id) === i);

              if (uniqueValues.length === 0) return null;

              return (
                <div key={group.attribute_name} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-3 uppercase tracking-wider">
                    {group.attribute_name}
                    {selectedValues[group.attribute_name] && (
                      <span className="ml-2 text-orange-500 normal-case">
                        : {isPrimary
                          ? group.values.find(v => v.value_id === selectedValues[group.attribute_name])?.value
                          : uniqueValues.find(v => v.value_id === selectedValues[group.attribute_name])?.value
                        }
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.map((val) => {
                      const valueId = isPrimary ? val.value_id : val.value_id;
                      const valueName = isPrimary ? val.value : val.value;
                      const isSelected = selectedValues[group.attribute_name] === valueId;
                      const stock = isPrimary ? null : val.stock;
                      const isOutOfStock = !isPrimary && stock === 0;

                      return (
                        <button
                          key={`${valueId}-${isPrimary ? '' : val.variant_id || ''}`}
                          onClick={() => {
                            setSelectedValues(prev => ({ ...prev, [group.attribute_name]: valueId }));
                          }}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                              : isOutOfStock
                                ? 'border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-gray-500 cursor-not-allowed line-through'
                                : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:border-orange-500/40'
                          }`}
                        >
                          {valueName}
                          {!isPrimary && stock !== null && stock > 0 && (
                            <span className="ml-1 text-xs text-emerald-600">({stock})</span>
                          )}
                          {isOutOfStock && (
                            <span className="ml-1 text-xs text-rose-500">(Sold out)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Non-catalog / fallback view ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column — Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-64 md:h-64 h-48 bg-slate-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  {(() => {
                    const firstImage = (product.media || []).find(m => m.is_thumbnail && m.media_type === 'image') || (product.media || []).find(m => m.media_type === 'image');
                    return firstImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstImage.file_url || firstImage.file}
                        alt={firstImage.alt_text || product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={48} className="text-slate-300" />
                    );
                  })()}
                </div>
                <div className="p-6 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">SKU</p>
                      <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">{product.sku}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">Type</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 capitalize flex items-center gap-1.5">
                        {isCatalog ? <Layers className="w-3.5 h-3.5 text-orange-500" /> : <Package className="w-3.5 h-3.5 text-orange-500" />}
                        {product.product_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">Price</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">${parseFloat(product.price).toFixed(2)}</p>
                        {product.compare_at_price && (
                          <p className="text-sm text-slate-400 dark:text-gray-500 line-through">${parseFloat(product.compare_at_price).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">Stock</p>
                      <p className={`text-sm font-bold mt-1 inline-block px-2 py-0.5 rounded ${stockColor}`}>
                        {totalStock === 0 ? 'Out of stock' : `${totalStock} units`}
                        {isCatalog && ' (total)'}
                      </p>
                    </div>
                  </div>
                  {product.category_name && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">Category</p>
                      <p className="text-sm text-slate-700 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-orange-500" /> {product.category_name}
                      </p>
                    </div>
                  )}
                  {product.description && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">Description</p>
                      <p className="text-sm text-slate-700 dark:text-gray-300 mt-1 whitespace-pre-line">{product.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column — Media + Meta */}
          <div className="space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Media</h3>
              {(product.media || []).length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400 dark:text-gray-500">No media uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {product.media.map((m) => (
                    <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-700">
                      {m.media_type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.file_url || m.file} alt={m.alt_text || product.name} className="w-full h-full object-cover" />
                      ) : (
                        <video src={m.file_url || m.file} className="w-full h-full object-cover" controls />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Details</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500 dark:text-gray-400">Created</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(product.created_at)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500 dark:text-gray-400">Updated</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(product.updated_at)}
                  </dd>
                </div>
                {isCatalog && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500 dark:text-gray-400">Variants</dt>
                    <dd className="text-sm font-bold text-orange-500">{product.variants_count || (product.variants || []).length}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500 dark:text-gray-400">Featured</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{product.is_featured ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      )}

      {/* ── Variants Table (Catalog only) ── */}
      {isCatalog && (product.variants || []).length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              All Variants <span className="text-slate-400 dark:text-gray-500 font-normal text-sm ml-2">({product.variants.length})</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-gray-700/50 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">SKU</th>
                  <th className="px-6 py-3 font-semibold">Attributes</th>
                  <th className="px-6 py-3 font-semibold">Price</th>
                  <th className="px-6 py-3 font-semibold">Stock</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {product.variants.map(v => {
                  const vStock = v.stock ?? 0;
                  const vStockColor = vStock === 0 ? 'bg-rose-100 text-rose-700' : vStock <= 10 ? 'bg-orange-100 text-orange-700 dark:text-orange-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900 dark:text-white">{v.sku}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(v.attribute_values || []).map((av, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded text-xs">
                              {av.attribute_name}: {av.value}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                        ${parseFloat(v.final_price || v.price || product.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${vStockColor}`}>
                          {vStock === 0 ? 'Out of stock' : vStock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {v.is_active
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <XCircle className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
