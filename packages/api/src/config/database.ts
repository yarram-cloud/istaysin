import { PrismaClient, Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// ── Actual PrismaClient instance ──
const actualPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// ── AsyncLocalStorage for transaction client ──
const txStore = new AsyncLocalStorage<Prisma.TransactionClient>();

// ── Proxy-based prisma export ──
// When inside withTenant(), all calls to prisma.* automatically route
// to the transaction client. This makes RLS + PgBouncer safe WITHOUT
// requiring any changes to router callback code.
export const prisma = new Proxy(actualPrisma, {
  get(target, prop, receiver) {
    const tx = txStore.getStore();
    if (tx && prop !== '$transaction' && prop !== '$connect' && prop !== '$disconnect' && prop !== '$on' && prop !== '$extends') {
      return Reflect.get(tx, prop, receiver);
    }
    return Reflect.get(target, prop, receiver);
  },
}) as unknown as PrismaClient;

// Keep global reference for hot-reload in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Execute a callback within a tenant's RLS context.
 *
 * Uses an interactive transaction to guarantee that SET LOCAL and all
 * subsequent queries execute on the SAME database connection.
 * This is critical for PgBouncer/Neon connection pooler safety.
 *
 * NOTE: SET LOCAL cannot use $1 parameter binding in PostgreSQL, so we
 * must use string interpolation. The UUID regex validation below is the
 * defense-in-depth layer against injection.
 */
export async function withTenant<T>(
  tenantId: string,
  callback: () => Promise<T>
): Promise<T> {
  // Strict UUID v4 validation — defense against SQL injection
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(tenantId)) {
    throw new Error('Invalid tenant ID format');
  }

  return actualPrisma.$transaction(async (tx) => {
    try {
      // SET LOCAL cannot use parameterized queries ($1), this is a PostgreSQL limitation.
      // The strict UUID regex above ensures only hex chars and dashes pass through.
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
      return await txStore.run(tx, callback);
    } catch (err) {
      console.error(`[withTenant ERROR for ${tenantId}]`, err);
      throw err;
    }
  }, {
    timeout: 15000,
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}

/**
 * Get today's date in YYYY-MM-DD format using property timezone (Asia/Kolkata default).
 */
export function getLocalDate(date?: Date, timezone: string = 'Asia/Kolkata'): string {
  const d = date || new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  return parts;
}

/**
 * Get current time components in property timezone.
 */
export function getPropertyTime(date?: Date, timezone: string = 'Asia/Kolkata'): { hours: number; minutes: number } {
  const d = date || new Date();
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).format(d);
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}
