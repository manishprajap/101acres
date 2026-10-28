import { db } from "@/db/db";
import { contacts } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { sendContactNotificationEmail } from "@/lib/sendMail"; // ✅ naya import

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "All fields required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    await db.insert(contacts).values({
      name,
      email,
      phone,
      subject,
      message,
    });

    await sendContactNotificationEmail({ name, email, phone, subject, message });

    return NextResponse.json(
      {
        success: true,
        message: "Message saved successfully ✅",
      },
      {
        status: 200,
        headers: corsHeaders(origin),
      }
    );
  } catch (error) {
    console.error("CONTACT API ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Database error ❌",
      },
      {
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}