import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getOptionalEnv } from "@/lib/env";
import { pgQuery } from "@/lib/postgres/client";

function safeEquals(left: string | undefined, right: string) {
  if (!left) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function requireAdminRequest(request: NextRequest) {
  const configuredKey = getOptionalEnv("ADMIN_API_KEY") || getOptionalEnv("ODOO_WEBHOOK_API_KEY");
  const headerKey = request.headers.get("x-api-key");

  if (configuredKey && safeEquals(headerKey || undefined, configuredKey)) {
    return;
  }

  const session = await getSessionFromRequest(request);

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (session.role === "admin") {
    return;
  }

  const { rows } = await pgQuery<{ role: string }>(
    "select role from profiles where id = $1::uuid limit 1",
    [session.sub],
  );
  const profile = rows[0];

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }
}
