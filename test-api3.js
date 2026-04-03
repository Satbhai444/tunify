async function test() {
  const apis = [
    'https://jiosaavn-api-privatecvc2.vercel.app/api/search?query=Tum+Hi+Ho',
    'https://jiosaavn-api-privatecvc2.vercel.app/api/search/songs?query=Tum+Hi+Ho',
    'https://saavn.dev/api/search/songs?query=Tum+Hi+Ho',
    'https://jiosavan-api2.vercel.app/api/search?query=Tum+Hi+Ho',
    'https://jiosaavn-api-codex.vercel.app/api/search?query=Tum+Hi+Ho',
    'https://jiosaavn-api.vercel.app/search?query=Tum+Hi+Ho',
    'https://saavn-api.vercel.app/search?query=Tum+Hi+Ho',
    'https://jiosaavn-api-ts.vercel.app/api/search?query=Tum+Hi+Ho',
  ];

  for (const url of apis) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      const isJson = text.startsWith('{') || text.startsWith('[');
      if (isJson && res.status === 200) {
        const json = JSON.parse(text);
        const hasSongs = json.data?.songs?.results?.length > 0 || json.data?.results?.length > 0 || json.results?.length > 0;
        if (hasSongs) {
          console.log('WORKING:', url);
          console.log('  Response keys:', Object.keys(json.data || json));
          console.log('  Sample:', text.substring(0, 300));
          return;
        } else {
          console.log('200 but no songs:', url, '|', text.substring(0, 100));
        }
      } else {
        console.log(`${res.status} ${isJson ? 'json' : 'html'}:`, url.substring(0, 60));
      }
    } catch (e) {
      console.log('FAIL:', url.substring(0, 60), '|', e.cause?.code || e.message);
    }
  }
  console.log('\nNo working API found. Trying docs URL...');
  try {
    const res = await fetch('https://docs.saavn.me', { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    console.log('docs.saavn.me status:', res.status, '| content:', text.substring(0, 300));
  } catch(e) {
    console.log('docs.saavn.me error:', e.message);
  }
}
test();
