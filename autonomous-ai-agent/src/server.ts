import dotenv from 'dotenv';
// Load environment variables before anything else
dotenv.config();

import app from './app';
import { env } from './config/env';
import prisma from './config/prisma';
import { schedulerService } from './services';
import { createLogger } from './utils/logger';

const logger = createLogger('Server');

async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('Database connected successfully');

        // Start the scheduler for autonomous tasks
        schedulerService.start();

        // Start Express server
        app.listen(env.server.port, () => {
            logger.info(`🔥 Server running on http://localhost:${env.server.port}`);
            logger.info(`📝 Environment: ${env.server.nodeEnv}`);
            logger.info(`🔗 Blockchain RPC: ${env.blockchain.rpcUrl}`);

            if (env.blockchain.contractAddress) {
                logger.info(`📋 Contract: ${env.blockchain.contractAddress}`);
            } else {
                logger.warn('⚠️  No contract address configured - blockchain logging disabled');
            }
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    schedulerService.stop();
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down gracefully...');
    schedulerService.stop();
    await prisma.$disconnect();
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

main();
