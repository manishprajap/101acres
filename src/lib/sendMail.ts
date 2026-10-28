// src/lib/sendMail.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for port 465, false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendContactNotificationEmail({
  name,
  email,
  phone,
  subject,
  message,
}: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}) {
  try {
    await transporter.sendMail({
      from: `"101Acres Website" <${process.env.SMTP_USER}>`,
      to: "admin@101acres.com",
      replyTo: email,
      subject: `New Inquiry: ${subject}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0; padding:0; background-color:#f4f6f5; font-family:'Segoe UI', Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f5; padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.06);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg, #1E7A46 0%, #2FA866 100%); padding:28px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0; color:#ffffff; font-size:20px; font-weight:700; letter-spacing:0.3px;">
                            101Acres
                          </p>
                          <p style="margin:4px 0 0; color:rgba(255,255,255,0.85); font-size:13px;">
                            Real Estate Platform
                          </p>
                        </td>
                        <td align="right">
                          <span style="background-color:rgba(255,255,255,0.15); color:#ffffff; font-size:11px; font-weight:600; padding:6px 12px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px;">
                            New Inquiry
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Title Section -->
                <tr>
                  <td style="padding:32px 32px 8px;">
                    <p style="margin:0; color:#111827; font-size:18px; font-weight:600;">
                      You've received a new contact form submission
                    </p>
                    <p style="margin:6px 0 0; color:#6b7280; font-size:14px;">
                      A visitor has reached out through the 101Acres website. Details are below.
                    </p>
                  </td>
                </tr>

                <!-- Details Card -->
                <tr>
                  <td style="padding:20px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                      <tr>
                        <td style="padding:14px 18px; background-color:#f9fafb; width:130px; font-size:13px; font-weight:600; color:#374151; border-bottom:1px solid #e5e7eb;">
                          Full Name
                        </td>
                        <td style="padding:14px 18px; font-size:14px; color:#111827; border-bottom:1px solid #e5e7eb;">
                          ${name}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 18px; background-color:#f9fafb; font-size:13px; font-weight:600; color:#374151; border-bottom:1px solid #e5e7eb;">
                          Email Address
                        </td>
                        <td style="padding:14px 18px; font-size:14px; border-bottom:1px solid #e5e7eb;">
                          <a href="mailto:${email}" style="color:#1E7A46; text-decoration:none;">${email}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 18px; background-color:#f9fafb; font-size:13px; font-weight:600; color:#374151; border-bottom:1px solid #e5e7eb;">
                          Phone Number
                        </td>
                        <td style="padding:14px 18px; font-size:14px; color:#111827; border-bottom:1px solid #e5e7eb;">
                          <a href="tel:${phone}" style="color:#111827; text-decoration:none;">${phone}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 18px; background-color:#f9fafb; font-size:13px; font-weight:600; color:#374151;">
                          Subject
                        </td>
                        <td style="padding:14px 18px; font-size:14px; color:#111827;">
                          ${subject}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Message Section -->
                <tr>
                  <td style="padding:8px 32px 24px;">
                    <p style="margin:0 0 8px; font-size:13px; font-weight:600; color:#374151; text-transform:uppercase; letter-spacing:0.4px;">
                      Message
                    </p>
                    <div style="background-color:#f9fafb; border:1px solid #e5e7eb; border-left:4px solid #1E7A46; border-radius:6px; padding:16px 18px;">
                      <p style="margin:0; font-size:14px; line-height:1.6; color:#374151; white-space:pre-wrap;">${message}</p>
                    </div>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding:0 32px 32px;">
                    <a href="mailto:${email}" style="display:inline-block; background-color:#1E7A46; color:#ffffff; font-size:14px; font-weight:600; padding:12px 24px; border-radius:6px; text-decoration:none;">
                      Reply to ${name}
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color:#f9fafb; padding:20px 32px; border-top:1px solid #e5e7eb;">
                    <p style="margin:0; font-size:12px; color:#9ca3af; text-align:center;">
                      This is an automated notification from the 101Acres contact form.<br />
                      © ${new Date().getFullYear()} 101Acres. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    });
    console.log("✅ Contact notification email sent to admin");
  } catch (err) {
    console.error("❌ Failed to send contact email:", err);
    // Contact form submission should not fail if email sending fails
  }
}