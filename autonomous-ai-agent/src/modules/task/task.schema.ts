import { z } from 'zod';

export const createTaskSchema = z.object({
    body: z.object({
        agentId: z.string().uuid('Invalid agent ID'),
        prompt: z
            .string()
            .min(1, 'Task prompt is required')
            .max(5000, 'Task prompt must be less than 5000 characters'),
    }),
});

export const taskIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid task ID'),
    }),
});

export const agentTasksParamSchema = z.object({
    params: z.object({
        agentId: z.string().uuid('Invalid agent ID'),
    }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
