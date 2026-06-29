import { resendClient } from '../config/email.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * All email sends are best-effort and never throw — a failed notification
 * email must never break the actual business operation (creating an
 * inquiry, updating a deal) that triggered it.
 */
async function sendEmail({ to, subject, html }) {
  if (!resendClient) {
    logger.warn({ to, subject }, 'Email skipped — Resend not configured');
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const result = await resendClient.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { sent: true, id: result.data?.id };
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    return { sent: false, reason: 'send_failed' };
  }
}

function emailLayout(title, bodyHtml) {
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #F7F4EE; color: #2B2620;">
      <p style="font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; color: #5C5448; margin: 0 0 24px;">YOUR OWN</p>
      <h1 style="font-size: 22px; margin: 0 0 16px; color: #2B2620;">${title}</h1>
      <div style="font-size: 15px; line-height: 1.6; color: #5C5448;">${bodyHtml}</div>
      <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #DDD5C5; font-size: 12px; color: #5C5448;">
        Built by AlignCraft
      </p>
    </div>
  `;
}

/**
 * Notifies the admin when a buyer clicks "Want to Buy" on a listing.
 */
export async function sendInquiryNotification({ adminEmail, landTitle, landSlug, messagePreview }) {
  const html = emailLayout(
    'New buyer inquiry',
    `
      <p>Someone just clicked "Want to Buy" on:</p>
      <p style="font-weight: bold; color: #2B2620;">${landTitle}</p>
      ${messagePreview ? `<p style="font-style: italic;">"${messagePreview}"</p>` : ''}
      <p>Check your WhatsApp for the conversation, or view the listing: ${landSlug}</p>
    `
  );

  return sendEmail({
    to: adminEmail,
    subject: `New inquiry: ${landTitle}`,
    html,
  });
}

/**
 * Notifies the admin when a deal's status changes (e.g. marked paid).
 */
export async function sendDealStatusNotification({ adminEmail, landTitle, status, totalCommission }) {
  const statusLabel = { pending_payment: 'pending payment', paid: 'paid', cancelled: 'cancelled' }[status] || status;

  const html = emailLayout(
    'Deal status updated',
    `
      <p>The deal for <strong>${landTitle}</strong> is now marked as <strong>${statusLabel}</strong>.</p>
      ${totalCommission ? `<p>Total commission: ₹${totalCommission.toLocaleString('en-IN')}</p>` : ''}
    `
  );

  return sendEmail({
    to: adminEmail,
    subject: `Deal update: ${landTitle} — ${statusLabel}`,
    html,
  });
}
