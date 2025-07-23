"use client";

import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("spotify")}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    >
      Login with Spotify
    </button>
  );
}
