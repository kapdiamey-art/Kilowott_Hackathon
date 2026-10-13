import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectDB(retries = MAX_RETRIES): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('✅  MongoDB connected');
  } catch (err) {
    if (retries > 0) {
      logger.warn(`MongoDB connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s… (${retries} attempts left)`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    }
    logger.error({ err }, '❌  MongoDB connection failed permanently');
    process.exit(1);
  }
}

export function dbStatus(): 'connected' | 'disconnected' | 'connecting' {
  const state = mongoose.connection.readyState;
  if (state === 1) return 'connected';
  if (state === 2) return 'connecting';
  return 'disconnected';
}
