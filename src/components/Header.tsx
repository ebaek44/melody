"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import { Menu, X, Music2, BarChart3, Crown, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LogoutButton from "./login/logoutbutton";

const Header = () => {
  /// These two const are used to manipulate the page path and the session token for the user
  const router = useRouter();
  const { data: session, status } = useSession();
  const hasSpotify = !!session?.spotifyAccessToken;
  const isLoggedIn = status === "authenticated" && hasSpotify;
  const [activePage, setActivePage] = useState("features");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode

  useEffect(() => {
    // Apply the theme to the document when it changes
    if (isDarkMode) {
      document.documentElement.classList.remove("light-mode");
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.documentElement.classList.add("light-mode");
    }
  }, [isDarkMode]);

  const handleNavClick = (page: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActivePage(page);
    const element = document.getElementById(page);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="sticky top-0 z-50 pt-8 px-4">
      <header className="w-full max-w-7xl mx-auto py-3 px-6 md:px-8 flex items-center justify-between">
        <div className="p-3">
          <Logo />
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-3 rounded-2xl text-muted-foreground hover:text-foreground"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2">
          <div className="rounded-full px-1 py-1 backdrop-blur-md bg-background/80 border border-border shadow-lg">
            <ToggleGroup
              type="single"
              value={activePage}
              onValueChange={(value: React.SetStateAction<string>) =>
                value && setActivePage(value)
              }
            >
              <ToggleGroupItem
                value="features"
                className={cn(
                  "px-4 py-2 rounded-full transition-colors relative",
                  activePage === "features"
                    ? "text-accent-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={handleNavClick("features")}
              >
                <Music2 size={16} className="inline-block mr-1.5" /> Features
              </ToggleGroupItem>
              <ToggleGroupItem
                value="dashboard"
                className={cn(
                  "px-4 py-2 rounded-full transition-colors relative",
                  activePage === "dashboard"
                    ? "text-accent-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={handleNavClick("dashboard")}
              >
                <BarChart3 size={16} className="inline-block mr-1.5" />{" "}
                Discovery
              </ToggleGroupItem>
              <ToggleGroupItem
                value="pricing"
                className={cn(
                  "px-4 py-2 rounded-full transition-colors relative",
                  activePage === "pricing"
                    ? "text-accent-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={handleNavClick("pricing")}
              >
                <Crown size={16} className="inline-block mr-1.5" /> Pricing
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </nav>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-4 right-4 bg-background/95 backdrop-blur-md py-4 px-6 border border-border rounded-2xl shadow-lg z-50">
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  activePage === "features"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={handleNavClick("features")}
              >
                <Music2 size={16} className="inline-block mr-1.5" /> Features
              </a>
              <a
                href="#dashboard"
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  activePage === "dashboard"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={handleNavClick("dashboard")}
              >
                <BarChart3 size={16} className="inline-block mr-1.5" />{" "}
                Discovery
              </a>
              <a
                href="#pricing"
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  activePage === "pricing"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={handleNavClick("pricing")}
              >
                <Crown size={16} className="inline-block mr-1.5" /> Pricing
              </a>
            </div>
          </div>
        )}

        <div className="hidden md:flex items-center gap-4">
          {/* Theme toggle for desktop */}
          <div className="flex items-center gap-2 rounded-full px-3 py-2">
            <Moon
              size={18}
              className={`${
                isDarkMode ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <Switch
              checked={!isDarkMode}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary"
            />
            <Sun
              size={18}
              className={`${
                !isDarkMode ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="rounded-2xl">
            {isLoggedIn ? (
              <LogoutButton />
            ) : (
              <Button
                className="group px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
                onClick={() => {
                  router.push("/login");
                }}
              >
                <span className="transition-colors duration-200 group-hover:text-foreground">
                  Log in
                </span>
              </Button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
