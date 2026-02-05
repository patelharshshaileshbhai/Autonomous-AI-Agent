import { z } from 'zod';

export const createAgentSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(1, 'Agent name is required')
            .max(100, 'Agent name must be less than 100 characters'),
        spendingLimit: z
            .number()
            .min(0, 'Spending limit must be non-negative')
            .optional(),
    }),
});

export const updateSpendingLimitSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid agent ID'),
    }),
    body: z.object({
        spendingLimit: z.number().min(0, 'Spending limit must be non-negative'),
    }),
});

export const agentIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid agent ID'),
    }),
});

export const setAgentActiveSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid agent ID'),
    }),
    body: z.object({
        isActive: z.boolean(),
    }),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>['body'];
export type UpdateSpendingLimitInput = z.infer<typeof updateSpendingLimitSchema>['body'];
export type SetAgentActiveInput = z.infer<typeof setAgentActiveSchema>['body'];
