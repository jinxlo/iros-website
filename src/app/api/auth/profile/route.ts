import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { upsertLocalProfile } from "@/lib/auth/users";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    await upsertLocalProfile({
      id: session.sub,
      email: session.email,
      full_name: session.name || null,
      role: session.role || "customer",
    });

    return NextResponse.json({ ok: true, profileSynced: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync profile" },
      { status: 500 },
    );
  }
}
