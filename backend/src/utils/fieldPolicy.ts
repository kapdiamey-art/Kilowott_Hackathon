/**
 * Field ownership policy — defines which fields are authoritative in PIM vs WooCommerce.
 * Enforced in the API layer to prevent WooCommerce from overwriting PIM content.
 */

/** Fields owned by ProductShelf PIM — only PIM can write these */
export const PIM_OWNED_FIELDS = new Set([
  'name',
  'sku',
  'description',
  'shortDescription',
  'bulletPoints',
  'attributes',
  'categories',
  'tags',
  'images',
  'brand',
  'seo',
]);

/** Fields owned by WooCommerce — PIM stores a read-only mirror */
export const WOO_OWNED_FIELDS = new Set([
  'wooId',
  'wooStatus',
  'wooPrice',
  'wooSalePrice',
  'wooStockStatus',
  'wooStockQuantity',
  'wooPermalink',
  'wooLastFetchedAt',
]);

export function isPimOwned(field: string): boolean {
  return PIM_OWNED_FIELDS.has(field);
}

export function isWooOwned(field: string): boolean {
  return WOO_OWNED_FIELDS.has(field);
}

/**
 * Filters an update payload to only PIM-owned fields.
 * Returns { safe, rejected } where rejected lists fields that were stripped.
 */
export function filterToPimOwned(data: Record<string, unknown>): {
  safe: Record<string, unknown>;
  rejected: string[];
} {
  const safe: Record<string, unknown> = {};
  const rejected: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (isWooOwned(key)) {
      rejected.push(key);
    } else {
      safe[key] = value;
    }
  }

  return { safe, rejected };
}
