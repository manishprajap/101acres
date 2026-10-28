// src/app/api/send-notification/route.ts
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    const { userId, title, body, data, imageUrl } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: "userId, title and body are required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const usersList = await db
      .select({ fcm_token: users.fcm_token })
      .from(users)
      .where(eq(users.id, Number(userId)));

    const user = usersList[0];

    if (!user || !user.fcm_token) {
      return NextResponse.json(
        { error: "No FCM token found for this user" },
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

    const message: admin.messaging.Message = {
      token: user.fcm_token,

      // Needed so Android/iOS OS shows the notification automatically
      // when the app is in background or fully killed.
      notification: {
        title,
        body,
      },

      // Needed so your foreground JS listener can still do custom
      // rendering (image attachment, custom icon, etc.) when app is open.
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

    const response = await admin.messaging().send(message);

    return NextResponse.json(
      { success: true, messageId: response },
      { headers: corsHeaders(origin) }
    );
  } catch (err: any) {
    console.error("Error sending notification:", err);

    if (
      err.code === "messaging/invalid-registration-token" ||
      err.code === "messaging/registration-token-not-registered"
    ) {
      return NextResponse.json(
        { error: "FCM token invalid or expired" },
        { status: 410, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}