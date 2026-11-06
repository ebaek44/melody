"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import type { SavedItem } from "@/types";
import { artistKey } from "@/lib/cache";

export type LibraryInput = Omit<SavedItem, "key" | "createdAt">;
type LibraryContextValue = {
  items: SavedItem[];
  loading: boolean;
  error: string;
  pending: Set<string>;
  isSaved: (item: LibraryInput) => boolean;
  toggle: (item: LibraryInput) => Promise<void>;
  reload: () => void;
};
const Context = createContext<LibraryContextValue | null>(null);
export const libraryIdentity = (item: LibraryInput) =>
  JSON.stringify([item.kind, artistKey(item.name), artistKey(item.artist)]);

export default function LibraryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const id = session?.user?.id;
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loadedOwner, setLoadedOwner] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(new Set<string>());
  const [revision, setRevision] = useState(0);
  const owner = useRef(id);
  owner.current = id;
  const inFlight = useRef(new Set<string>());
  const reload = useCallback(() => setRevision((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setError("");
    setPending(new Set());
    inFlight.current.clear();
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/library", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted && owner.current === id) {
          setItems(data.items);
          setLoadedOwner(id);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(error.message || "Your library couldn’t be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, revision]);

  const visibleItems =
    status === "authenticated" && id && loadedOwner === id ? items : [];
  const isSaved = (item: LibraryInput) =>
    visibleItems.some(
      (saved) => libraryIdentity(saved) === libraryIdentity(item),
    );
  async function toggle(item: LibraryInput) {
    if (!id) return;
    const identity = libraryIdentity(item);
    if (inFlight.current.has(identity)) return;
    inFlight.current.add(identity);
    setPending(new Set(inFlight.current));
    setError("");
    const saved = items.find((saved) => libraryIdentity(saved) === identity);
    try {
      const response = await fetch("/api/library", {
        method: saved ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saved ? { key: saved.key } : item),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      // Merge only this item so concurrent saves cannot overwrite each other.
      if (owner.current === id)
        setItems((current) =>
          [
            ...current.filter((entry) => libraryIdentity(entry) !== identity),
            ...data.items.filter(
              (entry: SavedItem) => libraryIdentity(entry) === identity,
            ),
          ].sort((a, b) => b.createdAt - a.createdAt),
        );
    } catch (error) {
      if (owner.current === id)
        setError(
          error instanceof Error
            ? error.message
            : "Couldn’t update your library.",
        );
    } finally {
      inFlight.current.delete(identity);
      if (owner.current === id) setPending(new Set(inFlight.current));
    }
  }
  return (
    <Context.Provider
      value={{
        items: visibleItems,
        loading: loading || status === "loading",
        error,
        pending,
        isSaved,
        toggle,
        reload,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useLibrary() {
  const context = useContext(Context);
  if (!context) throw new Error("LibraryProvider is required");
  return context;
}
