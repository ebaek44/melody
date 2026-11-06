"use client";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoginButton({
  provider,
  callbackUrl = "/discover",
}: {
  provider: string;
  callbackUrl?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            await signIn(provider, { callbackUrl });
          } catch {
            setError("Couldn’t open Spotify. Please try again.");
            setPending(false);
          }
        }}
        className="button button-primary login-submit"
      >
        {pending ? <Loader2 size={17} className="spin" /> : <HeadphoneMark />}{" "}
        {pending ? "Connecting…" : "Continue with Spotify"}
        <ArrowRight size={17} />
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
function HeadphoneMark() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="11" />
      <path
        d="M6 9c4-1 8-.5 12 1M6.5 12c3.5-.7 7-.2 10.5 1M7 15c3-.5 6-.1 9 1"
        stroke="var(--primary)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
