"use client";

import { signIn } from "next-auth/react";

export default function LoginButton({
  provider,
  callbackUrl,
}: {
  provider: string;
  callbackUrl?: string;
}) {
  const label = "Connect with Spotify";
  const color = "bg-green-500 hover:bg-green-600";

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
