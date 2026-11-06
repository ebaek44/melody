"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowUpRight,
  Compass,
  Library,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("musicmap-theme") === "dark";
    setDark(saved);
    document.documentElement.dataset.theme = saved ? "dark" : "light";
  }, []);
  function theme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("musicmap-theme", next ? "dark" : "light");
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link
            href="/discover"
            className={pathname === "/discover" ? "active" : ""}
          >
            <Compass size={15} /> Discover
          </Link>
          <Link href="/#library">
            <Library size={15} /> Your collection
          </Link>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button theme-toggle"
            onClick={theme}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {session?.user?.id ? (
            <>
              <span className="account-name">
                {session.user.name?.split(" ")[0] || "Your account"}
              </span>
              <button
                className="icon-button"
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label="Sign out"
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <Link
              className="button button-small button-secondary login-link"
              href={
                pathname === "/discover"
                  ? "/login?callbackUrl=/discover"
                  : "/login"
              }
            >
              Connect Spotify <ArrowUpRight size={14} />
            </Link>
          )}
          <button
            className="icon-button mobile-toggle"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          <Link href="/discover" onClick={() => setOpen(false)}>
            Discover music <ArrowUpRight size={16} />
          </Link>
          <Link href="/#library" onClick={() => setOpen(false)}>
            Your collection <Library size={16} />
          </Link>
          {!session?.user?.id && (
            <Link href="/login" onClick={() => setOpen(false)}>
              Connect Spotify <ArrowUpRight size={16} />
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
