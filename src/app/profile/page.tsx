/// Profile page where their personal profile will be and also be able to connect with spotify

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LoginButton from "@/components/login/loginbutton";
import BackButton from "@/components/ui/backbutton";
import LogoutButton from "@/components/login/logoutbutton";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  // 🚫 Not logged in → redirect to login page
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {session.user?.name || "User"}!
      </h1>

      <p className="mb-4">You are logged in with Google</p>

      {session.spotifyAccessToken ? (
        <div className="text-green-600 font-medium">
          Spotify is connected 🎵
        </div>
      ) : (
        <div className="w-full max-w-sm">
          <p className="mb-2">Connect your Spotify account:</p>
          <LoginButton provider="spotify" />
        </div>
      )}
      <BackButton />
      <LogoutButton />
    </main>
  );
}
