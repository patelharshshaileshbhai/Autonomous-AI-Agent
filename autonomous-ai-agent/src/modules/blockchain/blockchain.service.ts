import { ethers, Contract } from 'ethers';
import { env } from '../../config/env';
import prisma from '../../config/prisma';
import { agentService } from '../agent';
import { walletService } from '../wallet';
import { BlockchainError, TransactionError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';
import { AGENT_LOGGER_ABI } from './blockchain.abi';

const logger = createLogger('BlockchainService');

class BlockchainService {
    private provider: ethers.JsonRpcProvider;
    private contract: Contract | null = null;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(env.blockchain.rpcUrl);

        if (env.blockchain.contractAddress) {
            this.contract = new ethers.Contract(
                env.blockchain.contractAddress,
                AGENT_LOGGER_ABI,
                this.provider
            );
        }
    }

    /**
     * Check if blockchain logging is configured
     */
    isConfigured(): boolean {
        return !!env.blockchain.contractAddress;
    }

    /**
     * Log an action to the blockchain
     */
    async logAction(agentId: string, action: string, cost: number): Promise<string> {
        if (!this.contract) {
            logger.warn('Blockchain logging not configured - skipping');
            return '';
        }

        try {
            // Get agent's encrypted private key
            const encryptedKey = await agentService.getAgentPrivateKey(agentId);
            const wallet = walletService.getWallet(encryptedKey);
            const connectedWallet = wallet.connect(this.provider);

            // Create a hash of the action to store on-chain (to save gas)
            const actionHash = ethers.keccak256(ethers.toUtf8Bytes(action));
            const costWei = ethers.parseEther(cost.toString());

            // Connect contract with signer
            const contractWithSigner = this.contract.connect(connectedWallet) as Contract;

            // Estimate gas
            const gasEstimate = await contractWithSigner.logAction.estimateGas(
                actionHash,
                costWei
            );

            // Send transaction
            const tx = await contractWithSigner.logAction(
                actionHash,
                costWei,
                { gasLimit: gasEstimate * 120n / 100n } // 20% buffer
            );

            logger.info('Blockchain transaction sent', { hash: tx.hash, agentId });

            // Wait for confirmation
            const receipt = await tx.wait();

            if (!receipt) {
                throw new TransactionError('Transaction failed - no receipt');
            }

            logger.info('Blockchain transaction confirmed', {
                hash: receipt.hash,
                gasUsed: receipt.gasUsed.toString()
            });

            return receipt.hash;
        } catch (error) {
            logger.error('Failed to log action on blockchain', error);
            throw new BlockchainError(
                error instanceof Error ? error.message : 'Blockchain logging failed'
            );
        }
    }

    /**
     * Get action from blockchain by index
     */
    async getAction(index: number): Promise<{
        agent: string;
        actionHash: string;
        cost: string;
        timestamp: number;
    } | null> {
        if (!this.contract) {
            return null;
        }

        try {
            const result = await this.contract.getAction(index);
            return {
                agent: result[0],
                actionHash: result[1],
                cost: ethers.formatEther(result[2]),
                timestamp: Number(result[3]),
            };
        } catch (error) {
            logger.error('Failed to get action from blockchain', error);
            return null;
        }
    }

    /**
     * Get total actions logged
     */
    async getTotalActionsLogged(): Promise<number> {
        if (!this.contract) {
            return 0;
        }

        try {
            const total = await this.contract.totalActionsLogged();
            return Number(total);
        } catch (error) {
            logger.error('Failed to get total actions', error);
            return 0;
        }
    }

    /**
     * Get agent action count from blockchain
     */
    async getAgentActionCount(walletAddress: string): Promise<number> {
        if (!this.contract) {
            return 0;
        }

        try {
            const count = await this.contract.getAgentActionCount(walletAddress);
            return Number(count);
        } catch (error) {
            logger.error('Failed to get agent action count', error);
            return 0;
        }
    }

    /**
     * Get blockchain logs from database
     */
    async getBlockchainLogs(agentId: string, limit: number = 50) {
        const logs = await prisma.blockchainLog.findMany({
            where: { agentId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });

        return logs;
    }

    /**
     * Verify a transaction on the blockchain
     */
    async verifyTransaction(txHash: string): Promise<{
        confirmed: boolean;
        blockNumber?: number;
        gasUsed?: string;
    }> {
        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);

            if (!receipt) {
                return { confirmed: false };
            }

            return {
                confirmed: receipt.status === 1,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
            };
        } catch (error) {
            logger.error('Failed to verify transaction', error);
            return { confirmed: false };
        }
    }

    /**
     * Get current gas price
     */
    async getGasPrice(): Promise<string> {
        try {
            const feeData = await this.provider.getFeeData();
            return ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
        } catch (error) {
            logger.error('Failed to get gas price', error);
            throw new BlockchainError('Failed to get gas price');
        }
    }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
