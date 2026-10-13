import { Schema, model, Document, Types } from 'mongoose';

export interface IToolCallRecord {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: Date;
}

export interface IAgentTask extends Document {
  productId?: Types.ObjectId;
  taskType: 'enrich' | 'validate' | 'bulk_enrich' | 'suggest_categories';
  prompt: string;
  status: 'pending' | 'running' | 'awaiting_approval' | 'approved' | 'rejected' | 'completed' | 'failed';
  toolCalls: IToolCallRecord[];
  iterationCount: number;
  maxIterations: number;
  result?: unknown;
  requiresHumanApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  error?: string;
}

const AgentTaskSchema = new Schema<IAgentTask>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    taskType: { type: String, enum: ['enrich', 'validate', 'bulk_enrich', 'suggest_categories'], required: true },
    prompt: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'awaiting_approval', 'approved', 'rejected', 'completed', 'failed'],
      default: 'pending',
    },
    toolCalls: [
      {
        tool: String,
        input: { type: Schema.Types.Mixed },
        output: { type: Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    iterationCount: { type: Number, default: 0 },
    maxIterations: { type: Number, default: 10 },
    result: { type: Schema.Types.Mixed },
    requiresHumanApproval: { type: Boolean, default: true },
    approvedBy: String,
    approvedAt: Date,
    error: String,
  },
  { timestamps: true, versionKey: false },
);

AgentTaskSchema.index({ status: 1 });
AgentTaskSchema.index({ productId: 1 });

export const AgentTask = model<IAgentTask>('AgentTask', AgentTaskSchema);
