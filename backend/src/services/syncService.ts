import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { WooConnection } from '../models/WooConnection';
import { Product } from '../models/Product';
import { SyncJob } from '../models/SyncJob';
import { recordChange } from './auditService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

/** Map a Woo product to our mirror fields (all WOO_OWNED_FIELDS) */
function wooToMirror(wooProduct: Record<string, unknown>): Record<string, unknown> {
  return {
    wooId: wooProduct['id'],
    wooStatus: wooProduct['status'],
    wooPrice: wooProduct['price'],
    wooSalePrice: wooProduct['sale_price'],
    wooStockStatus: wooProduct['stock_status'],
    wooStockQuantity: wooProduct['stock_quantity'],
    wooPermalink: wooProduct['permalink'],
    wooLastFetchedAt: new Date(),
  };
}

/** Map a PIM product to Woo product update body (only PIM-owned content fields) */
function pimToWoo(product: InstanceType<typeof Product>) {
  return {
    name: product.name,
    description: product.description,
    short_description: product.shortDescription,
    tags: product.tags.map((t) => ({ name: t })),
    sku: product.sku,
    slug: product.seo?.slug || undefined,
    meta_data: [
      { key: '_pim_managed', value: 'true' },
      { key: '_seo_title', value: product.seo?.title ?? '' },
      { key: '_seo_description', value: product.seo?.description ?? '' },
    ],
    attributes: product.attributes.map((a) => ({
      name: a.name,
      options: [a.value],
      visible: true,
    })),
  };
}

async function getWooApi() {
  const connection = await WooConnection.findOne({ isVerified: true });
  if (!connection) {
    throw new AppError(503, 'No verified WooCommerce connection. Configure it in Settings.', 'WOO_NOT_CONNECTED');
  }
  return new WooCommerceRestApi({
    url: connection.siteUrl,
    consumerKey: connection.getConsumerKey(),
    consumerSecret: connection.getConsumerSecret(),
    version: 'wc/v3',
  });
}

/** Push a single PIM product to WooCommerce */
export async function pushProduct(productId: string, actor: string): Promise<void> {
  const product = await Product.findById(productId);
  if (!product) throw new AppError(404, `Product ${productId} not found`);

  const api = await getWooApi();
  const body = pimToWoo(product);

  try {
    product.syncStatus = 'syncing';
    await product.save();

    let wooData: Record<string, unknown>;

    if (product.wooId) {
      // Update existing
      const res = await api.put(`products/${product.wooId}`, body);
      wooData = res.data as Record<string, unknown>;
    } else {
      // Create new in Woo
      const createBody = {
        ...body,
        status: 'publish',
        images: product.images.map((img) => ({ src: img.url, alt: img.alt })),
      };
      const res = await api.post('products', createBody);
      wooData = res.data as Record<string, unknown>;
    }

    // Update read-only Woo mirror fields
    await Product.findByIdAndUpdate(productId, {
      ...wooToMirror(wooData),
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
      status: 'published',
      syncError: undefined,
    });

    await recordChange({
      entityType: 'product',
      entityId: product._id,
      action: 'product.synced_to_woo',
      actor,
      after: { wooId: wooData['id'], status: 'published' },
    });

    logger.info({ productId, wooId: wooData['id'] }, 'Product synced to WooCommerce');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    await Product.findByIdAndUpdate(productId, {
      syncStatus: 'error',
      syncError: message,
    });
    throw new AppError(502, `WooCommerce sync failed: ${message}`, 'WOO_SYNC_ERROR');
  }
}

/** Full catalog sync — fetches all Woo products, updates mirror fields */
export async function runFullSync(triggeredBy: 'manual' | 'scheduled' | 'agent'): Promise<typeof SyncJob.prototype> {
  const job = await SyncJob.create({ type: 'full', triggeredBy, status: 'running' });

  const api = await getWooApi();
  let page = 1;
  let total = 0;
  let processed = 0;
  let succeeded = 0;
  const errors: Array<{ productId: string; sku: string; message: string }> = [];

  try {
    while (true) {
      const res = await api.get('products', { per_page: env.SYNC_BATCH_SIZE, page });
      const wooProducts = (res.data as Record<string, unknown>[]);
      if (!wooProducts.length) break;

      total += wooProducts.length;
      job.totalProducts = total;
      await job.save();

      for (const wp of wooProducts) {
        processed++;
        try {
          const sku = (wp['sku'] as string)?.toUpperCase();
          if (!sku) continue;

          await Product.findOneAndUpdate(
            { sku },
            { $set: { ...wooToMirror(wp), syncStatus: 'synced', lastSyncedAt: new Date() } },
            { upsert: false },
          );
          succeeded++;
        } catch (err) {
          errors.push({ productId: String(wp['id']), sku: String(wp['sku']), message: (err as Error).message });
        }
      }

      if (wooProducts.length < env.SYNC_BATCH_SIZE) break;
      page++;
    }

    job.status = 'completed';
  } catch (err) {
    job.status = 'failed';
    logger.error({ err }, 'Full sync failed');
  } finally {
    job.processed = processed;
    job.succeeded = succeeded;
    job.failed = errors.length;
    job.syncErrors = errors.map((e) => ({ ...e, productId: new (require('mongoose').Types.ObjectId)() }));
    job.completedAt = new Date();
    job.durationMs = Date.now() - job.startedAt.getTime();
    await job.save();
  }

  return job;
}

/** Handle incoming WooCommerce webhook — update mirror fields only */
export async function handleWebhook(topic: string, payload: Record<string, unknown>): Promise<void> {
  const topics = ['product.updated', 'product.created', 'product.deleted'];
  if (!topics.includes(topic)) return;

  const sku = (payload['sku'] as string)?.toUpperCase();
  const wooId = payload['id'] as number;

  if (topic === 'product.deleted') {
    await Product.findOneAndUpdate({ wooId }, { $set: { syncStatus: 'not_synced', wooId: undefined } });
    logger.info({ wooId }, 'Woo product deleted — mirror cleared');
    return;
  }

  if (sku) {
    await Product.findOneAndUpdate(
      { sku },
      { $set: { ...wooToMirror(payload), syncStatus: 'synced', lastSyncedAt: new Date() } },
    );
    logger.info({ wooId, sku, topic }, 'Webhook processed — mirror updated');
  }
}
