import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

interface SessionPayload {
  userId?: number;
  id?: number;
  email?: string;
}

export interface TokenIdentity {
  /** "session" = signed with { userId }; "login" = signed by generateToken with { id, email } */
  kind: "session" | "login";
  id: number;
  email: string | null;
}

const toId = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

export function signSessionToken(userId: number): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return null;
}

/** Verifies the Bearer token and returns who it claims to be (admins, users and agents all use it). */
export async function getTokenIdentity(req: NextRequest): Promise<TokenIdentity | null> {
  const token = extractToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as SessionPayload;

    const sessionId = toId(payload.userId);
    if (sessionId !== null) return { kind: "session", id: sessionId, email: null };

    const loginId = toId(payload.id);
    if (loginId !== null) {
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
      return { kind: "login", id: loginId, email };
    }
    return null;
  } catch {
    return null; // expired, tampered, or wrong secret
  }
}

/** Unchanged behaviour: id only for { userId } session tokens. */
export async function getUserId(req: NextRequest): Promise<number | null> {
  const identity = await getTokenIdentity(req);
  return identity?.kind === "session" ? identity.id : null;
}

export async function getAuthUser(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return null;

  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId));

  return usersList[0] ?? null;
}