import { randomUUID } from "node:crypto";
import { pgQuery } from "@/lib/postgres/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type LocalUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

export async function createLocalUser(email: string, password: string, fullName?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const id = randomUUID();
  const passwordHash = hashPassword(password);

  await pgQuery(
    `insert into profiles (id, email, full_name, role)
     values ($1::uuid, $2, $3, 'customer')
     on conflict (id) do nothing`,
    [id, normalizedEmail, fullName?.trim() || null],
  );

  await pgQuery(
    `insert into auth_users (id, email, password_hash)
     values ($1::uuid, $2, $3)`,
    [id, normalizedEmail, passwordHash],
  );

  return {
    id,
    email: normalizedEmail,
    full_name: fullName?.trim() || null,
    role: "customer",
  } as LocalUser;
}

export async function authenticateLocalUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pgQuery<{
    id: string;
    email: string;
    password_hash: string;
    full_name: string | null;
    role: string;
  }>(
    `select au.id, au.email, au.password_hash, p.full_name, p.role
     from auth_users au
     join profiles p on p.id = au.id
     where au.email = $1
     limit 1`,
    [normalizedEmail],
  );

  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return undefined;
  }

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role || "customer",
  } as LocalUser;
}

export async function findLocalUserById(id: string) {
  const { rows } = await pgQuery<LocalUser>(
    `select id, email, full_name, role from profiles where id = $1::uuid limit 1`,
    [id],
  );

  return rows[0];
}

export async function upsertLocalProfile(input: {
  id: string;
  email: string;
  full_name?: string | null;
  role?: string;
}) {
  await pgQuery(
    `insert into profiles (id, email, full_name, role, updated_at)
     values ($1::uuid, $2, $3, $4, now())
     on conflict (id) do update set
       email = excluded.email,
       full_name = excluded.full_name,
       role = excluded.role,
       updated_at = now()`,
    [
      input.id,
      input.email.trim().toLowerCase(),
      input.full_name || null,
      input.role || "customer",
    ],
  );
}
