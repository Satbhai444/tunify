// Test various JioSaavn API mirrors
async function test() {
  const apis = [
    { name: 'saavn.dev/api', url: 'https://saavn.dev/api/search?query=Tum+Hi+Ho' },
    { name: 'saavn.dev (no /api)', url: 'https://saavn.dev/search?query=Tum+Hi+Ho' },
    { name: 'jiosaavn-api-privatecvc2', url: 'https://jiosaavn-api-privatecvc2.vercel.app/search?query=Tum+Hi+Ho' },
    { name: 'saavn.me', url: 'https://saavn.me/search?query=Tum+Hi+Ho' },
  ];

  for (const api of apis) {
    try {
      console.log(`\nTesting ${api.name}...`);
      const res = await fetch(api.url, { signal: AbortSignal.timeout(10000) });
      console.log('  Status:', res.status);
      const text = await res.text();
      console.log('  Response (200 chars):', text.substring(0, 200));
    } catch (e) {
      console.log('  FAILED:', e.cause?.code || e.message);
    }
  }

  // Test Deezer
  try {
    console.log('\nTesting Deezer (arijit singh)...');
    const res = await fetch('https://api.deezer.com/search?q=arijit+singh&limit=3');
    const json = await res.json();
    console.log('  Tracks:', json.data?.length);
    json.data?.forEach(t => console.log('  -', t.title, '|', t.artist?.name, '| preview:', !!t.preview));
  } catch (e) {
    console.log('  FAILED:', e.message);
  }
}
test();
