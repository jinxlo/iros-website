import { Pool, type QueryResultRow } from "pg";
import { getOptionalEnv } from "@/lib/env";

let pool: Pool | undefined;

function resolveConnectionString() {
  const explicit = getOptionalEnv("LOCAL_DATABASE_URL") || getOptionalEnv("POSTGRES_URL") || getOptionalEnv("DATABASE_URL");

  if (explicit) {
    return explicit;
  }

  const host = getOptionalEnv("LOCAL_DB_HOST");
  const database = getOptionalEnv("LOCAL_DB_NAME");
  const user = getOptionalEnv("LOCAL_DB_USER");
  const password = getOptionalEnv("LOCAL_DB_PASSWORD");
  const port = getOptionalEnv("LOCAL_DB_PORT") || "5432";

  if (host && database && user) {
    const encodedPassword = encodeURIComponent(password || "");

    return `postgresql://${encodeURIComponent(user)}:${encodedPassword}@${host}:${port}/${database}`;
  }

  throw new Error(
    "Missing PostgreSQL configuration. Set LOCAL_DATABASE_URL, POSTGRES_URL, DATABASE_URL, or LOCAL_DB_HOST/LOCAL_DB_NAME/LOCAL_DB_USER.",
  );
}

export function getLocalPostgresPool() {
  if (!pool) {
    const connectionString = resolveConnectionString();
    const useSsl = /^true$/i.test(getOptionalEnv("LOCAL_DB_SSL") || "false");

    pool = new Pool({
      connectionString,
      max: Number(getOptionalEnv("PG_POOL_MAX") || 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

export async function pgQuery<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  return getLocalPostgresPool().query<T>(text, params);
}
