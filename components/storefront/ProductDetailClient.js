'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useCartStore } from '@/store/cartStore';
import {
  ShoppingCart, Minus, Plus, ChevronRight, Check,
  Heart, Shield, Truck, RotateCcw, X, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetailClient({ slug, initialVariantSku = null }) {
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const [selectedValues, setSelectedValues] = useState({});

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    storefrontAPI.getProduct(slug)
      .then((res) => {
        const p = res.data;
        setProduct(p);
        if (p.product_type === 'catalog' && p.attribute_groups?.length > 0) {
          if (initialVariantSku) {
            const selected = resolveVariantFromSku(p, initialVariantSku);
            setSelectedValues(selected || getDefaultSelection(p));
          } else {
            const defaults = getDefaultSelection(p);
            setSelectedValues(defaults);
            const firstSku = findVariantSku(p, defaults);
            if (firstSku) router.replace(`/products/${p.slug}/${firstSku}`, { scroll: false });
          }
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug, initialVariantSku]);

  function getDefaultSelection(p) {
    const initial = {};
    p.attribute_groups?.forEach((g) => { if (g.values.length > 0) initial[g.attribute_id] = g.values[0].value_id; });
    return initial;
  }

  function resolveVariantFromSku(p, sku) {
    for (const group of p.attribute_groups || []) {
      for (const val of group.values) {
        for (const otherAttr of val.available_variants || []) {
          for (const av of otherAttr.available_values || []) {
            if (av.variant_sku === sku) {
              const selected = { [group.attribute_id]: val.value_id };
              selected[otherAttr.attribute_id] = av.value_id;
              return selected;
            }
          }
        }
      }
    }
    return null;
  }

  function findVariantSku(p, selections) {
    if (!p.attribute_groups?.length) return null;
    const firstGroup = p.attribute_groups[0];
    const matchedValue = firstGroup.values.find((v) => v.value_id === selections[firstGroup.attribute_id]);
    if (!matchedValue?.available_variants?.length) return null;
    for (const otherAttr of matchedValue.available_variants) {
      const matched = otherAttr.available_values.find((v) => v.value_id === selections[otherAttr.attribute_id]);
      if (matched) return matched.variant_sku;
    }
    return matchedValue.available_variants[0]?.available_values?.[0]?.variant_sku || null;
  }

  const isCatalog = product?.product_type === 'catalog';

  // Find the color group (for image swatches) and other groups (for text buttons)
  const colorGroup = useMemo(() => {
    if (!isCatalog || !product?.attribute_groups?.length) return null;
    // Find group named "color"/"colour" (case-insensitive)
    for (let i = 0; i < product.attribute_groups.length; i++) {
      const name = product.attribute_groups[i].attribute_name.toLowerCase().trim();
      if (name === 'color' || name === 'colour') {
        return product.attribute_groups[i];
      }
    }
    // Fallback: first group that has images on any value
    for (let i = 0; i < product.attribute_groups.length; i++) {
      if (product.attribute_groups[i].values.some((v) => v.images?.length > 0)) {
        return product.attribute_groups[i];
      }
    }
    return product.attribute_groups[0];
  }, [product, isCatalog]);

  const sizeGroups = useMemo(() => {
    if (!isCatalog || !product?.attribute_groups?.length || !colorGroup) return [];
    return product.attribute_groups.filter((g) => g.attribute_id !== colorGroup.attribute_id);
  }, [product, isCatalog, colorGroup]);

  const images = useMemo(() => {
    if (!product) return [];
    if (isCatalog && colorGroup) {
      const matched = colorGroup.values.find((v) => v.value_id === selectedValues[colorGroup.attribute_id]);
      if (matched?.images?.length > 0) return matched.images;
    }
    const general = (product.general_images || []).filter((img) => !img.is_thumbnail);
    return general.length > 0 ? general : (product.general_images || []);
  }, [product, selectedValues, isCatalog, colorGroup]);

  useEffect(() => { setSelectedImageIndex(0); }, [selectedValues]);

  const variantInfo = useMemo(() => {
    if (!product || !isCatalog || !product.attribute_groups?.length) {
      return { variant: null, price: product?.price, stock: product?.stock || 0, label: '', sku: null };
    }
    // Use the first group in the API to look up variant (it has the nested available_variants structure)
    const lookupGroup = product.attribute_groups[0];
    const matched = lookupGroup.values.find((v) => v.value_id === selectedValues[lookupGroup.attribute_id]);
    if (!matched) return { variant: null, price: product.price, stock: 0, label: '', sku: null };
    let selectedVariant = null;
    for (const otherAttr of matched.available_variants || []) {
      const m = otherAttr.available_values.find((v) => v.value_id === selectedValues[otherAttr.attribute_id]);
      if (m) { selectedVariant = m; break; }
    }
    const labels = [];
    product.attribute_groups.forEach((g) => {
      const v = g.values.find((v) => v.value_id === selectedValues[g.attribute_id]);
      if (v) labels.push(`${g.attribute_name}: ${v.value}`);
    });
    return {
      variant: selectedVariant,
      price: selectedVariant?.price || product.price,
      stock: selectedVariant?.stock || 0,
      label: labels.join(', '),
      sku: selectedVariant?.variant_sku || null,
    };
  }, [product, selectedValues, isCatalog]);

  const maxStock = variantInfo.stock || 0;
  const inStock = isCatalog ? (variantInfo.variant ? maxStock > 0 : false) : (product?.stock || 0) > 0;

  // Reset quantity when variant changes or cap it to available stock
  useEffect(() => {
    if (maxStock > 0 && quantity > maxStock) setQuantity(maxStock);
    else if (maxStock === 0) setQuantity(1);
  }, [maxStock]);
  const displayPrice = parseFloat(variantInfo.price || 0);
  const hasDiscount = product?.compare_at_price && parseFloat(product.compare_at_price) > displayPrice;

  function handleSelectColor(valueId) {
    const newValues = { ...selectedValues, [colorGroup.attribute_id]: valueId };
    // When color changes, check if current secondary selections are still valid
    for (const group of product.attribute_groups || []) {
      if (group.attribute_id === colorGroup.attribute_id) continue;
      const available = getAvailableSecondaryValues(group.attribute_id, valueId);
      const currentVal = selectedValues[group.attribute_id];
      if (available && !available.has(currentVal) && available.size > 0) {
        newValues[group.attribute_id] = [...available][0];
      }
    }
    setSelectedValues(newValues);
    const sku = findVariantSku(product, newValues);
    if (sku) router.replace(`/products/${product.slug}/${sku}`, { scroll: false });
  }

  function handleSelectAttribute(groupId, valueId) {
    const newValues = { ...selectedValues, [groupId]: valueId };
    setSelectedValues(newValues);
    const sku = findVariantSku(product, newValues);
    if (sku) router.replace(`/products/${product.slug}/${sku}`, { scroll: false });
  }

  function handleAddToCart() {
    if (!inStock) return;
    addItem({
      product: product.id,
      variant: variantInfo.variant?.variant_id || null,
      quantity,
      unitPrice: variantInfo.price,
      name: product.name,
      variantLabel: variantInfo.label,
      thumbnail: images[0]?.file_url || null,
      slug: product.slug,
    });
    setAddedToCart(true);
    toast.success('Added to cart!');
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function getAvailableSecondaryValues(groupId, colorOverride) {
    if (!isCatalog || !product.attribute_groups?.length || !colorGroup) return new Set();
    if (groupId === colorGroup.attribute_id) return null; // color group itself — all available
    const selectedColorId = colorOverride ?? selectedValues[colorGroup.attribute_id];
    // Check in the Color group's values for cross-reference to the target groupId
    const colorVal = colorGroup.values.find((v) => v.value_id === selectedColorId);
    if (colorVal?.available_variants) {
      const cross = colorVal.available_variants.find((a) => a.attribute_id === groupId);
      if (cross) return new Set(cross.available_values.map((v) => v.value_id));
    }
    // Also check from any group that has the cross-reference the other way
    for (const group of product.attribute_groups) {
      if (group.attribute_id === colorGroup.attribute_id) continue;
      if (group.attribute_id !== groupId) continue;
      // Check each value: is it available for the selected color?
      const available = new Set();
      for (const val of group.values) {
        for (const av of val.available_variants || []) {
          if (av.attribute_id === colorGroup.attribute_id) {
            if (av.available_values.some((v) => v.value_id === selectedColorId)) {
              available.add(val.value_id);
            }
          }
        }
      }
      if (available.size > 0) return available;
    }
    return new Set();
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-24">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-pink-500/30 border-b-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center pt-32">
        <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-gray-900 font-black text-xl">Product not found</p>
        <Link href="/products" className="text-orange-600 font-bold text-sm mt-4 inline-flex items-center gap-2 bg-orange-50 px-6 py-3 rounded-full hover:bg-orange-100 transition-colors">
          Back to Products <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 md:pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* ═══════ LEFT: Breadcrumb + Big Image + Small Thumbnails ═══════ */}
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
              <Link href="/" className="hover:text-orange-500 transition-colors font-medium">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/products" className="hover:text-orange-500 transition-colors font-medium">Products</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-700 font-semibold truncate">{product.name}</span>
            </nav>

            {/* Big main image */}
            <div
              className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative group cursor-zoom-in border border-gray-100"
              onClick={() => { setLightboxIndex(selectedImageIndex); setLightboxOpen(true); }}
            >
              {images.length > 0 ? (
                <img
                  key={images[selectedImageIndex]?.id || selectedImageIndex}
                  src={images[selectedImageIndex]?.file_url}
                  alt={images[selectedImageIndex]?.alt_text || product.name}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ShoppingCart className="w-20 h-20" />
                </div>
              )}
              {images.length > 0 && images[selectedImageIndex]?.alt_text && (
                <span className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-lg">
                  {product.name} — {images[selectedImageIndex].alt_text}
                </span>
              )}
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  -{Math.round((1 - displayPrice / parseFloat(product.compare_at_price)) * 100)}%
                </span>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-gray-900 text-white text-sm font-bold px-6 py-2.5 rounded-full">Sold Out</span>
                </div>
              )}
            </div>

            {/* Small thumbnails below (different angles of same color) */}
            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    onMouseEnter={() => setSelectedImageIndex(idx)}
                    className={`relative w-[72px] h-[72px] md:w-20 md:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${idx === selectedImageIndex
                        ? 'border-orange-500 shadow-md shadow-orange-500/15'
                        : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img src={img.file_url} alt={img.alt_text || ''} className="w-full h-full object-cover" />
                    {img.alt_text && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-semibold text-center py-1 leading-tight truncate px-1">
                        {img.alt_text}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══════ RIGHT: Product Info ═══════ */}
          <div>
            {/* Back to products */}
            <Link href="/products" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 font-semibold mb-5 border border-gray-200 px-4 py-2 rounded-lg hover:border-orange-500 transition-all">
              <ChevronLeft className="w-4 h-4" /> Back to products
            </Link>

            {product.category_name && (
              <p className="text-xs text-orange-500 font-bold uppercase tracking-[0.2em] mb-1">
                {product.category_name}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-gray-900">${displayPrice.toFixed(2)}</span>
              {hasDiscount && (
                <>
                  <span className="text-base text-gray-400 line-through">${parseFloat(product.compare_at_price).toFixed(2)}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md">
                    {Math.round((1 - displayPrice / parseFloat(product.compare_at_price)) * 100)}% off
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">{product.description}</p>
            )}

            {/* ── COLOR: Image swatches with label below ── */}
            {isCatalog && colorGroup && (
              <div className="mt-6">
                <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-widest">
                  {colorGroup.attribute_name}
                </h3>
                <div className="flex flex-wrap gap-4">
                  {colorGroup.values.map((val) => {
                    const isSelected = selectedValues[colorGroup.attribute_id] === val.value_id;
                    const firstImage = val.images?.[0];
                    // Try to find a matching general_image by color name in alt_text
                    const fallbackImage = !firstImage && product.general_images?.find(
                      (img) => img.alt_text?.toLowerCase().includes(val.value.toLowerCase())
                    );
                    const displayImage = firstImage || fallbackImage;
                    return (
                      <button
                        key={val.value_id}
                        onClick={() => handleSelectColor(val.value_id)}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className={`w-[72px] h-[72px] rounded-lg overflow-hidden border-2 transition-all duration-200 ${isSelected
                            ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                            : 'border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100'
                          }`}>
                          {displayImage ? (
                            <img src={displayImage.file_url} alt={val.value} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                              {val.value}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-semibold ${isSelected ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                          {val.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SIZE / secondary attributes ── */}
            {isCatalog && sizeGroups.map((group) => {
              const availableSet = getAvailableSecondaryValues(group.attribute_id);
              return (
                <div key={group.attribute_id} className="mt-6">
                  <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-widest">
                    {group.attribute_name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((val) => {
                      const isSelected = selectedValues[group.attribute_id] === val.value_id;
                      const isAvailable = availableSet === null || availableSet.has(val.value_id);
                      return (
                        <button
                          key={val.value_id}
                          onClick={() => isAvailable && handleSelectAttribute(group.attribute_id, val.value_id)}
                          disabled={!isAvailable}
                          className={`relative min-w-[48px] h-[44px] px-4 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${isSelected
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : isAvailable
                                ? 'border-gray-200 text-gray-700 hover:border-gray-400 cursor-pointer'
                                : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                            }`}
                        >
                          {val.value}
                          {!isAvailable && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="block w-[120%] h-px bg-gray-300 rotate-[-20deg]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Quantity & Stock */}
            <div className="mt-6 flex items-center gap-6">
              <div>
                <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-widest">Quantity</h3>
                <div className="inline-flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className={`p-3 transition-colors ${quantity <= 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                  {maxStock > 1 && quantity < maxStock ? (
                    <button
                      onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                      className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="p-3 text-gray-200 cursor-not-allowed">
                      <Plus className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
              <div className="pt-5">
                {inStock ? (
                  <p className="text-sm text-green-600 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    In Stock
                    {maxStock <= 5 && maxStock > 0 && (
                      <span className="text-orange-600 ml-1">Only {maxStock} left!</span>
                    )}
                    {quantity >= maxStock && maxStock > 0 && maxStock > 5 && (
                      <span className="text-orange-600 ml-1">Max {maxStock}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-red-600 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Out of Stock
                  </p>
                )}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base transition-all border-2 ${addedToCart
                    ? 'bg-green-500 border-green-500 text-white'
                    : inStock
                      ? 'bg-white border-gray-300 text-gray-900 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 active:scale-[0.99]'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {addedToCart ? (
                  <span className="flex items-center gap-2"><Check className="w-5 h-5" /> Added!</span>
                ) : (
                  <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Add to Cart</span>
                )}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Shipping' },
                { icon: Shield, label: 'Secure Payment' },
                { icon: RotateCcw, label: 'Easy Returns' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2 py-3">
                  <item.icon className="w-5 h-5 text-orange-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">{item.label}</span>
                </div>
              ))}
            </div>

            {/* SKU */}
            {variantInfo.sku && (
              <p className="mt-4 text-xs text-gray-400 font-mono">SKU: {variantInfo.sku}</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Lightbox ─── */}
      {mounted && lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }} className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 z-10">
            <X className="w-6 h-6" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }} className="absolute left-4 md:left-8 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 z-10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }} className="absolute right-4 md:right-8 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 z-10">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="max-w-4xl max-h-[85vh] px-4" onClick={(e) => e.stopPropagation()}>
            <img src={images[lightboxIndex]?.file_url} alt={product.name} className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3" onClick={(e) => e.stopPropagation()}>
              {images.map((img, idx) => (
                <button key={img.id} onClick={() => setLightboxIndex(idx)} className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${idx === lightboxIndex ? 'border-orange-500 scale-110' : 'border-white/20 opacity-60 hover:opacity-100'}`}>
                  <img src={img.file_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
