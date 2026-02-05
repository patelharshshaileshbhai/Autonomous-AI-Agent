import cron from 'node-cron';
import prisma from '../config/prisma';
import { taskService } from '../modules/task';
import { createLogger } from '../utils/logger';

const logger = createLogger('Scheduler');

class SchedulerService {
    private jobs: Map<string, cron.ScheduledTask> = new Map();
    private isRunning = false;

    /**
     * Start the scheduler
     */
    start(): void {
        if (this.isRunning) {
            logger.warn('Scheduler already running');
            return;
        }

        this.isRunning = true;
        logger.info('Scheduler started');

        // Load and start all active scheduled tasks
        this.loadScheduledTasks();

        // Cleanup job - runs every hour to clean old completed tasks
        cron.schedule('0 * * * *', () => {
            this.cleanupOldTasks();
        });
    }

    /**
     * Stop the scheduler
     */
    stop(): void {
        this.jobs.forEach((job, id) => {
            job.stop();
            logger.debug('Stopped job', { id });
        });
        this.jobs.clear();
        this.isRunning = false;
        logger.info('Scheduler stopped');
    }

    /**
     * Load and start all scheduled tasks from database
     */
    private async loadScheduledTasks(): Promise<void> {
        try {
            const scheduledTasks = await prisma.scheduledTask.findMany({
                where: { isActive: true, status: 'ACTIVE' },
            });

            for (const task of scheduledTasks) {
                this.scheduleTask(task.id, task.agentId, task.cronExpr, task.prompt);
            }

            logger.info('Loaded scheduled tasks', { count: scheduledTasks.length });
        } catch (error) {
            logger.error('Failed to load scheduled tasks', error);
        }
    }

    /**
     * Schedule a new task
     */
    scheduleTask(taskId: string, agentId: string, cronExpr: string, prompt: string): boolean {
        if (!cron.validate(cronExpr)) {
            logger.error('Invalid cron expression', { taskId, cronExpr });
            return false;
        }

        // Stop existing job if any
        if (this.jobs.has(taskId)) {
            this.jobs.get(taskId)!.stop();
        }

        const job = cron.schedule(cronExpr, async () => {
            await this.executeScheduledTask(taskId, agentId, prompt);
        });

        this.jobs.set(taskId, job);
        logger.info('Scheduled task', { taskId, cronExpr });

        return true;
    }

    /**
     * Execute a scheduled task
     */
    private async executeScheduledTask(
        scheduledTaskId: string,
        agentId: string,
        prompt: string
    ): Promise<void> {
        try {
            logger.info('Executing scheduled task', { scheduledTaskId, agentId });

            // Get agent to get userId
            const agent = await prisma.agent.findUnique({
                where: { id: agentId },
                select: { userId: true, isActive: true },
            });

            if (!agent || !agent.isActive) {
                logger.warn('Agent not found or inactive', { agentId });
                return;
            }

            // Create and execute task
            const task = await taskService.createTask({ agentId, prompt }, agent.userId);
            await taskService.executeTask({ taskId: task.id, userId: agent.userId });

            // Update last run time
            await prisma.scheduledTask.update({
                where: { id: scheduledTaskId },
                data: {
                    lastRunAt: new Date(),
                    nextRunAt: this.getNextRunTime(scheduledTaskId),
                },
            });

            logger.info('Scheduled task executed', { scheduledTaskId, taskId: task.id });
        } catch (error) {
            logger.error('Scheduled task failed', { scheduledTaskId, error });
        }
    }

    /**
     * Get next run time for a scheduled task
     */
    private getNextRunTime(taskId: string): Date | null {
        const job = this.jobs.get(taskId);
        if (!job) return null;

        // node-cron doesn't provide next run time directly
        // This is a placeholder - in production, use a library that provides this
        return new Date(Date.now() + 60000); // 1 minute from now
    }

    /**
     * Unschedule a task
     */
    unscheduleTask(taskId: string): void {
        const job = this.jobs.get(taskId);
        if (job) {
            job.stop();
            this.jobs.delete(taskId);
            logger.info('Unscheduled task', { taskId });
        }
    }

    /**
     * Cleanup old completed/failed tasks
     */
    private async cleanupOldTasks(): Promise<void> {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const deleted = await prisma.agentTask.deleteMany({
                where: {
                    status: { in: ['DONE', 'FAILED'] },
                    createdAt: { lt: thirtyDaysAgo },
                },
            });

            if (deleted.count > 0) {
                logger.info('Cleaned up old tasks', { count: deleted.count });
            }
        } catch (error) {
            logger.error('Task cleanup failed', error);
        }
    }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
