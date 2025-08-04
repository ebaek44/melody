/// Profile page where their personal profile will be and also be able to connect with spotify

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LoginButton from "@/components/login/loginbutton";
import BackButton from "@/components/ui/backbutton";
import LogoutButton from "@/components/login/logoutbutton";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <section className="relative w-full py-12 md:py-20 px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Cosmic particle effect */}
      <div className="absolute inset-0 cosmic-grid opacity-30"></div>

      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full">
        <div className="w-full h-full opacity-10 bg-primary blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-6 transition-all duration-700">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Personal Profile
        </h1>

        <p className="text-md md:text-lg text-muted-foreground">
          You are logged in with Google.
        </p>

        {session.spotifyAccessToken ? (
          <div className="text-green-600 font-medium text-lg">
            Spotify is connected 🎵
          </div>
        ) : (
          <div className="w-full max-w-sm mx-auto">
            <p className="mb-2 text-muted-foreground">
              Connect your Spotify account:
            </p>
            <LoginButton provider="spotify" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <BackButton />
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}
