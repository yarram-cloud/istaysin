const { setupRLSPolicies } = require('./modules/tenants/schema-manager');

async function main() {
  try {
    console.log('Manually triggering RLS setup...');
    await setupRLSPolicies();
    console.log('RLS setup complete');
  } catch (err) {
    console.error('RLS setup failed:', err);
  } finally {
    process.exit(0);
  }
}

main();
