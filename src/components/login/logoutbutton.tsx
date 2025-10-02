"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="group px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
    >
      Logout
    </button>
  );
}
