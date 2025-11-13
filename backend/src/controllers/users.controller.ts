import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { hashPassword } from '../utils/password';

export async function createUser(req: Request, res: Response) {
  const { name, email, role, password, region, district } = req.body;
  if (!['chw','nutritionist','admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const hashed = await hashPassword(password || 'changeme123');
  const user = await prisma.user.create({ data: { name, email, role, password: hashed, isActive: role === 'admin' ? true : false, region: region ?? null, district: district ?? null } });
  res.status(201).json(user);
}

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({ select: { id:true, name:true, email:true, role:true, isActive:true, createdAt:true, region: true, district: true }});
  res.json(users);
}

export async function activateUser(req: Request, res: Response) {
  const { userId } = req.params;
  const user = await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  res.json(user);
}

export async function updateUser(req: Request, res: Response) {
  const { userId } = req.params;
  const { name, email, role, isActive, region, district } = req.body;
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (role !== undefined && ['chw','nutritionist','admin'].includes(role)) data.role = role;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (region !== undefined) data.region = region;
  if (district !== undefined) data.district = district;
  const user = await prisma.user.update({ where: { id: userId }, data });
  res.json(user);
}

export async function updateUserPassword(req: Request, res: Response) {
  const { userId } = req.params;
  const { password } = req.body;
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be a string with at least 6 characters' });
  }
  const hashed = await hashPassword(password);
  const user = await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  // Do not return the password hash to the client
  const { password: _pw, ...rest } = user as any;
  res.json(rest);
}

export async function deleteUser(req: Request, res: Response) {
  const { userId } = req.params;
  // Prevent deleting the last admin? (optional) For now, allow admins to delete any user including themselves.
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    throw err;
  }
}
