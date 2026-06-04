import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { createLocalUser } from "@/lib/auth/users";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; fullName?: string };
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Email and password (min 6) are required." }, { status: 400 });
    }

    const user = await createLocalUser(email, password, body.fullName);
    const token = createSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    });
    const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, fullName: user.full_name } });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

    return response;
  } catch (error) {
    if (error instanceof Error && /duplicate key|unique/i.test(error.message)) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create account." },
      { status: 500 },
    );
  }
}
