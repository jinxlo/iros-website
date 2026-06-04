import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getRequiredEnv } from "@/lib/env";

const SESSION_COOKIE = "iros_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  email: string;
  role: string;
  name?: string | null;
  exp: number;
};

function base64urlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(value: string) {
  const padded = value + "===".slice((value.length + 3) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function sign(input: string) {
  return base64urlEncode(createHmac("sha256", getRequiredEnv("LOCAL_AUTH_SECRET")).update(input).digest());
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">) {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(fullPayload));
  const signature = sign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | undefined {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    return undefined;
  }

  const expected = sign(`${header}.${body}`);

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return undefined;
  }

  const payload = JSON.parse(base64urlDecode(body)) as SessionPayload;

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return undefined;
  }

  return payload;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function getSessionFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  const cookieStore = await cookies();
  const token = bearer || cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return undefined;
  }

  return verifySessionToken(token);
}

export { SESSION_COOKIE };
