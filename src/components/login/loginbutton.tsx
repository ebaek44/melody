"use client";

import { signIn } from "next-auth/react";

export default function LoginButton({
  provider,
  callbackUrl,
}: {
  provider: "google" | "spotify";
  callbackUrl?: string;
}) {
  const label =
    provider === "google" ? "Login with Google" : "Connect with Spotify";
  const color =
    provider === "google"
      ? "bg-blue-500 hover:bg-blue-600"
      : "bg-green-500 hover:bg-green-600";

  const handleLogin = () => {
    if (callbackUrl) {
      signIn(provider, { callbackUrl });
    } else {
      signIn(provider);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className={`w-full px-4 py-2 ${color} text-white rounded mb-4`}
    >
      {label}
    </button>
  );
}
