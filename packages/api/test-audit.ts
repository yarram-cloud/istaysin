import { getNightAuditSummary } from './src/services/night-audit';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

async function run() {
  try {
    const tenantId = '123'; // wait, without a valid tenant I can't test. I need to query a tenant first
    const { prisma } = require('./src/config/database');
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('No tenant found');
      return;
    }
    console.log('Testing with tenant:', tenant.id);
    const res = await getNightAuditSummary(tenant.id);
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
}
run();
