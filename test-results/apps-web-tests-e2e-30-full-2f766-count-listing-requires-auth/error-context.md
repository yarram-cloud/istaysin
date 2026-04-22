# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\tests\e2e\30-full-platform.spec.ts >> 20 — Loyalty Module >> LOY-01: Account listing requires auth
- Location: apps\web\tests\e2e\30-full-platform.spec.ts:363:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 404
```

# Test source

```ts
  265 |     const res = await request.put(`${API}/api/v1/housekeeping/fake-id`, { data: {} });
  266 |     expect(res.status()).toBe(401);
  267 |   });
  268 | });
  269 | 
  270 | // ═══════════════════════════════════════════════════
  271 | // 15. PRICING MODULE
  272 | // ═══════════════════════════════════════════════════
  273 | test.describe('15 — Pricing Module', () => {
  274 |   test('PRICE-01: Pricing rules listing requires auth', async ({ request }) => {
  275 |     const res = await request.get(`${API}/api/v1/pricing/rules`);
  276 |     expect(res.status()).toBe(401);
  277 |   });
  278 | 
  279 |   test('PRICE-02: Creating pricing rule requires auth', async ({ request }) => {
  280 |     const res = await request.post(`${API}/api/v1/pricing/rules`, { data: {} });
  281 |     expect(res.status()).toBe(401);
  282 |   });
  283 | 
  284 |   test('PRICE-03: Rate seasons listing requires auth', async ({ request }) => {
  285 |     const res = await request.get(`${API}/api/v1/pricing/seasons`);
  286 |     expect(res.status()).toBe(401);
  287 |   });
  288 | });
  289 | 
  290 | // ═══════════════════════════════════════════════════
  291 | // 16. USERS MODULE
  292 | // ═══════════════════════════════════════════════════
  293 | test.describe('16 — Users Module', () => {
  294 |   test('USER-01: Staff listing requires auth', async ({ request }) => {
  295 |     const res = await request.get(`${API}/api/v1/users`);
  296 |     expect(res.status()).toBe(401);
  297 |   });
  298 | 
  299 |   test('USER-02: Inviting staff requires auth', async ({ request }) => {
  300 |     const res = await request.post(`${API}/api/v1/users/invite`, { data: {} });
  301 |     expect(res.status()).toBe(401);
  302 |   });
  303 | });
  304 | 
  305 | // ═══════════════════════════════════════════════════
  306 | // 17. REVIEWS MODULE
  307 | // ═══════════════════════════════════════════════════
  308 | test.describe('17 — Reviews Module', () => {
  309 |   test('REV-01: Review listing requires auth', async ({ request }) => {
  310 |     const res = await request.get(`${API}/api/v1/reviews`);
  311 |     expect(res.status()).toBe(401);
  312 |   });
  313 | });
  314 | 
  315 | // ═══════════════════════════════════════════════════
  316 | // 18. SHIFTS MODULE
  317 | // ═══════════════════════════════════════════════════
  318 | test.describe('18 — Shifts Module', () => {
  319 |   test('SHIFT-01: Shift listing requires auth', async ({ request }) => {
  320 |     const res = await request.get(`${API}/api/v1/shifts`);
  321 |     expect(res.status()).toBe(401);
  322 |   });
  323 | 
  324 |   test('SHIFT-02: Creating shift requires auth', async ({ request }) => {
  325 |     const res = await request.post(`${API}/api/v1/shifts`, { data: {} });
  326 |     expect(res.status()).toBe(401);
  327 |   });
  328 | });
  329 | 
  330 | // ═══════════════════════════════════════════════════
  331 | // 19. CHANNELS MODULE
  332 | // ═══════════════════════════════════════════════════
  333 | test.describe('19 — Channels Module', () => {
  334 |   test('CH-01: Connection listing requires auth', async ({ request }) => {
  335 |     const res = await request.get(`${API}/api/v1/channels/connections`);
  336 |     expect(res.status()).toBe(401);
  337 |   });
  338 | 
  339 |   test('CH-02: Creating connection requires auth', async ({ request }) => {
  340 |     const res = await request.post(`${API}/api/v1/channels/connections`, { data: {} });
  341 |     expect(res.status()).toBe(401);
  342 |   });
  343 | 
  344 |   test('CH-03: Webhook rejects unknown OTA', async ({ request }) => {
  345 |     const res = await request.post(`${API}/api/v1/channels/webhooks/incoming/fake_ota`, {
  346 |       data: { hotelId: 'xyz' }
  347 |     });
  348 |     expect(res.status()).toBe(400);
  349 |   });
  350 | 
  351 |   test('CH-04: Webhook accepts valid OTA channel', async ({ request }) => {
  352 |     const res = await request.post(`${API}/api/v1/channels/webhooks/incoming/agoda`, {
  353 |       data: { hotelId: 'mock', roomId: 'mock', guestName: 'Test', checkInDate: '2027-01-01', checkOutDate: '2027-01-03' }
  354 |     });
  355 |     expect(res.status()).toBe(200);
  356 |   });
  357 | });
  358 | 
  359 | // ═══════════════════════════════════════════════════
  360 | // 20. LOYALTY MODULE
  361 | // ═══════════════════════════════════════════════════
  362 | test.describe('20 — Loyalty Module', () => {
  363 |   test('LOY-01: Account listing requires auth', async ({ request }) => {
  364 |     const res = await request.get(`${API}/api/v1/loyalty/accounts`);
> 365 |     expect(res.status()).toBe(401);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  366 |   });
  367 | 
  368 |   test('LOY-02: Rewards listing requires auth', async ({ request }) => {
  369 |     const res = await request.get(`${API}/api/v1/loyalty/rewards`);
  370 |     expect(res.status()).toBe(401);
  371 |   });
  372 | });
  373 | 
  374 | // ═══════════════════════════════════════════════════
  375 | // 21. COMPLIANCE MODULE
  376 | // ═══════════════════════════════════════════════════
  377 | test.describe('21 — Compliance Module', () => {
  378 |   test('COMP-01: FRRO report requires auth', async ({ request }) => {
  379 |     const res = await request.get(`${API}/api/v1/compliance/frro`);
  380 |     expect(res.status()).toBe(401);
  381 |   });
  382 | 
  383 |   test('COMP-02: GST report requires auth', async ({ request }) => {
  384 |     const res = await request.get(`${API}/api/v1/compliance/gst-summary`);
  385 |     expect(res.status()).toBe(401);
  386 |   });
  387 | });
  388 | 
  389 | // ═══════════════════════════════════════════════════
  390 | // 22. GROUPS MODULE
  391 | // ═══════════════════════════════════════════════════
  392 | test.describe('22 — Groups Module', () => {
  393 |   test('GRP-01: Group block listing requires auth', async ({ request }) => {
  394 |     const res = await request.get(`${API}/api/v1/groups`);
  395 |     expect(res.status()).toBe(401);
  396 |   });
  397 | 
  398 |   test('GRP-02: Creating group block requires auth', async ({ request }) => {
  399 |     const res = await request.post(`${API}/api/v1/groups`, { data: {} });
  400 |     expect(res.status()).toBe(401);
  401 |   });
  402 | });
  403 | 
  404 | // ═══════════════════════════════════════════════════
  405 | // 23. GUEST PORTAL MODULE
  406 | // ═══════════════════════════════════════════════════
  407 | test.describe('23 — Guest Portal Module', () => {
  408 |   test('GP-01: My bookings requires auth', async ({ request }) => {
  409 |     const res = await request.get(`${API}/api/v1/guest-portal/my-bookings`);
  410 |     expect(res.status()).toBe(401);
  411 |   });
  412 | 
  413 |   test('GP-02: Booking detail requires auth', async ({ request }) => {
  414 |     const res = await request.get(`${API}/api/v1/guest-portal/booking/fake-id`);
  415 |     expect(res.status()).toBe(401);
  416 |   });
  417 | 
  418 |   test('GP-03: Invoice download requires auth', async ({ request }) => {
  419 |     const res = await request.get(`${API}/api/v1/guest-portal/invoice/fake-id`);
  420 |     expect(res.status()).toBe(401);
  421 |   });
  422 | 
  423 |   test('GP-04: Pre-check-in requires auth', async ({ request }) => {
  424 |     const res = await request.post(`${API}/api/v1/guest-portal/pre-checkin/fake-id`, { data: {} });
  425 |     expect(res.status()).toBe(401);
  426 |   });
  427 | 
  428 |   test('GP-05: Public lookup rejects missing params', async ({ request }) => {
  429 |     const res = await request.get(`${API}/api/v1/guest-portal/lookup`);
  430 |     expect(res.status()).toBe(400);
  431 |     const body = await res.json();
  432 |     expect(body.error).toContain('required');
  433 |   });
  434 | 
  435 |   test('GP-06: Public lookup returns 404 for non-existent booking', async ({ request }) => {
  436 |     const res = await request.get(`${API}/api/v1/guest-portal/lookup?bookingRef=IS-FAKE-REF&phone=9999999999`);
  437 |     expect(res.status()).toBe(404);
  438 |   });
  439 | });
  440 | 
```