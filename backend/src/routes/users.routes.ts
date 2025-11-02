import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { createUser, listUsers, activateUser, updateUser, updateUserPassword, deleteUser } from '../controllers';

const router = Router();

router.use(requireAuth);
router.post('/', requireRole('admin'), createUser);
router.get('/', requireRole('admin'), listUsers);
router.post('/:userId/activate', requireRole('admin'), activateUser);
router.put('/:userId', requireRole('admin'), updateUser);
router.patch('/:userId/password', requireRole('admin'), updateUserPassword);
router.delete('/:userId', requireRole('admin'), deleteUser);

export default router;
