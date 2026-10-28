// src/lib/contactSplit.ts
// "Contact details" field can hold a phone number OR an email.
// Phone -> contact_number (+91XXXXXXXXXX), email -> contact_email.

export function splitContactValue(raw: unknown): { phone: string; email: string } {
  const v = String(raw ?? "").trim();
  if (!v) return { phone: "", email: "" };
  if (v.includes("@")) return { phone: "", email: v.toLowerCase() };

  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return { phone: d, email: "" };
}

/** Phone as saved in the DB: +91XXXXXXXXXX */
export const storedPhone = (digits: string): string =>
  digits.length === 10 ? `+91${digits}` : digits;

/** Phone as shown in the form: +91 XXXXXXXXXX (emails / other text are returned unchanged) */
export function displayPhone(raw: unknown): string {
  const v = String(raw ?? "").trim();
  if (!v || v.includes("@")) return v;
  const { phone } = splitContactValue(v);
  return phone.length === 10 ? `+91 ${phone}` : v;
}

/** Typing/pasting ke time input ko clean karta hai.
 *  - Email (@ ya letters) -> jaisa hai waisa
 *  - Phone -> max 10 digits, hamesha "+91 XXXXXXXXXX" format me
 */
export function formatContactInput(raw: string): string {
  if (raw.includes("@") || /[a-zA-Z]/.test(raw)) return raw;

  let rest = raw.trim();
  if (rest.startsWith("+91")) rest = rest.slice(3);

  let d = rest.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  else if (d.length > 10 && d.startsWith("0")) d = d.slice(1);

  d = d.slice(0, 10);
  return d ? `+91 ${d}` : "";
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/** Returns error message, ya null agar valid hai */
export function validateContact(raw: unknown): string | null {
  const v = String(raw ?? "").trim();
  if (!v) return "Contact details are required.";

  if (v.includes("@")) {
    return EMAIL_REGEX.test(v) ? null : "Please enter a valid email address.";
  }

  const { phone } = splitContactValue(v);
  if (phone.length !== 10) return "Mobile number must be exactly 10 digits.";
  if (!/^[6-9]/.test(phone)) return "Mobile number must start with 6, 7, 8 or 9.";
  return null;
}