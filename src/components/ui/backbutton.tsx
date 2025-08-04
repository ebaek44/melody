"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
    >
      ← Back to Home
    </button>
  );
}
