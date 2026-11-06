"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LibraryInput, libraryIdentity, useLibrary } from "./LibraryProvider";

export default function SaveButton({
  item,
  compact = false,
}: {
  item: LibraryInput;
  compact?: boolean;
}) {
  const { data: session, status } = useSession();
  const library = useLibrary();
  const router = useRouter();
  const saved = library.isSaved(item);
  const pending = library.pending.has(libraryIdentity(item));
  const label = saved
    ? `Remove ${item.name} from your library`
    : `Save ${item.name} to your library`;
  return (
    <button
      className={
        compact
          ? `icon-button save-button ${saved ? "is-saved" : ""}`
          : `button ${saved ? "button-saved" : "button-secondary"}`
      }
      aria-label={label}
      aria-pressed={saved}
      title={!session?.user?.id ? "Sign in to save to your library" : label}
      disabled={pending || status === "loading" || library.loading}
      onClick={() => {
        if (!session?.user?.id) {
          router.push(
            `/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`,
          );
        } else void library.toggle(item);
      }}
    >
      {pending ? (
        <Loader2 size={16} className="spin" />
      ) : saved ? (
        <Check size={16} />
      ) : (
        <Plus size={16} />
      )}
      {!compact && (saved ? "Artist saved" : "Save artist")}
    </button>
  );
}
