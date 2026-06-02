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

  /**
   * Rich branded email sent 7 days before a signup trial expires.
   * Includes a 3-plan comparison table and upgrade CTAs.
   */
  async sendTrialExpiringSoon(
    to: string,
    firstName: string | null,
    expiresAt: Date,
  ): Promise<void> {
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'https://stagelink.art';
    const billingUrl = `${frontendUrl}/es/dashboard/settings?tab=plan`;
    const greeting = firstName ? `Hey <strong style="color:#fff;">${firstName}</strong>` : 'Hey';
    const expiryFormatted = this.formatDate(expiresAt);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0D0A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background:#0D0A1A;padding:32px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" border="0"
    style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

    <!-- HEADER -->
    <tr>
      <td style="background:linear-gradient(135deg,#E040FB 0%,#9B30D0 45%,#4A1A8C 100%);padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td><span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Stage<span style="font-weight:400;">Link</span></span></td>
          <td align="right"><span style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">Plan Pro+</span></td>
        </tr></table>
      </td>
    </tr>

    <!-- HERO -->
    <tr>
      <td style="background:#0D0A1A;padding:36px 32px 24px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#E040FB;">Tu período de prueba</p>
        <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;line-height:1.2;color:#fff;letter-spacing:-0.02em;">
          Tu prueba Pro+ vence<br>en <span style="color:#E040FB;">7 días</span> &#x23F3;
        </h1>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);">${greeting}, gracias por ser parte de StageLink desde el principio.</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);">
          Tu acceso gratuito a <strong style="color:#fff;">Pro+</strong> vence el <strong style="color:#fff;">${expiryFormatted}</strong>.
          Después de esa fecha tu cuenta vuelve automáticamente al plan <strong style="color:#fff;">Gratis</strong>, salvo que elijas continuar con un plan pago.
        </p>
      </td>
    </tr>

    <!-- DIVIDER -->
    <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.08);"></div></td></tr>

    <!-- PLAN LABEL -->
    <tr>
      <td style="background:#0D0A1A;padding:28px 32px 16px;">
        <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Elegí el plan que mejor se adapte a vos</p>
      </td>
    </tr>

    <!-- PLANS TABLE -->
    <tr>
      <td style="background:#0D0A1A;padding:0 32px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr valign="top">

            <!-- FREE -->
            <td width="31%" style="padding-right:8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
                <tr><td style="padding:16px 14px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.08em;text-transform:uppercase;">Gratis</p>
                  <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#fff;">$0<span style="font-size:12px;font-weight:400;color:rgba(255,255,255,0.4);">/mes</span></p>
                  <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:12px;"></div>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5;">&#10003; 1 página de artista</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5;">&#10003; 5 social links</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5;">&#10003; 5 bloques de links</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5;">&#10003; EPK básico</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5;">&#10003; Analytics básicos</p>
                  <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5;">&#10003; stagelink.art/@usuario</p>
                </td></tr>
              </table>
            </td>

            <!-- PRO -->
            <td width="31%" style="padding-right:8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:rgba(224,64,251,0.08);border:1.5px solid rgba(224,64,251,0.5);border-radius:12px;">
                <tr><td style="padding:16px 14px;">
                  <p style="margin:0 0 6px;"><span style="display:inline-block;background:linear-gradient(135deg,#E040FB,#9B30D0);color:#fff;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:2px 8px;border-radius:99px;">Popular</span></p>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#E040FB;letter-spacing:0.08em;text-transform:uppercase;">Pro</p>
                  <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#fff;">$9<span style="font-size:12px;font-weight:400;color:rgba(255,255,255,0.4);">/mes</span></p>
                  <div style="height:1px;background:rgba(224,64,251,0.2);margin-bottom:12px;"></div>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.8);line-height:1.5;">&#10003; 1 página de artista</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.8);line-height:1.5;">&#10003; 8 social links</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.8);line-height:1.5;">&#10003; 10 bloques de links</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.8);line-height:1.5;">&#10003; EPK avanzado</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.8);line-height:1.5;">&#10003; Templates de EPK</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.8);line-height:1.5;">&#10003; Analytics avanzados</p>
                  <p style="margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.8);line-height:1.5;">&#10003; stagelink.art/@usuario</p>
                  <a href="${billingUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#E040FB,#9B30D0);color:#fff;text-decoration:none;padding:10px 12px;border-radius:8px;font-size:12px;font-weight:700;">Elegir Pro — $9/mes</a>
                </td></tr>
              </table>
            </td>

            <!-- PRO+ -->
            <td width="31%">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.15);border-radius:12px;">
                <tr><td style="padding:16px 14px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.08em;text-transform:uppercase;">Pro+</p>
                  <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#fff;">$19<span style="font-size:12px;font-weight:400;color:rgba(255,255,255,0.4);">/mes</span></p>
                  <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:12px;"></div>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5;">&#10003; Todo lo de Pro</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5;">&#10003; 13 social links</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5;">&#10003; Links ilimitados</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5;">&#10003; Insights Spotify/YT</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5;">&#10003; Multi-idioma</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5;">&#10003; Shopify + Printful</p>
                  <p style="margin:0 0 5px;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5;">&#10003; Soporte prioritario</p>
                  <p style="margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5;">&#10003; stagelink.art/@usuario</p>
                  <a href="${billingUrl}" style="display:block;text-align:center;background:rgba(255,255,255,0.08);color:#fff;text-decoration:none;padding:10px 12px;border-radius:8px;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,0.15);">Continuar Pro+ — $19</a>
                </td></tr>
              </table>
            </td>

          </tr>
        </table>
      </td>
    </tr>

    <!-- INFO NOTE -->
    <tr>
      <td style="background:#0D0A1A;padding:0 32px 28px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.5);">
              &#128161; <strong style="color:rgba(255,255,255,0.7);">Si preferís quedarte en el plan Gratis</strong>, no tenés que hacer nada — el cambio es automático al vencer el período.
            </p>
          </td></tr>
        </table>
      </td>
    </tr>

    <!-- DIVIDER -->
    <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.08);"></div></td></tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:#0D0A1A;padding:20px 32px 28px;">
        <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.4);">
          Recibís este email porque tenés una cuenta en StageLink.<br>
          &#x2753; Tenés dudas? Escribinos a <a href="mailto:stagelink.qa@gmail.com" style="color:rgba(255,255,255,0.6);text-decoration:underline;">stagelink.qa@gmail.com</a>
        </p>
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);">
          &copy; 2026 StageLink &middot; <a href="https://stagelink.art" style="color:rgba(255,255,255,0.25);text-decoration:underline;">stagelink.art</a>
        </p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;

    await this.send(to, 'Tu prueba Pro+ de StageLink vence en 7 días', html);
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
