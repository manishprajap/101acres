// src/lib/roleRedirect.ts
export type Role = "admin" | "agent" | "user";

export const ROLE_PATH: Record<Role, string> = {
  admin: "/",
  agent: "/",
  user: "/",
};

function normalizeRole(value: unknown): Role | null {
  const r = String(value ?? "").trim().toLowerCase();
  if (!r) return null;
  if (r.includes("admin")) return "admin";
  if (r.includes("agent")) return "agent";
  if (r.includes("user")) return "user";
  return null;
}

/** Logged-in user's role (localStorage "role", fallback: "user" object). */
export function getRole(): Role {
  try {
    const direct = normalizeRole(localStorage.getItem("role"));
    if (direct) return direct;

    const raw = localStorage.getItem("user");
    if (raw && raw !== "undefined" && raw !== "null") {
      const parsed = JSON.parse(raw);
      const u = parsed?.user ?? parsed?.data ?? parsed;
      const fromUser = normalizeRole(u?.role ?? u?.userRole ?? u?.user_role);
      if (fromUser) return fromUser;
    }
  } catch {
    /* ignore */
  }
  return "user";
}

/** Logged-in user's id as string ("" if not found). */
export function getUserId(): string {
  try {
    const direct = localStorage.getItem("userId");
    if (direct && direct.trim()) return direct.trim();

    for (const key of ["user", "authUser", "auth_user"]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const p = JSON.parse(raw);
        const u = p?.user ?? p?.data ?? p;
        const id = u?.id ?? u?.userId ?? u?.user_id;
        if (id !== null && id !== undefined && String(id).trim()) return String(id);
      } catch {
        if (/^\d+$/.test(raw.trim())) return raw.trim();
      }
    }
  } catch {
    /* ignore */
  }
  return "";
}