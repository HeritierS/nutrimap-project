import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: any;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // If an Authorization header is present, prefer verifying the token even when SKIP_AUTH=true.
  const auth = req.headers.authorization as string | undefined;
  if (auth) {
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid authorization header' });
    try {
      const payload = verifyToken(parts[1]);
      // Basic sanity check: ensure token payload contains an id we can use for DB lookups.
      if (!payload || typeof payload !== 'object' || !('id' in payload)) {
        // eslint-disable-next-line no-console
        console.warn('[requireAuth] Token payload missing id:', payload);
        return res.status(401).json({ message: 'Invalid token payload' });
      }
      req.user = payload;
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  // Development bypass: when SKIP_AUTH=true and no Authorization header is present,
  // inject a dev admin user so local quick-testing still works.
  if (process.env.SKIP_AUTH === 'true') {
    // If DEV_USER_ID is provided, prefer it so injected requests map to a real DB user.
    const devId = process.env.DEV_USER_ID || 'dev-admin';
    if (!process.env.DEV_USER_ID) {
      // eslint-disable-next-line no-console
      console.warn('[requireAuth] SKIP_AUTH=true and DEV_USER_ID not set — injecting synthetic user id dev-admin');
    }
    req.user = { id: devId, email: 'admin@dev', role: 'admin' };
    return next();
  }

  return res.status(401).json({ message: 'Missing authorization header' });
}

export function requireRole(role: 'admin'|'chw'|'nutritionist') {
  return function (req: AuthRequest, res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role !== role && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
