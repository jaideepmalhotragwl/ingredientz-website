// enquiryEmail.js
// Sends an instant "we've received your enquiry" acknowledgment to the customer.
// Uses the SAME send-email helper the CRM already uses (in the CRM Supabase project).
// This file is self-contained and does not touch any existing website code.

// The website's Supabase project URL + public (anon) key.
// These are the SAME public values already in supabase.js (safe in website code).
// The real Resend secret key stays hidden inside the send-email Edge Function.
const SUPA_URL = "https://eytoryygkxjslfvsqanl.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dG9yeXlna3hqc2xmdnNxYW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDA5MTUsImV4cCI6MjA5MDMxNjkxNX0.txYTl0Q06mKSfWGmWc8cOTmCN46tLcxF9_7RhBUHBRY";

// The navy "Ingredientz." wordmark, reused exactly as the CRM emails use it.
// (Same proven logo that appears on RFQ and Quotation emails.)
const LOGO_WORDMARK =
  '<div style="font-size:22px;font-weight:800;color:#0D1F3C;letter-spacing:-0.5px;">' +
  'Ingredientz<span style="color:#1877F2;">.</span></div>';

// Mirrors the CRM's sendEmail: knocks on the send-email helper's door
// and hands it the email to send. Returns the helper's reply (or null on failure).
export async function sendEnquiryEmail({ from, to, subject, html, text, reply_to }) {
  try {
    const res = await fetch(`${SUPA_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPA_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text, reply_to }),
    });
    return await res.json();
  } catch (e) {
    console.error("Acknowledgment email error:", e);
    return null;
  }
}

// Builds the branded acknowledgment email body.
// Navy header (matches the public website), lists the buyer's products,
// confirms the 48-hour quotation promise.
export function buildAcknowledgmentHtml({ greetingName, products }) {
  const productRows = (products || [])
    .map((p) => {
      const qty = p.qty ? `${p.qty} ${p.unit || "kg"}` : "Quantity to confirm";
      return (
        '<tr>' +
        '<td style="padding:9px 0;color:#0f172a;font-size:14px;border-bottom:1px solid #f0f0f0;">' +
        `${p.name}</td>` +
        '<td style="padding:9px 0;color:#64748b;font-size:13px;text-align:right;border-bottom:1px solid #f0f0f0;">' +
        `${qty}</td>` +
        '</tr>'
      );
    })
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;">
    <div style="background:#ffffff;padding:18px 28px 14px;border-bottom:1px solid #e8e8e8;">${LOGO_WORDMARK}</div>
    <div style="background:#0D1F3C;padding:22px 32px;">
      <div style="color:#ffffff;font-size:11px;font-weight:bold;letter-spacing:2px;margin-bottom:6px;opacity:0.6;">INGREDIENTZ INC</div>
      <div style="color:#ffffff;font-size:20px;font-weight:bold;">Enquiry received</div>
    </div>
    <div style="padding:26px 32px;background:#ffffff;">
      <p style="color:#0f172a;font-size:15px;margin:0 0 16px;">Hi <strong>${greetingName}</strong>,</p>
      <p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 20px;">Thank you for your enquiry. We've received it and our team is already on it.</p>
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;margin-bottom:6px;">Your enquiry</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${productRows}</table>
      <p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 18px;">Our team is preparing a commercial quotation and will respond within <strong style="color:#0D1F3C;">48 hours</strong>.</p>
      <p style="color:#444;font-size:14px;line-height:1.7;margin:0;">If you need anything in the meantime, just reply to this email.</p>
      <p style="color:#0f172a;font-size:14px;line-height:1.6;margin:22px 0 0;">Warm regards,<br><strong>The Ingredientz Team</strong></p>
    </div>
    <div style="background:#f9f9f9;padding:14px 32px;border-top:1px solid #e8e8e8;">
      <div style="color:#aaa;font-size:12px;">Ingredientz Inc · sales@ingredientz.co · www.ingredientz.co</div>
    </div>
  </div>`;
}

// One simple call that does everything: builds the email and sends it.
// Called by Enquiry.jsx right after the enquiry saves successfully.
export async function sendCustomerAcknowledgment({ toEmail, greetingName, products }) {
  const html = buildAcknowledgmentHtml({ greetingName, products });
  const productLines = (products || [])
    .map((p) => `- ${p.name}${p.qty ? ` (${p.qty} ${p.unit || "kg"})` : ""}`)
    .join("\n");
  const text =
    `Hi ${greetingName},\n\n` +
    `Thank you for your enquiry. We've received it and our team is already on it.\n\n` +
    `Your enquiry:\n${productLines}\n\n` +
    `Our team is preparing a commercial quotation and will respond within 48 hours.\n\n` +
    `If you need anything in the meantime, just reply to this email.\n\n` +
    `Warm regards,\nThe Ingredientz Team\nsales@ingredientz.co`;

  return sendEnquiryEmail({
    from: "Ingredientz <sales@mail.ingredientz.co>",
    to: toEmail,
    subject: "We've received your enquiry — quotation within 48 hours",
    html,
    text,
    reply_to: "sales@ingredientz.co",
  });
}
