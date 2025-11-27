import { storage } from './storage';
import { User, Child } from './types';

// Normalize VITE API base: remove trailing slash if present so joining
// with paths that start with '/' doesn't produce '//' in the final URL.
const rawBase = import.meta.env.VITE_API_URL || '';
const API_BASE = rawBase ? rawBase.replace(/\/+$/, '') : '';

async function request(path: string, opts: RequestInit = {}) {
  const session = storage.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.token) headers['Authorization'] = `Bearer ${session.token}`;
  let res: Response;
  try {
    const url = API_BASE ? `${API_BASE}${path}` : path;
    res = await fetch(url, { headers: { ...headers, ...(opts.headers as any) }, ...opts });
  } catch (err: any) {
    // Network-level errors (connection refused, DNS, CORS preflight failures that manifest here)
    const base = API_BASE || 'current origin';
    throw new Error(`Network error: failed to reach ${base}${path} — ${err?.message || err}`);
  }
  if (res.status === 204) return null;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body && body.message ? new Error(body.message) : new Error(res.statusText || 'Request failed');
    throw err;
  }
  return body;
}

function normalizeChild(raw: any): Child {
  // handle coordinates: backend may use latitude/longitude
  const lat = raw.latitude ?? raw.lat ?? raw.geo?.lat ?? null;
  const lng = raw.longitude ?? raw.lng ?? raw.geo?.lng ?? null;

  const initialRecordedAt = raw.initialRecordedAt ?? raw.initial_recorded_at ?? null;

  const initialWeightKg = raw.initialWeightKg ?? raw.initial_weight_kg ?? raw.initialAnthro?.weightKg ?? raw.initialAnthro?.weight ?? raw.initialWeight ?? null;
  const initialHeightCm = raw.initialHeightCm ?? raw.initial_height_cm ?? raw.initialAnthro?.heightCm ?? raw.initialAnthro?.height ?? raw.initialHeight ?? null;
  const initialHeadCirc = raw.initialHeadCircCm ?? raw.initialHeadCirc ?? raw.initialAnthro?.headCircCm ?? raw.initialAnthro?.headCirc ?? raw.initialHeadCircumferenceCm ?? null;

  const followUpsRaw = Array.isArray(raw.followUps) ? raw.followUps : (Array.isArray(raw.followups) ? raw.followups : []);
  const followUps = followUpsRaw.map((f: any) => ({
    id: f.id,
    recordedAt: f.recordedAt ?? f.recorded_at ?? f.createdAt ?? f.created_at,
    weightKg: f.weightKg ?? f.weight ?? f.wt ?? null,
    heightCm: f.heightCm ?? f.height ?? f.ht ?? null,
    headCircumferenceCm: f.headCircCm ?? f.headCirc ?? f.headCircumferenceCm ?? null,
  }));

  const initialAnthro = {
    recordedAt: initialRecordedAt,
    weightKg: typeof initialWeightKg === 'number' ? initialWeightKg : null,
    heightCm: typeof initialHeightCm === 'number' ? initialHeightCm : null,
    headCircumferenceCm: typeof initialHeadCirc === 'number' ? initialHeadCirc : null,
  };

  return {
    id: raw.id,
    name: raw.name,
  motherName: (raw.motherName ?? raw.mother_name ?? raw.mother) ?? '',
    dob: raw.dob ?? raw.dateOfBirth ?? raw.birthDate,
    sex: raw.sex ?? raw.gender,
    address: raw.address ?? raw.location ?? '',
    geo: { lat: lat ?? 0, lng: lng ?? 0 },
    complications: raw.complications ?? raw.notes ?? null,
    // Provide both an id and a human-friendly name for the creator when available.
    createdBy: typeof raw.createdBy === 'string' ? raw.createdBy : raw.createdBy?.id ?? raw.createdBy?.name ?? '',
    createdById: typeof raw.createdBy === 'string' ? raw.createdBy : raw.createdBy?.id ?? null,
    createdByName: typeof raw.createdBy === 'object' ? (raw.createdBy?.name ?? raw.createdBy?.email ?? null) : (typeof raw.createdBy === 'string' ? null : null),
    initialAnthro,
    followUps,
  } as Child;
}

export const api = {
  // Auth
  login: (email: string, password: string): Promise<{ user: User; token: string }> =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  registerAdmin: (name: string, email: string, password: string) =>
    request('/api/auth/register-admin', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  getMe: () => request('/api/auth/me'),

  // Users (admin only)
  listUsers: () => request('/api/users'),
  createUser: (data: { name: string; email: string; role: string; password?: string; region?: string; district?: string }) =>
    request('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  activateUser: (userId: string) => request(`/api/users/${userId}/activate`, { method: 'POST' }),
  updateUser: (userId: string, updates: any) => request(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(updates) }),
  updateUserPassword: (userId: string, password: string) => request(`/api/users/${userId}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  deleteUser: (userId: string) => request(`/api/users/${userId}`, { method: 'DELETE' }),

  // Children
  // Normalize backend child shape into frontend `Child` shape so components
  // can rely on a consistent format.
  getChildren: async (params?: { collectorId?: string; q?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const raw = await request(`/api/children${qs}`);
    if (!Array.isArray(raw)) return [] as Child[];
    return raw.map((r: any) => normalizeChild(r));
  },
  getMyChildren: async () => {
    const raw = await request('/api/children/mine');
    if (!Array.isArray(raw)) return [] as Child[];
    return raw.map((r: any) => normalizeChild(r));
  },
  getChild: async (id: string) => {
    const raw = await request(`/api/children/${id}`);
    return raw ? normalizeChild(raw) : null;
  },
  createChild: (data: any) => request('/api/children', { method: 'POST', body: JSON.stringify(data) }),
  updateChild: (id: string, data: any) => request(`/api/children/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addFollowUp: (id: string, data: any) => request(`/api/children/${id}/followups`, { method: 'POST', body: JSON.stringify(data) }),
  deleteChild: (id: string) => request(`/api/children/${id}`, { method: 'DELETE' }),
  reportSummary: () => request('/api/children/reports/summary'),
  getMotherMaritalStats: () => request('/api/analytics/mother-marital'),
  // Conversations / Discussions
  createConversation: (data: { childId?: string; title?: string }) => request('/api/conversations', { method: 'POST', body: JSON.stringify(data) }),
  listConversations: (params?: { childId?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request(`/api/conversations${qs}`);
  },
  getConversationMessages: (conversationId: string) => request(`/api/conversations/${conversationId}/messages`),
  postConversationMessage: (conversationId: string, text: string) => request(`/api/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
};

export default api;
