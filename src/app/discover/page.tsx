import Header from "@/components/Header";
import NodeMap from "@/components/node-map/NodeMap";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTopArtists } from "@/app/actions/spotify/actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Discover · MusicMap",
  description:
    "Explore a web of related artists. Follow the connections, listen with Spotify, and keep your favorites.",
};
export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const topArtists = session?.user?.id ? await getTopArtists() : [];
  const name =
    params.artist?.trim().slice(0, 120) || topArtists[0]?.name || "Radiohead";
  return (
    <>
      <Header />
      <NodeMap initialArtist={name} topArtists={topArtists} />
    </>
  );
}
