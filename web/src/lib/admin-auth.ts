import { cookies } from "next/headers";

export const ADMIN_COOKIE = "tsc_admin";

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "tsc-dev-only-change-me"
  );
}

export function adminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedAdminToken() {
  const password = process.env.ADMIN_PASSWORD?.trim() || "";
  if (!password) return "";
  return sha256Hex(`tsc-admin:${password}:${secret()}`);
}

export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD?.trim() || "";
  return Boolean(expected) && input === expected;
}

export async function tokenMatches(token: string | undefined) {
  const expected = await expectedAdminToken();
  if (!expected || !token || token.length !== expected.length) return false;
  let ok = true;
  for (let i = 0; i < expected.length; i++) {
    if (token[i] !== expected[i]) ok = false;
  }
  return ok;
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  return tokenMatches(jar.get(ADMIN_COOKIE)?.value);
}

export function sessionCookieOptions(token: string) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}
