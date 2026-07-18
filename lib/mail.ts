import nodemailer from "nodemailer";

const APP_NAME = process.env.EMAIL_FROM_NAME || "Let It Power Life";

function transporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_APP_PASSWORD,
    },
  });
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F7F7F5;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#1B2A4A;color:#fff;border-radius:12px 12px 0 0;padding:20px 24px;">
      <div style="font-size:18px;font-weight:bold;">${APP_NAME}</div>
    </div>
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:24px;color:#1B2A4A;line-height:1.6;font-size:15px;">
      <h2 style="margin-top:0;color:#1B2A4A;">${title}</h2>
      ${bodyHtml}
      <p style="color:#888;font-size:13px;margin-top:32px;">This is an automated message from ${APP_NAME}.</p>
    </div>
  </div>
</body></html>`;
}

export async function sendMail(to: string, subject: string, title: string, bodyHtml: string) {
  const t = transporter();
  if (!t) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[mail:dev] To: ${to} | Subject: ${subject}\n${bodyHtml.replace(/<[^>]+>/g, " ")}`);
      return;
    }
    throw new Error("Email is not configured — SMTP_USER / SMTP_APP_PASSWORD missing.");
  }
  await t.sendMail({
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: layout(title, bodyHtml),
  });
}

export async function sendOtpEmail(to: string, code: string) {
  await sendMail(
    to,
    `${code} is your ${APP_NAME} verification code`,
    "Your verification code",
    `<p>Use this code to verify your email address:</p>
     <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0E7C7B;">${code}</p>
     <p>The code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`
  );
}

export type RequestSummaryLine = { model: string; qty: number };

function summaryTable(lines: RequestSummaryLine[]): string {
  return `<table style="border-collapse:collapse;width:100%;margin:12px 0;">${lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${l.model}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">× ${l.qty}</td></tr>`
    )
    .join("")}</table>`;
}

export async function sendRequestReceived(to: string, requestId: string, org: string, lines: RequestSummaryLine[]) {
  await sendMail(
    to,
    `Request ${requestId} received`,
    "We received your request",
    `<p>Dear ${org},</p>
     <p>Thank you — your laptop request has been received and is pending review.</p>
     <p><strong>Request ID: ${requestId}</strong></p>
     ${summaryTable(lines)}
     <p>We will email you as soon as a decision is made. You can also track your request anytime using the "Track Request" page.</p>`
  );
}

export async function sendApproved(to: string, requestId: string, org: string, lines: RequestSummaryLine[], note?: string | null) {
  await sendMail(
    to,
    `Request ${requestId} approved 🎉`,
    "Your request has been approved",
    `<p>Dear ${org},</p>
     <p>Great news — your request has been <strong style="color:#0E7C7B;">approved</strong> with the following laptops:</p>
     ${summaryTable(lines)}
     ${note ? `<p><em>Note from our team: ${note}</em></p>` : ""}
     <p>We are now processing your laptops for delivery. You will receive updates as your request moves through preparation and delivery.</p>`
  );
}

export async function sendRejected(to: string, requestId: string, org: string, note?: string | null) {
  await sendMail(
    to,
    `Update on request ${requestId}`,
    "Update on your request",
    `<p>Dear ${org},</p>
     <p>Thank you for your interest. Unfortunately we are unable to fulfil your request (${requestId}) at this time.</p>
     ${note ? `<p><em>Note from our team: ${note}</em></p>` : ""}
     <p>Laptop stock changes over time — you are very welcome to submit a new request in future.</p>`
  );
}

export async function sendStatusUpdate(to: string, requestId: string, org: string, status: string) {
  const friendly: Record<string, string> = {
    "Out for Delivery": "Your laptops are out for delivery",
    Delivered: "Your laptops have been delivered",
  };
  await sendMail(
    to,
    `Request ${requestId}: ${status}`,
    friendly[status] || `Status update: ${status}`,
    `<p>Dear ${org},</p>
     <p>Your request <strong>${requestId}</strong> is now: <strong style="color:#0E7C7B;">${status}</strong>.</p>
     ${status === "Delivered" ? "<p>We hope these laptops power new possibilities for your community. Thank you for the work you do! 💙</p>" : "<p>We will keep you posted on further updates.</p>"}`
  );
}
