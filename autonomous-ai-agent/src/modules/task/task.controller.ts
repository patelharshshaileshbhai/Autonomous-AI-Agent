import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service';
import { CreateTaskInput } from './task.schema';

export class TaskController {
    /**
     * POST /tasks/create
     */
    async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const input: CreateTaskInput = req.body;

            const task = await taskService.createTask(input, userId);

            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: { task },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /tasks/:id/execute
     */
    async executeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const taskId = req.params['id'] as string;

            const task = await taskService.executeTask({ taskId, userId });

            res.status(200).json({
                success: true,
                message: 'Task executed successfully',
                data: { task },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /tasks/:id/retry
     */
    async retryTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const taskId = req.params['id'] as string;

            const task = await taskService.retryTask(taskId, userId);

            res.status(200).json({
                success: true,
                message: 'Task reset for retry',
                data: { task },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /tasks/:id
     */
    async getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const taskId = req.params['id'] as string;

            const task = await taskService.getTaskById(taskId, userId);

            res.status(200).json({
                success: true,
                data: { task },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /tasks/agent/:agentId
     */
    async getAgentTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const agentId = req.params['agentId'] as string;

            const tasks = await taskService.getAgentTasks(agentId, userId);

            res.status(200).json({
                success: true,
                data: { tasks },
            });
        } catch (error) {
            next(error);
        }
    }
}

export const taskController = new TaskController();
export default taskController;
