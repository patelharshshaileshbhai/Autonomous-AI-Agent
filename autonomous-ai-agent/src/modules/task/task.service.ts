import prisma from '../../config/prisma';
import { agentService } from '../agent';
import { aiService } from '../ai';
import { blockchainService } from '../blockchain';
import { TaskStatus } from '@prisma/client';
import {
    NotFoundError,
    AgentInactiveError,
    SpendingLimitExceededError,
    TaskExecutionError,
    ValidationError,
} from '../../utils/errors';
import { createLogger } from '../../utils/logger';

const logger = createLogger('TaskService');

export interface CreateTaskInput {
    agentId: string;
    prompt: string;
}

export interface ExecuteTaskInput {
    taskId: string;
    userId: string;
}

export interface TaskResult {
    id: string;
    agentId: string;
    prompt: string;
    status: TaskStatus;
    cost: number | null;
    result: string | null;
    reasoning: string | null;
    executedAt: Date | null;
    createdAt: Date;
}

class TaskService {
    /**
     * Create a new task for an agent
     */
    async createTask(input: CreateTaskInput, userId: string): Promise<TaskResult> {
        const { agentId, prompt } = input;

        // Verify agent belongs to user
        const agent = await agentService.getAgentById(agentId, userId);

        if (!agent.isActive) {
            throw new AgentInactiveError(agentId);
        }

        // Create task
        const task = await prisma.agentTask.create({
            data: {
                agentId,
                prompt,
                status: 'PENDING',
            },
        });

        logger.info('Task created', { taskId: task.id, agentId });

        return this.mapTaskToResult(task);
    }

    /**
     * Execute a pending task
     * This is the main workflow: VALIDATE → DECIDE → EXECUTE → LOG → RESPOND
     */
    async executeTask(input: ExecuteTaskInput): Promise<TaskResult> {
        const { taskId, userId } = input;

        // Get task
        const task = await prisma.agentTask.findUnique({
            where: { id: taskId },
            include: { agent: true },
        });

        if (!task) {
            throw new NotFoundError('Task');
        }

        // Verify ownership
        if (task.agent.userId !== userId) {
            throw new NotFoundError('Task');
        }

        if (task.status !== 'PENDING') {
            throw new ValidationError(`Task is already ${task.status.toLowerCase()}`);
        }

        if (!task.agent.isActive) {
            throw new AgentInactiveError(task.agentId);
        }

        // Mark as running
        await prisma.agentTask.update({
            where: { id: taskId },
            data: { status: 'RUNNING' },
        });

        try {
            // Get agent memory for context
            const memory = await aiService.getMemory(task.agentId, 10);

            // Step 1: Analyze task with AI
            const analysis = await aiService.analyzeTask({
                task: task.prompt,
                agentContext: {
                    name: task.agent.name,
                    spendingLimit: task.agent.spendingLimit,
                    totalSpent: task.agent.totalSpent,
                    isActive: task.agent.isActive,
                },
                memory,
            });

            logger.info('Task analysis complete', { taskId, analysis });

            // Step 2: Validate based on analysis
            if (!analysis.isValid) {
                const updatedTask = await prisma.agentTask.update({
                    where: { id: taskId },
                    data: {
                        status: 'FAILED',
                        reasoning: analysis.reasoning,
                        result: `Task rejected: ${analysis.suggestedAction}`,
                    },
                });
                return this.mapTaskToResult(updatedTask);
            }

            // Step 3: Check spending limits if payment required
            if (analysis.requiresPayment) {
                const canSpend = await agentService.canSpend(task.agentId, analysis.estimatedCost);

                if (!canSpend.canSpend) {
                    throw new SpendingLimitExceededError(
                        task.agent.spendingLimit - task.agent.totalSpent,
                        analysis.estimatedCost
                    );
                }
            }

            // Step 4: Execute task with AI
            const execution = await aiService.executeTask({
                task: task.prompt,
                agentContext: {
                    name: task.agent.name,
                    spendingLimit: task.agent.spendingLimit,
                    totalSpent: task.agent.totalSpent,
                    isActive: task.agent.isActive,
                },
                memory,
            });

            logger.info('Task executed', { taskId, success: execution.success });

            // Step 5: Record spending if applicable
            if (execution.cost > 0) {
                await agentService.recordSpending(task.agentId, execution.cost);
            }

            // Step 6: Log to blockchain (if contract is configured)
            let txHash: string | null = null;
            try {
                if (execution.cost > 0) {
                    txHash = await blockchainService.logAction(
                        task.agentId,
                        task.prompt.substring(0, 100),
                        execution.cost
                    );
                }
            } catch (blockchainError) {
                logger.warn('Failed to log to blockchain', blockchainError);
                // Continue execution even if blockchain logging fails
            }

            // Step 7: Store in memory
            await aiService.storeMemory(
                task.agentId,
                `Task: ${task.prompt}\nResult: ${execution.output}`,
                'assistant'
            );

            // Step 8: Update task with results
            const updatedTask = await prisma.agentTask.update({
                where: { id: taskId },
                data: {
                    status: execution.success ? 'DONE' : 'FAILED',
                    cost: execution.cost,
                    result: execution.output,
                    reasoning: execution.reasoning,
                    executedAt: new Date(),
                },
            });

            // Store blockchain log if we have a txHash
            if (txHash) {
                await prisma.blockchainLog.create({
                    data: {
                        agentId: task.agentId,
                        txHash,
                        action: task.prompt.substring(0, 255),
                        cost: execution.cost,
                        status: 'CONFIRMED',
                    },
                });
            }

            return this.mapTaskToResult(updatedTask);
        } catch (error) {
            logger.error('Task execution failed', { taskId, error });

            // Mark task as failed
            await prisma.agentTask.update({
                where: { id: taskId },
                data: {
                    status: 'FAILED',
                    result: error instanceof Error ? error.message : 'Unknown error',
                },
            });

            if (error instanceof SpendingLimitExceededError || error instanceof AgentInactiveError) {
                throw error;
            }

            throw new TaskExecutionError(
                error instanceof Error ? error.message : 'Task execution failed'
            );
        }
    }

    /**
     * Retry a failed task (reset status to PENDING)
     */
    async retryTask(taskId: string, userId: string): Promise<TaskResult> {
        const task = await prisma.agentTask.findUnique({
            where: { id: taskId },
            include: { agent: true },
        });

        if (!task || task.agent.userId !== userId) {
            throw new NotFoundError('Task');
        }

        const updatedTask = await prisma.agentTask.update({
            where: { id: taskId },
            data: {
                status: 'PENDING',
                result: null,
                reasoning: null,
                cost: null,
                executedAt: null,
                updatedAt: new Date(),
            },
        });

        logger.info('Task reset for retry', { taskId });

        return this.mapTaskToResult(updatedTask);
    }

    /**
     * Get task by ID
     */
    async getTaskById(taskId: string, userId: string): Promise<TaskResult> {
        const task = await prisma.agentTask.findUnique({
            where: { id: taskId },
            include: { agent: true },
        });

        if (!task || task.agent.userId !== userId) {
            throw new NotFoundError('Task');
        }

        return this.mapTaskToResult(task);
    }

    /**
     * Get all tasks for an agent
     */
    async getAgentTasks(agentId: string, userId: string): Promise<TaskResult[]> {
        // Verify ownership
        await agentService.getAgentById(agentId, userId);

        const tasks = await prisma.agentTask.findMany({
            where: { agentId },
            orderBy: { createdAt: 'desc' },
        });

        return tasks.map(this.mapTaskToResult);
    }

    /**
     * Get pending tasks for an agent (for scheduler)
     */
    async getPendingTasks(agentId: string): Promise<TaskResult[]> {
        const tasks = await prisma.agentTask.findMany({
            where: {
                agentId,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'asc' },
        });

        return tasks.map(this.mapTaskToResult);
    }

    private mapTaskToResult(task: {
        id: string;
        agentId: string;
        prompt: string;
        status: TaskStatus;
        cost: number | null;
        result: string | null;
        reasoning: string | null;
        executedAt: Date | null;
        createdAt: Date;
    }): TaskResult {
        return {
            id: task.id,
            agentId: task.agentId,
            prompt: task.prompt,
            status: task.status,
            cost: task.cost,
            result: task.result,
            reasoning: task.reasoning,
            executedAt: task.executedAt,
            createdAt: task.createdAt,
        };
    }
}

export const taskService = new TaskService();
export default taskService;
