"use client";

import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="p-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200"
    >
      <Home/>
    </button>
  );
}
