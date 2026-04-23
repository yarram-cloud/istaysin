import fetch from 'node-fetch';

async function run() {
  try {
    // We need to login to get a token
    const loginRes = await fetch('http://localhost:4100/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@istays.com', password: 'password123' }) // We don't know the password...
    });
    
    // Instead we can just check if it returns 401 or something else to prove router works.
    const res = await fetch('http://localhost:4100/api/v1/night-audit/summary');
    console.log(res.status, await res.text());
  } catch (err) {
    console.error(err);
  }
}
run();
