# Audit Report

Total Endpoints checked: 66
Validated: 34
Unvalidated: 32

### packages/api/src/modules/auth/router.ts
- [ ] Line 229: **POST** `/send-whatsapp-otp`
- [ ] Line 261: **POST** `/verify-whatsapp-otp`
- [ ] Line 377: **POST** `/refresh-token`
- [ ] Line 465: **PUT** `/me/language`

### packages/api/src/modules/bookings/router.ts
- [ ] Line 404: **PATCH** `/:id/confirm`
- [ ] Line 434: **POST** `/:id/cancel`
- [ ] Line 733: **PUT** `/:id/assign-room`
- [ ] Line 795: **PUT** `/:id`

### packages/api/src/modules/channels/router.ts
- [ ] Line 14: **POST** `/webhooks/incoming/:channel`

### packages/api/src/modules/groups/router.ts
- [ ] Line 13: **POST** `/blocks`

### packages/api/src/modules/housekeeping/router.ts
- [ ] Line 32: **PATCH** `/tasks/:id/status`
- [ ] Line 77: **PATCH** `/tasks/:id`
- [ ] Line 99: **POST** `/tasks`
- [ ] Line 170: **POST** `/maintenance`

### packages/api/src/modules/notifications/router.ts
- [ ] Line 34: **PATCH** `/:id/read`
- [ ] Line 47: **POST** `/read-all`

### packages/api/src/modules/payments/router.ts
- [ ] Line 72: **POST** `/razorpay/order`
- [ ] Line 121: **POST** `/razorpay/verify`

### packages/api/src/modules/platform/router.ts
- [ ] Line 28: **POST** `/approve/:id`
- [ ] Line 47: **POST** `/reject/:id`

### packages/api/src/modules/pos/router.ts
- [ ] Line 241: **PUT** `/orders/:id/void`

### packages/api/src/modules/pricing/router.ts
- [ ] Line 28: **POST** `/`
- [ ] Line 61: **PUT** `/:id`

### packages/api/src/modules/public/router.ts
- [ ] Line 272: **POST** `/reviews`
- [ ] Line 621: **POST** `/payments/razorpay/order`
- [ ] Line 675: **POST** `/payments/razorpay/verify`

### packages/api/src/modules/reviews/router.ts
- [ ] Line 59: **PATCH** `/:id/publish`
- [ ] Line 81: **PATCH** `/:id/reply`

### packages/api/src/modules/rooms/router.ts
- [ ] Line 179: **PUT** `/:id`
- [ ] Line 293: **PATCH** `/:id/status`

### packages/api/src/modules/users/router.ts
- [ ] Line 9: **PATCH** `/profile`
- [ ] Line 28: **PATCH** `/change-password`

