// src/lib/requester.ts
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { admins, users } from "@/db/schema";
import { getTokenIdentity } from "@/lib/auth";

export interface Requester {
  /** id of the caller (null when unknown) */
  userId: number | null;
  /** true when the identity came from a valid Bearer JWT */
  verified: boolean;
  /** caller is an admin */
  isAdmin: boolean;
}

const NONE: Requester = { userId: null, verified: false, isAdmin: false };

function toPositiveInt(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

/**
 * Who is calling?
 * 1. Valid Bearer token -> checked against `admins` (id + email), then `users` (id + email).
 * 2. No token -> legacy `userId` from the client (disabled when REQUIRE_TOKEN=true).
 */
export async function getRequester(
  request: NextRequest,
  claimedUserId?: unknown
): Promise<Requester> {
  const identity = await getTokenIdentity(request);

  if (identity) {
    try {
      /* login token: admins and users share ids, so the email decides which table it is */
      if (identity.kind === "login" && identity.email) {
        const adminRows = await db
          .select({ id: admins.id, email: admins.email })
          .from(admins)
          .where(eq(admins.id, identity.id))
          .limit(1);
        if (adminRows[0] && norm(adminRows[0].email) === identity.email) {
          return { userId: identity.id, verified: true, isAdmin: true };
        }

        const userRows = await db
          .select({ email: users.email, role: users.role })
          .from(users)
          .where(eq(users.id, identity.id))
          .limit(1);
        if (userRows[0] && norm(userRows[0].email) === identity.email) {
          return {
            userId: identity.id,
            verified: true,
            isAdmin: norm(userRows[0].role) === "admin",
          };
        }
        return NONE; // valid signature but no matching account
      }

      /* session token { userId } */
      const rows = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, identity.id))
        .limit(1);
      if (!rows[0]) return NONE;
      return { userId: identity.id, verified: true, isAdmin: norm(rows[0].role) === "admin" };
    } catch (error) {
      console.error("getRequester lookup error:", error);
      return NONE;
    }
  }

  /* no valid token: legacy userId, never admin */
  if (process.env.REQUIRE_TOKEN === "true") return NONE;
  const userId = toPositiveInt(claimedUserId);
  if (userId === null) return NONE;
  return { userId, verified: false, isAdmin: false };
}

/** May this caller list ALL users' properties? Admin only, and only with a verified token. */
export function canViewAll(requester: Requester): boolean {
  return requester.isAdmin && requester.verified;
}