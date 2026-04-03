// Quick test to check if JioSaavn API works
async function test() {
  try {
    console.log('Testing JioSaavn search API...');
    const res = await fetch('https://saavn.dev/api/search?query=Tum+Hi+Ho');
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Success:', json.success);
    console.log('Data keys:', Object.keys(json.data || json));
    if (json.data?.songs) {
      console.log('Songs count:', json.data.songs.results?.length);
      json.data.songs.results?.slice(0, 3).forEach(s => console.log(' -', s.name, '|', s.id));
    } else {
      console.log('Raw response (first 500 chars):', JSON.stringify(json).substring(0, 500));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  try {
    console.log('\nTesting Deezer search API...');
    const res = await fetch('https://api.deezer.com/search?q=Tum+Hi+Ho&limit=3');
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Tracks:', json.data?.length);
    json.data?.slice(0, 3).forEach(t => console.log(' -', t.title, '|', t.artist?.name));
  } catch (e) {
    console.error('Deezer Error:', e.message);
  }
}
test();
