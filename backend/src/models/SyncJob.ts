import { Schema, model, Document, Types } from 'mongoose';

export interface ISyncError {
  productId: Types.ObjectId;
  sku: string;
  message: string;
  code?: string;
}

// Renamed `errors` → `syncErrors` to avoid collision with Mongoose Document.ValidationError
export interface ISyncJob extends Document {
  type: 'full' | 'incremental' | 'single_product';
  triggeredBy: 'manual' | 'webhook' | 'scheduled' | 'agent';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalProducts: number;
  processed: number;
  succeeded: number;
  failed: number;
  syncErrors: ISyncError[];
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}

const SyncJobSchema = new Schema<ISyncJob>(
  {
    type: { type: String, enum: ['full', 'incremental', 'single_product'], required: true },
    triggeredBy: { type: String, enum: ['manual', 'webhook', 'scheduled', 'agent'], required: true },
    status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'cancelled'], default: 'queued' },
    totalProducts: { type: Number, default: 0 },
    processed: { type: Number, default: 0 },
    succeeded: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    syncErrors: [
      {
        productId: { type: Schema.Types.ObjectId },
        sku: String,
        message: String,
        code: String,
        _id: false,
      },
    ],
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    durationMs: Number,
  },
  { timestamps: true, versionKey: false },
);

SyncJobSchema.index({ status: 1 });
SyncJobSchema.index({ startedAt: -1 });

export const SyncJob = model<ISyncJob>('SyncJob', SyncJobSchema);
