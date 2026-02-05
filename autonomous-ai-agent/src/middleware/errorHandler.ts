import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

/**
 * Global error handler middleware
 */
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log error
    logger.error('Error occurred', {
        name: err.name,
        message: err.message,
        stack: err.stack,
    });

    // Handle known operational errors
    if (err instanceof AppError) {
        const response: {
            success: boolean;
            error: {
                code: string;
                message: string;
                errors?: Record<string, string[]>;
            };
        } = {
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        };

        // Add validation errors if present
        if (err instanceof ValidationError) {
            response.error.errors = err.errors;
        }

        res.status(err.statusCode).json(response);
        return;
    }

    // Handle unknown errors
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message,
        },
    });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
};
