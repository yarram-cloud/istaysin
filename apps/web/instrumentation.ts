/**
 * Next.js 14 instrumentation hook.
 *
 * Called once per server runtime when the app boots. We use it to load the
 * Sentry config that matches the active runtime — `nodejs` for Server
 * Components / Route Handlers, `edge` for Middleware. The client config is
 * loaded automatically by the bundler, so it isn't referenced here.
 *
 * Both branches are dynamic imports so the cost is paid lazily at boot, not
 * at module-graph time, which keeps the runtime entrypoint slim.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
