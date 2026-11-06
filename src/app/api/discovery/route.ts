import { NextRequest, NextResponse } from "next/server";
import { discoverArtist } from "@/lib/music";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("artist")?.trim();
  if (!name || name.length > 120)
    return NextResponse.json(
      { error: "Enter an artist name (up to 120 characters)." },
      { status: 400 },
    );
  try {
    return NextResponse.json(await discoverArtist(name));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Discovery unavailable",
      },
      { status: 503 },
    );
  }
}
