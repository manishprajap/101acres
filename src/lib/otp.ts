// src/lib/otp.ts
import nodemailer from "nodemailer";

// ============================================
// OTP generate karna
// ============================================
export function generateOtp(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtpExpiry(minutes = 5): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

// ============================================
// EMAIL OTP (Gmail SMTP via Nodemailer)
// ============================================
// .env me ye daalna hoga:
// GMAIL_USER=youraddress@gmail.com
// GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (Gmail App Password, normal password nahi chalega)
//
// App password kaise banaye:
// Google Account -> Security -> 2-Step Verification -> App Passwords -> "Mail" select karo -> generate

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(toEmail: string, otp: string) {
  try {
    await transporter.sendMail({
      from: `"101acres" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: "Your Login OTP - 101acres",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">101acres Login Verification</h2>
          <p>Your One-Time Password (OTP) for login is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; background: #f4f4f4; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for 5 minutes. Do not share this code with anyone.</p>
          <p style="color: #888; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error };
  }
}

// ============================================
// SMS OTP (MSG91)
// ============================================
// .env me ye daalna hoga:
// MSG91_AUTH_KEY=your_msg91_auth_key
// MSG91_TEMPLATE_ID=your_dlt_approved_template_id   (MSG91 dashboard se OTP template banake ID lena hoga)
// MSG91_SENDER_ID=your_sender_id   (e.g. "ACRES" - 6 char DLT approved sender id)
//
// MSG91 OTP API docs: https://docs.msg91.com/p/tf9GTextN/e/yJ3pVqzir/MSG91

export async function sendOtpSms(phone: string | number, otp: string) {
  try {
    // users.mobile column int hai, isliye string me convert karna padega
    const phoneStr = String(phone);

    // Phone number ko 91XXXXXXXXXX format me bhejna hota hai MSG91 ko (without +)
    const formattedPhone = phoneStr.replace(/^\+/, "").replace(/^0/, "");
    const mobile = formattedPhone.startsWith("91") ? formattedPhone : `91${formattedPhone}`;

    const url = `https://control.msg91.com/api/v5/otp?otp=${otp}&mobile=${mobile}&authkey=${process.env.MSG91_AUTH_KEY}&template_id=${process.env.MSG91_TEMPLATE_ID}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (data.type === "success") {
      return { success: true, data };
    } else {
      console.error("MSG91 error:", data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error("Error sending OTP SMS:", error);
    return { success: false, error };
  }
}