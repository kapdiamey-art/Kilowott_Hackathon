import { Schema, model, Document, Types } from 'mongoose';

export type ActivityAction =
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.published'
  | 'ai.proposal_generated'
  | 'ai.proposal_approved'
  | 'ai.proposal_rejected'
  | 'quality.recalculated'
  | 'duplicate.reviewed'
  | 'duplicate.merged'
  | 'duplicate.dismissed'
  | 'category.created'
  | 'category.updated'
  | 'category.deleted'
  | 'attribute.created'
  | 'attribute.deleted'
  | 'publishing.job_started'
  | 'publishing.job_completed'
  | 'publishing.job_failed'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register';

export interface IActivityEvent extends Document {
  action: ActivityAction;
  entityType: string;
  entityId?: Types.ObjectId | string;
  entityName?: string;
  actor: string;
  actorId?: Types.ObjectId;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const ActivityEventSchema = new Schema<IActivityEvent>(
  {
    action: { type: String, required: true },
    entityType: { type: String, required: true, default: 'product' },
    entityId: { type: Schema.Types.Mixed },
    entityName: { type: String },
    actor: { type: String, required: true, default: 'system' },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

ActivityEventSchema.index({ timestamp: -1 });
ActivityEventSchema.index({ actor: 1 });
ActivityEventSchema.index({ action: 1 });
ActivityEventSchema.index({ entityId: 1 });

export const ActivityEvent = model<IActivityEvent>('ActivityEvent', ActivityEventSchema);
