import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import type { IProduct } from '../models/Product';

// Build client only when key is configured
function getClient(): OpenAI {
  if (!env.AI_API_KEY) {
    throw new AppError(503, 'AI provider not configured. Set AI_API_KEY in .env', 'AI_NOT_CONFIGURED');
  }
  return new OpenAI({
    apiKey: env.AI_API_KEY,
    baseURL: env.AI_BASE_URL,
  });
}

export type TaskType =
  | 'improve_description'
  | 'generate_title'
  | 'create_bullet_points'
  | 'generate_seo'
  | 'suggest_attributes';

export interface AiResult {
  taskType: TaskType;
  result: string | string[];
  tokensUsed: number;
  model: string;
}

function buildPrompt(taskType: TaskType, product: Partial<IProduct>): string {
  const ctx = [
    product.name && `Product: ${product.name}`,
    product.brand && `Brand: ${product.brand}`,
    product.category && `Category: ${product.category}`,
    product.description && `Current description: ${product.description}`,
    product.bulletPoints?.length && `Current bullet points: ${product.bulletPoints.join(' | ')}`,
    product.attributes?.length && `Attributes: ${product.attributes.map((a) => `${a.name}: ${a.value}`).join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const tasks: Record<TaskType, string> = {
    improve_description: `Rewrite the product description to be compelling, benefit-driven, and SEO-friendly. Return ONLY the description text (150-300 words).`,
    generate_title: `Generate a keyword-rich, conversion-optimised product title (max 80 characters). Return ONLY the title.`,
    create_bullet_points: `Create 5 scannable bullet points highlighting key product features and benefits. Each bullet must start with a bold keyword. Return as a JSON array of strings.`,
    generate_seo: `Create a JSON object with two fields: "title" (max 60 chars, SEO-optimised) and "description" (max 160 chars, compelling meta description).`,
    suggest_attributes: `Identify the key technical attributes for this product and return them as a JSON array of objects with keys "name" and "value".`,
  };

  return `You are a product content expert.\n\n${ctx}\n\nTask: ${tasks[taskType]}`;
}

export async function runAiTask(taskType: TaskType, product: Partial<IProduct>): Promise<AiResult> {
  const client = getClient();
  const prompt = buildPrompt(taskType, product);

  logger.debug({ taskType, productId: product._id }, 'Running AI task');

  const response = await client.chat.completions.create({
    model: env.AI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: env.AI_MAX_TOKENS,
    temperature: env.AI_TEMPERATURE,
  });

  const raw = response.choices[0]?.message?.content ?? '';
  const tokensUsed = response.usage?.total_tokens ?? 0;

  let result: string | string[] = raw.trim();

  // Parse JSON responses for structured tasks
  if (taskType === 'create_bullet_points' || taskType === 'suggest_attributes' || taskType === 'generate_seo') {
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
    } catch {
      logger.warn({ taskType, raw }, 'Could not parse structured AI response — returning raw string');
    }
  }

  logger.info({ taskType, tokensUsed }, 'AI task completed');

  return { taskType, result, tokensUsed, model: env.AI_MODEL };
}

export function isAiConfigured(): boolean {
  return !!env.AI_API_KEY;
}
