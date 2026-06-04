import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { pgQuery } from "@/lib/postgres/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ isAdmin: false, error: "Missing or invalid session" }, { status: 401 });
    }

    if (session.role === "admin") {
      return NextResponse.json({ isAdmin: true, source: "auth_metadata" });
    }

    const { rows } = await pgQuery<{ role: string }>(
      "select role from profiles where id = $1::uuid limit 1",
      [session.sub],
    );
    const profile = rows[0];

    return NextResponse.json({ isAdmin: profile?.role === "admin", source: "profiles" });
  } catch (error) {
    return NextResponse.json(
      { isAdmin: false, error: error instanceof Error ? error.message : "Failed to verify admin" },
      { status: 500 },
    );
  }
}
