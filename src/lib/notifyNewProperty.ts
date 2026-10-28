// src/lib/notifyNewProperty.ts
// Sends a push notification to every user that has an fcm_token whenever a
// new property is added. The message is built per fcm_platform (android / ios / web).
import fs from "fs";
import path from "path";
import type { RowDataPacket } from "mysql2";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging, type MulticastMessage } from "firebase-admin/messaging";

import { pool } from "@/db/db";

/* ============================================================
   CONFIG
============================================================ */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://101acres.com").replace(/\/+$/, "");
// Public page of a property. Change if your detail page lives somewhere else.
const PROPERTY_PATH = "/properties";

const FCM_BATCH_SIZE = 500; // FCM limit per multicast request
const APP_NAME = "101acres"; // named app, never clashes with other firebase-admin code

const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

type Platform = "android" | "ios" | "web" | "other";

export interface NewPropertyPush {
  propertyId: number | string;
  title?: string;
  city?: string;
  price?: number | string;
  /** The user who added the property. This user does not get the push. */
  ownerId?: number | string;
  /**
   * Saved form data. Used to fill title / city / price when they are not
   * passed directly (explicit values always win).
   */
  formData?: Record<string, unknown>;
}

export interface PushResult {
  recipients: number;
  sent: number;
  failed: number;
  removedTokens: number;
}

/* ============================================================
   FIREBASE
============================================================ */

function getFirebaseApp() {
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) return existing;

  const file =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(process.cwd(), "src/lib/firebase-service-account.json");

  const serviceAccount = JSON.parse(fs.readFileSync(file, "utf8"));
  return initializeApp({ credential: cert(serviceAccount) }, APP_NAME);
}

/* ============================================================
   HELPERS
============================================================ */

function normalizePlatform(value: unknown): Platform {
  const platform = String(value ?? "").trim().toLowerCase();
  if (platform === "android") return "android";
  if (platform === "ios" || platform === "iphone" || platform === "ipad") return "ios";
  if (platform === "web") return "web";
  return "other";
}

function formatPrice(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 10000000) return `₹${parseFloat((n / 10000000).toFixed(2))} Cr`;
  if (n >= 100000) return `₹${parseFloat((n / 100000).toFixed(2))} Lac`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

/** First non-empty value found under any of the given keys. */
function pickFirst(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
}

function buildMessage(
  platform: Platform,
  tokens: string[],
  content: { title: string; body: string; data: Record<string, string>; link: string }
): MulticastMessage {
  const message: MulticastMessage = {
    tokens,
    notification: { title: content.title, body: content.body },
    data: content.data,
  };

  if (platform === "android") {
    message.android = {
      priority: "high",
      notification: { sound: "default" },
    };
  }

  if (platform === "ios") {
    message.apns = {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    };
  }

  if (platform === "web") {
    message.webpush = {
      fcmOptions: { link: content.link },
    };
  }

  return message;
}

async function removeInvalidTokens(tokens: string[]): Promise<number> {
  if (tokens.length === 0) return 0;

  let removed = 0;
  for (const part of chunk(tokens, 500)) {
    const [result] = await pool.query<RowDataPacket[] & { affectedRows?: number }>(
      "UPDATE `users` SET `fcm_token` = NULL WHERE `fcm_token` IN (?)",
      [part]
    );
    removed += Number((result as unknown as { affectedRows?: number }).affectedRows ?? 0);
  }
  return removed;
}

/* ============================================================
   MAIN
   Call it WITHOUT await so the add-property response is not delayed:
     void notifyNewProperty({...}).catch(console.error);
============================================================ */

export async function notifyNewProperty(input: NewPropertyPush): Promise<PushResult> {
  const result: PushResult = { recipients: 0, sent: 0, failed: 0, removedTokens: 0 };

  /* ---------- 1. collect tokens (one per device, grouped by platform) ---------- */

  const ownerId = Number(input.ownerId);

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT `fcm_token`, `fcm_platform` FROM `users` " +
      "WHERE `fcm_token` IS NOT NULL AND `fcm_token` <> '' AND `id` <> ?",
    [Number.isInteger(ownerId) ? ownerId : 0]
  );

  const tokenPlatform = new Map<string, Platform>();
  for (const row of rows) {
    const token = String(row.fcm_token ?? "").trim();
    if (token) tokenPlatform.set(token, normalizePlatform(row.fcm_platform));
  }

  result.recipients = tokenPlatform.size;
  if (result.recipients === 0) {
    console.log("[push] new property: no users with an fcm_token");
    return result;
  }

  const byPlatform = new Map<Platform, string[]>();
  for (const [token, platform] of tokenPlatform) {
    byPlatform.set(platform, [...(byPlatform.get(platform) ?? []), token]);
  }

  /* ---------- 2. notification content ---------- */

  // Explicit values win; formData only fills the gaps.
  const fd = input.formData ?? {};

  const city = String(input.city ?? pickFirst(fd, ["city"]) ?? "").trim();
  const propertyTitle = String(
    input.title ?? pickFirst(fd, ["title", "propertyTitle", "property_title"]) ?? ""
  ).trim();
  const price = formatPrice(
    input.price ?? pickFirst(fd, ["price", "expectedPrice", "expected_price"])
  );
  const propertyId = String(input.propertyId);

  // A purely numeric city is an ID, not a name -> don't show "New property in 123".
  const cityLabel = /^\d+$/.test(city) ? "" : city;

  const content = {
    title: cityLabel ? `New property in ${cityLabel}` : "New property added",
    body: [propertyTitle || "A new property is now available", price].filter(Boolean).join(" • "),
    data: {
      type: "new_property",
      propertyId,
    },
    link: `${SITE_URL}${PROPERTY_PATH}/${encodeURIComponent(propertyId)}`,
  };

  /* ---------- 3. send per platform, 500 tokens at a time ---------- */

  const messaging = getMessaging(getFirebaseApp());
  const invalidTokens: string[] = [];

  for (const [platform, tokens] of byPlatform) {
    for (const batch of chunk(tokens, FCM_BATCH_SIZE)) {
      try {
        const response = await messaging.sendEachForMulticast(
          buildMessage(platform, batch, content)
        );

        result.sent += response.successCount;
        result.failed += response.failureCount;

        response.responses.forEach((item, index) => {
          if (item.success) return;

          // Log the real reason so failures can be diagnosed from pm2 logs.
          console.error(
            `[push] ${platform} token ${batch[index].slice(0, 12)}... failed:`,
            item.error?.code,
            item.error?.message
          );

          if (item.error && INVALID_TOKEN_CODES.has(item.error.code)) {
            invalidTokens.push(batch[index]);
          }
        });
      } catch (error) {
        result.failed += batch.length;
        console.error(`[push] ${platform} batch failed:`, error);
      }
    }
  }

  /* ---------- 4. clean tokens Firebase says are dead ---------- */

  try {
    result.removedTokens = await removeInvalidTokens(invalidTokens);
  } catch (error) {
    console.error("[push] could not clear invalid tokens:", error);
  }

  console.log("[push] new property", propertyId, result);
  return result;
}