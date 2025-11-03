'use server'

// this gets a spotify token every hour. need for each api call
async function getSpotifyToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store'
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to get Spotify token: ${JSON.stringify(data)}`);
    }
    return data.access_token;
  }

  
  export async function fetchArtist(artistId: string) {
      const accessToken = await getSpotifyToken();
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Spotify API error: ${data.error?.message || response.statusText}`);
      }
      
      return data;
  }


export async function searchArtist(artistName: string) {
  const accessToken = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search/?q=${artistName}&type=artist`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Spotify API error: ${data.error?.message || response.statusText}`);
  }
  
  return data;
}


export async function getTopArtists() {
  const accessToken = await getSpotifyToken();
  const response = await fetch(
  'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=8&offset=5',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Spotify API error: ${data.error?.message || response.statusText}`);
  }

  return data;
}