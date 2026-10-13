import { AuditLog } from '../models/AuditLog';
import type { Types } from 'mongoose';
import { logger } from '../utils/logger';

interface RecordChangeOptions {
  entityType: 'product' | 'sync' | 'agent_task' | 'settings';
  entityId: Types.ObjectId;
  action: string;
  actor: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  before?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  after?: any;
  ip?: string;
  userAgent?: string;
}

export async function recordChange(opts: RecordChangeOptions): Promise<void> {
  try {
    await AuditLog.create({
      entityType: opts.entityType,
      entityId: opts.entityId,
      action: opts.action,
      actor: opts.actor,
      before: opts.before,
      after: opts.after,
      ip: opts.ip,
      userAgent: opts.userAgent,
      timestamp: new Date(),
    });
  } catch (err) {
    // Audit failures must not crash the main operation — log and continue
    logger.error({ err, action: opts.action }, 'Failed to write audit log');
  }
}

export async function getAuditTrail(entityId: Types.ObjectId, limit = 50) {
  return AuditLog.find({ entityId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
}
