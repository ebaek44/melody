// app/api/top-artists/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const accessToken = session?.spotifyAccessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const time_range = searchParams.get("time_range") ?? "short_term"; // short_term, medium_term, long_term
  const limit = searchParams.get("limit") ?? "10"; // 1..50
  const offset = searchParams.get("offset") ?? "0";

  const url = `https://api.spotify.com/v1/me/top/artists?time_range=${time_range}&limit=${limit}&offset=${offset}`;

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
