import { Router } from 'express';
import { agentController } from './agent.controller';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../middleware/validate';
import {
    createAgentSchema,
    agentIdParamSchema,
    updateSpendingLimitSchema,
    setAgentActiveSchema,
} from './agent.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Agent CRUD
router.post('/create', validate(createAgentSchema), agentController.createAgent.bind(agentController));
router.get('/', agentController.getUserAgents.bind(agentController));
router.get('/:id', validate(agentIdParamSchema), agentController.getAgent.bind(agentController));
router.patch('/:id/spending-limit', validate(updateSpendingLimitSchema), agentController.updateSpendingLimit.bind(agentController));
router.patch('/:id/status', validate(setAgentActiveSchema), agentController.setAgentActive.bind(agentController));
router.delete('/:id', validate(agentIdParamSchema), agentController.deleteAgent.bind(agentController));

export default router;
