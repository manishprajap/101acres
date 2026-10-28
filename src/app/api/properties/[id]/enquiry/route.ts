// src/app/api/properties/[id]/enquiry/route.ts
// Receives "Contact Owner", "View Number" and "Send enquiry" requests from the
// property page.
//   1. Email to the property owner / broker
//   2. Separate copy to admin (no BCC, so the owner mail looks like a normal 1-to-1 mail)
//   3. Confirmation email to the person who sent the enquiry (if they gave an email)
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type { RowDataPacket } from "mysql2";
import nodemailer from "nodemailer";

import { db, pool } from "@/db/db";
import { users } from "@/db/schema";
import { corsHeaders } from "@/lib/cors";
import { parsePropertyFormData } from "@/lib/propertyFormStorage";

export const runtime = "nodejs";

type EnquiryType = "contact_owner" | "view_number" | "enquiry";
type RouteContext = { params: Promise<{ id: string }> };

const BRAND_COLOR = "#0078d4";
const BRAND_DARK = "#0b3d66";

const TYPE_LABELS: Record<EnquiryType, string> = {
  contact_owner: "Contact owner request",
  view_number: "Phone number request",
  enquiry: "Property enquiry",
};

const TYPE_HEADLINES: Record<EnquiryType, string> = {
  contact_owner: "Someone wants to contact you",
  view_number: "Someone requested your phone number",
  enquiry: "You have a new property enquiry",
};

/* ============================================================
   HELPERS
============================================================ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Single line, no control characters (safe for subjects and headers). */
function cleanLine(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Multi-line text, control characters removed but line breaks kept. */
function cleanMessage(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ")
    .trim()
    .slice(0, max);
}

/** Digits only; strips +91 / 91 / leading 0 so "+919876543210" -> "9876543210". */
function normalizePhone(value: unknown): string {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

const isMobile = (value: string): boolean => /^[6-9]\d{9}$/.test(value);
const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Only links back to 101acres.com are put into the email. */
function safePageUrl(value: unknown): string {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    const host = url.hostname;
    if (host !== "101acres.com" && !host.endsWith(".101acres.com")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function formatPrice(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `₹${n.toLocaleString("en-IN")}`;
}

/**
 * SMTP_FROM must look like:  "101acres.com" <no-reply@101acres.com>
 * IMPORTANT (spam): the address must belong to YOUR domain, and that domain must have
 * SPF + DKIM + DMARC set up for the SMTP server you send from. A @gmail.com From
 * address sent through another server is treated as spoofing and lands in spam.
 * If SMTP_FROM is just an address or has no <...>, it is fixed here so a bad .env
 * value does not make the mail fail.
 */
function getFromAddress(): string {
  const user = String(process.env.SMTP_USER ?? "").trim();
  const raw = String(process.env.SMTP_FROM ?? "").trim();
  if (!raw) return `"101acres.com" <${user}>`;
  if (/<[^<>@\s]+@[^<>\s]+>/.test(raw)) return raw;

  const match = raw.match(/[^\s<>"]+@[^\s<>"]+/);
  if (!match) return `"101acres.com" <${user}>`;
  return `"101acres.com" <${match[0]}>`;
}

/* ============================================================
   RATE LIMIT (in memory, per IP + property)
============================================================ */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();

  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
}

/* ============================================================
   MAIL
============================================================ */

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/* ============================================================
   LOGO
   public/images/logo1.png is embedded in the mail as an inline (CID)
   attachment, so it shows in Gmail / Outlook / mobile apps even when the
   site is not public yet (localhost testing).
   Set EMAIL_LOGO_URL in .env to use a hosted image instead.
============================================================ */

const LOGO_FILE = path.join(process.cwd(), "public", "images", "logo1.png");
const LOGO_CID = "logo@101acres.com";

let logoBuffer: Buffer | null | undefined;

function readLogoFile(): Buffer | null {
  if (logoBuffer !== undefined) return logoBuffer;
  try {
    logoBuffer = fs.readFileSync(LOGO_FILE);
  } catch {
    console.error("[enquiry] logo file not found:", LOGO_FILE);
    logoBuffer = null;
  }
  return logoBuffer;
}

function getHostedLogoUrl(): string {
  return String(process.env.EMAIL_LOGO_URL ?? "").trim();
}

function getLogoSrc(): string {
  const hosted = getHostedLogoUrl();
  if (hosted) return hosted;
  return readLogoFile() ? `cid:${LOGO_CID}` : "";
}

/** Pass this as `attachments` in every sendMail call. */
function getLogoAttachments() {
  if (getHostedLogoUrl()) return [];
  const content = readLogoFile();
  if (!content) return [];
  return [
    {
      filename: "logo1.png",
      content,
      contentType: "image/png",
      cid: LOGO_CID,
      contentDisposition: "inline" as const,
    },
  ];
}

/* ============================================================
   EMAIL TEMPLATES
   Table based layout with inline CSS so it renders correctly in
   Gmail, Outlook and mobile mail apps.
============================================================ */

interface EmailInput {
  type: EnquiryType;
  propertyId: number;
  title: string;
  address: string;
  price: string;
  name: string;
  mobile: string;
  email: string;
  message: string;
  pageUrl: string;
  /** "Owner", "Broker", "Builder" ... (from the ownership column) */
  ownership: string;
  /** Owner / broker phone. Only shown to the enquirer for "view_number". */
  ownerPhone: string;
}

function logoHtml(siteUrl: string): string {
  const src = getLogoSrc();

  return src
    ? `<a href="${escapeHtml(siteUrl)}" style="text-decoration:none">
         <img src="${escapeHtml(src)}" alt="101acres.com" height="46"
              style="display:block;border:0;outline:none;text-decoration:none;height:46px;width:auto;max-width:220px" />
       </a>`
    : `<a href="${escapeHtml(siteUrl)}" style="text-decoration:none;font-size:26px;font-weight:700;color:${BRAND_DARK};letter-spacing:-0.5px">
         101<span style="color:${BRAND_COLOR}">acres</span>.com
       </a>`;
}

function buttonHtml(href: string, label: string, filled: boolean): string {
  return `
    <td style="padding:0 8px 8px 0">
      <a href="${escapeHtml(href)}"
         style="display:inline-block;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;
                ${
                  filled
                    ? `background:${BRAND_COLOR};color:#ffffff;border:1px solid ${BRAND_COLOR}`
                    : `background:#ffffff;color:${BRAND_COLOR};border:1px solid ${BRAND_COLOR}`
                }">
        ${escapeHtml(label)}
      </a>
    </td>`;
}

function detailRow(label: string, valueHtml: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef2f6;width:110px;font-size:13px;color:#64748b;vertical-align:top">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef2f6;font-size:14px;color:#0f172a;font-weight:600;vertical-align:top">${valueHtml}</td>
    </tr>`;
}

function propertyCardHtml(input: EmailInput): string {
  return `
          <tr>
            <td style="padding:22px 32px 0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
                <tr>
                  <td style="padding:16px 18px">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;font-weight:700">Property</div>
                    <div style="font-size:17px;font-weight:700;color:#0f172a;margin-top:6px;line-height:1.4">
                      ${escapeHtml(input.title)}
                    </div>
                    ${
                      input.address
                        ? `<div style="font-size:13px;color:#475569;margin-top:6px;line-height:1.5">&#128205; ${escapeHtml(input.address)}</div>`
                        : ""
                    }
                    <div style="margin-top:10px;font-size:13px;color:#64748b">
                      ${
                        input.price
                          ? `<span style="font-size:18px;font-weight:700;color:${BRAND_COLOR}">${escapeHtml(input.price)}</span>&nbsp;&nbsp;`
                          : ""
                      }
                      <span>Property ID: #${input.propertyId}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function messageBlockHtml(message: string, title = "Message"): string {
  return `
          <tr>
            <td style="padding:22px 32px 0">
              <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;font-weight:700;margin-bottom:8px">
                ${escapeHtml(title)}
              </div>
              <div style="padding:14px 16px;background:#f8fafc;border-left:4px solid ${BRAND_COLOR};border-radius:4px;font-size:14px;line-height:1.6;color:#1e293b">
                ${escapeHtml(message).replace(/\n/g, "<br>")}
              </div>
            </td>
          </tr>`;
}

/** Wraps the body rows with the shared header (logo), preheader and footer. */
function wrapEmail(options: {
  headline: string;
  preheader: string;
  footerNote: string;
  rows: string;
}): string {
  const siteUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://101acres.com").replace(/\/+$/, "");
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(options.headline)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">

  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px">
    ${escapeHtml(options.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9">
    <tr>
      <td align="center" style="padding:24px 12px">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0">

          <!-- Header with logo -->
          <tr>
            <td style="padding:20px 32px;background:#ffffff;border-bottom:4px solid ${BRAND_COLOR}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    ${logoHtml(siteUrl)}
                  </td>
                  <td align="right" valign="middle"
                      style="font-size:12px;line-height:1.4;color:#64748b;font-family:Arial,Helvetica,sans-serif">
                    Find your perfect property
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${options.rows}

          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#64748b">
                ${options.footerNote}
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8">
                &copy; ${year} <a href="${escapeHtml(siteUrl)}" style="color:#94a3b8;text-decoration:none">101acres.com</a>. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ---------------- 1. email to the owner / broker ---------------- */

function buildOwnerEmailHtml(input: EmailInput): string {
  const siteUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://101acres.com").replace(/\/+$/, "");

  const headline = TYPE_HEADLINES[input.type];
  const firstName = input.name.split(" ")[0] || input.name;

  const intro =
    input.type === "view_number"
      ? `<strong>${escapeHtml(input.name)}</strong> requested your phone number for the property below. Please get in touch with them as soon as possible.`
      : input.type === "contact_owner"
        ? `<strong>${escapeHtml(input.name)}</strong> would like to contact you about the property below.`
        : `<strong>${escapeHtml(input.name)}</strong> has sent an enquiry about the property below.`;

  const contactRows = [
    detailRow("Name", escapeHtml(input.name)),
    detailRow(
      "Mobile",
      `<a href="tel:${escapeHtml(input.mobile)}" style="color:${BRAND_COLOR};text-decoration:none">${escapeHtml(input.mobile)}</a>`
    ),
    input.email
      ? detailRow(
          "Email",
          `<a href="mailto:${escapeHtml(input.email)}" style="color:${BRAND_COLOR};text-decoration:none">${escapeHtml(input.email)}</a>`
        )
      : "",
  ].join("");

  const buttons = [
    input.pageUrl ? buttonHtml(input.pageUrl, "View property", true) : "",
    buttonHtml(`tel:${input.mobile}`, `Call ${firstName}`, !input.pageUrl),
    input.email
      ? buttonHtml(
          `mailto:${input.email}?subject=${encodeURIComponent(`Re: ${input.title}`)}`,
          "Reply by email",
          false
        )
      : "",
  ].join("");

  const rows = `
          <tr>
            <td style="padding:30px 32px 6px">
              <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#e6f2fb;color:${BRAND_COLOR};font-size:12px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase">
                ${escapeHtml(TYPE_LABELS[input.type])}
              </span>
              <h1 style="margin:14px 0 8px;font-size:22px;line-height:1.3;color:#0f172a">
                ${escapeHtml(headline)}
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#334155">
                ${intro}
              </p>
            </td>
          </tr>

          ${propertyCardHtml(input)}

          <tr>
            <td style="padding:24px 32px 0">
              <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;font-weight:700;margin-bottom:4px">
                Contact details
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${contactRows}
              </table>
            </td>
          </tr>

          ${messageBlockHtml(input.message)}

          <tr>
            <td style="padding:26px 32px 8px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>${buttons}</tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 28px">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b">
                Tip: contacting enquirers quickly gives you a much better chance of closing the deal.
              </p>
            </td>
          </tr>`;

  return wrapEmail({
    headline,
    preheader: `${input.name} (${input.mobile}) is interested in ${input.title}`,
    footerNote: `You are receiving this email because someone enquired about your listing on
                <a href="${escapeHtml(siteUrl)}" style="color:${BRAND_COLOR};text-decoration:none">101acres.com</a>.
                You can reply directly to this email to reach the enquirer${input.email ? "" : " (no email address was provided, please call instead)"}.`,
    rows,
  });
}

function buildOwnerEmailText(input: EmailInput): string {
  const lines = [
    `${TYPE_HEADLINES[input.type]} - 101acres.com`,
    "",
    `Property: ${input.title} (ID ${input.propertyId})`,
    input.address ? `Location: ${input.address}` : "",
    input.price ? `Price: ${input.price}` : "",
    "",
    `Name: ${input.name}`,
    `Mobile: ${input.mobile}`,
    `Email: ${input.email || "-"}`,
    "",
    "Message:",
    input.message,
    input.pageUrl ? `\nProperty page: ${input.pageUrl}` : "",
    "",
    "Reply to this email or call the enquirer directly to follow up.",
  ];

  return lines.filter((line, index) => line !== "" || lines[index - 1] !== "").join("\n");
}

/* ---------------- 2. confirmation email to the enquirer ---------------- */

function buildUserEmailHtml(input: EmailInput): string {
  const siteUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://101acres.com").replace(/\/+$/, "");

  const who = input.ownership || "Owner";
  const whoLower = who.toLowerCase();
  const firstName = input.name.split(" ")[0] || input.name;

  const headline =
    input.type === "view_number"
      ? `Here is the ${whoLower}'s contact`
      : "Your enquiry has been sent";

  const intro =
    input.type === "view_number"
      ? `Hi ${escapeHtml(firstName)}, you asked for the ${escapeHtml(whoLower)}'s phone number. The ${escapeHtml(whoLower)} has also been notified and may call you.`
      : `Hi ${escapeHtml(firstName)}, thank you for your interest! We have sent your enquiry to the property ${escapeHtml(whoLower)}. They will contact you on <strong>${escapeHtml(input.mobile)}</strong> soon.`;

  const phoneBlock =
    input.type === "view_number" && input.ownerPhone
      ? `
          <tr>
            <td style="padding:22px 32px 0">
              <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;font-weight:700;margin-bottom:8px">
                ${escapeHtml(who)} phone number
              </div>
              <a href="tel:${escapeHtml(input.ownerPhone)}"
                 style="display:block;padding:14px 16px;background:#e6f2fb;border-radius:6px;font-size:24px;font-weight:700;color:${BRAND_COLOR};text-decoration:none;text-align:center">
                ${escapeHtml(input.ownerPhone)}
              </a>
            </td>
          </tr>`
      : "";

  const buttons = [
    input.pageUrl ? buttonHtml(input.pageUrl, "View property again", true) : "",
    buttonHtml(siteUrl, "Search more properties", !input.pageUrl),
  ].join("");

  const rows = `
          <tr>
            <td style="padding:30px 32px 6px">
              <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#e8f7ee;color:#15803d;font-size:12px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase">
                ${input.type === "view_number" ? "Contact details" : "Enquiry sent"}
              </span>
              <h1 style="margin:14px 0 8px;font-size:22px;line-height:1.3;color:#0f172a">
                ${escapeHtml(headline)}
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#334155">
                ${intro}
              </p>
            </td>
          </tr>

          ${propertyCardHtml(input)}

          ${phoneBlock}

          ${messageBlockHtml(input.message, "Your message")}

          <tr>
            <td style="padding:26px 32px 8px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>${buttons}</tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 28px">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b">
                Tip: keep your phone reachable and check the property details, price and
                documents carefully before making any payment.
              </p>
            </td>
          </tr>`;

  return wrapEmail({
    headline,
    preheader:
      input.type === "view_number"
        ? `Contact details for ${input.title}`
        : `Your enquiry for ${input.title} was sent to the ${whoLower}`,
    footerNote: `You are receiving this email because you sent an enquiry on
                <a href="${escapeHtml(siteUrl)}" style="color:${BRAND_COLOR};text-decoration:none">101acres.com</a>.
                This is an automated message, please do not reply to it.`,
    rows,
  });
}

function buildUserEmailText(input: EmailInput): string {
  const who = input.ownership || "Owner";

  const lines = [
    input.type === "view_number"
      ? `Contact details - 101acres.com`
      : `Your enquiry has been sent - 101acres.com`,
    "",
    `Hi ${input.name},`,
    input.type === "view_number"
      ? `You asked for the ${who.toLowerCase()}'s phone number.`
      : `We have sent your enquiry to the property ${who.toLowerCase()}. They will contact you on ${input.mobile} soon.`,
    "",
    `Property: ${input.title} (ID ${input.propertyId})`,
    input.address ? `Location: ${input.address}` : "",
    input.price ? `Price: ${input.price}` : "",
    input.type === "view_number" && input.ownerPhone
      ? `\n${who} phone: ${input.ownerPhone}`
      : "",
    "",
    "Your message:",
    input.message,
    input.pageUrl ? `\nProperty page: ${input.pageUrl}` : "",
  ];

  return lines.filter((line, index) => line !== "" || lines[index - 1] !== "").join("\n");
}

/* ============================================================
   OPTIONS
============================================================ */

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

/* ============================================================
   POST /api/properties/[id]/enquiry
   Body: { type, name, mobile, email?, message?, pageUrl?, website? }
============================================================ */

export async function POST(request: NextRequest, { params }: RouteContext) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  const fail = (error: string, status: number) =>
    NextResponse.json({ success: false, error }, { status, headers });

  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) return fail("Invalid property id", 400);

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    // Honeypot field: real users never fill it. Pretend success for bots.
    if (cleanLine(body.website, 100)) {
      return NextResponse.json({ success: true }, { status: 200, headers });
    }

    const rawType = String(body.type ?? "enquiry");
    const type: EnquiryType =
      rawType === "contact_owner" || rawType === "view_number" ? rawType : "enquiry";

    const name = cleanLine(body.name, 80);
    const mobile = normalizePhone(body.mobile);
    const email = cleanLine(body.email, 120);
    const message =
      cleanMessage(body.message, 1000) ||
      "I am interested in this property. Please contact me.";

    if (name.length < 2) return fail("Please enter your name.", 400);
    if (!isMobile(mobile)) return fail("Please enter a valid 10-digit mobile number.", 400);
    if (email && !isEmail(email)) return fail("Please enter a valid email address.", 400);

    const forwarded = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwarded.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(`${ip}:${id}`)) {
      return fail("Too many requests. Please try again in a few minutes.", 429);
    }

    /* ---------- property + owner ---------- */

    const [rows] = await pool.query<Array<RowDataPacket & Record<string, unknown>>>(
      "SELECT * FROM `properties` WHERE `id` = ? LIMIT 1",
      [id]
    );
    const property = rows[0];
    if (!property) return fail("Property not found", 404);

    const formData = parsePropertyFormData(property.form_data) as unknown as Record<
      string,
      unknown
    >;

    const ownerId = Number(property.user_id);

    let ownerRow: { email: string | null; mobile: string | null } | undefined;

    if (Number.isInteger(ownerId) && ownerId > 0) {
      const [owner] = await db
        .select({ email: users.email, mobile: users.mobile })
        .from(users)
        .where(eq(users.id, ownerId))
        .limit(1);

      if (owner) {
        ownerRow = {
          email: owner.email == null ? null : String(owner.email),
          mobile: owner.mobile == null ? null : String(owner.mobile),
        };
      }
    }

    // Email: the dedicated contact_email column comes first (the add/edit APIs now save an
    // email typed in "Contact details" there). Older rows may still hold the email in the
    // contact number field, so those are checked after.
    const emailCandidates = [
      property.contact_email,
      formData.contactEmail,
      formData.contact_email,
      property.contact_number,
      formData.contactNumber,
      formData.contact_number,
      ownerRow?.email,
    ].map((value) => String(value ?? "").trim());
    const ownerEmail = emailCandidates.find(isEmail) ?? "";

    // Phone: contact_number is saved as +91XXXXXXXXXX; normalizePhone() strips the +91.
    const phoneCandidates = [
      property.contact_number,
      formData.contactNumber,
      formData.contact_number,
      ownerRow?.mobile,
    ]
      .filter((value) => !String(value ?? "").includes("@"))
      .map(normalizePhone);
    const ownerPhone =
      phoneCandidates.find((value) => value.length >= 8 && value.length <= 15) ?? "";

    // "Owner" / "Broker" / "Builder" ... as saved on the listing
    const ownership =
      cleanLine(property.ownership ?? formData.ownership, 30) || "Owner";

    const adminEmail = String(process.env.ENQUIRY_ADMIN_EMAIL ?? "").trim();
    const to = ownerEmail || adminEmail;
    // Admin copy goes as its own mail (no BCC): BCC on automated mail is a spam signal.
    const sendAdminCopy = Boolean(ownerEmail && adminEmail && adminEmail !== ownerEmail);

    if (!to) {
      console.error("[enquiry] no owner email and ENQUIRY_ADMIN_EMAIL is not set, property", id);
      return fail("Could not send your request right now. Please try again later.", 500);
    }

    const transport = getTransport();
    if (!transport) {
      console.error("[enquiry] SMTP_HOST / SMTP_USER / SMTP_PASS are not configured");
      return fail("Could not send your request right now. Please try again later.", 500);
    }

    /* ---------- emails ---------- */

    const title = cleanLine(property.title, 150) || `Property #${id}`;
    const from = getFromAddress();

    const emailInput: EmailInput = {
      type,
      propertyId: id,
      title,
      address: cleanLine(property.address, 200),
      price: formatPrice(property.price),
      name,
      mobile,
      email,
      message,
      pageUrl: safePageUrl(body.pageUrl),
      ownership,
      ownerPhone,
    };

    const ownerSubject = `101acres.com: ${TYPE_LABELS[type]} for "${title}"`;
    const ownerText = buildOwnerEmailText(emailInput);
    const ownerHtml = buildOwnerEmailHtml(emailInput);

    // 1. Owner / broker. If this fails the request fails.
    await transport.sendMail({
      from,
      to,
      replyTo: email || undefined,
      subject: ownerSubject,
      text: ownerText,
      html: ownerHtml,
      attachments: getLogoAttachments(),
    });

    // 1b. Admin copy (best effort, separate mail instead of BCC).
    if (sendAdminCopy) {
      try {
        await transport.sendMail({
          from,
          to: adminEmail,
          replyTo: email || undefined,
          subject: `[Admin copy] ${ownerSubject}`,
          text: ownerText,
          html: ownerHtml,
          attachments: getLogoAttachments(),
        });
      } catch (mailError) {
        console.error("[enquiry] admin copy failed:", mailError);
      }
    }

    // 2. Confirmation to the person who sent the enquiry.
    //    Best effort: a failure here must not break an enquiry that already
    //    reached the owner.
    let userEmailSent = false;
    if (email) {
      try {
        await transport.sendMail({
          from,
          to: email,
          replyTo: ownerEmail || undefined,
          subject:
            type === "view_number"
              ? `Contact details for "${title}" - 101acres.com`
              : `Your enquiry for "${title}" was sent - 101acres.com`,
          text: buildUserEmailText(emailInput),
          html: buildUserEmailHtml(emailInput),
          attachments: getLogoAttachments(),
        });
        userEmailSent = true;
      } catch (mailError) {
        console.error("[enquiry] confirmation email to user failed:", mailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your request has been sent to the owner.",
        confirmationEmailSent: userEmailSent,
        // Revealed only after the lead (name + mobile) was captured and mailed.
        contactNumber: type === "view_number" ? ownerPhone : undefined,
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("POST /api/properties/[id]/enquiry error:", error);
    return fail("Could not send your request right now. Please try again later.", 500);
  }
}