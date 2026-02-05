import { Request, Response, NextFunction } from 'express';
import { agentService } from './agent.service';
import { CreateAgentInput, UpdateSpendingLimitInput, SetAgentActiveInput } from './agent.schema';

export class AgentController {
    /**
     * POST /agents/create
     */
    async createAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const input: CreateAgentInput = req.body;

            const agent = await agentService.createAgent({
                userId,
                name: input.name,
                spendingLimit: input.spendingLimit,
            });

            res.status(201).json({
                success: true,
                message: 'Agent created successfully',
                data: { agent },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /agents/:id
     */
    async getAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const agentId = req.params['id'] as string;

            const agent = await agentService.getAgentById(agentId, userId);

            res.status(200).json({
                success: true,
                data: { agent },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /agents
     */
    async getUserAgents(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;

            const agents = await agentService.getUserAgents(userId);

            res.status(200).json({
                success: true,
                data: { agents },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /agents/:id/spending-limit
     */
    async updateSpendingLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const agentId = req.params['id'] as string;
            const input: UpdateSpendingLimitInput = req.body;

            await agentService.updateSpendingLimit(agentId, userId, input.spendingLimit);

            res.status(200).json({
                success: true,
                message: 'Spending limit updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /agents/:id/status
     */
    async setAgentActive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const agentId = req.params['id'] as string;
            const input: SetAgentActiveInput = req.body;

            await agentService.setAgentActive(agentId, userId, input.isActive);

            res.status(200).json({
                success: true,
                message: `Agent ${input.isActive ? 'activated' : 'deactivated'} successfully`,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /agents/:id
     */
    async deleteAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const agentId = req.params['id'] as string;

            await agentService.deleteAgent(agentId, userId);

            res.status(200).json({
                success: true,
                message: 'Agent deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const agentController = new AgentController();
export default agentController;
