'use server'


export async function fetchRelatedArtists(artistName: string) {
  const apiKey = process.env.LASTFM_API_KEY!;

  const response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${artistName}&api_key=${apiKey}&format=json&autocorrect=1&limit=8`);
  const data = await response.json();

  if (!response.ok || data?.error) {
    throw new Error(`Last.fm API error: ${data?.message || response.statusText}`);
  }

  return data;
}