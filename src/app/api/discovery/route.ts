import { NextRequest, NextResponse } from "next/server";
import { discoverArtist } from "@/lib/music";
import { discoveryInput, DiscoveryInputError } from "@/lib/discovery";
export const runtime = "nodejs";

async function discover(value: unknown) {
  try {
    const { artist, exclude } = discoveryInput(value);
    return NextResponse.json(await discoverArtist(artist, exclude), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Discovery unavailable",
      },
      { status: error instanceof DiscoveryInputError ? 400 : 503 },
    );
  }
}

export async function GET(request: NextRequest) {
  return discover({ artist: request.nextUrl.searchParams.get("artist") });
}

export async function POST(request: NextRequest) {
  // Keep the visit list out of URLs and cap streamed bodies, including chunked requests.
  const maxBytes = 64 * 1024;
  const tooLarge = () =>
    NextResponse.json(
      { error: "Discovery request too large." },
      { status: 413 },
    );
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes)
    return tooLarge();
  const reader = request.body?.getReader();
  if (!reader)
    return NextResponse.json(
      { error: "Enter an artist name." },
      { status: 400 },
    );
  let bytes = 0;
  let body = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return tooLarge();
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return discover(JSON.parse(body));
  } catch {
    return NextResponse.json(
      { error: "Invalid discovery request." },
      { status: 400 },
    );
  } finally {
    reader.releaseLock();
  }
}
