import { runAiTask, type TaskType } from './aiService';
import { Product } from '../models/Product';
import { AgentTask } from '../models/AgentTask';
import { recordChange } from './auditService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface AgentOptions {
  productId: string;
  taskType: TaskType;
  actor: string;
  requireApproval?: boolean;
}

/**
 * Agentic enrichment loop.
 * The agent runs AI tasks iteratively, with human-approval gates before committing changes.
 * Tool calls are logged to AgentTask for full transparency.
 */
export async function runEnrichmentAgent(opts: AgentOptions): Promise<typeof AgentTask.prototype> {
  const product = await Product.findById(opts.productId);
  if (!product) throw new AppError(404, `Product ${opts.productId} not found`);

  const task = await AgentTask.create({
    productId: product._id,
    taskType: 'enrich',
    prompt: `Run ${opts.taskType} for product "${product.name}" (SKU: ${product.sku})`,
    status: 'running',
    requiresHumanApproval: opts.requireApproval ?? env.NODE_ENV !== 'test',
    maxIterations: env.AGENT_MAX_ITERATIONS,
  });

  let iterations = 0;

  try {
    while (iterations < env.AGENT_MAX_ITERATIONS) {
      iterations++;
      task.iterationCount = iterations;
      await task.save();

      logger.debug({ taskId: task.id, iteration: iterations, taskType: opts.taskType }, 'Agent iteration');

      // Run AI tool
      const aiResult = await runAiTask(opts.taskType, product.toObject());

      // Log tool call
      task.toolCalls.push({
        tool: `ai.${opts.taskType}`,
        input: { productId: product.id, taskType: opts.taskType },
        output: aiResult,
        timestamp: new Date(),
      });

      // Validate result (basic check — non-empty)
      const resultOk =
        typeof aiResult.result === 'string'
          ? aiResult.result.trim().length > 10
          : Array.isArray(aiResult.result) && aiResult.result.length > 0;

      if (resultOk) {
        task.result = aiResult;
        task.status = opts.requireApproval ? 'awaiting_approval' : 'completed';
        await task.save();

        // If no approval needed — apply immediately
        if (!opts.requireApproval) {
          await applyAgentResult(task.id, opts.actor);
        }

        break;
      }

      // Retry if result was insufficient
      logger.warn({ taskId: task.id, iteration: iterations }, 'Agent result insufficient — retrying');
    }

    if (iterations >= env.AGENT_MAX_ITERATIONS && task.status === 'running') {
      task.status = 'failed';
      task.error = 'Max iterations reached without satisfactory result';
      await task.save();
    }
  } catch (err) {
    task.status = 'failed';
    task.error = err instanceof Error ? err.message : 'Unknown error';
    await task.save();
    logger.error({ err, taskId: task.id }, 'Agent task failed');
  }

  return task;
}

/**
 * Applies an approved agent task's result to the product.
 * Called either automatically (no-approval) or after human approval.
 */
export async function applyAgentResult(taskId: string, actor: string): Promise<void> {
  const task = await AgentTask.findById(taskId);
  if (!task) throw new AppError(404, `Task ${taskId} not found`);
  if (!['awaiting_approval', 'approved', 'completed'].includes(task.status)) {
    throw new AppError(400, `Task ${taskId} is not in an appliable state (status: ${task.status})`);
  }

  const product = await Product.findById(task.productId);
  if (!product) throw new AppError(404, `Product ${task.productId} not found`);

  const before = product.toObject();
  const result = task.result as { taskType: TaskType; result: string | string[] };

  // Apply AI result to the correct product field
  switch (result.taskType) {
    case 'improve_description':
      product.description = result.result as string;
      break;
    case 'generate_title':
      product.name = result.result as string;
      break;
    case 'create_bullet_points':
      product.bulletPoints = result.result as string[];
      break;
    case 'generate_seo': {
      const seo = (result.result as unknown) as { title: string; description: string };
      if (seo?.title) product.seo.title = seo.title;
      if (seo?.description) product.seo.description = seo.description;
      break;
    }
    case 'suggest_attributes': {
      const attrs = (result.result as unknown) as Array<{ name: string; value: string }>;
      const newAttrs = attrs.map((a) => ({ name: a.name, value: a.value, required: false, isAI: true }));
      // Merge — don't overwrite manually set attributes
      const existing = product.attributes.filter((a) => !a.isAI);
      product.attributes = [...existing, ...newAttrs] as typeof product.attributes;
      break;
    }
  }

  product.enrichmentStatus = 'completed';
  product.pimUpdatedAt = new Date();
  product.pimUpdatedBy = `AI Agent (approved by ${actor})`;
  await product.save();

  task.status = 'completed';
  task.approvedBy = actor;
  task.approvedAt = new Date();
  await task.save();

  await recordChange({
    entityType: 'agent_task',
    entityId: task._id,
    action: 'agent.result_applied',
    actor,
    before: { product: before },
    after: { taskType: result.taskType, result: result.result },
  });
}

export async function rejectAgentTask(taskId: string, actor: string): Promise<void> {
  const task = await AgentTask.findById(taskId);
  if (!task) throw new AppError(404, `Task ${taskId} not found`);

  task.status = 'rejected';
  task.approvedBy = actor;
  task.approvedAt = new Date();
  await task.save();

  await recordChange({
    entityType: 'agent_task',
    entityId: task._id,
    action: 'agent.result_rejected',
    actor,
  });
}
