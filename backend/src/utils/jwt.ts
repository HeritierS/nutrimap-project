import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET: jwt.Secret = process.env.JWT_SECRET || 'change_this';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload: string | object) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return jwt.sign(payload as any, SECRET as any, { expiresIn: EXPIRES_IN } as any);
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as any;
}
