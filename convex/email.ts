import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sends an email via HTTP provider (Brevo, Resend, or SendGrid).
 * Configure one of these env vars in Convex:
 * - AUTH_BREVO_KEY (required for Brevo)
 * - RESEND_API_KEY
 * - SENDGRID_API_KEY
 * 
 * IMPORTANT: Set EMAIL_FROM to a verified sender email in Brevo
 * - EMAIL_FROM (e.g., "safespace.dev.app@gmail.com" or any verified email)
 * 
 * Without EMAIL_FROM, emails will fail with Brevo free tier as they require verified senders.
 */
export const sendIssueEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    html: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // EMAIL_FROM must be set to a verified email in Brevo
    // Common options: your-email@gmail.com, noreply@yourdomain.com
    const from = process.env.EMAIL_FROM;
    
    if (!from) {
      console.error("❌ EMAIL_FROM environment variable is not set!");
      console.error("   Please set EMAIL_FROM in Convex dashboard to a verified Brevo sender email.");
      console.error("   Example: safespace.dev.app@gmail.com");
      return { sent: false, reason: "missing_from_email" } as const;
    }

    const brevoKey = process.env.AUTH_BREVO_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const sendgridKey = process.env.SENDGRID_API_KEY;

    console.log("📧 Attempting to send email:", {
      from,
      to: args.to,
      subject: args.subject,
      hasBrevoKey: !!brevoKey,
      hasResendKey: !!resendKey,
      hasSendGridKey: !!sendgridKey,
    });

    if (!brevoKey && !resendKey && !sendgridKey) {
      console.error("❌ No email API key configured! Set AUTH_BREVO_KEY, RESEND_API_KEY, or SENDGRID_API_KEY in Convex environment variables.");
      return { sent: false, reason: "missing_api_key" } as const;
    }

    try {
      if (brevoKey) {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { email: from },
            to: [{ email: args.to }],
            subject: args.subject,
            textContent: args.text,
            htmlContent: args.html ?? `<pre style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">${escapeHtml(
              args.text
            )}</pre>`,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`❌ Brevo error ${res.status}:`, body);
          throw new Error(`Brevo error ${res.status}: ${body}`);
        }
        console.log("✅ Email sent successfully via Brevo");
        return { sent: true, provider: "brevo" } as const;
      }

      if (resendKey) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [args.to],
            subject: args.subject,
            text: args.text,
            html: args.html ?? `<pre style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">${escapeHtml(
              args.text
            )}</pre>`,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`❌ Resend error ${res.status}:`, body);
          throw new Error(`Resend error ${res.status}: ${body}`);
        }
        console.log("✅ Email sent successfully via Resend");
        return { sent: true, provider: "resend" } as const;
      }

      if (sendgridKey) {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sendgridKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: args.to }] }],
            from: { email: from },
            subject: args.subject,
            content: [
              args.html
                ? { type: "text/html", value: args.html }
                : { type: "text/plain", value: args.text },
            ],
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`❌ SendGrid error ${res.status}:`, body);
          throw new Error(`SendGrid error ${res.status}: ${body}`);
        }
        console.log("✅ Email sent successfully via SendGrid");
        return { sent: true, provider: "sendgrid" } as const;
      }

      return { sent: false, reason: "no_provider" } as const;
    } catch (err) {
      console.error("Email send failed", err);
      return { sent: false, reason: "exception" } as const;
    }
  },
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
