import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import attributeRoutes from './routes/attributes';
import aiRoutes from './routes/ai';
import syncRoutes from './routes/sync';
import auditRoutes from './routes/audit';
import activityRoutes from './routes/activity';
import qualityRoutes from './routes/quality';
import duplicatesRoutes from './routes/duplicates';
import publishingRoutes from './routes/publishing';

export function buildApp() {
  const app = express();

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS — allow both deployed frontend and local dev
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:4173',
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Raw body capture for webhook (must be before JSON parser)
  app.use((req, res, next) => {
    if (req.path === '/api/sync/webhook') {
      let data = Buffer.alloc(0);
      req.on('data', (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
      req.on('end', () => {
        (req as express.Request & { rawBody: Buffer }).rawBody = data;
        next();
      });
    } else {
      next();
    }
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // HTTP logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('tiny', { stream: { write: (msg) => logger.info(msg.trim()) } }));
  }

  // Rate limiting
  app.use('/api/', rateLimiter);

  // Health check (no auth required)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', environment: env.NODE_ENV, timestamp: new Date().toISOString() });
  });

  // Mounted API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/attributes', attributeRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/quality', qualityRoutes);
  app.use('/api/duplicates', duplicatesRoutes);
  app.use('/api/publishing', publishingRoutes);

  // 404 for unknown API paths
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
