import prisma from '../../config/prisma';
import { walletService } from '../wallet';
import { env } from '../../config/env';
import { NotFoundError, AgentInactiveError, ValidationError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AgentService');

export interface CreateAgentInput {
    userId: string;
    name: string;
    spendingLimit?: number;
}

export interface AgentWithBalance {
    id: string;
    name: string;
    walletAddress: string;
    spendingLimit: number;
    totalSpent: number;
    isActive: boolean;
    createdAt: Date;
    balance: string;
}

interface AgentRecord {
    id: string;
    name: string;
    walletAddress: string;
    encryptedPrivateKey: string;
    spendingLimit: number;
    totalSpent: number;
    isActive: boolean;
    createdAt: Date;
    userId: string;
}

class AgentService {
    /**
     * Create a new agent with a wallet
     */
    async createAgent(input: CreateAgentInput): Promise<AgentWithBalance> {
        const { userId, name, spendingLimit } = input;

        // Generate wallet for the agent
        const wallet = walletService.generateWallet();

        // Create agent in database
        const agent = await prisma.agent.create({
            data: {
                userId,
                name,
                walletAddress: wallet.address,
                encryptedPrivateKey: wallet.encryptedPrivateKey,
                spendingLimit: spendingLimit ?? env.agent.defaultSpendingLimit,
            },
        });

        logger.info('Agent created', { agentId: agent.id, name, walletAddress: wallet.address });

        // Get initial balance (will be 0)
        const balance = await walletService.getBalance(agent.walletAddress);

        return {
            id: agent.id,
            name: agent.name,
            walletAddress: agent.walletAddress,
            spendingLimit: agent.spendingLimit,
            totalSpent: agent.totalSpent,
            isActive: agent.isActive,
            createdAt: agent.createdAt,
            balance,
        };
    }

    /**
     * Get agent by ID
     */
    async getAgentById(agentId: string, userId?: string): Promise<AgentWithBalance> {
        const where: { id: string; userId?: string } = { id: agentId };
        if (userId) {
            where.userId = userId;
        }

        const agent = await prisma.agent.findFirst({
            where,
        });

        if (!agent) {
            throw new NotFoundError('Agent');
        }

        const balance = await walletService.getBalance(agent.walletAddress);

        return {
            id: agent.id,
            name: agent.name,
            walletAddress: agent.walletAddress,
            spendingLimit: agent.spendingLimit,
            totalSpent: agent.totalSpent,
            isActive: agent.isActive,
            createdAt: agent.createdAt,
            balance,
        };
    }

    /**
     * Get all agents for a user
     */
    async getUserAgents(userId: string): Promise<AgentWithBalance[]> {
        const agents = await prisma.agent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return Promise.all(
            agents.map(async (agent: AgentRecord) => {
                const balance = await walletService.getBalance(agent.walletAddress);
                return {
                    id: agent.id,
                    name: agent.name,
                    walletAddress: agent.walletAddress,
                    spendingLimit: agent.spendingLimit,
                    totalSpent: agent.totalSpent,
                    isActive: agent.isActive,
                    createdAt: agent.createdAt,
                    balance,
                };
            })
        );
    }

    /**
     * Update agent spending limit
     */
    async updateSpendingLimit(agentId: string, userId: string, newLimit: number): Promise<void> {
        const agent = await prisma.agent.findFirst({
            where: { id: agentId, userId },
        });

        if (!agent) {
            throw new NotFoundError('Agent');
        }

        if (newLimit < 0) {
            throw new ValidationError('Spending limit must be positive');
        }

        await prisma.agent.update({
            where: { id: agentId },
            data: { spendingLimit: newLimit },
        });

        logger.info('Agent spending limit updated', { agentId, newLimit });
    }

    /**
     * Activate or deactivate agent
     */
    async setAgentActive(agentId: string, userId: string, isActive: boolean): Promise<void> {
        const agent = await prisma.agent.findFirst({
            where: { id: agentId, userId },
        });

        if (!agent) {
            throw new NotFoundError('Agent');
        }

        await prisma.agent.update({
            where: { id: agentId },
            data: { isActive },
        });

        logger.info('Agent status updated', { agentId, isActive });
    }

    /**
     * Check if agent can spend amount
     */
    async canSpend(agentId: string, amount: number): Promise<{ canSpend: boolean; reason?: string }> {
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
        });

        if (!agent) {
            return { canSpend: false, reason: 'Agent not found' };
        }

        if (!agent.isActive) {
            return { canSpend: false, reason: 'Agent is inactive' };
        }

        const remainingBudget = agent.spendingLimit - agent.totalSpent;
        if (amount > remainingBudget) {
            return {
                canSpend: false,
                reason: `Exceeds remaining budget. Remaining: ${remainingBudget} ETH, Requested: ${amount} ETH`
            };
        }

        // Check wallet balance
        const hasFunds = await walletService.hasSufficientBalance(agent.walletAddress, amount);
        if (!hasFunds) {
            return { canSpend: false, reason: 'Insufficient wallet balance' };
        }

        return { canSpend: true };
    }

    /**
     * Record spending for an agent
     */
    async recordSpending(agentId: string, amount: number): Promise<void> {
        await prisma.agent.update({
            where: { id: agentId },
            data: {
                totalSpent: {
                    increment: amount,
                },
            },
        });

        logger.info('Agent spending recorded', { agentId, amount });
    }

    /**
     * Get agent's encrypted private key (for internal use only)
     */
    async getAgentPrivateKey(agentId: string): Promise<string> {
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            select: { encryptedPrivateKey: true, isActive: true },
        });

        if (!agent) {
            throw new NotFoundError('Agent');
        }

        if (!agent.isActive) {
            throw new AgentInactiveError(agentId);
        }

        return agent.encryptedPrivateKey;
    }

    /**
     * Delete an agent
     */
    async deleteAgent(agentId: string, userId: string): Promise<void> {
        const agent = await prisma.agent.findFirst({
            where: { id: agentId, userId },
        });

        if (!agent) {
            throw new NotFoundError('Agent');
        }

        await prisma.agent.delete({
            where: { id: agentId },
        });

        logger.info('Agent deleted', { agentId });
    }
}

export const agentService = new AgentService();
export default agentService;
