import { fetchArtist } from "../actions/spotify/actions";
import { fetchRelatedArtists } from "../actions/lastfm/actions";

export default async function Page() {
  const artist = await fetchRelatedArtists("Taylor Swift");
  console.log(artist.name);
  return <div>{artist}</div>;
}
