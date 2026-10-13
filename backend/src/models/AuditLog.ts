import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  entityType: 'product' | 'sync' | 'agent_task' | 'settings';
  entityId: Types.ObjectId;
  action: string;
  actor: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    entityType: { type: String, enum: ['product', 'sync', 'agent_task', 'settings'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    actor: { type: String, required: true, default: 'system' },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

AuditLogSchema.index({ entityId: 1 });
AuditLogSchema.index({ entityType: 1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
