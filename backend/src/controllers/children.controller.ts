import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { generateLocalId, computeAnthro } from '../utils/anthro';
// Local minimal types to avoid depending on generated Prisma typings at edit-time
type FollowUpEntry = {
  recordedAt: Date;
  weightKg: number;
  heightCm: number;
  headCircCm?: number | null;
};

type ChildWithRelations = {
  id: string;
  dob: Date;
  initialWeightKg: number;
  initialHeightCm: number;
  initialHeadCircCm?: number | null;
  sex: 'male' | 'female';
  followUps: FollowUpEntry[];
};

export async function createChild(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'chw' && user.role !== 'admin') return res.status(403).json({ message: 'Only CHWs or Admins can create child records' });
  const body = req.body;
  const localId = await generateLocalId();
  // Defensive check: ensure the user id in the token exists in the database before using it
  try {
    // Debug: show the decoded token/user object to diagnose lookup failures
    // eslint-disable-next-line no-console
    console.debug('[createChild] req.user full payload:', JSON.stringify(user));
    // eslint-disable-next-line no-console
    console.debug('[createChild] DATABASE_URL present:', !!process.env.DATABASE_URL);
    const existingUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, isActive: true } });
    if (!existingUser) {
      return res.status(401).json({ message: 'Authenticated user not found in database' });
    }

    if (!existingUser.isActive) {
      return res.status(403).json({ message: 'Account not activated' });
    }

    // Log minimal debug info to help trace foreign-key issues (do not log sensitive data)
    // eslint-disable-next-line no-console
    console.debug('[createChild] userId=', user.id, 'payloadKeys=', Object.keys(body));

    const child = await prisma.child.create({ data: {
      localId,
      name: body.name,
      motherName: body.motherName,
      motherNationalId: body.motherNationalId ?? null,
      motherMaritalStatus: body.motherMaritalStatus ?? null,
      motherAge: body.motherAge ?? null,
      dob: new Date(body.dob),
      sex: body.sex,
      address: body.address,
      region: body.region ?? null,
      district: body.district ?? null,
      fatherName: body.fatherName ?? null,
      fatherNationalId: body.fatherNationalId ?? null,
      latitude: body.geo?.lat ?? 0,
      longitude: body.geo?.lng ?? 0,
      complications: body.complications,
      createdById: user.id,
      initialRecordedAt: new Date(body.initialRecordedAt),
      initialWeightKg: body.initialWeightKg,
      initialHeightCm: body.initialHeightCm,
      initialHeadCircCm: body.initialHeadCircCm
    }});

    res.status(201).json(child);
  } catch (err: any) {
    // Better error response for FK or validation failures
    // eslint-disable-next-line no-console
    console.error('[createChild] error:', err?.message || err);
    if (err?.code === 'P2003' || /Foreign key constraint/.test(err?.message || '')) {
      return res.status(400).json({ message: 'Invalid createdBy reference (user may not exist).' });
    }
    return res.status(500).json({ message: err?.message || 'Failed to create child' });
  }
}

export async function getChildren(req: Request, res: Response) {
  const { collectorId, q } = req.query;
  const where: any = {};
  if (collectorId) where.createdById = collectorId as string;
  if (q) {
    where.OR = [
      { name: { contains: String(q), mode: 'insensitive' } },
      { motherName: { contains: String(q), mode: 'insensitive' } },
      { address: { contains: String(q), mode: 'insensitive' } }
    ];
  }
  const children = await prisma.child.findMany({ where, include: { followUps: true, createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
  const withAnalysis = children.map((c: ChildWithRelations) => {
    const last = c.followUps.length ? c.followUps[c.followUps.length -1] : null;
    const weight = last ? last.weightKg : c.initialWeightKg;
    const height = last ? last.heightCm : c.initialHeightCm;
    const ageDays = Math.floor((new Date().getTime() - c.dob.getTime())/ (1000*60*60*24));
    const analysis = computeAnthro({ ageDays, weight, height, sex: c.sex });
    return { ...c, analysis };
  });
  res.json(withAnalysis);
}

export async function getChildById(req: Request, res: Response) {
  const { id } = req.params;
  const child = await prisma.child.findUnique({ where: { id }, include: { followUps: { orderBy: { recordedAt: 'asc' } }, createdBy: true } });
  if (!child) return res.status(404).json({ message: 'Child not found' });
  const entries = [
    { recordedAt: child.initialRecordedAt, weightKg: child.initialWeightKg, heightCm: child.initialHeightCm, headCircCm: child.initialHeadCircCm },
  ...child.followUps.map((f: FollowUpEntry) => ({ recordedAt: f.recordedAt, weightKg: f.weightKg, heightCm: f.heightCm, headCircCm: f.headCircCm }))
  ];
  const timeline = entries.map(e => ({
    ...e,
    analysis: computeAnthro({ ageDays: Math.floor((new Date(e.recordedAt).getTime() - child.dob.getTime()) / (1000*60*60*24)), weight: e.weightKg, height: e.heightCm, sex: child.sex })
  }));
  res.json({ ...child, timeline });
}

export async function addFollowUp(req: Request, res: Response) {
  const user = (req as any).user;
  const { id } = req.params;
  const { recordedAt, weightKg, heightCm, headCircCm } = req.body;
  const child = await prisma.child.findUnique({ where: { id }});
  if (!child) return res.status(404).json({ message: 'Child not found' });
  if (user.role !== 'admin' && user.id !== child.createdById) return res.status(403).json({ message: 'Forbidden' });
  const f = await prisma.followUp.create({ data: { childId: id, recordedAt: new Date(recordedAt), weightKg, heightCm, headCircCm, collectorId: user.id } });
  res.status(201).json(f);
}

export async function updateChild(req: Request, res: Response) {
  const user = (req as any).user;
  const { id } = req.params;
  const body = req.body;
  const child = await prisma.child.findUnique({ where: { id }});
  if (!child) return res.status(404).json({ message: 'Child not found' });
  if (user.role !== 'admin' && user.id !== child.createdById) return res.status(403).json({ message: 'Forbidden' });
  const updated = await prisma.child.update({ where: { id }, data: { 
    name: body.name ?? child.name,
    motherName: body.motherName ?? child.motherName,
    motherNationalId: body.motherNationalId ?? child.motherNationalId,
    motherMaritalStatus: body.motherMaritalStatus ?? child.motherMaritalStatus,
    motherAge: body.motherAge ?? child.motherAge,
    region: body.region ?? child.region,
    district: body.district ?? child.district,
    fatherName: body.fatherName ?? child.fatherName,
    fatherNationalId: body.fatherNationalId ?? child.fatherNationalId,
    address: body.address ?? child.address,
    latitude: body.geo?.lat ?? child.latitude,
    longitude: body.geo?.lng ?? child.longitude,
    complications: body.complications ?? child.complications } });
  res.json(updated);
}

export async function deleteChild(req: Request, res: Response) {
  const user = (req as any).user;
  const { id } = req.params;
  const child = await prisma.child.findUnique({ where: { id }});
  if (!child) return res.status(404).json({ message: 'Child not found' });
  if (user.role !== 'admin' && user.id !== child.createdById) return res.status(403).json({ message: 'Forbidden' });
  await prisma.followUp.deleteMany({ where: { childId: id }});
  await prisma.child.delete({ where: { id }});
  res.json({ message: 'Deleted' });
}

export async function reportSummary(_req: Request, res: Response) {
  const children = await prisma.child.findMany({ include: { followUps: true }});
  function classify(c: any) {
    const last = c.followUps.length ? c.followUps[c.followUps.length -1] : null;
    const weight = last ? last.weightKg : c.initialWeightKg;
    const height = last ? last.heightCm : c.initialHeightCm;
    const a = computeAnthro({ ageDays: Math.floor((new Date().getTime() - c.dob.getTime())/(1000*60*60*24)), weight, height, sex: c.sex });
    return a.classification.wh || a.classification.wa || a.classification.ha || 'normal';
  }
  const summary = { total: children.length, byStatus: { normal:0, moderate:0, severe:0 } };
  for (const c of children) {
    const cstatus = classify(c);
    if (cstatus === 'severe') summary.byStatus.severe++;
    else if (cstatus === 'moderate') summary.byStatus.moderate++;
    else summary.byStatus.normal++;
  }
  res.json(summary);
}

export async function reportByMotherMaritalStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    // Nutritionists and admins see all data; CHWs see only their own children
    const where: any = {};
    if (user && user.role === 'chw') where.createdById = user.id;

    const children = await prisma.child.findMany({ where, include: { followUps: true } });

    function classifyChild(c: any) {
      const last = c.followUps.length ? c.followUps[c.followUps.length -1] : null;
      const weight = last ? last.weightKg : c.initialWeightKg;
      const height = last ? last.heightCm : c.initialHeightCm;
      const a = computeAnthro({ ageDays: Math.floor((new Date().getTime() - c.dob.getTime())/(1000*60*60*24)), weight, height, sex: c.sex });
      return a.classification.wh || a.classification.wa || a.classification.ha || 'normal';
    }

    const statuses = ['normal', 'moderate', 'severe'];
    const maritalEnum = ['married','divorced','single','teen'];

    const breakdown: Record<string, { total: number; byStatus: Record<string, number> }> = {};
    // initialize
    for (const m of maritalEnum) breakdown[m] = { total: 0, byStatus: { normal:0, moderate:0, severe:0 } };
    breakdown.unknown = { total: 0, byStatus: { normal:0, moderate:0, severe:0 } };

    for (const c of children) {
      const marital = c.motherMaritalStatus ?? 'unknown';
      const mKey = maritalEnum.includes(marital) ? marital : 'unknown';
      const st = classifyChild(c);
      breakdown[mKey].total++;
      if (statuses.includes(st)) breakdown[mKey].byStatus[st]++;
      else breakdown[mKey].byStatus.normal++;
    }

    // totals
    const totalChildren = children.length;

    return res.json({ total: totalChildren, breakdown });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[reportByMotherMaritalStatus] error', err?.message || err);
    return res.status(500).json({ message: 'Failed to compute report' });
  }
}

export async function exportChildren(_req: Request, res: Response) {
  try {
    const children: any[] = await prisma.child.findMany({ include: { followUps: true, createdBy: { select: { id: true, name: true, email: true } } } });
    // simple CSV export
    const header = ['id', 'localId', 'name', 'motherName', 'motherNationalId', 'motherMaritalStatus', 'motherAge', 'fatherName', 'fatherNationalId', 'dob', 'sex', 'address', 'latitude', 'longitude', 'createdById', 'createdByName', 'initialRecordedAt', 'initialWeightKg', 'initialHeightCm', 'initialHeadCircCm'];
    const rows: string[][] = children.map(c => ([
      c.id,
      c.localId,
      c.name,
      c.motherName,
      c.motherNationalId ?? '',
      c.motherMaritalStatus ?? '',
      c.motherAge ?? '',
      c.fatherName ?? '',
      c.fatherNationalId ?? '',
      c.dob.toISOString(),
      c.sex,
      c.address,
      c.latitude,
      c.longitude,
      c.createdById,
      (c as any).createdBy?.name ?? '',
      c.initialRecordedAt.toISOString(),
      c.initialWeightKg,
      c.initialHeightCm,
      c.initialHeadCircCm ?? ''
    ].map(v => typeof v === 'string' ? `"${String(v).replace(/"/g, '""')}"` : String(v))));

    const csv = [header.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="children_export.csv"');
    res.send(csv);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[exportChildren] error', err?.message || err);
    res.status(500).json({ message: 'Failed to export children' });
  }
}
