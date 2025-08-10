/// The authentication for the spotify and google log in
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import type { NextAuthOptions } from "next-auth";

const scopes = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
  "user-library-read",
].join(" ");

const params = new URLSearchParams({
  scope: scopes,
});

const LOGIN_URL = `https://accounts.spotify.com/authorize?${params.toString()}`;

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: LOGIN_URL,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account }) {
      // Only update Spotify tokens if signing in with Spotify
      if (account?.provider === "spotify") {
        token.spotifyAccessToken = account.access_token;
        token.spotifyRefreshToken = account.refresh_token;
        token.spotifyExpiresAt = account.expires_at;
      }

      return token;
    },

    async session({ session, token }) {
      // Add Spotify info only if available
      if (token.spotifyAccessToken) {
        session.spotifyAccessToken = token.spotifyAccessToken as string;
        session.spotifyRefreshToken = token.spotifyRefreshToken as string;
        session.spotifyExpiresAt = token.spotifyExpiresAt as number;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
