import { User } from '../models/User';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Creates the default admin account from env variables if it doesn't already exist.
 * Never overwrites an existing password — completely idempotent.
 * Only logs a success message, never logs credentials.
 */
export async function bootstrapAdmin(): Promise<void> {
  try {
    const email = `${env.ADMIN_USERNAME}@productshelf.local`;
    const existing = await User.findOne({ email });

    if (existing) {
      logger.info('Admin account already exists — skipping bootstrap');
      return;
    }

    await User.create({
      name: 'Admin',
      email,
      passwordHash: env.ADMIN_PASSWORD, // UserSchema.pre('save') will hash this
      role: 'admin',
      isActive: true,
    });

    logger.info(`✅  Admin account created: ${email}`);
    logger.info('   Use ADMIN_PASSWORD from your .env file to log in');
  } catch (err) {
    logger.error({ err }, 'Admin bootstrap failed — the application will still start');
  }
}
