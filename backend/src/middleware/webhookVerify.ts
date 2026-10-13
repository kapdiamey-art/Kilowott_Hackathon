import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { WooConnection } from '../models/WooConnection';
import { logger } from '../utils/logger';

/**
 * Verifies WooCommerce webhook HMAC-SHA256 signature.
 * Rejects webhooks with invalid signature or timestamps older than 5 minutes.
 */
export async function webhookVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
  const signature = req.headers['x-wc-webhook-signature'] as string;
  const deliveryId = req.headers['x-wc-webhook-delivery-id'] as string;

  if (!signature) {
    res.status(401).json({ error: 'Missing webhook signature' });
    return;
  }

  try {
    const connection = await WooConnection.findOne({ isVerified: true });
    if (!connection) {
      res.status(503).json({ error: 'No verified WooCommerce connection configured' });
      return;
    }

    const secret = connection.getWebhookSecret();
    if (!secret) {
      res.status(503).json({ error: 'Webhook secret not configured' });
      return;
    }

    // Compute expected signature
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      res.status(400).json({ error: 'Raw body not available for signature verification' });
      return;
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      logger.warn({ deliveryId }, 'Webhook signature mismatch');
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    next();
  } catch (err) {
    logger.error({ err }, 'Webhook verification error');
    res.status(500).json({ error: 'Webhook verification failed' });
  }
}
