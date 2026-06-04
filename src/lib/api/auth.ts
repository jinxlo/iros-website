import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getOptionalEnv } from "@/lib/env";

function safeEquals(left: string | undefined, right: string) {
  if (!left) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function requireApiKey(request: NextRequest) {
  const configuredKey = getOptionalEnv("ADMIN_API_KEY") || getOptionalEnv("ODOO_WEBHOOK_API_KEY");

  if (!configuredKey) {
    throw new Error("Missing API key configuration");
  }

  const authorization = request.headers.get("authorization");
  const headerKey = request.headers.get("x-api-key");
  const bearerKey = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  if (!safeEquals(headerKey || undefined, configuredKey) && !safeEquals(bearerKey, configuredKey)) {
    throw new Error("Unauthorized");
  }
}
