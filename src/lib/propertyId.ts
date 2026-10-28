const KEY = "101acres-k3y-2026";

const hex = (n: number) => (n & 0xff).toString(16).padStart(2, "0");

/** 113 -> "p3f1a0b7c..." (reversible, not cryptographic). */
export function encodePropertyId(id: number | string): string {
  const s = String(id);
  let out = "";
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    const b = s.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length) ^ ((i * 31) & 0xff);
    out += hex(b);
    sum = (sum + (b & 0xff) * (i + 1)) & 0xff;
  }
  return `p${hex(sum)}${out}`;
}

/** Returns the numeric id as a string, or null when the token is invalid. */
export function decodePropertyId(token: string | undefined | null): string | null {
  if (!token) return null;
  let t = token;
  try {
    t = decodeURIComponent(token);
  } catch {
    /* keep raw */
  }
  t = t.trim();

  // Legacy links with a plain numeric id keep working.
  if (/^\d+$/.test(t)) return t;

  if (!/^p[0-9a-f]{4,}$/i.test(t) || t.length % 2 === 0) return null;

  const body = t.slice(1);
  const checksum = parseInt(body.slice(0, 2), 16);
  const data = body.slice(2);
  if (data.length === 0 || data.length % 2 !== 0) return null;

  let id = "";
  let sum = 0;
  for (let i = 0; i < data.length / 2; i++) {
    const b = parseInt(data.slice(i * 2, i * 2 + 2), 16);
    sum = (sum + b * (i + 1)) & 0xff;
    id += String.fromCharCode(b ^ KEY.charCodeAt(i % KEY.length) ^ ((i * 31) & 0xff));
  }

  if (sum !== checksum || !/^\d+$/.test(id)) return null;
  return id;
}

/** users.role -> label shown on the site. */
export function getRoleLabel(role: unknown): string {
  const r = String(role ?? "").trim().toLowerCase();
  switch (r) {
    case "agent":
      return "Agent";
    case "dealer":
      return "Dealer";
    case "builder":
      return "Builder";
    case "user":
    case "owner":
      return "Owner";
    default:
      return "";
  }
}

/** Drops city ids like "707" and generic values like "National". */
export function cleanPlace(value: unknown): string {
  const v = String(value ?? "").trim();
  if (!v) return "";
  if (/^\d+$/.test(v)) return "";
  if (/^(national|international|null|undefined|-)$/i.test(v)) return "";
  return v;
}