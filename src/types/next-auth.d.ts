import NextAuth from "next-auth";
/// This makes it so that typescript recognizes theses custom variables for authentication
declare module "next-auth" {
  interface Session {
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyExpiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyExpiresAt?: number;
  }
}
