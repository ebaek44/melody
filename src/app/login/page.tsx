"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader, Lock } from "lucide-react";
import LoginButton from "@/components/login/loginbutton";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative w-full min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cosmic-grid opacity-30"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full">
        <div className="w-full h-full opacity-10 bg-primary blur-[120px]"></div>
      </div>

      {/* Login Card */}
      <div
        className={`relative z-10 w-full max-w-md p-8 rounded-xl border border-border shadow-lg backdrop-blur-sm bg-card transition-all duration-700 transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-muted text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            Secure Login
            <Loader className="h-3 w-3 animate-spin text-primary" />
          </span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-6 text-foreground">
          Sign in to continue
        </h1>

        {/* Spotify login */}
        <LoginButton provider="spotify" callbackUrl="/home" />

        {/* Back to Homepage */}
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            ← Back to Homepage
          </Button>
        </div>

        <p className="mt-6 text-sm text-center text-muted-foreground">
          By signing in, you agree to our terms and privacy policy.
        </p>
      </div>
    </main>
  );
}
