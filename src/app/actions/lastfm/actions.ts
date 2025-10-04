'use server'


export async function fetchRelatedArtists(artistName: string) {
  const apiKey = process.env.LASTFM_API_KEY!;
  const params = new URLSearchParams({
    method: 'artist.getSimilar',
    artist: artistName,          // pass the artist NAME here
    api_key: apiKey,
    format: 'json',
    autocorrect: '1',
    limit: '12',
  });

  const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${params.toString()}`, { cache: 'no-store' });
  const data = await response.json();

  if (!response.ok || data?.error) {
    throw new Error(`Last.fm API error: ${data?.message || response.statusText}`);
  }

  return data;
}