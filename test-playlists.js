// Test various JioSaavn playlists to find working ones for all genres
const BASE = 'https://jiosavan-api2.vercel.app/api';

const playlists = [
  // Bollywood
  { id: '110858205', label: 'Trending Today' },
  { id: '159144718', label: 'Bollywood Butter' },
  { id: '1134543272', label: 'Most Searched Songs' },
  { id: '48853370', label: 'Hindi Top 40' },
  // Romantic
  { id: '890011805', label: 'Romantic Hits' },
  // Punjabi
  { id: '48853326', label: 'Punjabi Top 40' },
  { id: '74316792', label: 'Punjabi Hits' },
  // English/Hollywood
  { id: '48853316', label: 'English Top 40' },
  { id: '836498082', label: 'English Viral Hits' },
  // Party
  { id: '75064566', label: 'Party Hits' },
  // Chill
  { id: '136481498', label: 'Chill Vibes' },
  // 90s
  { id: '150048906', label: '90s Evergreen' },
  // Devotional
  { id: '48853309', label: 'Devotional' },
  // Workout
  { id: '136487498', label: 'Workout Beats' },
];

async function testPlaylist(pl) {
  try {
    const r = await fetch(`${BASE}/playlists?id=${pl.id}`);
    const d = await r.json();
    const songs = d.data?.songs ?? [];
    const hasDl = songs.length > 0 && songs[0].downloadUrl?.length > 0;
    console.log(`${hasDl ? 'OK' : songs.length > 0 ? 'NO-DL' : 'EMPTY'} [${songs.length} songs] ${pl.label} (${pl.id})`);
  } catch (e) {
    console.log(`FAIL ${pl.label} (${pl.id}): ${e.message}`);
  }
}

// Also test search-based approach for English songs
async function testSearch(q) {
  const r = await fetch(`${BASE}/search/songs?query=${encodeURIComponent(q)}&limit=5`);
  const d = await r.json();
  const songs = d.data?.results ?? [];
  const hasDl = songs.length > 0 && songs[0].downloadUrl?.length > 0;
  console.log(`SEARCH ${hasDl ? 'OK' : 'FAIL'} [${songs.length}] "${q}"`);
}

(async () => {
  console.log('=== Playlist Tests ===');
  for (const pl of playlists) {
    await testPlaylist(pl);
  }
  console.log('\n=== Search Tests ===');
  await testSearch('Shape of You Ed Sheeran');
  await testSearch('Blinding Lights Weeknd');
  await testSearch('Starboy');
  await testSearch('Eminem Lose Yourself');
  await testSearch('BTS Dynamite');
  await testSearch('Bad Guy Billie Eilish');
  console.log('\nDone!');
})();
