const fs = require('fs');

const routeMapping = {
  'packages/api/src/modules/auth/router.ts': {
    '/send-whatsapp-otp': 'whatsappOtpSchema',
    '/verify-whatsapp-otp': 'verifyOtpSchema',
    '/refresh-token': 'refreshTokenSchema',
    '/me/language': 'updateLanguageSchema',
  },
  'packages/api/src/modules/bookings/router.ts': {
    '/:id/confirm': 'confirmBookingSchema',
    '/:id/cancel': 'cancelBookingSchema',
    '/:id/assign-room': 'assignRoomSchema',
    '/:id': 'updateBookingSchema',
  },
  'packages/api/src/modules/channels/router.ts': {
    '/webhooks/incoming/:channel': 'channelWebhookSchema',
  },
  'packages/api/src/modules/groups/router.ts': {
    '/blocks': 'createGroupBlockSchema',
  },
  'packages/api/src/modules/housekeeping/router.ts': {
    '/tasks/:id/status': 'updateTaskStatusSchema',
    '/tasks/:id': 'updateTaskSchema',
    '/tasks': 'createTaskSchema',
    '/maintenance': 'createMaintenanceSchema',
  },
  'packages/api/src/modules/notifications/router.ts': {
    '/:id/read': 'markNotificationReadSchema',
    '/read-all': 'markAllNotificationsReadSchema',
  },
  'packages/api/src/modules/payments/router.ts': {
    '/razorpay/order': 'createRazorpayOrderSchema',
    '/razorpay/verify': 'verifyRazorpayOrderSchema',
  },
  'packages/api/src/modules/platform/router.ts': {
    '/approve/:id': 'platformApproveSchema',
    '/reject/:id': 'platformRejectSchema',
  },
  'packages/api/src/modules/pos/router.ts': {
    '/orders/:id/void': 'voidPosOrderSchema',
  },
  'packages/api/src/modules/pricing/router.ts': {
    '/': 'createPricingSchema',
    '/:id': 'updatePricingSchema',
  },
  'packages/api/src/modules/public/router.ts': {
    '/reviews': 'createReviewSchema',
    '/payments/razorpay/order': 'createRazorpayOrderSchema',
    '/payments/razorpay/verify': 'verifyRazorpayOrderSchema',
  },
  'packages/api/src/modules/reviews/router.ts': {
    '/:id/publish': 'publishReviewSchema',
    '/:id/reply': 'replyReviewSchema',
  },
  'packages/api/src/modules/rooms/router.ts': {
    '/:id': 'updateRoomSchema',
    '/:id/status': 'updateRoomStatusSchema',
  },
  'packages/api/src/modules/users/router.ts': {
    '/profile': 'updateProfileSchema',
    '/change-password': 'changePasswordSchema',
  }
};

for (const [file, endpoints] of Object.entries(routeMapping)) {
  let content = fs.readFileSync(file, 'utf8');
  const requiredSchemas = Object.values(endpoints);

  // 1. Inject schema imports
  const schemaImportsStr = requiredSchemas.join(', ');
  if (content.includes('@istays/shared')) {
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]@istays\/shared['"];/, (match, p1) => {
      // Avoid duplicate imports
      const existing = p1.split(',').map(s => s.trim());
      const newSchemas = requiredSchemas.filter(s => !existing.includes(s));
      if (newSchemas.length === 0) return match;
      return `import { ${p1.trim()}, ${newSchemas.join(', ')} } from '@istays/shared';`;
    });
  } else {
    content = `import { ${schemaImportsStr} } from '@istays/shared';\n` + content;
  }

  // 2. Inject validateRequest middleware import
  if (!content.includes('validateRequest')) {
    content = `import { validateRequest } from '../../middleware/validate';\n` + content;
  }

  // 3. Inject middleware into routes
  for (const [path, schema] of Object.entries(endpoints)) {
    // Regex matches the HTTP method, the path string, and then inserts the validateRequest(schema) right after.
    // E.g. router.post('/path', ... => router.post('/path', validateRequest(schema), ...
    const regex = new RegExp(`(\\.(?:post|put|patch)\\(\\s*['"\`]${path}['"\`]\\s*,)`);
    content = content.replace(regex, `$1 validateRequest(${schema}),`);
  }

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
