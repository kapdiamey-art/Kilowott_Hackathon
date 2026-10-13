import { buildApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import { bootstrapAdmin } from './utils/bootstrap';

async function main() {
  logger.info('Starting ProductShelf backend…');

  // Connect to MongoDB
  await connectDB();

  // Bootstrap admin account if needed (safe, idempotent)
  await bootstrapAdmin();

  // Start HTTP server
  const app = buildApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📡 CORS allowed for: ${env.FRONTEND_URL}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      const mongoose = await import('mongoose');
      await mongoose.default.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
