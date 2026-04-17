import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  artistType: z.string().trim().min(2).max(80),
  message: z.string().trim().min(10).max(2_000),
  website: z.string().trim().max(200).optional().default(''),
  startedAt: z.number().int().positive(),
});

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || 'unknown';
}

function formatEmailText(payload: z.infer<typeof contactSchema>) {
  return [
    'New landing contact form submission',
    '',
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Artist type: ${payload.artistType}`,
    '',
    'Message:',
    payload.message,
  ].join('\n');
}

function formatEmailHtml(payload: z.infer<typeof contactSchema>) {
  const escape = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');

  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#0e021d;color:#ffffff;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:24px;">
        <p style="margin:0 0 20px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#c084fc;">StageLink landing contact</p>
        <h1 style="margin:0 0 20px;font-size:24px;line-height:1.2;">New visitor message</h1>
        <div style="display:grid;gap:8px;margin-bottom:20px;font-size:14px;color:rgba(255,255,255,0.84);">
          <div><strong>Name:</strong> ${escape(payload.name)}</div>
          <div><strong>Email:</strong> ${escape(payload.email)}</div>
          <div><strong>Artist type:</strong> ${escape(payload.artistType)}</div>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:18px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Message</p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.88);white-space:pre-wrap;">${escape(payload.message)}</p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const withinLimit = checkRateLimit('landing-contact', ip, {
    windowMs: 10 * 60_000,
    max: 6,
  });

  if (!withinLimit) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const payload = parsed.data;
  const submittedTooFast = Date.now() - payload.startedAt < 4_000;

  // Honeypot and timing checks return a silent success so bots don't learn the rules.
  if (payload.website || submittedTooFast) {
    return NextResponse.json({ ok: true });
  }

  const resendApiKey = process.env['RESEND_API_KEY'];
  if (!resendApiKey) {
    console.error('[contact] Missing RESEND_API_KEY');
    return NextResponse.json({ message: 'Email is not configured' }, { status: 500 });
  }

  const to = process.env['CONTACT_FORM_TO'] ?? 'robertinoc@gmail.com';
  const from = process.env['CONTACT_FORM_FROM'] ?? 'StageLink <onboarding@resend.dev>';
  const subject = `StageLink-visitor · ${payload.artistType}`;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        reply_to: payload.email,
        text: formatEmailText(payload),
        html: formatEmailHtml(payload),
      }),
      cache: 'no-store',
    });

    if (!resendResponse.ok) {
      const body = await resendResponse.text();
      console.error('[contact] Resend request failed', body);
      return NextResponse.json({ message: 'Unable to send message' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[contact] Unexpected send failure', error);
    return NextResponse.json({ message: 'Unable to send message' }, { status: 502 });
  }
}
