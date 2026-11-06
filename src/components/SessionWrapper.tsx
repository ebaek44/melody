"use client";
import { SessionProvider } from "next-auth/react";
import LibraryProvider from "./LibraryProvider";

export default function SessionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LibraryProvider>{children}</LibraryProvider>
    </SessionProvider>
  );
}
