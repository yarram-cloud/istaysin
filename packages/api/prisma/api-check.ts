const BASE = 'http://localhost:4100/api/v1';
const TOKEN = process.argv[2];

async function test(label: string, path: string) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const body: any = await res.json();
    console.log(`\n=== ${label} (${res.status}) ===`);
    if (body.success) {
      const data = Array.isArray(body.data) ? body.data : [body.data];
      console.log(`  Count: ${data.length}`);
      if (data.length > 0) console.log(`  Sample: ${JSON.stringify(data[0]).substring(0, 200)}`);
    } else {
      console.log(`  ERROR: ${body.error}`);
    }
  } catch (e: any) {
    console.log(`\n=== ${label} FETCH ERROR ===\n  ${e.message}`);
  }
}

async function main() {
  await test('Rooms', '/rooms');
  await test('Room Types', '/rooms/types');
  await test('Floors', '/rooms/floors');
  await test('Bookings', '/bookings');
  await test('Compliance Register', '/compliance/guest-register');
}
main();
