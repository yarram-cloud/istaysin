# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\tests\e2e\31-payments.spec.ts >> Payments & UPI Module >> Should block QR generation if user not authenticated
- Location: apps\web\tests\e2e\31-payments.spec.ts:53:7

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:3000
Call log:
  - → POST http://localhost:3000/api/v1/auth/login
    - user-agent: Playwright/1.59.1 (x64; windows 10.0) node/24.13
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 56

```