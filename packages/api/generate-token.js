const jwt = require('jsonwebtoken');

const secret = "your-super-secret-jwt-key-change-in-production";
const payload = {
  id: "f7b64bed-b2f0-449c-b360-f8acee7458ea",
  email: "staff-free@e2e.com",
  tenantId: "724a4744-9337-47e2-96b3-2a486c65a3d9",
  role: "property_owner"
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log(token);
