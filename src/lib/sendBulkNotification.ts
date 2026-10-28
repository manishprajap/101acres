// src/lib/sendBulkNotification.ts
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { and, isNotNull, ne, inArray } from "drizzle-orm";
import admin from "@/lib/firebase-admin";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function sendBulkNotification({
  title,
  body,
  data,
  imageUrl,
}: {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}) {
  console.log("📢 sendBulkNotification called:", { title, body });

  const usersList = await db
    .select({ fcm_token: users.fcm_token })
    .from(users)
    .where(and(isNotNull(users.fcm_token), ne(users.fcm_token, "")));

  const tokens = usersList.map((u) => u.fcm_token).filter((t): t is string => !!t);

  console.log(`📢 ${tokens.length} FCM tokens found`);

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, totalTokens: 0 };
  }

  const logoUrl = imageUrl || "https://101acres.com/images/logo1.png";
  const sanitizedExtraData: Record<string, string> = {};
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        sanitizedExtraData[key] = typeof value === "string" ? value : JSON.stringify(value);
      }
    }
  }

  const tokenBatches = chunkArray(tokens, 500);
  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  for (const batch of tokenBatches) {
    const message: admin.messaging.MulticastMessage = {
      tokens: batch,
      notification: { title, body },
      data: { ...sanitizedExtraData, title, body, imageUrl: logoUrl },
      android: {
        priority: "high",
        notification: {
          icon: "ic_stat_logo1",
          color: "#1E7A46",
          imageUrl: logoUrl,
          channelId: "default",
        },
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { "content-available": 1, "mutable-content": 1 } },
        fcmOptions: { imageUrl: logoUrl },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((res, idx) => {
        if (!res.success) {
          console.error(`❌ Token failed: ${batch[idx]}`, res.error);
          if (
            res.error?.code === "messaging/invalid-registration-token" ||
            res.error?.code === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(batch[idx]);
          }
        }
      });
    } catch (batchErr) {
      console.error("❌ Batch error:", batchErr);
      failureCount += batch.length;
    }
  }

  if (invalidTokens.length > 0) {
    await db.update(users).set({ fcm_token: null }).where(inArray(users.fcm_token, invalidTokens));
  }

  console.log(`✅ Sent: ${successCount} success, ${failureCount} failed`);
  return { successCount, failureCount, totalTokens: tokens.length };
}