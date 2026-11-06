// src/lib/auth.ts
import { upsertUser } from "./db";
import SpotifyProvider from "next-auth/providers/spotify";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";

const scopes = ["user-read-email", "user-read-private", "user-top-read"].join(
  " ",
);

const params = new URLSearchParams({ scope: scopes });
const LOGIN_URL = `https://accounts.spotify.com/authorize?${params.toString()}`;

async function refreshSpotifyAccessToken(token: JWT): Promise<JWT> {
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.spotifyRefreshToken as string,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
    });

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();
    if (!res.ok) throw new Error("Spotify token refresh failed");

    const newExpiresAtMs = Date.now() + data.expires_in * 1000;

    return {
      ...token,
      spotifyAccessToken: data.access_token,
      spotifyExpiresAt: Math.floor(newExpiresAtMs / 1000), // store as seconds
      spotifyRefreshToken: data.refresh_token ?? token.spotifyRefreshToken,
      spotifyRefreshError: undefined,
    };
  } catch {
    return {
      ...token,
      spotifyRefreshError: "RefreshAccessTokenError" as const,
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: LOGIN_URL,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },

  callbacks: {
    async jwt({ token, account, user }) {
      // First time signing in with Spotify
      if (account?.provider === "spotify") {
        await upsertUser(account.providerAccountId, user?.name, user?.image);
        token.spotifyUserId = account.providerAccountId;
        token.spotifyRefreshError = undefined;
        // account.expires_at is seconds since epoch
        token.spotifyAccessToken = account.access_token;
        token.spotifyRefreshToken = account.refresh_token;
        token.spotifyExpiresAt = account.expires_at; // seconds
        return token;
      }

      // If we do not have Spotify tokens, nothing to do
      if (!token.spotifyAccessToken || !token.spotifyExpiresAt) {
        return token;
      }

      // If access token is still valid, return it
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec < (token.spotifyExpiresAt as number) - 60) {
        return token;
      }

      // Otherwise try to refresh
      if (token.spotifyRefreshToken) {
        return await refreshSpotifyAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      // Provider credentials remain inside the encrypted, HTTP-only JWT cookie.
      if (session.user) session.user.id = token.spotifyUserId;
      session.spotifyRefreshError = token.spotifyRefreshError;
      return session;
    },
  },
};
