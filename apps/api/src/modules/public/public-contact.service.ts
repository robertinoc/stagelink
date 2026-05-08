import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../../lib/prisma.service';
import type { ContactFormDto } from './dto/contact-form.dto';
import type { ContactFormBlockConfig } from '@stagelink/types';

@Injectable()
export class PublicContactService {
  private readonly logger = new Logger(PublicContactService.name);
  private readonly resend: Resend | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendContactMessage(blockId: string, dto: ContactFormDto): Promise<void> {
    if (!this.resend) {
      throw new BadRequestException('Email sending is not configured');
    }

    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: {
        type: true,
        isPublished: true,
        config: true,
        page: {
          select: {
            artist: { select: { contactEmail: true, displayName: true } },
          },
        },
      },
    });

    if (!block || !block.isPublished || !block.page) {
      throw new NotFoundException('Block not found');
    }

    if (block.type !== 'contact_form') {
      throw new BadRequestException('Block does not accept contact messages');
    }

    const config = block.config as unknown as ContactFormBlockConfig;
    const toEmail = config.email || block.page.artist.contactEmail;

    if (!toEmail) {
      throw new BadRequestException('No contact email configured for this artist');
    }

    const artistName = block.page.artist.displayName ?? 'the artist';
    const fromDomain = this.config.get<string>('RESEND_FROM_DOMAIN') ?? 'stagelink.art';

    const { error } = await this.resend.emails.send({
      from: `StageLink Contact <noreply@${fromDomain}>`,
      to: toEmail,
      replyTo: undefined,
      subject: `Message from ${dto.name} via StageLink`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px">
            New message via StageLink — ${artistName}
          </p>
          <h2 style="margin:0 0 24px;font-size:20px;color:#111">
            ${dto.name} wants to get in touch
          </h2>
          <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px">
            <p style="margin:0;white-space:pre-wrap;color:#374151;line-height:1.6">${dto.message}</p>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:0">
            This message was sent via your StageLink artist page.
            Reply directly to this email to respond to ${dto.name}.
          </p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Resend error for block ${blockId}: ${JSON.stringify(error)}`);
      throw new BadRequestException('Failed to send message. Please try again.');
    }
  }
}
