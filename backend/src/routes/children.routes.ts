import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import {
  createChild,
  getChildren,
  getChildById,
  addFollowUp,
  updateChild,
  deleteChild,
  reportSummary,
  exportChildren
} from '../controllers';

const router = Router();

router.use(requireAuth);

// List children (Admin, Nutritionist)
router.get('/', requireRole('nutritionist'), getChildren);

// CHW: get only their collected children
router.get('/mine', requireRole('chw'), (req, res) => {
  // delegate to existing controller by setting query param
  (req as any).query = { ...(req.query as any), collectorId: (req as any).user.id };
  return getChildren(req, res);
});

// Create child (CHW or Admin)
router.post('/', requireRole('chw'), createChild);

// followups (CHW or Admin)
router.post('/:id/followups', requireRole('chw'), addFollowUp);

// analytics and export (Admin, Nutritionist)
router.get('/analytics', requireRole('nutritionist'), reportSummary);
router.get('/export', requireRole('nutritionist'), exportChildren);

// child detail and management
router.get('/:id', getChildById);
router.put('/:id', updateChild);
router.delete('/:id', deleteChild);

// legacy reports path
router.get('/reports/summary', reportSummary);

export default router;
