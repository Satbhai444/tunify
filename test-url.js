// Test URL extraction for Kesariya
fetch('https://jiosavan-api2.vercel.app/api/search/songs?query=Kesariya')
  .then(r => r.json())
  .then(d => {
    const song = d.data.results[0];
    console.log('=== Song:', song.name);
    console.log('=== downloadUrl:', JSON.stringify(song.downloadUrl, null, 2));
    console.log('=== All keys:', Object.keys(song).join(', '));
    // Also check search endpoint (not /songs)
    return fetch('https://jiosavan-api2.vercel.app/api/search?query=Kesariya');
  })
  .then(r => r.json())
  .then(d => {
    const song = d.data.songs?.results?.[0];
    if (song) {
      console.log('\n=== Search result song:', song.name || song.title);
      console.log('=== downloadUrl:', JSON.stringify(song.downloadUrl, null, 2));
      console.log('=== All keys:', Object.keys(song).join(', '));
    }
  })
  .catch(e => console.error(e));
