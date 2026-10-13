import { Schema, model, Document } from 'mongoose';
import crypto from 'crypto';
import { env } from '../config/env';

// AES-256-GCM encryption helpers
const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(env.ENCRYPTION_KEY.padEnd(64, '0').slice(0, 64), 'hex');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export interface IWooConnection extends Document {
  siteUrl: string;
  consumerKey: string;      // stored encrypted
  consumerSecret: string;   // stored encrypted
  isVerified: boolean;
  lastTestedAt?: Date;
  webhookSecret: string;    // stored encrypted
  // Methods
  getConsumerKey(): string;
  getConsumerSecret(): string;
  getWebhookSecret(): string;
}

const WooConnectionSchema = new Schema<IWooConnection>(
  {
    siteUrl: { type: String, required: true },
    consumerKey: { type: String, required: true },
    consumerSecret: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    lastTestedAt: Date,
    webhookSecret: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

// Encrypt before saving
WooConnectionSchema.pre('save', function (next) {
  if (this.isModified('consumerKey') && !this.consumerKey.includes(':')) {
    this.consumerKey = encrypt(this.consumerKey);
  }
  if (this.isModified('consumerSecret') && !this.consumerSecret.includes(':')) {
    this.consumerSecret = encrypt(this.consumerSecret);
  }
  if (this.isModified('webhookSecret') && this.webhookSecret && !this.webhookSecret.includes(':')) {
    this.webhookSecret = encrypt(this.webhookSecret);
  }
  next();
});

WooConnectionSchema.methods.getConsumerKey = function (): string {
  try { return decrypt(this.consumerKey); } catch { return this.consumerKey; }
};
WooConnectionSchema.methods.getConsumerSecret = function (): string {
  try { return decrypt(this.consumerSecret); } catch { return this.consumerSecret; }
};
WooConnectionSchema.methods.getWebhookSecret = function (): string {
  try { return decrypt(this.webhookSecret); } catch { return this.webhookSecret; }
};

export const WooConnection = model<IWooConnection>('WooConnection', WooConnectionSchema);
