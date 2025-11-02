import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';

export async function registerInitialAdmin(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const existing = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (existing) return res.status(400).json({ message: 'Admin already exists. Use admin creation endpoint.' });

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, password: hashed, role: 'admin', isActive: true } });
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (!user.isActive) return res.status(403).json({ message: 'Account not activated by admin' });
  const ok = await verifyPassword(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export async function me(req: Request, res: Response) {
  const userPayload = (req as any).user;
  if (!userPayload) return res.status(401).json({ message: 'Unauthorized' });
  // Debug: log the incoming payload and the DB lookup result to help diagnose mismatches
  // eslint-disable-next-line no-console
  console.debug('[auth.me] token payload:', { id: userPayload.id, email: userPayload.email, role: userPayload.role });
  const u = await prisma.user.findUnique({ where: { id: userPayload.id }, select: { id: true, name: true, email: true, role: true, isActive: true } });
  // eslint-disable-next-line no-console
  console.debug('[auth.me] db user found:', !!u, 'for id', userPayload.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  res.json(u);
}

export async function tokenPayload(req: Request, res: Response) {
  // Return the decoded JWT payload (no DB lookup) for debugging
  const payload = (req as any).user;
  if (!payload) return res.status(401).json({ message: 'Unauthorized' });
  res.json({ payload });
}

export async function debugUsers(req: Request, res: Response) {
  // Admin-only endpoint to list users and ids (dev helper)
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, isActive: true } });
  res.json(users);
}
