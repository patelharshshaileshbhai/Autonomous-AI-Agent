import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from './auth.middleware';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register.bind(authController));
router.post('/login', validate(loginSchema), authController.login.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.getProfile.bind(authController));

export default router;
