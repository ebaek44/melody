import Link from "next/link";
import { ArrowLeft, Bookmark, GitBranch, Headphones } from "lucide-react";
import Header from "@/components/Header";
import LoginButton from "@/components/login/loginbutton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl?.startsWith("/") &&
    !params.callbackUrl.startsWith("//") &&
    !params.callbackUrl.includes("\\")
      ? params.callbackUrl
      : "/discover";
  return (
    <>
      <Header />
      <main className="login-page dotted">
        <div className="login-card">
          <span className="login-symbol">
            <Headphones size={30} />
          </span>
          <span className="eyebrow">YOUR NEXT FAVORITES LIVE HERE</span>
          <h1>Make it your music.</h1>
          <p>
            Connect Spotify to keep the artists and songs you discover in one
            personal collection.
          </p>
          <div className="login-benefits">
            <span>
              <GitBranch size={17} /> Follow a different kind of recommendation.
            </span>
            <span>
              <Bookmark size={17} /> Save artists and songs to your account.
            </span>
            <span>
              <Headphones size={17} /> Pick up where inspiration left off.
            </span>
          </div>
          {params.error && (
            <div className="inline-alert" role="alert">
              We couldn’t connect to Spotify. Please try again. Development apps
              may require your Spotify account to be allowlisted.
            </div>
          )}
          <LoginButton provider="spotify" callbackUrl={callbackUrl} />
          <Link href={callbackUrl} className="login-guest">
            <ArrowLeft size={15} /> Keep exploring as a guest
          </Link>
          <p className="login-footnote">
            Your collection is saved in musicweb. We don’t change your Spotify
            library or playlists.
          </p>
        </div>
      </main>
    </>
  );
}
