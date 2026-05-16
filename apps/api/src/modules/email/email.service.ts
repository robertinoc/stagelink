import { Injectable, Logger } from '@nestjs/common';
import type { Resend } from 'resend';

/**
 * EmailService — sends transactional billing emails via Resend.
 *
 * Activated when RESEND_API_KEY is set in the environment.
 * All methods are silent no-ops (console.warn only) when the key is absent,
 * so the app works in development / CI without an email provider configured.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resendClient: Resend | null = null;

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  private isEnabled(): boolean {
    return Boolean(process.env['RESEND_API_KEY']);
  }

  private async getClient(): Promise<Resend | null> {
    if (!this.isEnabled()) return null;

    if (!this.resendClient) {
      // Lazy init — only import/instantiate when a key is present.
      const { Resend } = await import('resend');
      this.resendClient = new Resend(process.env['RESEND_API_KEY']);
    }

    return this.resendClient;
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  private async send(to: string, subject: string, html: string): Promise<void> {
    const client = await this.getClient();

    if (!client) {
      this.logger.warn(`Email skipped (no RESEND_API_KEY): ${subject} → ${to}`);
      return;
    }

    try {
      const from = process.env['RESEND_FROM_EMAIL'] ?? 'StageLink <noreply@stagelink.io>';
      const { error } = await client.emails.send({ from, to, subject, html });

      if (error) {
        this.logger.error(`Email send failed: ${subject} → ${to}`, error);
      } else {
        this.logger.log(`Email sent: ${subject} → ${to}`);
      }
    } catch (err) {
      this.logger.error(`Email send threw: ${subject} → ${to}`, err);
    }
  }

  /**
   * Builds a minimal inline-styled HTML email.
   * White background, dark text, purple (#7C3AED) accent, max-width 600px.
   */
  private buildEmailHtml(
    title: string,
    lines: string[],
    ctaLabel?: string,
    ctaUrl?: string,
  ): string {
    const ctaBlock =
      ctaLabel && ctaUrl
        ? `<p style="margin:24px 0 0;">
            <a href="${ctaUrl}"
               style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;
                      padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">
              ${ctaLabel}
            </a>
           </p>`
        : '';

    const bodyLines = lines
      .map(
        (line) =>
          `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">${line}</p>`,
      )
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;
                    overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:#7C3AED;padding:20px 32px;">
            <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">StageLink</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;">${title}</h1>
            ${bodyLines}
            ${ctaBlock}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:13px;color:#9ca3af;">
              You received this email because you have a StageLink account.
              Questions? Reply to this email or contact support.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private planLabel(plan: string): string {
    if (plan === 'pro_plus') return 'Pro+';
    if (plan === 'pro') return 'Pro';
    return plan;
  }

  // ─── Public email methods ────────────────────────────────────────────────────

  async sendManualAccessGranted(to: string, plan: string, expiresAt: Date | null): Promise<void> {
    const planName = this.planLabel(plan);
    const expiryText = expiresAt
      ? `This access is valid until <strong>${this.formatDate(expiresAt)}</strong>.`
      : 'This access has no expiry date set.';

    const html = this.buildEmailHtml(
      `You now have ${planName} access`,
      [
        `Great news — a StageLink admin has granted you temporary <strong>${planName}</strong> access.`,
        expiryText,
        'Log in to your dashboard to start using your new features.',
      ],
      'Go to Dashboard',
      process.env['FRONTEND_URL']
        ? `${process.env['FRONTEND_URL']}/dashboard/billing`
        : 'https://app.stagelink.io/dashboard/billing',
    );

    await this.send(to, `You now have ${planName} access on StageLink`, html);
  }

  async sendManualAccessExpiringSoon(
    to: string,
    plan: string,
    expiresAt: Date,
    daysLeft: number,
  ): Promise<void> {
    const planName = this.planLabel(plan);
    const dayWord = daysLeft === 1 ? 'day' : 'days';

    const html = this.buildEmailHtml(
      `Your ${planName} access expires soon`,
      [
        `Your temporary <strong>${planName}</strong> access on StageLink expires in <strong>${daysLeft} ${dayWord}</strong> (${this.formatDate(expiresAt)}).`,
        'Contact support if you would like to extend your access.',
      ],
      'Manage Billing',
      process.env['FRONTEND_URL']
        ? `${process.env['FRONTEND_URL']}/dashboard/billing`
        : 'https://app.stagelink.io/dashboard/billing',
    );

    await this.send(
      to,
      `Your StageLink ${planName} access expires in ${daysLeft} ${dayWord}`,
      html,
    );
  }

  async sendManualAccessExpired(to: string, plan: string): Promise<void> {
    const planName = this.planLabel(plan);

    const html = this.buildEmailHtml(
      `Your ${planName} access has ended`,
      [
        `Your temporary <strong>${planName}</strong> access on StageLink has been revoked.`,
        'You have been returned to your previous plan. If you believe this is a mistake, please contact support.',
        'You can upgrade at any time from the billing page.',
      ],
      'View Billing',
      process.env['FRONTEND_URL']
        ? `${process.env['FRONTEND_URL']}/dashboard/billing`
        : 'https://app.stagelink.io/dashboard/billing',
    );

    await this.send(to, `Your StageLink ${planName} access has ended`, html);
  }

  async sendPaymentFailed(to: string, plan: string, retryUrl?: string): Promise<void> {
    const planName = this.planLabel(plan);
    const ctaUrl =
      retryUrl ??
      (process.env['FRONTEND_URL']
        ? `${process.env['FRONTEND_URL']}/dashboard/billing`
        : 'https://app.stagelink.io/dashboard/billing');

    const html = this.buildEmailHtml(
      'Payment failed — action required',
      [
        `We were unable to process your payment for your StageLink <strong>${planName}</strong> subscription.`,
        'To keep your access, please update your billing details as soon as possible.',
        'Your access may be restricted if payment continues to fail.',
      ],
      'Update Billing Details',
      ctaUrl,
    );

    await this.send(to, 'StageLink payment failed — please update your billing details', html);
  }

  async sendSubscriptionCancelledAtPeriodEnd(
    to: string,
    plan: string,
    periodEnd: Date,
  ): Promise<void> {
    const planName = this.planLabel(plan);

    const html = this.buildEmailHtml(
      `Your ${planName} subscription is canceling`,
      [
        `Your StageLink <strong>${planName}</strong> subscription has been set to cancel.`,
        `You will retain access to all ${planName} features until <strong>${this.formatDate(periodEnd)}</strong>, after which your account will revert to the Free plan.`,
        'If you change your mind, you can reactivate your subscription from the billing page before that date.',
      ],
      'Manage Subscription',
      process.env['FRONTEND_URL']
        ? `${process.env['FRONTEND_URL']}/dashboard/billing`
        : 'https://app.stagelink.io/dashboard/billing',
    );

    await this.send(to, `Your StageLink ${planName} subscription is scheduled to cancel`, html);
  }

  async sendSubscriptionDowngraded(to: string, fromPlan: string, toPlan: string): Promise<void> {
    const fromName = this.planLabel(fromPlan);
    const toName = this.planLabel(toPlan);

    const html = this.buildEmailHtml(
      `Your plan changed to ${toName}`,
      [
        `Your StageLink subscription has been downgraded from <strong>${fromName}</strong> to <strong>${toName}</strong>.`,
        `Some features that were available on ${fromName} may no longer be accessible.`,
        'You can upgrade at any time from the billing page.',
      ],
      'View Plans',
      process.env['FRONTEND_URL']
        ? `${process.env['FRONTEND_URL']}/dashboard/billing`
        : 'https://app.stagelink.io/dashboard/billing',
    );

    await this.send(to, `Your StageLink subscription has changed to ${toName}`, html);
  }
}
