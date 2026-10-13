import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().min(6, 'ADMIN_PASSWORD must be at least 6 characters'),

  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),

  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default('https://generativelanguage.googleapis.com/v1beta/openai'),
  AI_MODEL: z.string().default('gemini-2.0-flash-exp'),
  AI_MAX_TOKENS: z.coerce.number().default(2048),
  AI_TEMPERATURE: z.coerce.number().default(0.3),

  AGENT_MAX_ITERATIONS: z.coerce.number().default(10),
  AGENT_TIMEOUT_MS: z.coerce.number().default(120000),

  WOO_SITE_URL: z.string().optional(),
  WOO_CONSUMER_KEY: z.string().optional(),
  WOO_CONSUMER_SECRET: z.string().optional(),
  WOO_WEBHOOK_SECRET: z.string().optional(),

  SYNC_CRON_SCHEDULE: z.string().default('0 2 * * *'),
  SYNC_ENABLED: z.coerce.boolean().default(false),
  SYNC_BATCH_SIZE: z.coerce.number().default(20),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:\n');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
