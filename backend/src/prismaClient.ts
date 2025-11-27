// Resilient Prisma client: try primary DATABASE_URL, fall back to
// DATABASE_FALLBACK_URL if the initial connection fails. Export a proxy
// that forwards to the active PrismaClient instance so existing imports
// remain compatible.
// Use require to avoid certain editor/runtime interop issues.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
import type { PrismaClient as PrismaClientType } from '@prisma/client';

const LOG_OPTS = { log: ['query'] };

// Create an initial client using the primary DATABASE_URL (if any)
function createClientWithUrl(url?: string): PrismaClientType {
	if (url) {
		return new PrismaClient({ datasources: { db: { url } }, ...LOG_OPTS }) as PrismaClientType;
	}
	return new PrismaClient(LOG_OPTS) as PrismaClientType;
}

let activeClient: PrismaClientType = createClientWithUrl(process.env.DATABASE_URL);

// Proxy to forward calls to the active client instance
const handler: ProxyHandler<any> = {
	get(_target: any, prop: PropertyKey) {
		return (activeClient as any)[prop];
	},
};

const prismaProxy = new Proxy({}, handler) as unknown as PrismaClientType;

// Async init: attempt to connect to primary, otherwise try fallback.
(async () => {
	try {
		if (process.env.DATABASE_URL) {
			// try connecting to primary
			await activeClient.$connect();
			// eslint-disable-next-line no-console
			console.log('[startup] Prisma connected to primary DATABASE_URL');
			return;
		}
		// no primary specified, connect with default client
		await activeClient.$connect();
		// eslint-disable-next-line no-console
		console.log('[startup] Prisma connected using default client');
	} catch (primaryErr: unknown) {
		// eslint-disable-next-line no-console
		console.warn('[startup] Primary DB connect failed:', (primaryErr as any)?.message ?? primaryErr);
		const fallback = process.env.DATABASE_FALLBACK_URL;
		if (fallback) {
			try {
				// disconnect previous client if possible
				try { await activeClient.$disconnect(); } catch (_) {}
				activeClient = createClientWithUrl(fallback);
				await activeClient.$connect();
				// eslint-disable-next-line no-console
				console.log('[startup] Prisma connected to fallback DATABASE_FALLBACK_URL');
				return;
			} catch (fallbackErr: unknown) {
				// eslint-disable-next-line no-console
				console.error('[startup] Fallback DB connect also failed:', (fallbackErr as any)?.message ?? fallbackErr);
			}
		} else {
			// eslint-disable-next-line no-console
			console.warn('[startup] No DATABASE_FALLBACK_URL configured');
		}
	}
})();

export default prismaProxy;
