import NodeMap from "@/components/node-map/NodeMap";
import BackButton from "@/components/ui/backbutton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTopArtists } from "@/app/actions/spotify/actions";
import { Artist } from "@/types";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.spotifyAccessToken) {
    return null;
  }
  // Map /v1/me/top/artists items -> Artist (no extra fetch)
  const mapSpotifyItems = (items: any[]): Artist[] => {
    if (!Array.isArray(items)) return [];
    return items
      .map((it) => ({
        id: it?.id,
        name: it?.name ?? "",
        url: it?.external_urls?.spotify ?? "#",
        pfp: it?.images?.[0]?.url ?? undefined,
        uri: it?.uri,
      }))
      .filter((a) => a.name);
  };
  const data = await getTopArtists(session.spotifyAccessToken);
  const topArtists = mapSpotifyItems(data.items);
  return (
    <>
      <div className="fixed top-5 left-5 z-50">
        <BackButton />
      </div>
      <main className="fixed inset-0 flex items-center justify-center overflow-hidden">
        <NodeMap userTopArtists={topArtists} />
      </main>
    </>
  );
}
