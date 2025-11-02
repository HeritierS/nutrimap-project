import { Request, Response, NextFunction } from 'express';
import { verifyToken as verifyJwt } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * Lightweight JWT verification middleware.
 * - Validates Authorization header
 * - Verifies JWT and attaches decoded payload to req.user
 * - Supports DEV bypass via SKIP_AUTH + DEV_USER_ID (keeps parity with existing dev helper)
 */
export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  if (process.env.SKIP_AUTH === 'true') {
    const devId = process.env.DEV_USER_ID || 'dev-admin';
    if (!process.env.DEV_USER_ID) {
      // eslint-disable-next-line no-console
      console.warn('[verifyToken] SKIP_AUTH=true and DEV_USER_ID not set — injecting synthetic user id dev-admin');
    }
    req.user = { id: devId, email: 'dev@local', role: 'admin' };
    return next();
  }

  const auth = req.headers.authorization as string | undefined;
  if (!auth) return res.status(401).json({ message: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid authorization header' });
  try {
    const payload = verifyJwt(parts[1]);
    if (!payload || typeof payload !== 'object' || !('id' in payload)) {
      // eslint-disable-next-line no-console
      console.warn('[verifyToken] token payload missing id:', payload);
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export default verifyToken;
