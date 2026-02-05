import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import prisma from '../../config/prisma';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AuthService');

const SALT_ROUNDS = 12;

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        createdAt: Date;
    };
    token: string;
}

export interface JwtPayload {
    userId: string;
    email: string;
}

interface RegisterInput {
    email: string;
    password: string;
}

interface LoginInput {
    email: string;
    password: string;
}

class AuthService {
    /**
     * Register a new user
     */
    async register(input: RegisterInput): Promise<AuthResponse> {
        const { email, password } = input;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });

        logger.info('User registered', { userId: user.id, email });

        // Generate token
        const token = this.generateToken({ userId: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
            },
            token,
        };
    }

    /**
     * Login user
     */
    async login(input: LoginInput): Promise<AuthResponse> {
        const { email, password } = input;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        logger.info('User logged in', { userId: user.id, email });

        // Generate token
        const token = this.generateToken({ userId: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
            },
            token,
        };
    }

    /**
     * Verify JWT token
     */
    verifyToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
            return decoded;
        } catch (error) {
            logger.debug('Token verification failed', error);
            throw new UnauthorizedError('Invalid or expired token');
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundError('User');
        }

        return user;
    }

    /**
     * Generate JWT token
     */
    private generateToken(payload: JwtPayload): string {
        return jwt.sign(payload, env.jwt.secret, {
            expiresIn: env.jwt.expiresIn,
        } as SignOptions);
    }
}

export const authService = new AuthService();
export default authService;
