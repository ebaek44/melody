import Node from "@/components/node-map/node";
import NodeMap from "@/components/node-map/NodeMap";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="flex border-black border-1 p-75">
        <NodeMap />
      </div>
    </main>
  );
}
