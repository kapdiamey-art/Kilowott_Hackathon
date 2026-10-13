import { Schema, model, Document, Types } from 'mongoose';

export type AttributeType = 'text' | 'number' | 'select' | 'boolean' | 'multiselect';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  parentId?: Types.ObjectId;
  color: string;
  productCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttributeDefinition extends Document {
  name: string;
  type: AttributeType;
  options: string[];
  required: boolean;
  categoryIds: Types.ObjectId[];
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: '' },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    color: { type: String, default: '#8B5CF6' },
    productCount: { type: Number, default: 0 },
    createdBy: { type: String, default: 'system' },
  },
  { timestamps: true, versionKey: false },
);

CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parentId: 1 });

const AttributeDefinitionSchema = new Schema<IAttributeDefinition>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'number', 'select', 'boolean', 'multiselect'], default: 'text' },
    options: [{ type: String }],
    required: { type: Boolean, default: false },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    description: { type: String, default: '' },
    createdBy: { type: String, default: 'system' },
  },
  { timestamps: true, versionKey: false },
);

export const Category = model<ICategory>('Category', CategorySchema);
export const AttributeDefinition = model<IAttributeDefinition>('AttributeDefinition', AttributeDefinitionSchema);
