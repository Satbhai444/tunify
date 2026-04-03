const BASE = 'https://jiosavan-api2.vercel.app/api';

async function test(label, url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    const success = data.success !== false && res.ok;
    const sample = JSON.stringify(data).slice(0, 200);
    console.log(`${success ? 'OK' : 'FAIL'}: ${label}`);
    console.log(`  ${sample}\n`);
  } catch (e) {
    console.log(`ERR: ${label} | ${e.message}\n`);
  }
}

(async () => {
  await test('Search songs', `${BASE}/search/songs?query=Tum+Hi+Ho`);
  await test('Search all', `${BASE}/search?query=Arijit+Singh`);
  await test('Song details', `${BASE}/songs/aRZbUYD7`);
  await test('Trending playlist', `${BASE}/playlists?id=110858205`);
  await test('New releases (albums)', `${BASE}/search/albums?query=new`);
  console.log('Done!');
})();
