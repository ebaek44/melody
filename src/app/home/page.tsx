import Node from "@/components/node-map/node";
import NodeMap from "@/components/node-map/NodeMap";
import BackButton from "@/components/ui/backbutton";

export default function HomePage() {
  return (
    <>
      <div className="fixed top-5 left-5 z-50">
        <BackButton />
      </div>
      <main className="fixed inset-0 flex items-center justify-center overflow-hidden">
        <NodeMap />
      </main>
    </>
  );
}