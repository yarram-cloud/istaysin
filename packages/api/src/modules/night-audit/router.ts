import { Router, Request, Response } from 'express';
import { runNightAudit } from '../../services/night-audit';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { z } from 'zod';
import { logAudit } from '../../middleware/audit-log';

export const nightAuditRouter = Router();

// Protect all night audit routes
nightAuditRouter.use(authenticate, resolveTenant, requireTenant, authorize('property_owner', 'general_manager'));

const runAuditSchema = z.object({
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

// POST /night-audit/run
nightAuditRouter.post('/run', async (req: Request, res: Response) => {
  try {
    const parsed = runAuditSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const tenantId = req.tenantId!;
    let auditDate: Date;

    if (parsed.data.targetDate) {
      auditDate = new Date(parsed.data.targetDate + 'T00:00:00Z');
      if (isNaN(auditDate.getTime())) {
        res.status(400).json({ success: false, error: 'Invalid date provided' });
        return;
      }
    } else {
      // Default to today in IST
      auditDate = new Date();
    }
    
    // Set time to Midnight UTC so date comparisons match strictly
    auditDate.setUTCHours(0, 0, 0, 0);

    const result = await runNightAudit(tenantId, auditDate);
    
    await logAudit(tenantId, req.userId, 'NIGHT_AUDIT_RUN', 'night-audit', undefined, { auditDate: auditDate.toISOString(), result }, req.ip || undefined);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[NIGHT AUDIT API ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to run night audit' });
  }
});
