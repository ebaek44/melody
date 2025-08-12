import NextAuth from "next-auth";
/// This makes it so that typescript recognizes theses custom variables for authentication
declare module "next-auth" {
  interface Session {
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyExpiresAt?: number;
    spotifyRefreshError?: string;
  }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyExpiresAt?: number;
    spotifyRefreshError?: string;
  }
}
