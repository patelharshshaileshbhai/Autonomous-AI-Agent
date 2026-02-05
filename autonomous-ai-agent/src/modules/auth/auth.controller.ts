import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { RegisterInput, LoginInput } from './auth.schema';

export class AuthController {
    /**
     * POST /auth/register
     */
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: RegisterInput = req.body;
            const result = await authService.register(input);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /auth/login
     */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: LoginInput = req.body;
            const result = await authService.login(input);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /auth/me
     */
    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const user = await authService.getUserById(userId);

            res.status(200).json({
                success: true,
                data: { user },
            });
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
export default authController;
