import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * Role-based authorization middleware factory.
 * Usage: authorizeRole(['admin', 'chw'])
 */
export function authorizeRole(allowed: Array<'admin'|'chw'|'nutritionist'>) {
  return function (req: AuthRequest, res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    // admin bypass: admin can always act
    if (user.role === 'admin') return next();
    if (!allowed.includes(user.role)) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
}

export default authorizeRole;
