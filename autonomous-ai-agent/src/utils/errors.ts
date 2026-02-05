/**
 * Custom error classes for the Autonomous AI Agent
 */

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: string;

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;

        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

// Authentication Errors
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

// Resource Errors
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

// Validation Errors
export class ValidationError extends AppError {
    public readonly errors: Record<string, string[]>;

    constructor(message: string = 'Validation failed', errors: Record<string, string[]> = {}) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

// Business Logic Errors
export class InsufficientFundsError extends AppError {
    constructor(message: string = 'Insufficient funds in wallet') {
        super(message, 400, 'INSUFFICIENT_FUNDS');
    }
}

export class SpendingLimitExceededError extends AppError {
    constructor(limit: number, attempted: number) {
        super(`Spending limit exceeded. Limit: ${limit}, Attempted: ${attempted}`, 400, 'SPENDING_LIMIT_EXCEEDED');
    }
}

export class AgentInactiveError extends AppError {
    constructor(agentId: string) {
        super(`Agent ${agentId} is inactive`, 400, 'AGENT_INACTIVE');
    }
}

export class TaskExecutionError extends AppError {
    constructor(message: string = 'Task execution failed') {
        super(message, 500, 'TASK_EXECUTION_ERROR');
    }
}

// Blockchain Errors
export class BlockchainError extends AppError {
    constructor(message: string = 'Blockchain operation failed') {
        super(message, 500, 'BLOCKCHAIN_ERROR');
    }
}

export class TransactionError extends AppError {
    public readonly txHash?: string;

    constructor(message: string = 'Transaction failed', txHash?: string) {
        super(message, 500, 'TRANSACTION_ERROR');
        this.txHash = txHash;
    }
}

// AI Errors
export class AIServiceError extends AppError {
    constructor(message: string = 'AI service error') {
        super(message, 503, 'AI_SERVICE_ERROR');
    }
}

// Wallet Errors
export class WalletError extends AppError {
    constructor(message: string = 'Wallet operation failed') {
        super(message, 500, 'WALLET_ERROR');
    }
}
