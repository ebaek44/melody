import { NextRequest, NextResponse } from "next/server";
import { searchArtists } from "@/lib/music";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2 || query.length > 120)
    return NextResponse.json(
      { error: "Enter between 2 and 120 characters." },
      { status: 400 },
    );
  try {
    return NextResponse.json({ artists: await searchArtists(query) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search unavailable" },
      { status: 503 },
    );
  }
}
