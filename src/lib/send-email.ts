import nodemailer from "nodemailer";
import { Resend } from "resend";

import { COORDINATOR_EMAIL } from "@/lib/send-email-client";

export { COORDINATOR_EMAIL };

type SendPdfEmailInput = {
  to: string;
  subject: string;
  text: string;
  pdfBytes: Uint8Array;
  filename: string;
};

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

/**
 * 1) Resend si hay RESEND_API_KEY
 * 2) Gmail SMTP si hay GMAIL_USER + GMAIL_APP_PASSWORD
 * 3) null → el cliente manda por FormSubmit (plantel completo en el cuerpo)
 */
export async function sendPdfEmail(input: SendPdfEmailInput) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    const from = process.env.RESEND_FROM?.trim() || "Torneo Ardillitas <onboarding@resend.dev>";
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      attachments: [
        {
          filename: input.filename,
          content: toBase64(input.pdfBytes),
        },
      ],
    });
    if (error) throw new Error(error.message);
    return { provider: "resend" as const };
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transporter.sendMail({
      from: `Torneo Ardillitas <${gmailUser}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      attachments: [
        {
          filename: input.filename,
          content: Buffer.from(input.pdfBytes),
          contentType: "application/pdf",
        },
      ],
    });
    return { provider: "gmail" as const };
  }

  return null;
}
