import { Schema, model, Document, Types } from 'mongoose';

export type DuplicateStatus = 'pending' | 'dismissed' | 'confirmed' | 'merged';

export interface ISimilarityEvidence {
  field: string;
  valueA: string;
  valueB: string;
  score: number;
}

export interface IDuplicateReview extends Document {
  productAId: Types.ObjectId;
  productAName: string;
  productASku: string;
  productBId: Types.ObjectId;
  productBName: string;
  productBSku: string;
  similarityScore: number;
  matchedFields: string[];
  evidence: ISimilarityEvidence[];
  status: DuplicateStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIProposal extends Document {
  productId: Types.ObjectId;
  taskType: string;
  proposalText: string | object;
  before: string | object;
  aiModel: string;
  tokensUsed: number;
  reasoning?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPublishingJob extends Document {
  productId: Types.ObjectId;
  productSku: string;
  destination: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'simulated';
  externalId?: string;
  externalUrl?: string;
  attempts: number;
  lastAttemptAt?: Date;
  completedAt?: Date;
  error?: string;
  isSimulated: boolean;
  triggeredBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const DuplicateReviewSchema = new Schema<IDuplicateReview>(
  {
    productAId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productAName: String,
    productASku: String,
    productBId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productBName: String,
    productBSku: String,
    similarityScore: { type: Number, required: true, min: 0, max: 100 },
    matchedFields: [{ type: String }],
    evidence: [{
      field: String,
      valueA: String,
      valueB: String,
      score: Number,
      _id: false,
    }],
    status: { type: String, enum: ['pending', 'dismissed', 'confirmed', 'merged'], default: 'pending' },
    reviewedBy: String,
    reviewedAt: Date,
    resolution: String,
  },
  { timestamps: true, versionKey: false },
);

DuplicateReviewSchema.index({ status: 1 });
DuplicateReviewSchema.index({ productAId: 1 });
DuplicateReviewSchema.index({ productBId: 1 });

const AIProposalSchema = new Schema<IAIProposal>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    taskType: { type: String, required: true },
    proposalText: { type: Schema.Types.Mixed, required: true },
    before: { type: Schema.Types.Mixed },
    aiModel: { type: String },
    tokensUsed: { type: Number, default: 0 },
    reasoning: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: String,
    approvedAt: Date,
    rejectedBy: String,
    rejectedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

AIProposalSchema.index({ productId: 1 });
AIProposalSchema.index({ status: 1 });

const PublishingJobSchema = new Schema<IPublishingJob>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productSku: { type: String, required: true },
    destination: { type: String, required: true, default: 'WooCommerce' },
    status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'simulated'], default: 'queued' },
    externalId: String,
    externalUrl: String,
    attempts: { type: Number, default: 0 },
    lastAttemptAt: Date,
    completedAt: Date,
    error: String,
    isSimulated: { type: Boolean, default: false },
    triggeredBy: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

PublishingJobSchema.index({ productId: 1 });
PublishingJobSchema.index({ status: 1 });

export const DuplicateReview = model<IDuplicateReview>('DuplicateReview', DuplicateReviewSchema);
export const AIProposal = model<IAIProposal>('AIProposal', AIProposalSchema);
export const PublishingJob = model<IPublishingJob>('PublishingJob', PublishingJobSchema);
