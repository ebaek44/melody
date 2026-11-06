import type { DefaultSession } from "next-auth";
/// This makes it so that typescript recognizes theses custom variables for authentication
declare module "next-auth" {
  interface Session {
    user: { id?: string } & DefaultSession["user"];
    spotifyRefreshError?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    spotifyUserId?: string;
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyExpiresAt?: number;
    spotifyRefreshError?: string;
  }
}
