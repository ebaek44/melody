import { fetchArtist } from "../actions/spotify/actions";
import { fetchRelatedArtists } from "../actions/lastfm/actions";

export default async function Page() {
  const data = await fetchRelatedArtists("Taylor Swift");
  const list = data?.similarartists?.artist ?? [];
  return (
    <div>
      {list.map((a: any) => (
        <div key={a.name}>{a.name}</div>
      ))}
    </div>
  );
}
