import { Router } from 'express';
import { taskController } from './task.controller';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../middleware/validate';
import { createTaskSchema, taskIdParamSchema, agentTasksParamSchema } from './task.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task routes
router.post('/create', validate(createTaskSchema), taskController.createTask.bind(taskController));
router.post('/:id/execute', validate(taskIdParamSchema), taskController.executeTask.bind(taskController));
router.get('/:id', validate(taskIdParamSchema), taskController.getTask.bind(taskController));
router.get('/agent/:agentId', validate(agentTasksParamSchema), taskController.getAgentTasks.bind(taskController));

export default router;
