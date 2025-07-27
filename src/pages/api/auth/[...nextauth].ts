/// The authentication for the spotify log in
import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import type { NextAuthOptions } from "next-auth";

/// We can change this to what information we want to use
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

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      /// Make sure to make a folder with all the spotify client info
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: LOGIN_URL,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      // Save access token to the JWT
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass token for use in client
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt as number;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
