import { prisma } from '../../config/database';

// List of tenant-scoped tables that need RLS policies
const TENANT_TABLES = [
  'floors',
  'room_types',
  'pricing_rules',
  'rooms',
  'room_photos',
  'rate_seasons',
  'bookings',
  'booking_rooms',
  'booking_guests',
  'folio_charges',
  'guest_payments',
  'invoices',
  'housekeeping_tasks',
  'maintenance_requests',
  'lost_and_found',
  'reviews',
  'notifications',
  'audit_logs',
  'tenant_stats',
  'staff_shifts',
  'channel_connections',
  'point_transactions',
  'loyalty_rewards',
  'group_blocks'
] as const;

/**
 * Setup RLS policies on all tenant-scoped tables.
 * Safe to run multiple times (uses IF NOT EXISTS).
 *
 * IMPORTANT: Table names come from the const array above, never from user input.
 * The $executeRawUnsafe calls are safe here because the table names are hardcoded.
 */
export async function setupRLSPolicies(): Promise<void> {
  console.log('🔒 Setting up RLS policies...');

  for (const table of TENANT_TABLES) {
    try {
      // Enable RLS on the table
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);

      // Force RLS even for table owners (important for security)
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);

      // Create the tenant isolation policy
      // Uses current_setting('app.current_tenant_id', true) which returns NULL if not set,
      // causing no rows to match — failing closed (safe default).
      // No bypass escape hatch: only the connection that sets app.current_tenant_id via
      // withTenant() can access tenant data. Platform-level queries (global admin) should
      // use the unproxied prisma client or query global tables directly.
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = '${table}_tenant_isolation'
          ) THEN
            EXECUTE format(
              'CREATE POLICY %I ON %I FOR ALL USING (
                tenant_id = current_setting(''app.current_tenant_id'', true)
              )',
              '${table}_tenant_isolation',
              '${table}'
            );
          END IF;
        END
        $$;
      `);

      console.log(`  ✓ RLS enabled on ${table}`);
    } catch (err: any) {
      console.error(`  ✗ RLS error on ${table}: ${err.message}`);
    }
  }

  console.log('🔒 RLS setup complete');
}
