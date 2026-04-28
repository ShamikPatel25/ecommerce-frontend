'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useCartStore } from '@/store/cartStore';
import { calcDiscountPercent, formatCurrency } from '@/lib/utils';
import { useStoreInfo } from '@/lib/StorefrontContext';
import { toast } from 'sonner';
import { X, ChevronLeft, ChevronRight, Check, Diamond, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

function findCrossReferencedValues(colorGroup, selectedColorId, groupId) {
  const colorVal = colorGroup.values.find((v) => v.value_id === selectedColorId);
  if (!colorVal?.available_variants) return null;
  const cross = colorVal.available_variants.find((a) => a.attribute_id === groupId);
  if (cross) return new Set(cross.available_values.map((v) => v.value_id));
  return null;
}

function collectAvailableValuesFromGroup(group, colorGroupId, selectedColorId) {
  const available = new Set();
  for (const val of group.values) {
    for (const av of val.available_variants || []) {
      if (av.attribute_id === colorGroupId && av.available_values.some((v) => v.value_id === selectedColorId)) {
        available.add(val.value_id);
      }
    }
  }
  return available;
}

function findReverseReferencedValues(attributeGroups, colorGroupId, groupId, selectedColorId) {
  for (const group of attributeGroups) {
    if (group.attribute_id === colorGroupId || group.attribute_id !== groupId) continue;
    const available = collectAvailableValuesFromGroup(group, colorGroupId, selectedColorId);
    if (available.size > 0) return available;
  }
  return null;
}

export default function ProductDetailClient({ slug, initialVariantSku = null }) {
  const router = useRouter();
  const { href } = useStorefrontPath();
  const storeInfo = useStoreInfo();
  const currency = storeInfo?.currency;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const [selectedValues, setSelectedValues] = useState({});

  // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration guard
  useEffect(() => { setMounted(true); }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    const el = lightboxRef.current;
    if (!el) return;
    const handleClick = (e) => { if (e.target === el) closeLightbox(); };
    const handleKey = (e) => { if (e.key === 'Escape') closeLightbox(); };
    el.addEventListener('click', handleClick);
    el.addEventListener('keydown', handleKey);
    return () => {
      el.removeEventListener('click', handleClick);
      el.removeEventListener('keydown', handleKey);
    };
  }, [lightboxOpen, closeLightbox]);

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
            if (firstSku) router.replace(href(`/products/${p.slug}/${firstSku}`), { scroll: false });
          }
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug, initialVariantSku, href, router]);

  const isCatalog = product?.product_type === 'catalog';

  const colorGroup = useMemo(() => {
    if (!isCatalog || !product?.attribute_groups?.length) return null;
    for (const group of product.attribute_groups) {
      const name = group.attribute_name.toLowerCase().trim();
      if ((name === 'color' || name === 'colour') && group.values.some((v) => v.images?.length > 0)) {
        return group;
      }
    }
    for (const group of product.attribute_groups) {
      if (group.values.some((v) => v.images?.length > 0)) {
        return group;
      }
    }
    return null;
  }, [product, isCatalog]);

  const sizeGroups = useMemo(() => {
    if (!isCatalog || !product?.attribute_groups?.length) return [];
    if (!colorGroup) return product.attribute_groups;
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

  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on selection change
  useEffect(() => { setSelectedImageIndex(0); }, [selectedValues]);

  const variantInfo = useMemo(() => {
    if (!product || !isCatalog || !product.attribute_groups?.length) {
      return { variant: null, price: product?.price, stock: product?.stock || 0, label: '', sku: null };
    }
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
      stock: selectedVariant?.stock ?? 0,
      label: labels.join(', '),
      sku: selectedVariant?.variant_sku || null,
    };
  }, [product, selectedValues, isCatalog]);

  const maxStock = variantInfo.stock || 0;
  const catalogInStock = variantInfo.variant ? maxStock > 0 : false;
  const inStock = isCatalog ? catalogInStock : (product?.stock || 0) > 0;

  /* eslint-disable react-hooks/set-state-in-effect -- clamp quantity to stock */
  useEffect(() => {
    if (maxStock > 0 && quantity > maxStock) setQuantity(maxStock);
    else if (maxStock === 0) setQuantity(1);
  }, [maxStock, quantity]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const displayPrice = Number.parseFloat(variantInfo.price || 0);
  const hasDiscount = product?.compare_at_price && Number.parseFloat(product.compare_at_price) > displayPrice;

  function handleSelectColor(valueId) {
    const newValues = { ...selectedValues, [colorGroup.attribute_id]: valueId };
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
    if (sku) router.replace(href(`/products/${product.slug}/${sku}`), { scroll: false });
  }

  function handleSelectAttribute(groupId, valueId) {
    const newValues = { ...selectedValues, [groupId]: valueId };
    setSelectedValues(newValues);
    const sku = findVariantSku(product, newValues);
    if (sku) router.replace(href(`/products/${product.slug}/${sku}`), { scroll: false });
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
      maxStock: isCatalog ? variantInfo.stock : (product?.stock || 0),
    });
    setAddedToCart(true);
    toast.success('Added to cart!');
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function getAvailableSecondaryValues(groupId, colorOverride) {
    if (!isCatalog || !product.attribute_groups?.length) return new Set();
    if (!colorGroup) return null;
    if (groupId === colorGroup.attribute_id) return null;
    const selectedColorId = colorOverride ?? selectedValues[colorGroup.attribute_id];

    const crossRef = findCrossReferencedValues(colorGroup, selectedColorId, groupId);
    if (crossRef) return crossRef;

    const reverseRef = findReverseReferencedValues(product.attribute_groups, colorGroup.attribute_id, groupId, selectedColorId);
    if (reverseRef) return reverseRef;

    return new Set();
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-2xl text-muted-foreground font-light italic animate-pulse">
          Loading product...
        </p>
      </div>
    );
  }

  /* ── Not found state ── */
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 pb-32 px-4 text-center">
        <Diamond className="w-16 h-16 text-muted-foreground opacity-30 mb-6" />
        <p className="text-3xl font-bold text-card-foreground mb-6">Product not found</p>
        <Link href={href('/products')}>
          <Button size="lg" className="rounded-full">Back to Products</Button>
        </Link>
      </div>
    );
  }

  const discountPercent = calcDiscountPercent(displayPrice, product.compare_at_price);

  return (
    <>
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 md:mb-12 font-medium">
          <Link href={href('/')} className="hover:text-primary transition-colors">Home</Link>
          <span className="opacity-50">/</span>
          <Link href={href('/products')} className="hover:text-primary transition-colors">Products</Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* ═══════ LEFT: Images ═══════ */}
          <div className="space-y-4">
            <button
              type="button"
              className="relative w-full aspect-square rounded-3xl bg-card border border-border overflow-hidden cursor-zoom-in group"
              onClick={() => { setLightboxIndex(selectedImageIndex); setLightboxOpen(true); }}
            >
              {images.length > 0 ? (
                <Image
                  key={images[selectedImageIndex]?.id || selectedImageIndex}
                  src={images[selectedImageIndex]?.file_url}
                  alt={images[selectedImageIndex]?.alt_text || product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Diamond className="w-12 h-12 opacity-20" />
                </div>
              )}
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1.5 rounded-md text-sm z-10 shadow-lg">
                  -{discountPercent}%
                </span>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20 flex items-center justify-center">
                  <span className="bg-foreground text-background text-sm tracking-widest uppercase font-bold py-2 px-6 rounded-full shadow-2xl">
                    SOLD OUT
                  </span>
                </div>
              )}
            </button>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    onMouseEnter={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 sm:w-24 aspect-square flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex ? 'border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background' : 'border-border/50 hover:border-primary/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img.file_url} alt={img.alt_text || ''} fill sizes="96px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══════ RIGHT: Product Info ═══════ */}
          <div className="flex flex-col">
            {product.category_name && (
              <p className="text-primary font-medium tracking-wide uppercase text-sm mb-3">
                {product.category_name}
              </p>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-3xl font-bold">{formatCurrency(displayPrice, currency)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-muted-foreground line-through decoration-muted-foreground/50">{formatCurrency(product.compare_at_price, currency)}</span>
                  <span className="text-sm font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md">{discountPercent}% OFF</span>
                </>
              )}
            </div>

            {product.description && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-prose">
                {product.description}
              </p>
            )}

            <hr className="border-border mb-8" />

            {/* ── COLOR: Image swatches ── */}
            {isCatalog && colorGroup && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{colorGroup.attribute_name}</h3>
                  <span className="text-muted-foreground text-sm">
                    {colorGroup.values.find(v => selectedValues[colorGroup.attribute_id] === v.value_id)?.value}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {colorGroup.values.map((val) => {
                    const isSelected = selectedValues[colorGroup.attribute_id] === val.value_id;
                    const firstImage = val.images?.[0];
                    const fallbackImage = !firstImage && product.general_images?.find(
                      (img) => img.alt_text?.toLowerCase().includes(val.value.toLowerCase())
                    );
                    const displayImage = firstImage || fallbackImage;
                    return (
                      <button
                        key={val.value_id}
                        onClick={() => handleSelectColor(val.value_id)}
                        title={val.value}
                        className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center ${
                          isSelected ? 'border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {displayImage ? (
                          <Image src={displayImage.file_url} alt={val.value} fill sizes="56px" className="object-cover" />
                        ) : (
                          <span className="text-xs font-semibold uppercase">{val.value.slice(0, 2)}</span>
                        )}
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
                <div key={group.attribute_id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{group.attribute_name}</h3>
                    <span className="text-muted-foreground text-sm">
                      {group.values.find(v => selectedValues[group.attribute_id] === v.value_id)?.value}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {group.values.map((val) => {
                      const isSelected = selectedValues[group.attribute_id] === val.value_id;
                      const isAvailable = availableSet === null || availableSet.has(val.value_id);
                      return (
                        <button
                          key={val.value_id}
                          onClick={() => isAvailable && handleSelectAttribute(group.attribute_id, val.value_id)}
                          disabled={!isAvailable}
                          className={`min-w-[4rem] h-12 flex items-center justify-center px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                            !isAvailable ? 'opacity-30 border-border cursor-not-allowed line-through' :
                            isSelected ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20' : 
                            'border-border hover:border-primary/50 bg-card text-foreground'
                          }`}
                        >
                          {val.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Quantity & Actions Block */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 mt-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold mb-2 block sr-only">Quantity</span>
                <div className="flex items-center h-14 bg-muted border border-border rounded-2xl w-full sm:w-36">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="flex-1 h-full flex items-center justify-center text-xl text-foreground disabled:opacity-30 hover:bg-black/5"
                  >
                    &minus;
                  </button>
                  <span className="flex-1 font-bold text-center text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxStock || 1, quantity + 1))}
                    disabled={!inStock || quantity >= maxStock}
                    className="flex-1 h-full flex items-center justify-center text-xl text-foreground disabled:opacity-30 hover:bg-black/5"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <Button
                onClick={handleAddToCart}
                disabled={!inStock}
                size="lg"
                className={`flex-1 h-14 text-lg font-bold rounded-2xl ${addedToCart ? 'bg-green-600 hover:bg-green-600/90 text-white shadow-green-600/20 shadow-lg' : 'shadow-primary/20 shadow-lg'}`}
              >
                {addedToCart ? (
                  <span className="flex items-center"><Check className="w-6 h-6 mr-2" /> Added to Cart</span>
                ) : (
                  'Add to Cart'
                )}
              </Button>
            </div>

            {/* Stock indicator */}
            <div className="mb-10">
              {inStock ? (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-500">In Stock and Ready to Ship</span>
                  {maxStock <= 5 && maxStock > 0 && (
                    <span className="text-orange-400 ml-1">&mdash; Only {maxStock} left!</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-red-500">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 py-6 border-y border-border">
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <Truck className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2 border-x border-border">
                <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <RefreshCcw className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Easy Returns</span>
              </div>
            </div>

            {/* SKU */}
            {variantInfo.sku && (
              <p className="text-xs text-muted-foreground mt-6 uppercase tracking-widest font-mono">
                SKU: {variantInfo.sku}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Lightbox ─── */}
      {mounted && lightboxOpen && (
        <dialog
          ref={lightboxRef}
          open
          aria-label="Image lightbox"
          className="fixed inset-0 z-50 w-full h-full p-0 m-0 bg-background/95 backdrop-blur-sm border-none flex flex-col"
        >
          <div className="w-full flex justify-end p-6 absolute top-0 z-10">
            <button onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }} className="w-12 h-12 bg-card rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors border border-border">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 w-full flex items-center justify-center relative p-8">
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }}
                className="absolute left-4 md:left-12 w-14 h-14 bg-card rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors border border-border"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element -- lightbox uses dynamic sizing */}
            <img
              src={images[lightboxIndex]?.file_url}
              alt={product.name}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl" 
            />

            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }}
                className="absolute right-4 md:right-12 w-14 h-14 bg-card rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors border border-border"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="w-full bg-card/80 border-t border-border p-4 flex gap-3 overflow-x-auto justify-center hide-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-16 sm:w-20 aspect-square flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === lightboxIndex ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-border/50 hover:border-primary/50 opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- lightbox thumbnails */}
                  <img src={img.file_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </dialog>
      )}
    </>
  );
}
