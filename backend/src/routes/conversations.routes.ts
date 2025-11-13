import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import conversationsController from '../controllers/conversations.controller';

const router = Router();

// All endpoints require authentication; controllers enforce role rules (exclude admin)
router.post('/', requireAuth, conversationsController.createConversation);
router.get('/', requireAuth, conversationsController.listConversations);
router.get('/:id/messages', requireAuth, conversationsController.getMessages);
router.post('/:id/messages', requireAuth, conversationsController.postMessage);

export default router;
