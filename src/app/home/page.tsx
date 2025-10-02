import Node from "@/components/nodemap/node";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">MusicWeb</h1>
      
      {/* Example usage of your Node component */}
      <Node
        artistName="Radiohead"
        artistURL="https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb"
      />

      <Node
        artistName="Daft Punk"
        artistURL="https://open.spotify.com/artist/4tZwfgrHOc3mvqYlEYSvVi"
      />
    </main>
  );
}
