
import { Router } from 'express';
import { login, registerInitialAdmin, me, tokenPayload, debugUsers } from '../controllers/auth.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { createUser } from '../controllers';

const router = Router();

router.post('/register-admin', registerInitialAdmin);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.get('/token', requireAuth, tokenPayload);
router.get('/debug/users', requireAuth, debugUsers);
// Admin-only signup to create additional users
router.post('/signup', requireAuth, requireRole('admin'), createUser);

export default router;
