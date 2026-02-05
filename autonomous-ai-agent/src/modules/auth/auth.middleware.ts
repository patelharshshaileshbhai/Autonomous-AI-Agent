import { Request, Response, NextFunction } from 'express';
import { authService, JwtPayload } from './auth.service';
import { UnauthorizedError } from '../../utils/errors';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedError('No authorization header provided');
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new UnauthorizedError('Invalid authorization header format');
        }

        const token = parts[1]!;
        const payload = authService.verifyToken(token);

        req.user = payload;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional authentication - attaches user if token is valid, continues otherwise
 */
export const optionalAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const parts = authHeader.split(' ');

            if (parts.length === 2 && parts[0] === 'Bearer') {
                const token = parts[1]!;
                const payload = authService.verifyToken(token);
                req.user = payload;
            }
        }

        next();
    } catch {
        // Token is invalid, but we continue without user context
        next();
    }
};
