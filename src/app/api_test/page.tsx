import { fetchArtist, fetchRelatedArtists } from "../actions/spotify/actions";

export default async function Page() {
    const artist = await fetchArtist('0TnOYISbd1XYRBk9myaseg');
    console.log(artist.name)
    return (
      <div>
        {artist.name}
      </div>
    );
  }
