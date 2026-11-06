import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  getLibrary,
  removeItem,
  saveItem,
  DatabaseUnavailableError,
} from "@/lib/db";
import { DatabaseConfigurationError } from "@/lib/database/config";
import { validateItem } from "@/lib/library";
export const runtime = "nodejs";

async function userId() {
  return (await getServerSession(authOptions))?.user?.id;
}
const unauthorized = () =>
  NextResponse.json(
    { error: "Sign in with Spotify to save your discoveries." },
    { status: 401 },
  );

export async function GET() {
  const id = await userId();
  if (!id) return unauthorized();
  try {
    return NextResponse.json(
      { items: await getLibrary(id) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Your library couldn’t be loaded. Please try again." },
      {
        status:
          error instanceof DatabaseConfigurationError ||
          error instanceof DatabaseUnavailableError
            ? 503
            : 500,
      },
    );
  }
}

async function mutate(request: NextRequest, operation: "save" | "remove") {
  // Next may internally normalize 127.0.0.1 to localhost; the browser's Host
  // identifies the actual origin and also works behind a same-origin proxy.
  const expectedOrigin = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  if (request.headers.get("origin") !== expectedOrigin)
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  const id = await userId();
  if (!id) return unauthorized();
  if (Number(request.headers.get("content-length") ?? 0) > 8192)
    return NextResponse.json({ error: "Item too large" }, { status: 413 });
  try {
    const text = await request.text();
    if (text.length > 8192)
      return NextResponse.json({ error: "Item too large" }, { status: 413 });
    const body = JSON.parse(text);
    if (operation === "save") await saveItem(id, validateItem(body));
    else {
      if (typeof body.key !== "string" || !/^[a-f0-9]{32}$/.test(body.key))
        throw new Error("Invalid item key");
      await removeItem(id, body.key);
    }
    return NextResponse.json(
      { items: await getLibrary(id) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && /Invalid|Choose/.test(error.message))
    )
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(
      { error: "Your library couldn’t be updated. Please try again." },
      {
        status:
          error instanceof DatabaseConfigurationError ||
          error instanceof DatabaseUnavailableError
            ? 503
            : 500,
      },
    );
  }
}
export async function PUT(request: NextRequest) {
  return mutate(request, "save");
}
export async function DELETE(request: NextRequest) {
  return mutate(request, "remove");
}
