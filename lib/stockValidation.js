import { storefrontAPI } from '@/lib/storefrontApi';

export async function validateCartStock(items, updateItemStock) {
  if (!items || items.length === 0) return;

  const uniqueSlugs = [...new Set(items.filter((i) => i.slug).map((i) => i.slug))];
  if (uniqueSlugs.length === 0) return;

  const results = await Promise.allSettled(
    uniqueSlugs.map((slug) => storefrontAPI.getProduct(slug))
  );

  results.forEach((result, idx) => {
    if (result.status !== 'fulfilled') return;

    const product = result.value.data;
    const slug = uniqueSlugs[idx];

    items.forEach((cartItem) => {
      if (cartItem.slug !== slug) return;

      let liveStock = 0;

      if (cartItem.variant && product.attribute_groups?.length > 0) {
        for (const group of product.attribute_groups) {
          for (const val of group.values || []) {
            if (val.variant?.variant_id === cartItem.variant) {
              liveStock = val.variant.stock ?? 0;
            }
            for (const av of val.available_variants || []) {
              for (const v of av.available_values || []) {
                if (v.variant_id === cartItem.variant) {
                  liveStock = v.stock ?? 0;
                }
              }
            }
          }
        }
      } else {
        liveStock = product.stock ?? 0;
      }

      updateItemStock(cartItem.product, cartItem.variant, liveStock);
    });
  });
}
