import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db/db";
import { admins, users } from "@/db/schema";
import { verifyToken } from "@/db/utils";

export type PropertyRequestRole =
  | "admin"
  | "agent"
  | "owner"
  | "dealer"
  | "builder"
  | "user";

export type PropertyRequestActor = {
  id: number;
  role: PropertyRequestRole;
};

const KNOWN_ROLES: readonly PropertyRequestRole[] = [
  "admin",
  "agent",
  "owner",
  "dealer",
  "builder",
  "user",
];

/** Dev-only reason log, so a 401 can be traced to the exact step. */
function debug(reason: string, extra?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[propertyAuth]", reason, extra ?? "");
  }
}

/**
 * Every token the request carries, best candidate first.
 * A stale Authorization header must not hide a valid cookie,
 * so all candidates are tried one after another.
 */
function getRequestTokens(request: NextRequest): string[] {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim().replace(/^"|"$/g, "")
    : null;

  const candidates = [
    bearerToken,
    request.cookies.get("token")?.value,
    request.cookies.get("adminToken")?.value,
    request.cookies.get("admin_token")?.value,
  ];

  const unique: string[] = [];
  for (const candidate of candidates) {
    const token = candidate?.trim();
    if (token && token !== "undefined" && token !== "null" && !unique.includes(token)) {
      unique.push(token);
    }
  }
  return unique;
}

const sameEmail = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

/**
 * Maps the stored role to a known role (trim + lowercase).
 * admin / agent / owner / dealer / builder / user are kept as they are.
 * Any other value is treated as a normal "user" (own properties only).
 * To block unknown roles instead, return null here and handle it below.
 */
function normalizeRole(role: unknown): PropertyRequestRole {
  const value = String(role ?? "").trim().toLowerCase();
  return (KNOWN_ROLES as readonly string[]).includes(value)
    ? (value as PropertyRequestRole)
    : "user";
}

async function actorFromToken(token: string): Promise<PropertyRequestActor | null> {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = (verifyToken(token) as Record<string, unknown> | null) ?? null;
  } catch {
    payload = null;
  }
  if (!payload) {
    debug("token could not be verified (expired or invalid)");
    return null;
  }

  const id = Number(payload.id ?? payload.userId ?? payload.sub);
  const email = typeof payload.email === "string" ? payload.email : "";
  if (!Number.isInteger(id) || id <= 0 || !email) {
    debug("token payload has no valid id / email", { id: payload.id, hasEmail: !!email });
    return null;
  }

  // Admin accounts live in their own table
  const [admin] = await db
    .select({ id: admins.id, email: admins.email })
    .from(admins)
    .where(eq(admins.id, id))
    .limit(1);
  if (admin && sameEmail(admin.email, email)) return { id, role: "admin" };

  // Agents, owners, dealers, builders and users
  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user || !sameEmail(user.email, email)) {
    debug("no admin / user matches the token id + email", { id, email });
    return null;
  }

  return { id: user.id, role: normalizeRole(user.role) };
}

export async function getPropertyRequestActor(
  request: NextRequest
): Promise<PropertyRequestActor | null> {
  const tokens = getRequestTokens(request);
  if (tokens.length === 0) {
    debug("request has no Authorization header and no token cookie");
    return null;
  }

  for (const token of tokens) {
    const actor = await actorFromToken(token);
    if (actor) return actor;
  }

  return null;
}