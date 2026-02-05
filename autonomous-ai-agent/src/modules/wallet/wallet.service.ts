import { ethers } from 'ethers';
import { encrypt, decrypt } from '../../utils/encryption';
import { env } from '../../config/env';
import { WalletError, InsufficientFundsError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';

const logger = createLogger('WalletService');

export interface WalletInfo {
    address: string;
    encryptedPrivateKey: string;
}

export interface TransactionRequest {
    to: string;
    value: string; // In ETH
    data?: string;
}

export interface TransactionResult {
    hash: string;
    from: string;
    to: string;
    value: string;
    gasUsed?: string;
}

class WalletService {
    private provider: ethers.JsonRpcProvider;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(env.blockchain.rpcUrl);
    }

    /**
     * Generate a new wallet with encrypted private key
     */
    generateWallet(): WalletInfo {
        try {
            const wallet = ethers.Wallet.createRandom();
            const encryptedPrivateKey = encrypt(wallet.privateKey);

            logger.info('Generated new wallet', { address: wallet.address });

            return {
                address: wallet.address,
                encryptedPrivateKey,
            };
        } catch (error) {
            logger.error('Failed to generate wallet', error);
            throw new WalletError('Failed to generate wallet');
        }
    }

    /**
     * Get wallet from encrypted private key
     */
    getWallet(encryptedPrivateKey: string): ethers.Wallet {
        try {
            const privateKey = decrypt(encryptedPrivateKey);
            return new ethers.Wallet(privateKey, this.provider);
        } catch (error) {
            logger.error('Failed to decrypt wallet', error);
            throw new WalletError('Failed to access wallet');
        }
    }

    /**
     * Get wallet balance in ETH
     */
    async getBalance(address: string): Promise<string> {
        try {
            const balance = await this.provider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            logger.error('Failed to get balance', { address, error });
            throw new WalletError('Failed to get wallet balance');
        }
    }

    /**
     * Get wallet balance in Wei
     */
    async getBalanceWei(address: string): Promise<bigint> {
        try {
            return await this.provider.getBalance(address);
        } catch (error) {
            logger.error('Failed to get balance in Wei', { address, error });
            throw new WalletError('Failed to get wallet balance');
        }
    }

    /**
     * Check if wallet has sufficient balance for a transaction
     */
    async hasSufficientBalance(address: string, amountEth: number): Promise<boolean> {
        const balance = await this.getBalanceWei(address);
        const required = ethers.parseEther(amountEth.toString());
        return balance >= required;
    }

    /**
     * Send a transaction from the wallet
     */
    async sendTransaction(
        encryptedPrivateKey: string,
        request: TransactionRequest
    ): Promise<TransactionResult> {
        const wallet = this.getWallet(encryptedPrivateKey);

        try {
            // Check balance first
            const balance = await this.getBalanceWei(wallet.address);
            const value = ethers.parseEther(request.value);

            // Estimate gas
            const gasEstimate = await this.provider.estimateGas({
                from: wallet.address,
                to: request.to,
                value,
                data: request.data,
            });

            const feeData = await this.provider.getFeeData();
            const gasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei');
            const totalCost = value + (gasEstimate * gasPrice);

            if (balance < totalCost) {
                throw new InsufficientFundsError(
                    `Insufficient funds. Balance: ${ethers.formatEther(balance)} ETH, Required: ${ethers.formatEther(totalCost)} ETH`
                );
            }

            // Send transaction
            const tx = await wallet.sendTransaction({
                to: request.to,
                value,
                data: request.data,
                gasLimit: gasEstimate,
            });

            logger.info('Transaction sent', { hash: tx.hash, to: request.to, value: request.value });

            // Wait for confirmation
            const receipt = await tx.wait();

            if (!receipt) {
                throw new WalletError('Transaction failed - no receipt');
            }

            return {
                hash: receipt.hash,
                from: wallet.address,
                to: request.to,
                value: request.value,
                gasUsed: receipt.gasUsed.toString(),
            };
        } catch (error) {
            if (error instanceof InsufficientFundsError) {
                throw error;
            }
            logger.error('Transaction failed', { error });
            throw new WalletError(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Sign a message with the wallet
     */
    async signMessage(encryptedPrivateKey: string, message: string): Promise<string> {
        const wallet = this.getWallet(encryptedPrivateKey);
        try {
            return await wallet.signMessage(message);
        } catch (error) {
            logger.error('Failed to sign message', error);
            throw new WalletError('Failed to sign message');
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
            throw new WalletError('Failed to get gas price');
        }
    }

    /**
     * Estimate gas for a transaction
     */
    async estimateGas(request: TransactionRequest): Promise<string> {
        try {
            const estimate = await this.provider.estimateGas({
                to: request.to,
                value: ethers.parseEther(request.value),
                data: request.data,
            });
            return estimate.toString();
        } catch (error) {
            logger.error('Failed to estimate gas', error);
            throw new WalletError('Failed to estimate gas');
        }
    }
}

export const walletService = new WalletService();
export default walletService;
