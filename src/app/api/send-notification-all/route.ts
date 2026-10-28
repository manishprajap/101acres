// src/app/api/send-notification-all/route.ts
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { and, isNotNull, ne, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// FCM allows max 500 tokens per multicast call, so we batch them
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    const { title, body, data, imageUrl } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Fetch all users who have a valid (non-null, non-empty) fcm_token
    const usersList = await db
      .select({ fcm_token: users.fcm_token })
      .from(users)
      .where(and(isNotNull(users.fcm_token), ne(users.fcm_token, "")));

    const tokens = usersList
      .map((u) => u.fcm_token)
      .filter((t): t is string => !!t);

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: "No registered FCM tokens found" },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    const logoUrl = imageUrl || "https://101acres.com/images/logo1.png";

    const sanitizedExtraData: Record<string, string> = {};
    if (data && typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          sanitizedExtraData[key] =
            typeof value === "string" ? value : JSON.stringify(value);
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
        notification: {
          title,
          body,
        },
        data: {
          ...sanitizedExtraData,
          title,
          body,
          imageUrl: logoUrl,
        },
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
          headers: {
            "apns-priority": "10",
          },
          payload: {
            aps: {
              "content-available": 1,
              "mutable-content": 1,
            },
          },
          fcmOptions: {
            imageUrl: logoUrl,
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((res, idx) => {
        if (
          !res.success &&
          (res.error?.code === "messaging/invalid-registration-token" ||
            res.error?.code === "messaging/registration-token-not-registered")
        ) {
          invalidTokens.push(batch[idx]);
        }
      });
    }

    // Clean up dead tokens so future sends don't waste calls on them
    if (invalidTokens.length > 0) {
      await db
        .update(users)
        .set({ fcm_token: null })
        .where(inArray(users.fcm_token, invalidTokens));
    }

    return NextResponse.json(
      {
        success: true,
        totalTokens: tokens.length,
        successCount,
        failureCount,
        invalidTokensRemoved: invalidTokens.length,
      },
      { headers: corsHeaders(origin) }
    );
  } catch (err: any) {
    console.error("Error sending bulk notification:", err);
    return NextResponse.json(
      { error: "Failed to send bulk notification" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}